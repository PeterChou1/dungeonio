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
  RollState,
  RunState,
  JumpState,
  AirJump,
  FallState,
  AttackState,
  Attack2State,
  Attack3State,
  DashAttack,
  AirAttack1,
  Hurt,
  HitStun,
  Death,
} from "./state";
import { gameObject } from "./gameobject";
import Phaser from "phaser";
import { AOImanager } from "../interest/aoi.manager";
import { EventEmitter } from "events";
import { event } from "./state";
import { registerCollisionCallback } from "../utils/utils";

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

type bodyState = {
  onPlatform: boolean;
  platformFall: boolean;
};

type playerState = {
  asleep: boolean; //whether or not player is asleep
  flipX: boolean;
  airjumps: number;
  health: number;
  stamina: number;
};

type internalState = playerState & bodyState;

type bodyStateConfig = {
  onPlatform?: boolean;
  platformFall?: boolean;
};

type internalStateConfig = {
  asleep?: boolean; //whether or not player is asleep
  onPlatform?: boolean;
  platformFall?: boolean;
  flipX?: boolean;
  airjumps?: number;
  stamina?: number;
  health?: number;
};

type attributeConfig = {
  groundspeed?: number;
  airspeed?: number;
  runspeed?: number;
  rolldistance?: number;
  maxairjumps?: number;
  jumpheight?: number;
  airaccel?: number;
  staminaregen?: number;
  maxstamina?: number;
  maxhealth?: number;
};

type attributes = {
  groundspeed: number;
  airspeed: number;
  rolldistance: number;
  airaccel: number;
  maxairjumps: number;
  runspeed: number;
  jumpheight: number;
  staminaregen: number;
  maxstamina: number;
  maxhealth: number;
};

