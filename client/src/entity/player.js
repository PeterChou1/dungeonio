import e from "cors";
import { gameConfig, frontEndEvent } from "../../../common";
import { HealthBar } from "../ui/healthbar";
const { Body, Bodies } = Phaser.Physics.Matter.Matter;


export default class Player {
  /**
   * 
   * @param {*} scene 
   * @param {*} x 
   * @param {*} y 
   * @param {*} key 
   * @param {*} playerName 
   * @param {*} flipX whether or not the player is flip horizontally
   * @param {*} maxhealth 
   * @param {*} health 
   * @param {*} isawake set player to awake or asleep mode
   */
  constructor(
    scene, 
    x, y, 
    key, 
    playerName, 
    flipX, 
    maxhealth, 
    health, 
    isawake = true
  ) {
    console.log(`player name: ${playerName} joined`);
    this.isawake = isawake;
    // meta attributes on player
    this.meta = {
      maxhealth: maxhealth,
      health: health,
    };
    this.scene = scene;
    this.sprite = scene.matter.add.sprite(
      x,
      y,
      "mainchar",
      "adventure-idle-00"
    );
    this.playerId = key;
    this.matterFrameData = {};
    //this.generateBodyFrames();
    // keeps track of server updates positions by server for interpolation purposes
    this.serverInterpolation = [];
    this.sprite.setScale(2);
    //this.mainBody = Bodies.rectangle(0, 0, 100, 2000, { chamfer: 10 });
    //this.sprite.setExistingBody(this.mainBody);
    //this.sprite.setFixedRotation();
    this.sprite.setPosition(x, y);
    this.sprite.setFlipX(flipX);
    // default state of player values is idle
    this.playerstate = "idle";
    this.sprite.anims.play(this.playerstate);
    this.scene.events.on("update", this.entityinterpolate, this);
    // if its player instaniate health bar
    this.playertext = scene.add.text(x, y - 50, playerName);
    this.playertext.setOrigin(0.5, 0.5);
    if (this.scene.sessionId !== this.playerId) {
      this.hp = new HealthBar(scene, x - 50, y - 75, 100, 0.25, true);
    }
    if (this.isawake) {
      this.setAwake();
    } else{
      this.setAsleep();
    }

  }

  /**
   * @desciption set aoi id
   */
  getAOIid() {
    return this.aoiId;
  }

  setAOIid(x, y) {
    this.aoiId = {x: x, y: y};
  }

  /**
   * @description sets player character into slient sleep mode
   */
  setAsleep() {

  }
  
  /**
   * @description sets player asleep
   */
  setAwake() {

  }



  updatePlayer({ x, y, flipX, collisionData, state, maxhealth, health }) {
    if (this.scene.sessionId !== this.playerId) {
      this.hp.animateToFill(health / maxhealth);
    } else {
      this.scene.events.emit(frontEndEvent.uiupdate, {
        maxhealth, health 
      });
    }
    this.meta = {
      maxhealth: maxhealth,
      health: health,
    };
    this.sprite.setFlipX(flipX);
    this.sprite.setCollidesWith(collisionData);
    if (this.playerstate !== state) {
      this.sprite.anims.play(state);
    }
    this.playerstate = state;
    let serverInterpolation = [];
    if (gameConfig.networkdebug) {
      this.sprite.setPosition(x, y);
      this.playertext.setPosition(x, y - 50);
      this.playertext.setText(
        `x: ${x} y: ${y} flipX: ${flipX} state: ${state} maxhealth: ${maxhealth} health: ${health}`
      );
    } else {
      if (document.hidden) {
        // when browser is hidden don't interpolate update immediately
        this.sprite.setPosition(x, y);
        this.playertext.setPosition(x, y - 50);
        this.hp.setPosition(x - 45, y - 75);
      } else {
        for (let i = 0; i <= 1; i += 0.25) {
          let xInterp = Phaser.Math.Interpolation.Linear([this.sprite.x, x], i);
          let yInterp = Phaser.Math.Interpolation.Linear([this.sprite.y, y], i);
          //console.log(`coordinates interp x:${xInterp}  y:${yInterp}`);
          serverInterpolation.push({
            x: xInterp,
            y: yInterp,
          });
        }
      }
    }
    //console.log(serverInterpolation);
    this.serverInterpolation = serverInterpolation;
    //console.log("debug update");
  }

  entityinterpolate() {
    // interpolate between new and older positions
    if (this.serverInterpolation.length > 0) {
      const coord = this.serverInterpolation.shift();
      this.sprite.setPosition(coord.x, coord.y);
      if (this.scene.sessionId !== this.playerId) {
        this.hp.setPosition(coord.x - 50, coord.y - 75);
      }
      if (gameConfig.networkdebug && this.scene.sessionId === this.playerId) {
        //console.log(misc);
        this.playertext.setPosition(coord.x - 200, coord.y - 100);
      } else {
        this.playertext.setPosition(coord.x, coord.y - 50);
        
      }
    }
  }

  getPlayerState() {
    return this.playerstate;
  }

  destroy() {
    //this.sprite.world.off("beforeupdate", this.cancelgravity, this);
    console.log(this.hp);
    if (this.scene.sessionId !== this.playerId) {
      this.hp.destroy();
    }
    this.sprite.destroy();
    this.scene.events.off("update", this.entityinterpolate, this);
    this.playertext.destroy();
    for (const frame in this.matterFrameData) {
      this.matterFrameData[frame] = null;
    }
  }
}
