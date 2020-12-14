import { World, Bodies, Body, Sleeping, Events } from "matter-js";

import {
  collisionData,
  gameConfig,
  messageType,
  //@ts-ignore
} from "../../common/globalConfig.ts";
import {
  StateMachine,
  IdleState,
  RunState,
  JumpState,
  FallState,
  //@ts-ignore
} from "./state.ts";
//@ts-ignore
import { gameObject } from "./gameobject.ts";

export class Player extends gameObject {
  world;
  engine;
  room;
  mainBody;
  sensors;
  stateMachine;
  isTouching;
  state;
  attributes;
  input;
  compoundBody;
  name;
  client;
  aoiId;
  aoi;

  constructor(engine, name, client, room, x, y, h, w, aoi) {
    super();
    this.name = name;
    this.world = engine.world;
    this.engine = engine;
    this.room = room;
    this.client = client;
    //@ts-ignore
    this.id = client.sessionId;
    this.aoi = aoi;
    this.mainBody = Bodies.rectangle(0, 0, w, h, {
      chamfer: { radius: 10 },
    });
    this.sensors = {
      nearbottom: Bodies.rectangle(0, h - 10, w, 50, { isSensor: true }),
      bottom: Bodies.rectangle(0, h / 2, w / 1.5, 4, { isSensor: true }),
      left: Bodies.rectangle(-w / 2, 0, 2, h * 0.75, { isSensor: true }),
      right: Bodies.rectangle(w / 2, 0, 2, h * 0.75, { isSensor: true }),
    };
    this.compoundBody = Body.create({
      parts: [
        this.mainBody,
        this.sensors.bottom,
        this.sensors.left,
        this.sensors.right,
        this.sensors.nearbottom,
      ],
      frictionStatic: 0,
      frictionAir: 0.02,
      friction: 0.1,
      sleepThreshold: -1,
      collisionFilter: {
        mask: collisionData.category.hard,
      },
    });
    const playerState = {
      idle: new IdleState(),
      run: new RunState(),
      jump: new JumpState(),
      fall: new FallState(),
    };
    this.stateMachine = new StateMachine("idle", playerState, [this]);
    // attributes describing whether or not player is in contact with any surfaces
    this.isTouching = {
      nearbottom: false,
      bottom: false,
      left: false,
      right: false,
    };
    this.state = {
      onPlatform: false,
      platformFall: false,
      flipX: false,
      collideswith: [collisionData.category.hard],
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
      left_keyup: true,
      right_keyup: true,
      up_keyup: true,
      down_keyup: true,
    };

    this.setCollisionCallback(
      this.sensors.nearbottom,
      (val) => (this.isTouching.nearbottom = val)
    );

    this.setCollisionCallback(
      this.sensors.bottom,
      (val) => (this.isTouching.bottom = val)
    );
    this.setCollisionCallback(
      this.sensors.left,
      (val) => (this.isTouching.left = val)
    );
    this.setCollisionCallback(
      this.sensors.right,
      (val) => (this.isTouching.right = val)
    );
    Body.setInertia(this.compoundBody, Infinity);
    Body.setPosition(this.compoundBody, { x: x, y: y });
    World.addBody(this.world, this.compoundBody);
    Events.on(this.engine, "beforeUpdate", () => {
      this.isTouching = {
        nearbottom: false,
        bottom: false,
        left: false,
        right: false,
      };
    });
    //console.log('--aoi init--');
    if (!gameConfig.networkdebug) {
      this.aoiId = this.aoi.aoiinit(this);
    }
  }

  /**
   * @description sleeping is enable for matterjs engine which means if object comes to a standstill they are put into
   * a sleeping state this method is for awakening a sleeping player
   */
  awakeplayer() {
    Sleeping.set(this.compoundBody, false);
  }

  setCollisionCallback(sensor, setter) {
    sensor.onCollide(function () {
      setter(true);
    });
    sensor.onCollideActive(function () {
      setter(true);
    });
  }

  setVelocity(velocity) {
    Body.setVelocity(this.compoundBody, { x: velocity, y: velocity });
  }

  setVelocityX(velocity) {
    Body.setVelocity(this.compoundBody, {
      x: velocity,
      y: this.compoundBody.velocity.y,
    });
  }

  setVelocityY(velocity) {
    Body.setVelocity(this.compoundBody, {
      x: this.compoundBody.velocity.x,
      y: velocity,
    });
  }

  setCollidesWith(categories) {
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

  updatePlayerInput(playerinput) {
    this.input = playerinput;
  }

  getMeta() {
    return {
      category: "player",
      name: this.name,
      //@ts-ignore
      id: this.id,
    };
  }
  getPosition() {
    //console.log(`x: ${this.compoundBody.position.x} y: ${this.compoundBody.position.y}`);
    return {
      x: Math.trunc(this.compoundBody.position.x),
      y: Math.trunc(this.compoundBody.position.y),
    };
  }

  getState() {
    const pos = this.getPosition();
    return {
      velocityX: Math.trunc(this.compoundBody.velocity.x),
      velocityY: Math.trunc(this.compoundBody.velocity.y),
      flipX: this.state.flipX,
      collisionData: this.state.collideswith,
      state: this.stateMachine.state,
      ...pos,
    };
  }

  update() {
    this.stateMachine.step();
    //console.log(this.aoiId);
    if (!gameConfig.networkdebug) {
      this.aoiId = this.aoi.aoiupdate(this);
      //@ts-ignore
      //this.room.state.updatePlayer(this.id, this.getState());
      // send client gameobject information within the AOI
      // const currentAOI = this.aoi.getAOI(this.aoiId);
      // currentAOI.updateEntity(this);
    }
  }

  destroy() {
    if (!gameConfig.networkdebug) {
      //@ts-ignore
      console.log(`destroy player id: ${this.id} name: ${this.name}`);
      const currentAOI = this.aoi.getAOI(this.aoiId);
      currentAOI.removeClient(this, true);
    }
    Events.off(this.compoundBody);
    World.remove(this.world, this.compoundBody);
  }
}
