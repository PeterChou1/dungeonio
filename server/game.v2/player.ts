import { World, Bodies, Body, Vector, Events, Render } from "matter-js";
import {
  collisionData,
  gameConfig,
  gameEvents,
  playerConfig,
  messageType,
  playerHitboxData,
} from "../../common";
import {
  StateMachine,
  IdleState,
  WalkState,
  RunState,
  JumpState,
  FallState,
  AttackState,
  Attack2State,
  Attack3State,
  DashAttack,
  Hurt,
  HitStun,
  Death,
} from "./state";
import { gameObject } from "./gameobject";
import Phaser from "phaser";
import { AOImanager } from "../interest/aoi.manager";
import { EventEmitter } from "events";
import { event } from "./state";
import { registerCollisionCallback } from "../utils/utils"

const PhysicsEditorParser = Phaser.Physics.Matter.PhysicsEditorParser;

type configObj = {
  pos?: (any) => { x: number; y: number };
  dim?: (any) => { h: number; w: number };
  prev?: { h: number; w: number };
  onCollide?: (any) => void;
  onCollideActive?: (any) => void;
  onCollideEnd?: (any) => void;
  // on collision provides callback for both onCollide and onCollideActive
  onCollision?: (any) => void;
};

type sensorConfig = {
  [sensorConfig: string]: configObj;
};

type internalState = {
  asleep: boolean; //whether or not player is asleep
  onPlatform: boolean;
  platformFall: boolean;
  flipX: boolean;
  health: number;
};

type internalStateConfig = {
  asleep?: boolean; //whether or not player is asleep
  onPlatform?: boolean;
  platformFall?: boolean;
  flipX?: boolean;
  health?: number;
};

type attributeConfig = {
  groundspeed?: number;
  airspeed?: number;
  runspeed?: number;
  jumpheight?: number;
  maxhealth?: number;
};

type attributes = {
  groundspeed: number;
  airspeed: number;
  runspeed: number;
  jumpheight: number;
  maxhealth: number;
};

type compoundBodyConfig = {
  frictionStatic: number;
  frictionAir: number;
  friction: number;
  sleepThreshold: number;
  collisionFilter: {
    mask: number;
  };
};
/**
 * @description handle player matterjs body
 * sensors for detecting collision
 * animation changes changing hitbox
 */
class PlayerBody {
  engine;
  h: number;
  w: number;
  isTouching;
  // register event emitter for when a state change to body happens
  // ex: grab, hit
  event: EventEmitter;
  // a object keeps track of action being done to user
  private registeredActions: {
    [id: string]: event;
  };
  // offset for sensors
  private sensoroffset = { x: 0, y: 0 };
  // offset for position
  private posoffset = { x: 0, y: 0 };
  // keep track if player is flipped or not
  private flipX = false;
  private sensors;
  private collidesWith;
  private sensorsConfig: sensorConfig = {
    virtualbody:  {
      pos: ({h}) => ({x: 0, y: (h / 2) - (playerConfig.dim.h / 2)}),
      dim: () => ({w: playerConfig.dim.w, h: playerConfig.dim.h})
    },
    nearbottom: {
      pos: ({ h }) => ({ x: 0, y: h }),
      dim: ({ w }) => ({ w: w, h: 50 }),
    },
    bottom: {
      pos: ({ h }) => ({ x: 0, y: h / 2 }),
      dim: ({ w }) => ({ w: w / 1.5, h: 10 }),
    },
    left: {
      pos: ({ w }) => ({ x: -w / 2, y: 0 }),
      dim: ({ h }) => ({ w: 10, h: h * 0.75 }),
    },
    right: {
      pos: ({ w }) => ({ x: w / 2, y: 0 }),
      dim: ({ h }) => ({ w: 10, h: h * 0.75 }),
    }
  };
  private frameData;
  private mainBody;
  // default matterjs body used if no custom body is used
  private default;
  // body used to derived position from 
  private positionalBody;
  // main matterjs body
  private compoundBody;
  private compoundBodyConfig: compoundBodyConfig = {
    frictionStatic: 0,
    frictionAir: 0.02,
    friction: 0.1,
    sleepThreshold: -1,
    collisionFilter: {
      mask: collisionData.category.hard,
    },
  };

