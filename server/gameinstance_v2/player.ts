import { World, Bodies, Body } from "matter-js";
//@ts-ignore
import { collisionData, gameConfig } from "../../common/globalConfig.ts";
import {
  StateMachine,
  IdleState,
  RunState,
  JumpState,
  FallState,
  //@ts-ignore
} from "./state.ts";

export class Player {
  world;
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
  sessionId;

  constructor(world, name, sessionId, room, x, y, h, w) {
    this.name = name;
    this.world = world;
    this.room = room;
    this.sessionId = sessionId;
    this.mainBody = Bodies.rectangle(0, 0, w, h, {
      chamfer: { radius: 10 },
    });
    this.sensors = {
      nearbottom: Bodies.rectangle(0, h - 10, w, 50, { isSensor: true }),
      bottom: Bodies.rectangle(0, h / 2, w / 2, 2, { isSensor: true }),
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
      collisionFilter: {
        mask: collisionData.category.hard,
      },
    });

    if (!gameConfig.networkdebug) {
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
      World.addBody(world, this.compoundBody);
    }
  }

  setCollisionCallback(sensor, setter) {
    sensor.onCollide(function () {
      setter(true);
    });
    sensor.onCollideEnd(function () {
      setter(false);
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

  update() {
    this.stateMachine.step();
    if (!gameConfig.networkdebug) {
      //console.log(`x: ${this.compoundBody.position.x} y: ${this.compoundBody.position.y}`);
      //console.log(this.input);
      this.room.state.updatePlayer(this.sessionId, {
        timestamp: new Date().getTime(),
        x: this.compoundBody.position.x,
        y: this.compoundBody.position.y,
        velocityX: this.compoundBody.velocity.x,
        velocityY: this.compoundBody.velocity.y,
        stateTime: 0,
        flipX: this.state.flipX,
        collisionData: this.state.collideswith,
        state: this.stateMachine.state,
        isTouching: Object.values(this.isTouching),
        onPlatform: this.state.onPlatform,
        elaspsedTime: 0,
      });
    }
  }

  destroy() {
    World.remove(this.world, this.compoundBody);
  }
}
