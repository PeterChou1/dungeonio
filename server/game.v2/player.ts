import { World, Bodies, Body, Vector, Events, Render } from "matter-js";
import {
  collisionData,
  gameConfig,
  playerConfig,
  playerHitboxData,
} from "../../common";
import {
  StateMachine,
  IdleState,
  RunState,
  JumpState,
  FallState,
  AttackState,
} from "./state";
import { gameObject } from "./gameobject";
import Phaser from "phaser";
import { AOImanager } from "../interest/aoi.manager";

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
  onPlatform?: boolean;
  platformFall?: boolean;
  flipX?: boolean;
};

type attributes = {
  groundspeed: number;
  airspeed: number;
  jumpheight: number;
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
  // offset for sensors
  private offset = { x: 0, y: 0 };
  // keep track if player is flipped or not
  private flipX = false;
  private sensors;
  private collidesWith;
  private sensorsConfig: sensorConfig = {
    nearbottom: {
      pos: ({ h }) => ({ x: 0, y: h }),
      dim: ({ w }) => ({ w: w, h: 50 }),
    },
    bottom: {
      pos: ({ h }) => ({ x: 0, y: h / 2 }),
      dim: ({ w }) => ({ w: w / 1.5, h: 4 }),
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
  // main matterjs body
  private compoundBody;
  private compoundBodyConfig: compoundBodyConfig = {
    frictionStatic: 0,
    frictionAir: 0.02,
    friction: 0,
    sleepThreshold: -1,
    collisionFilter: {
      mask: collisionData.category.hard,
    },
  };

  constructor(engine, x, y, frameData) {
    this.engine = engine;
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
    this.h = this.default.bounds.max.y - this.default.bounds.min.y;
    this.w = this.default.bounds.max.x - this.default.bounds.min.x;
    this.sensors = {};
    this.isTouching = {};
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
    if (bodyB.label === "hitbox") {
      console.log("hurt");
    }
  }

  createDefaultBody(x, y) {
    if (this.compoundBody) World.remove(this.engine.world, this.compoundBody);
    this.h = this.default.bounds.max.y - this.default.bounds.min.y;
    this.w = this.default.bounds.max.x - this.default.bounds.min.x;
    this.createSensors(this.sensorsConfig);
    this.mainBody = this.default;
    this.mainBody.onCollide(this.mainBodyCallback);
    this.mainBody.onCollideActive(this.mainBodyCallback);
    this.mainBody.onCollideEnd(this.mainBodyCallback);
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
      Vector.add(pos, this.offset, pos);
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
        Body.scale(frameBody, 2, 2);
        this.frameData[frameName] = frameBody.parts.slice(
          1,
          frameBody.parts.length
        );
        // set custom configuration for
        this.frameData[frameName][0]["config"] = {
          flipX: false,
        };
      }
    }
  }

  getPosition() {
    return {
      x: Math.trunc(this.compoundBody.position.x),
      y: Math.trunc(this.compoundBody.position.y),
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
   *
   * @param frame
   */
  setFrameBody(frame) {
    //console.log(frame);
    if (this.frameData[frame]) {
      World.remove(this.engine.world, this.compoundBody);
      var pos = this.getPosition();
      this.mainBody = this.frameData[frame][0];
      const { min, max } = this.mainBody.bounds;
      this.h = max.y - min.y;
      this.w = max.x - min.x;
      this.offset = {
        x: this.mainBody.position.x,
        y: this.mainBody.position.y,
      };
      this.createSensors(this.sensorsConfig);
      this.compoundBody = Body.create({
        parts: [...this.frameData[frame], ...Object.values(this.sensors)],
        ...this.compoundBodyConfig,
      });
      if (this.flipX !== this.frameData[frame][0]["config"].flipX) {
        Body.scale(this.compoundBody, -1, 1);
        this.frameData[frame][0]["config"].flipX = this.flipX;
      }
      //if (this.frameData[frame].length > 1) {
      //  console.log('------');
      //  console.log(this.compoundBody.position);
      //  this.compoundBody.position.x -= this.frameData[frame][0].centerOffset.x;
      //  this.compoundBody.positionPrev.x -= this.frameData[frame][0].centerOffset.x;
      //  this.offset.y = this.frameData[frame][0].centerOffset.y;
      //} else {
      //  this.offset.y = 0;
      //  this.offset.x = 0;
      //}
      World.addBody(this.engine.world, this.compoundBody);
      Body.setPosition(this.compoundBody, { x: pos.x, y: pos.y });
      Body.setInertia(this.compoundBody, Infinity);
      Body.setVelocity(this.compoundBody, { x: 0, y: 0 });
    } else if (this.mainBody !== this.default) {
      const pos = this.getPosition();
      this.offset = { x: this.default.position.x, y: this.default.position.y };
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
  private body: PlayerBody;
  private state: internalState;
  private attributes: attributes;
  input;
  client;
  name: string;
  aoiId: { x: number; y: number };
  aoi: AOImanager;

  constructor(game, name, client, x, y) {
    super();
    this.name = name;
    this.engine = game.engine;
    this.aoi = game.aoimanager;
    this.client = client;
    this.id = client.sessionId;
    this.body = new PlayerBody(this.engine, x, y, game.frameData);
    const playerState = {
      idle: new IdleState(),
      run: new RunState(),
      jump: new JumpState(),
      fall: new FallState(),
      attack1: new AttackState(),
    };
    this.stateMachine = new StateMachine("idle", playerState, game.framesInfo, [
      this,
    ]);
    this.stateMachine.anims.event.on("framechange", (frame) => {
      this.body.setFrameBody(frame);
    });
    this.state = {
      onPlatform: false,
      platformFall: false,
      flipX: false,
    };
    this.attributes = {
      groundspeed: 5,
      airspeed: 5,
      jumpheight: 12,
    };
    this.input = {
      left_keydown: false,
      right_keydown: false,
      up_keydown: false,
      down_keydown: false,
      attack_keydown: false,
      left_keyup: true,
      right_keyup: true,
      up_keyup: true,
      down_keyup: true,
      attack_keyup: true,
    };
    //console.log('--aoi init--');
    if (!gameConfig.networkdebug) {
      this.aoiId = this.aoi.aoiinit(this);
    }
  }

  updatePlayerInput(playerinput) {
    this.input = playerinput;
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

  setInternalState(newstate: internalState) {
    typeof newstate.flipX === "boolean"
      ? this.body.setFlipX(newstate.flipX)
      : null;
    this.state = {
      ...this.state,
      ...newstate,
    };
  }

  setCamera(renderer) {
    this.body.setCamera(renderer);
  }

  getMeta() {
    return {
      category: "player",
      name: this.name,
      id: this.id,
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
    this.stateMachine.step();
    if (gameConfig.networkdebug) {
      //console.log(this.body.isTouching);
    } else {
      this.aoiId = this.aoi.aoiupdate(this);
    }
  }

  destroy() {
    if (!gameConfig.networkdebug) {
      console.log(`destroy player id: ${this.id} name: ${this.name}`);
      const currentAOI = this.aoi.getAOI(this.aoiId);
      currentAOI.removeClient(this, true);
    }
    this.body.destroy();
  }
}