  constructor(engine, x, y, frameData) {
    this.engine = engine;
    this.event = new EventEmitter();
    this.generateframeBody(frameData);
    this.default = Bodies.rectangle(
      0,
      0,
      playerConfig.dim.w,
      playerConfig.dim.h,
      {
        chamfer: { radius: 10 },
      }
    );
    //store height and width in default body
    this.default.config = {
      h: this.default.bounds.max.y - this.default.bounds.min.y,
      w: this.default.bounds.max.x - this.default.bounds.min.x,
    };
    //console.log(this.default.inertia);
    this.h = this.default.config.h;
    this.w = this.default.config.w;
    this.sensors = {};
    this.isTouching = {};
    this.registeredActions = new Proxy(
      {},
      {
        set: (obj, prop, value) => {
          obj[prop] = value;
          this.event.emit(gameEvents.body.statechange, value);
          return true;
        },
      }
    );
    this.createSensors(this.sensorsConfig);
    this.createDefaultBody(x, y);
    Events.on(this.engine, "beforeUpdate", () => {
      for (const sensor in this.isTouching) {
        this.isTouching[sensor] = false;
      }
    });
  }
  /**
   * used for collision callback of mainbody
   * @param pair
   */
  private mainBodyCallback(pair) {
    const { bodyA, bodyB } = pair;
    const hitboxbody = this.mainBody === bodyA ? bodyB : bodyA;
    if (!(hitboxbody.id in this.registeredActions)) {
      if (hitboxbody.label === "hitbox") {
        console.log('hitbox collided with mainbody');
        console.log(hitboxbody.config);
        this.registeredActions[hitboxbody.id] = {
          id: hitboxbody.id,
          category: "hit",
          eventConfig: {
            knockback: hitboxbody.config.knockback,
            damage: hitboxbody.config.damage,
            hitstun: hitboxbody.config.hitstun,
            flipX: hitboxbody.config.flipX,
          },
        };
      }
    }
  }
  /**
   * once an action is completed it must be deregistered or else that action
   * can never occur again to this player
   * @param id
   */
  deregisterAction(id: number) {
    delete this.registeredActions[id];
  }

  /**
   * @description recreates default body
   * @param x
   * @param y
   */
  createDefaultBody(x, y) {
    if (this.compoundBody) World.remove(this.engine.world, this.compoundBody);
    this.h = this.default.config.h;
    this.w = this.default.config.w;
    this.createSensors(this.sensorsConfig);
    this.mainBody = this.default;
    this.mainBody.onCollide(this.mainBodyCallback.bind(this));
    this.mainBody.onCollideActive(this.mainBodyCallback.bind(this));
    this.mainBody.onCollideEnd(this.mainBodyCallback.bind(this));
    this.compoundBody = Body.create({
      parts: [this.default, ...Object.values(this.sensors)],
      ...this.compoundBodyConfig,
    });
    Body.setInertia(this.compoundBody, Infinity);
    Body.setPosition(this.compoundBody, { x: x, y: y });
    World.addBody(this.engine.world, this.compoundBody);
  }

  /**
   *
   * @param {string} sensor
   * @param config
   */
  setSensor(sensor: string, config: configObj) {
    this.sensorsConfig[sensor] = {
      ...this.sensorsConfig,
      ...config,
    };
    this.createSensors(this.sensorsConfig);
  }

  /**
   * create body sensors based on configurations
   * @param config
   * @param offset whether or not to offset the sensor to account for body shift
   */
  createSensors(config: sensorConfig) {
    for (const sensor in config) {
      const cur: configObj = config[sensor];
      const pos = cur.pos({ w: this.w, h: this.h });
      const dim = cur.dim({ w: this.w, h: this.h });
      Vector.add(pos, this.sensoroffset, pos);
      // if there is a sensor modify it
      if (this.sensors[sensor]) {
        Body.scale(
          this.sensors[sensor],
          dim.w / cur.prev.w,
          dim.h / cur.prev.h
        );
        Body.setPosition(this.sensors[sensor], { x: pos.x, y: pos.y });
      } else {
        // if there is no sensor create it
        this.sensors[sensor] = Bodies.rectangle(pos.x, pos.y, dim.w, dim.h, {
          isSensor: true,
        });
        this.isTouching[sensor] = false;
        // set default sensor if no sensors exist
        const defaultCallback = () => (this.isTouching[sensor] = true);
        if (cur.onCollision) {
          const wrapper = (pair) => {
            cur.onCollision(pair);
            defaultCallback();
          };
          this.sensors[sensor].onCollide(wrapper);
          this.sensors[sensor].onCollideActive(wrapper);
        } else {
          this.sensors[sensor].onCollide(
            cur.onCollide
              ? (pair) => {
                  cur.onCollide(pair);
                  defaultCallback();
                }
              : defaultCallback
          );
          this.sensors[sensor].onCollideActive(
            cur.onCollideActive
              ? (pair) => {
                  cur.onCollideActive(pair);
                  defaultCallback();
                }
              : defaultCallback
          );
        }
        cur.onCollideEnd
          ? this.sensors[sensor].onCollideEnd(cur.onCollideEnd)
          : null;
      }
      cur.prev = dim;
    }
  }

