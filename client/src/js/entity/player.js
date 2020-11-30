import { StateMachine, SimulatedStateMachine } from "../state/stateMachine";
import { getplayerstate, getsimplayerState } from "../state/playerState";
import {
  gameConfig,
  messageType,
  collisionData,
} from "../../../../common/globalConfig.ts";
import { PlayerPhysics } from "../physics/playerPhysics";
const { Body } = Phaser.Physics.Matter.Matter;
const PhysicsEditorParser = Phaser.Physics.Matter.PhysicsEditorParser;

export default class Player {
  constructor(scene, x, y, scale, key, playerName) {
    console.log(`player name: ${playerName} joined`);
    this.scene = scene;
    this.sprite = scene.matter.add.sprite(x, y, "mainchar", "adventure-idle");
    this.playerId = key;
    this.matterFrameData = {};
    this.generateBodyFrames();
    //  keeps track of server updates positions by server for interpolation purposes
    this.serverInterpolation = [];
    this.physics = new PlayerPhysics(
      scene,
      this.sprite,
      x,
      y,
      scale,
      playerName
    );

    const hitbox = this.matterFrameData["adventurer-idle-00"];
    this.sprite.setExistingBody(hitbox);
    this.sprite.setPosition(x, y);
    this.sprite.setScale(scale);
    this.sprite.setFixedRotation();

    // default state of player values is idle
    this.playerstate = "idle";
    this.playanimation(this.playerstate);
    this.disablegravity();
    this.scene.events.on("update", this.entityinterpolate, this);
    // debug text

    if (gameConfig.debug) {
      this.debugtext = scene.add.text(10, 100, "");
    }
  }

  generateBodyFrames() {
    for (const frameName of this.scene.frameNames) {
      this.matterFrameData[frameName] = PhysicsEditorParser.parseBody(
        0,
        0,
        this.scene.frameData[frameName]
      );
    }
  }

  playanimation(anims) {
    this.sprite.anims.play(anims);
  }

  updatePlayer({ x, y, flipX, collisionData, state, misc }) {
    //console.log('update player');
    //console.log({x, y, flipX, collisionData, state});
    // interpolate from old to new
    let serverInterpolation = [];
    if (!document.hidden) {
      // do what you need
      for (let i = 0; i <= 1; i += 0.25) {
        let xInterp = Phaser.Math.Interpolation.Linear([this.sprite.x, x], i);
        let yInterp = Phaser.Math.Interpolation.Linear([this.sprite.y, y], i);
        //console.log(`coordinates x:${x}  y:${y}`);
        serverInterpolation.push({
          x: xInterp,
          y: yInterp,
        });
      }
    } else {
      // when browser is hidden don't interpolate update immediately
      //console.log('----console hidden update immediately---');
      serverInterpolation.push({
        x: x,
        y: y,
      });
    }
    //console.log(serverInterpolation);
    this.serverInterpolation = serverInterpolation;
    this.sprite.setFlipX(flipX);
    this.sprite.setCollidesWith(collisionData);
    if (this.playerstate !== state) {
      this.playanimation(state);
    }
    this.playerstate = state;

    if (gameConfig.debug) {
      console.log(misc);
      this.debugtext.setText(
        `left: ${misc.isTouching[0]} right: ${misc.isTouching[1]} ground: ${misc.isTouching[2]} top: ${misc.isTouching[3]} nearground: ${misc.isTouching[4]} \n platform: ${misc.onPlatform} state: ${misc.state}`
      );
    }
  }

  entityinterpolate() {
    // interpolate between new and older positions
    if (this.serverInterpolation.length > 0 && this.physics) {
      //if (this.sprite.anims.currentFrame) {
      //  const hitbox = this.matterFrameData[
      //    this.sprite.anims.currentFrame.textureFrame
      //  ];
      //  ////console.log(`x: ${this.sprite.x} y: ${this.sprite.y}`);
      //  const collideswith = this.sprite.body.collisionFilter.mask;
      //  this.sprite
      //    .setAngle(0)
      //    .setScale(1)
      //    .setExistingBody(hitbox)
      //    .setScale(2)
      //    .setFixedRotation()
      //    .setCollisionCategory(collisionData.category.player)
      //    .setCollidesWith(collideswith);
      //  if (this.sprite.flipX) {
      //    Body.scale(hitbox, -1, 1);
      //    //this.sprite.setOriginFromFrame();
      //    this.sprite.setOrigin(1 - this.sprite.originX, this.sprite.originY);
      //  }
      //}
      const coord = this.serverInterpolation.shift();
      this.sprite.setPosition(coord.x, coord.y);
    }
  }

  getPlayerState() {
    return this.playerstate;
  }

  disablegravity() {
    this.sprite.world.on("beforeupdate", this.cancelgravity, this);
  }

  enablegravity() {
    this.sprite.world.off("beforeupdate", this.cancelgravity, this);
  }

  cancelgravity() {
    var gravity = this.sprite.world.localWorld.gravity;
    var body = this.sprite.body;
    Body.applyForce(body, body.position, {
      x: -gravity.x * gravity.scale * body.mass,
      y: -gravity.y * gravity.scale * body.mass,
    });
  }

  //debug() {
  //    this.playerdebug = this.scene.add.text(10, 10, `Player State: ${this.stateMachine.state} \n isTouching {left: ${this.physics.isTouching.left}, right: ${this.physics.isTouching.right}, ground: ${this.physics.isTouching.ground}, top: ${this.physics.isTouching.top}, nearbottom: ${this.physics.isTouching.nearground}} onPlatfrom: ${this.physics.onPlatform} \n x: ${this.sprite.x} y: ${this.sprite.y}`,
  //                                           { font: '"Times"', fontSize: '32px' });
  //}
  //
  //debugUpdate(){
  //    this.playerdebug.setText(`Player State: ${this.stateMachine.state} \n isTouching {left: ${this.physics.isTouching.left}, right: ${this.physics.isTouching.right}, ground: ${this.physics.isTouching.ground}, top: ${this.physics.isTouching.top}, nearbottom: ${this.physics.isTouching.nearground}} onPlatfrom: ${this.physics.onPlatform}\n x: ${this.sprite.x} y: ${this.sprite.y}`,
  //                                         { font: '"Times"', fontSize: '32px' });
  //}

  destroy() {
    this.sprite.destroy();
    this.physics.destroy();
    this.sprite.world.off("beforeupdate", this.cancelgravity, this);
    this.scene.events.off("update", this.entityinterpolate, this);
    for (const frame in this.matterFrameData) {
      this.matterFrameData[frame] = null;
    }
  }
}