type compoundBodyConfig = {
  frictionStatic: number;
  frictionAir: number;
  friction: number;
  sleepThreshold: number;
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
  internalState: bodyState = {
    onPlatform: false,
    platformFall: false,
  };
  // register event emitter for when a state change to body happens
  // ex: grab, hit
  event: EventEmitter;
  // a object keeps track of action being done to user
  private registeredActions: {
    [id: string]: event;
  };
  // offset for sensors
  private sensoroffset = { x: 0, y: 0 };
  private collidesWith: Array<number> = [
    collisionData.category.hard,
    collisionData.category.player,
  ];
  private category: number = collisionData.category.player;
  // keep track if player is flipped or not
  private flipX = false;
  private sensors;
  private sensorsConfig: sensorConfig = {
    virtualbody: {
      pos: ({ h }) => ({ x: 0, y: h / 2 - playerConfig.dim.h / 2 }),
      dim: () => ({ w: playerConfig.dim.w, h: playerConfig.dim.h }),
    },
    nearbottom: {
      pos: ({ h }) => ({ x: 0, y: h }),
      dim: ({ w }) => ({ w: w, h: 50 }),
    },
    bottom: {
      pos: ({ h }) => ({ x: 0, y: h / 2 }),
      dim: ({ w }) => ({ w: w / 1.25, h: 10 }),
      onCollide: (pair) => {
        const { bodyA, bodyB } = pair;
        const bottom = this.sensors.bottom === bodyA ? bodyB : bodyA;
        if (
          this.objectgroup.soft.includes(bottom) &&
          !this.internalState.platformFall
        ) {
          this.internalState.onPlatform = true;
          this.addCollidesWith([collisionData.category.soft]);
        }
      },
      onCollideActive: (pair) => {
        const { bodyA, bodyB } = pair;
        const bottom = this.sensors.bottom === bodyA ? bodyB : bodyA;
        if (
          this.objectgroup.soft.includes(bottom) &&
          this.internalState.platformFall
        ) {
          this.internalState.onPlatform = false;
          this.isTouching.bottom = false;
          this.removeCollidesWith([collisionData.category.soft]);
        }
      },
      onCollideEnd: (pair) => {
        const { bodyA, bodyB } = pair;
        const bottom = this.sensors.bottom === bodyA ? bodyB : bodyA;
        if (this.objectgroup.soft.includes(bottom)) {
          this.internalState.onPlatform = false;
          this.internalState.platformFall = false;
          this.removeCollidesWith([collisionData.category.soft]);
        }
      },
    },
    left: {
      pos: ({ w }) => ({ x: -w / 2, y: 0 }),
      dim: ({ h }) => ({ w: 10, h: h * 0.75 }),
    },
    right: {
      pos: ({ w }) => ({ x: w / 2, y: 0 }),
      dim: ({ h }) => ({ w: 10, h: h * 0.75 }),
    },
  };
  private frameData;
  private mainBody;
  // default matterjs body used if no custom body is used
  private default;
  private objectgroup;
  // main matterjs body
  private compoundBody;
  private compoundBodyConfig: compoundBodyConfig = {
    frictionStatic: 0,
    frictionAir: 0.02,
    friction: 0.1,
    sleepThreshold: -1,
  };

  constructor(engine, x, y, frameData, objectgroup) {
    this.objectgroup = objectgroup;
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

  setBodyState(config: bodyStateConfig) {
    if (config.hasOwnProperty("onPlatform")) {
      this.internalState.onPlatform = config.onPlatform;
    }
    if (config.hasOwnProperty("platformFall")) {
      this.internalState.platformFall = config.platformFall;
    }
  }

  getBodyState(): bodyState {
    return this.internalState;
  }

  /**
   * once an action is completed it must be deregistered or else that action
   * can never occur again to this player
   * @param id
   */
  deregisterAction(id: number) {
    console.log("deregister action: ", id);
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
    const v = this.getVelocity();
    Body.setInertia(this.compoundBody, Infinity);
    Body.setPosition(this.compoundBody, { x: x, y: y });
    Body.setVelocity(this.compoundBody, v);

    this.setCollisionCategory(this.category);
    this.setCollidesWith(this.collidesWith);
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
          label: "sensor",
          isSensor: true,
        });
        this.isTouching[sensor] = false;
        // set default sensor if no sensors exist
        const defaultCallback = () => (this.isTouching[sensor] = true);
        if (cur.onCollision) {
          const wrapper = (pair) => {
            defaultCallback();
            cur.onCollision(pair);
          };
          this.sensors[sensor].onCollide(wrapper);
          this.sensors[sensor].onCollideActive(wrapper);
        } else {
          this.sensors[sensor].onCollide(
            cur.onCollide
              ? (pair) => {
                  defaultCallback();
                  cur.onCollide(pair);
                }
              : defaultCallback
          );
          this.sensors[sensor].onCollideActive(
            cur.onCollideActive
              ? (pair) => {
                  defaultCallback();
                  cur.onCollideActive(pair);
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

  getInternalPosition() {
    return {
      x: Math.trunc(this.compoundBody.position.x),
      y: Math.trunc(this.compoundBody.position.y),
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
    Body.setVelocity(this.compoundBody, {
      x: vx,
      y: typeof vy === "number" ? vy : vx,
    });
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

  setFriction(f: number) {
    this.compoundBody.friction = f;
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

  setCollisionCategory(value) {
    this.category = value;
    this.compoundBody.collisionFilter.category = value;
  }

  addCollidesWith(categories: Array<number>) {
    this.setCollidesWith([...this.collidesWith, ...categories]);
  }

  removeCollidesWith(categories: Array<number>) {
    this.collidesWith = this.collidesWith.filter(
      (cat) => !categories.includes(cat)
    );
    this.setCollidesWith(this.collidesWith);
  }

  getVelocity() {
    return {
      x: this.compoundBody.velocity.x,
      y: this.compoundBody.velocity.y,
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
    setImmediate(() => {
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
        this.setCollisionCategory(this.category);
        this.setCollidesWith(this.collidesWith);
        World.addBody(this.engine.world, this.compoundBody);
        Body.setPosition(this.compoundBody, pos);
        Body.setInertia(this.compoundBody, Infinity);
        Body.setVelocity(this.compoundBody, v);
      } else if (this.mainBody !== this.default) {
        const pos = this.getInternalPosition();
        this.sensoroffset = {
          x: this.default.position.x,
          y: this.default.position.y,
        };
        this.createDefaultBody(pos.x, pos.y);
      }
    });
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
    this.event.removeAllListeners();
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
  private state: playerState;
  private attributes: attributes;
  // current player input
  input;
  // track repeating inputs
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
    this.body = new PlayerBody(
      this.engine,
      x,
      y,
      game.frameData,
      game.objectgroup
    );
    this.body.event.on(gameEvents.body.statechange, async (change) => {
      await this.stateMachine.dispatch(change);
      this.body.deregisterAction(change.id);
    });
    const playerState = {
      idle: new IdleState(),
      walk: new WalkState(),
      run: new RunState(),
      roll: new RollState(),
      jump: new JumpState(),
      airjump: new AirJump(),
      fall: new FallState(),
      attack1: new AttackState(),
      attack2: new Attack2State(),
      attack3: new Attack3State(),
      dashattack: new DashAttack(),
      airattack1: new AirAttack1(),
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
      rolldistance: 7,
      maxairjumps: 1,
      // max air speed character can attain
      airspeed: 5,
      airaccel: 0.25,
      jumpheight: 12,
      staminaregen: 0.5,
      maxstamina: 100,
      maxhealth: 100,
    };
    this.state = {
      asleep: false,
      flipX: false,
      airjumps: 0,
      stamina: this.attributes.maxstamina,
      health: this.attributes.maxhealth,
    };

    // track if input repeats
    this.inputrepeats = {
      left: 0,
      right: 0,
      up: 0,
      down: 0,
      run: 0,
      attack: 0,
    };
    this.input = {
      roll: {
        isDown: false,
        isUp: true,
      },
      left: {
        isDown: false,
        isUp: true,
      },
      right: {
        isDown: false,
        isUp: true,
      },
      up: {
        isDown: false,
        isUp: true,
      },
      down: {
        isDown: false,
        isUp: true,
      },
      run: {
        isDown: false,
        isUp: true,
      },
      attack: {
        isDown: false,
        isUp: true,
      },
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
    this.input = { ...this.input, ...playerinput };
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

  setFriction(f: number) {
    this.body.setFriction(f);
  }

  addCollidesWith(categories: Array<number>) {
    this.body.addCollidesWith(categories);
  }

  removeCollidesWith(categories: Array<number>) {
    this.body.removeCollidesWith(categories);
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
    if (newstate.hasOwnProperty("health")) {
      newstate.health = Phaser.Math.Clamp(
        newstate.health,
        0,
        this.attributes.maxhealth
      );
      if (newstate.health === 0) {
        this.kill();
      }
    }
    if (newstate.hasOwnProperty("stamina")) {
      newstate.stamina = Phaser.Math.Clamp(
        newstate.stamina,
        0,
        this.attributes.maxstamina
      );
    }
    if (newstate.hasOwnProperty("onPlatform")) {
      this.body.setBodyState({ onPlatform: newstate.onPlatform });
    }
    if (newstate.hasOwnProperty("platformFall")) {
      this.body.setBodyState({ platformFall: newstate.platformFall });
    }
    if (this.state.asleep && newstate.asleep === false) {
      this.awakePlayer();
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

  getVelocity() {
    return this.body.getVelocity();
  }

  getIsTouching() {
    return this.body.isTouching;
  }

  getInternalState(): internalState {
    return { ...this.state, ...this.body.getBodyState() };
  }

  getAttributes(): attributes {
    return this.attributes;
  }

  getState() {
    const pos = this.getPosition();
    return {
      maxhealth: this.attributes.maxhealth,
      health: this.state.health,
      maxstamina: this.attributes.maxstamina,
      stamina: this.state.stamina,
      flipX: this.state.flipX,
      anims: this.stateMachine.anims.getKey(),
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
        // send kill request to client -> cause client to leave -> trigger onLeave -> call destroy
        this.client.send(messageType.kill);
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
        currentAOI.removeClient(this);
        const adjacentAOI = this.aoi.getAdjacentAOI(this.aoiId);
        adjacentAOI.forEach((aoi) => aoi.removeAdjacentClient(this));
      }
    }
    this.stateMachine.destroy();
    this.body.destroy();
  }
}