  /**
   * generates matterjs body for certain animation frames.
   * @param frameData
   */
  generateframeBody(frameData) {
    this.frameData = {};
    // body generate hitboxs for each frame
    for (const frameName in frameData) {
      // if there are no fixtures do not generate body
      if (
        frameData[frameName].fixtures &&
        frameData[frameName].fixtures.length > 0
      ) {
        const frameBody = PhysicsEditorParser.parseBody(
          0,
          0,
          frameData[frameName]
        );
        //scale body by two to be visible
        Body.scale(frameBody, 2, 2);
        this.frameData[frameName] = frameBody.parts.slice(
          1,
          frameBody.parts.length
        );
        // set custom configuration for body
        for (const bodyparts of this.frameData[frameName]) {
          //add collision callbacks
          registerCollisionCallback(bodyparts);
          bodyparts["config"] = {
            flipX: false,
            orgh: frameBody.bounds.max.y - frameBody.bounds.min.y,
            orgw: frameBody.bounds.max.x - frameBody.bounds.min.x,
            h:
              this.frameData[frameName][0].bounds.max.y -
              this.frameData[frameName][0].bounds.min.y,
            w:
              this.frameData[frameName][0].bounds.max.x -
              this.frameData[frameName][0].bounds.min.x,
            ...(playerHitboxData.hasOwnProperty(frameName) &&
              bodyparts.label === playerHitboxData[frameName].label &&
              playerHitboxData[frameName]),
          };
        }
      }
    }
  }

  private getInternalPosition() {
    return {
      x: Math.trunc(this.compoundBody.position.x + this.posoffset.x),
      y: Math.trunc(this.compoundBody.position.y + this.posoffset.y),
    };
  }

  getPosition() {
    return {
      x: Math.trunc(this.sensors.virtualbody.position.x),
      y: Math.trunc(this.sensors.virtualbody.position.y),
    };
  }

  setFlipX(flipX) {
    this.flipX = flipX;
  }

  setVelocity(vx: number, vy?: number) {
    Body.setVelocity(this.compoundBody, { x: vx, y: vy ? vy : vx });
  }

  setVelocityX(vx: number) {
    Body.setVelocity(this.compoundBody, {
      x: vx,
      y: this.compoundBody.velocity.y,
    });
  }

  setVelocityY(vy: number) {
    Body.setVelocity(this.compoundBody, {
      x: this.compoundBody.velocity.x,
      y: vy,
    });
  }

  setCollidesWith(categories: Array<number>) {
    this.collidesWith = categories;
    var flags = 0;
    if (!Array.isArray(categories)) {
      flags = categories;
    } else {
      for (var i = 0; i < categories.length; i++) {
        flags |= categories[i];
      }
    }
    this.compoundBody.collisionFilter.mask = flags;
  }

  getVelocity() {
    return {
      velocityX: Math.trunc(this.compoundBody.velocity.x),
      velocityY: Math.trunc(this.compoundBody.velocity.y),
    };
  }

  getCollidesWith() {
    return this.collidesWith;
  }

