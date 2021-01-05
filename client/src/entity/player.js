import { gameConfig, frontEndEvent } from "../../../common";
import { HealthBar } from "../ui/healthbar";

export default class Player {
  /**
   * @param {*} scene 
   * @param {*} x 
   * @param {*} y 
   * @param {*} key 
   * @param {*} playerName 
   * @param {*} flipX whether or not the player is flip horizontally
   * @param {*} maxhealth 
   * @param {*} health 
   * @param {*} awake set player to awake or asleep mode
   */
  constructor(
    scene, 
    x, y, 
    key, 
    playerName, 
    flipX, 
    maxhealth, 
    health,
    aoi,
    awake = false
  ) {
    console.log(`player name: ${playerName} joined`);
    this.x = x;
    this.y = y;
    this.aoi = aoi;
    this.aoiId = null;
    // prevents setting awake then setting asleep
    this.insomniamode = false;
    this.isawake = awake;
    this.playerName = playerName;
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
    //this.generateBodyFrames();
    // keeps track of server updates positions by server for interpolation purposes
    this.serverInterpolation = [];
    this.sprite.setScale(2);
    //this.mainBody = Bodies.rectangle(0, 0, 100, 2000, { chamfer: 10 });
    //this.sprite.setExistingBody(this.mainBody);
    //this.sprite.setFixedRotation();
    this.sprite.setPosition(x, y);
    this.sprite.setFlipX(flipX);
    // default animation state
    this.animationstate = "idle";
    // if its player instaniate health bar
    this.playertext = scene.add.text(x, y - 50, playerName);
    this.playertext.setOrigin(0.5, 0.5);
    if (this.scene.sessionId !== this.playerId) {
      this.hp = new HealthBar(scene, x - 50, y - 75, 100, 0.25, true);
    }
    if (awake) {
      this.setAwake();
    } else {
      this.setAsleep();
    }
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  getPosition() {
    return {
      x: this.x,
      y: this.y
    }
  }

  getAOIid() {
    return this.aoiId;
  }

  setAOIid(aoiId) {
    this.aoiId = aoiId;
  }


  setAsleep() {
    if (!this.insomniamode) {
      console.log(`player ${this.playerId} set asleep`);
      this.awake = false;
      if (this.scene.sessionId !== this.playerId) {
        this.hp.setHidden();
      }
      this.scene.events.off('update', this.update, this);
      this.sprite.setActive(false)
                 .setVisible(false);
      this.playertext.setActive(false)
                     .setVisible(false);
    }
  }

  setAwake() {
    console.log(`player ${this.playerId} set awake`);
    this.awake = true;
    this.sprite.anims.play(this.animationstate);
    if (this.scene.sessionId !== this.playerId) {
      this.hp.setVisible();
    }
    this.scene.events.on('update', this.update, this);
    this.sprite.setActive(true)
               .setVisible(true);
    this.playertext.setActive(true)
                   .setVisible(true);
    this.insomniamode = true;
    setTimeout(() => {
      this.insomniamode = false;
    }, 1000)
    //console.log(`name: ${this.playerName} set wake`);
    //console.log(this.getPosition());

  }

  updatePlayer({ x, y, flipX, collisionData, anims, maxhealth, health }) {
    //console.log(`name: ${this.playerName} (x: ${x} y: ${y})`);
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
    if (this.animationstate !== anims) {
      this.sprite.anims.play(anims);
      this.animationstate = anims;
    }
    //let serverInterpolation = [];
    this.setPosition(x, y);
    this.playertext.setPosition(x, y - 50);
    if (this.hp) this.hp.setPosition(x - 45, y - 75);
    if (gameConfig.networkdebug) {
      this.playertext.setText(
        `x: ${x} y: ${y} flipX: ${flipX} anims: ${anims} maxhealth: ${maxhealth} health: ${health}`
      );
    }
    this.aoi.aoiupdate(this);
  }

  update() {
    this.aoi.aoiupdate(this);
    this.sprite.setPosition(this.x, this.y);
  }

  destroy() {
    if (this.hp) this.hp.destroy();
    this.sprite.destroy();
    this.scene.events.off('update', this.update, this);
    this.playertext.destroy();
  }
}