  /**
   * @desciption set based on frame the body of the player
   * @param frame
   */
  setFrameBody(frame) {
    if (this.frameData[frame]) {
      var pos = this.getInternalPosition();
      var v = this.getVelocity();
      World.remove(this.engine.world, this.compoundBody);
      this.mainBody = this.frameData[frame][0];
      this.mainBody.onCollide(this.mainBodyCallback.bind(this));
      this.mainBody.onCollideActive(this.mainBodyCallback.bind(this));
      this.mainBody.onCollideEnd(this.mainBodyCallback.bind(this));
      this.h = this.mainBody.config.h;
      this.w = this.mainBody.config.w;
      this.sensoroffset = {
        x: this.mainBody.position.x,
        y: this.mainBody.position.y,
      };
      this.createSensors(this.sensorsConfig);
      this.compoundBody = Body.create({
        parts: [...this.frameData[frame], ...Object.values(this.sensors)],
        ...this.compoundBodyConfig,
      });
      if (this.flipX !== this.mainBody.config.flipX) {
        Body.scale(this.compoundBody, -1, 1);
        this.frameData[frame].forEach(
          (body) => (body.config.flipX = this.flipX)
        );
      }
      if (this.w < this.mainBody.config.orgw) {
        if (this.flipX) {
          this.compoundBody.position.x += this.mainBody.centerOffset.x;
          this.compoundBody.positionPrev.x += this.mainBody.centerOffset.x;
        } else {
          this.compoundBody.position.x -= this.mainBody.centerOffset.x;
          this.compoundBody.positionPrev.x -= this.mainBody.centerOffset.x;
        }
      }
      //if (this.default.config.h < this.mainBody.config.orgh) {
      //  this.posoffset.y = this.mainBody.centerOffset.y
      //  console.log('y offset');
      //  console.log(this.posoffset.y);
      //}
      //else if (this.default.config.h > this.mainBody.config.orgh) {
      //  this.posoffset.y = -(this.default.config.h - this.mainBody.config.orgh);
      //}
      World.addBody(this.engine.world, this.compoundBody);
      Body.setPosition(this.compoundBody, { x: pos.x, y: pos.y });
      Body.setInertia(this.compoundBody, Infinity);
      Body.setVelocity(this.compoundBody, { x: v.velocityX, y: v.velocityY });
    } else if (this.mainBody !== this.default) {
      const pos = this.getInternalPosition();
      this.posoffset = { x: 0, y: 0 };
      this.sensoroffset = {
        x: this.default.position.x,
        y: this.default.position.y,
      };
      this.createDefaultBody(pos.x, pos.y);
    }
  }

  /**
   * set debug camera to look at player used for debug purposes
   * @param renderer
   */
  setCamera(renderer) {
    Render.lookAt(renderer, this.compoundBody, {
      x: 200,
      y: 150,
    });
  }

  destroy() {
    Events.off(this.compoundBody);
    World.remove(this.engine.world, this.compoundBody);
  }
}

export class Player extends gameObject {
  // main matterjs body
  world;
  engine;
  stateMachine: StateMachine;
  // dead but not removed from world
  private zombiemode: boolean;
  private body: PlayerBody;
  private state: internalState;
  private attributes: attributes;
  // current player input
  input;
  // repeating 
  inputrepeats;
  client;
  name: string;
  aoiId: { x: number; y: number };
  aoi: AOImanager;

  constructor(game, name, client, x, y) {
    super();
    this.name = name;
    this.engine = game.engine;
    this.zombiemode = false;
    this.aoi = game.aoimanager;
    this.client = client;
    this.id = client.sessionId;
    this.body = new PlayerBody(this.engine, x, y, game.frameData);
    this.body.event.on(gameEvents.body.statechange, async (change) => {
      await this.stateMachine.dispatch(change);
      this.body.deregisterAction(change.id);
    });
    const playerState = {
      idle: new IdleState(),
      walk: new WalkState(),
      run: new RunState(),
      jump: new JumpState(),
      fall: new FallState(),
      attack1: new AttackState(),
      attack2: new Attack2State(),
      attack3: new Attack3State(),
      dashattack: new DashAttack(),
      hurt: new Hurt(),
      hitstun: new HitStun(),
      death: new Death(),
    };
    this.stateMachine = new StateMachine("idle", playerState, game.framesInfo, [
      this,
    ]);
    this.stateMachine.anims.event.on(gameEvents.anims.framechange, (frame) => {
      this.body.setFrameBody(frame);
    });
    // default attributes
    this.attributes = {
      groundspeed: 5,
      runspeed: 7,
      airspeed: 5,
      jumpheight: 12,
      maxhealth: 100,
    };
    this.state = {
      asleep: false,
      onPlatform: false,
      platformFall: false,
      flipX: false,
      health: this.attributes.maxhealth,
    };

    // track if input repeats
    this.inputrepeats = {
      left : 0,
      right : 0,
      up : 0,
      down : 0,
      attack : 0
    }
    this.input = {
      left: {
        isDown : false,
        isUp : true,
      },
      right: {
        isDown : false,
        isUp : true,
      },
      up: {
        isDown : false,
        isUp : true,
      },
      down: {
        isDown : false,
        isUp: true,
      },
      run: {
        isDown: false,
        isUp: true
      },
      attack: {
        isDown : false,
        isUp : true,
      }
    };
    //console.log('--aoi init--');
    if (!gameConfig.networkdebug) {
      this.aoiId = this.aoi.aoiinit(this);
    }
  }

  /**
   * @description compares inputs set internal counter if it repeats resets to zero if it doesnt
   */
  private compareInputs() {
    for (const keycode in this.input) {
      if (this.input[keycode].isDown) {
        this.inputrepeats[keycode] += 1;
      } else if (this.input[keycode].isUp) {
        this.inputrepeats[keycode] = 0;
      }
    }
  }
  updatePlayerInput(playerinput) {
    this.input = {...this.input, ...playerinput};
  }

  setVelocity(vx: number, vy?: number) {
    this.body.setVelocity(vx, vy);
  }

  setVelocityX(velocity: number) {
    this.body.setVelocityX(velocity);
  }

  setVelocityY(velocity: number) {
    this.body.setVelocityY(velocity);
  }

  setCollidesWith(categories: Array<number>) {
    this.body.setCollidesWith(categories);
  }

  setAttribute(newstate: attributeConfig) {
    this.attributes = {
      ...this.attributes,
      ...newstate,
    };
  }

  setInternalState(newstate: internalStateConfig) {
    if (newstate.hasOwnProperty("flipX")) {
      this.body.setFlipX(newstate.flipX);
    }
    if (this.state.asleep && newstate.asleep === false) {
      this.awakePlayer();
    }
    if (newstate.health === 0) {
      this.kill();
    }
    //newstate.asleep ? this.awakePlayer()
    this.state = {
      ...this.state,
      ...newstate,
    };
  }

  setCamera(renderer) {
    this.body.setCamera(renderer);
  }

  /**
   * @description re initializes client with newly updated information after they navigated back to game
   */
  awakePlayer() {
    const currentAOI = this.aoi.getAOI(this.aoiId);
    currentAOI.updatePlayer(this);
    const adjacentAOI = this.aoi.getAdjacentAOI(this.aoiId);
    for (const aoi of adjacentAOI) {
      aoi.updatePlayer(this);
    }
  }

  getMeta() {
    return {
      category: "player",
      name: this.name,
      id: this.id,
      maxhealth: this.attributes.maxhealth,
      health: this.state.health,
      flipX: this.state.flipX,
    };
  }
  getPosition() {
    //console.log(`x: ${this.compoundBody.position.x} y: ${this.compoundBody.position.y}`);
    return this.body.getPosition();
  }

  getIsTouching() {
    return this.body.isTouching;
  }

  getInternalState(): internalState {
    return this.state;
  }

  getAttributes(): attributes {
    return this.attributes;
  }

  getState() {
    const pos = this.getPosition();
    const v = this.body.getVelocity();
    return {
      maxhealth: this.attributes.maxhealth,
      health: this.state.health,
      flipX: this.state.flipX,
      collisionData: this.body.getCollidesWith(),
      state: this.stateMachine.state,
      velocityX: v.velocityX,
      velocityY: v.velocityY,
      x: pos.x,
      y: pos.y,
    };
  }

  update() {
    if (!this.zombiemode) {
      this.stateMachine.step();
      this.compareInputs();
      if (!gameConfig.networkdebug) {
        this.aoiId = this.aoi.aoiupdate(this);
        // if aoi id is undefined destroy player activate zombie mode
        // and wait for player destruction
        if (this.aoiId === undefined) {
          this.kill();
          this.zombiemode = true;
        }
      }
    }
  }


  /**
   * @description plays death animation then destroys body
   */
  kill() {
    this.stateMachine.dispatch({ category: "death" });
    this.stateMachine.event.once(
      gameEvents.stateMachine.dispatchcomplete,
      () => {
        // send remove aoi to client -> cause client to leave -> trigger onLeave -> call destroy
        this.client.send(messageType.aoiremove, {
          id: this.id,
        });
      }
    );
  }

  /**
   * @description destroys player body and removes it from the world
   */
  destroy() {
    if (!gameConfig.networkdebug) {
      console.log(`destroy player id: ${this.id} name: ${this.name}`);
      if (this.aoiId) {
        const currentAOI = this.aoi.getAOI(this.aoiId);
        currentAOI.removeClient(this, true);
        const adjacentAOI = this.aoi.getAdjacentAOI(this.aoiId);
        adjacentAOI.forEach((aoi) => aoi.removeAdjacentClient(this, false));
      }
    }
    this.stateMachine.destroy();
    this.body.destroy();
  }
}
