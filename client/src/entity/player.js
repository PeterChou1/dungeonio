import { gameConfig, frontEndEvent } from "../../../common";
import { HealthBar } from "../ui/bar";



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
  constructor(scene, x, y, key, playerName, aoi, awake = false) {
    console.log(`player name: ${playerName} joined`);
    // interpolated value from server
    // keeps track of server updates positions by server for interpolation purposes
    this.x_interp = null;
    this.y_interp = null;
    this.serverInterpolation = [];
    // last server position
    this.x = x;
    this.y = y;
    this.aoi = aoi;
    this.aoiId = null;
    // prevents setting awake then setting asleep
    this.insomniamode = false;
    this.isawake = awake;
    this.playerName = playerName;
    // meta attributes on player set to defaults
    this.meta = {
      maxhealth: 100,
      health: 100,
      maxstamina: 100,
      stamina: 100,
      combocount: 0,
    };
    this.scene = scene;
    this.sprite = scene.matter.add.sprite(
      x,
      y,
      "mainchar",
      "adventure-idle-00"
    );
    this.playerId = key;
    this.sprite.setScale(2);
    this.sprite.setPosition(x, y);
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
      y: this.y,
    };
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
      this.serverInterpolation = [];
      this.x_interp = null;
      this.y_interp = null;
      this.awake = false;
      if (this.scene.sessionId !== this.playerId) {
        this.hp.setHidden();
      }
      this.scene.events.off("update", this.update, this);
      this.sprite.setActive(false).setVisible(false);
      this.playertext.setActive(false).setVisible(false);
    }
  }

  setAwake() {
    console.log(`player ${this.playerId} set awake`);
    this.awake = true;
    this.sprite.anims.play(this.animationstate);
    if (this.scene.sessionId !== this.playerId) {
      this.hp.setVisible();
    }
    this.scene.events.on("update", this.update, this);
    this.sprite.setActive(true).setVisible(true);
    this.playertext.setActive(true).setVisible(true);
    this.insomniamode = true;
    setTimeout(() => {
      this.insomniamode = false;
    }, 1000);
    //console.log(`name: ${this.playerName} set wake`);
    //console.log(this.getPosition());
  }

  /**
   * @description damage pop up indicator
   * @param {*} damage
   */
  popup(text, options) {
    if (!options) options = {};
    this.scene.floatingNumbers.createFloatingText({
      textOptions: {
        fontFamily: "uifont",
        fontSize: options.fontsize ? options.fontsize : 20,
        color: options.color ? options.color : "#ff0000",
        strokeThickness: 2,
        fontWeight: "bold",
        stroke: "#000000",
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#000",
          blur: 4,
          stroke: true,
          fill: false,
        },
      },
      text: text.toString(),
      align: "top-center",
      parentObject: this.sprite,
      animation: options.animation ? options.animation : "up",
      animationEase: "Linear",
    });
  }
  
  updateText(newhealth) {
    const dmgdealt = this.meta.health - newhealth;
    if (dmgdealt > 0) {
      if (this.animationstate === "hitstun") {
        this.meta.combocount++;
        if (this.meta.combocount > 1) {
          this.popup(`combo ${this.meta.combocount}`, {
            fontsize: 12,
            animation: "smoke",
            color: "#11ff00",
          });
        }
      } else {
        this.meta.combocount = 1;
      }
      this.popup(dmgdealt.toString());
    } else if (
      this.animationstate !== "hitstun" &&
      this.animationstate !== "hurt"
    ) {
      this.meta.combocount = 0;
    }
  }

  updatePlayer({ x, y, flipX, anims, maxhealth, health, maxstamina, stamina }) {
    this.updateText(health);
    this.meta = {
      ...this.meta,
      ...{
        maxstamina: maxstamina,
        stamina: stamina,
        maxhealth: maxhealth,
        health: health,
      },
    };
    this.sprite.setFlipX(flipX);
    this.setPosition(x, y);
    this.aoi.aoiupdate(this);
    if (this.scene.sessionId !== this.playerId) {
      this.hp.animateToFill(health / maxhealth);
    } else {
      this.scene.events.emit(frontEndEvent.uiupdate, this.meta);
    }
    if (this.animationstate !== anims) {
      this.sprite.anims.play(anims);
      this.animationstate = anims;
    }
    if (gameConfig.networkdebug) {
      this.playertext.setText(
        `x: ${x} y: ${y} flipX: ${flipX} anims: ${anims} \n maxhealth: ${maxhealth} health: ${health} maxstamina: ${maxstamina} stamina ${stamina}`
      );
    }

    this.serverInterpolation = [];
    if (!this.x_interp && !this.y_interp) {
      this.x_interp = x;
      this.y_interp = y;
      this.serverInterpolation.push({ x: x, y: y });
    } else {
      for (let i = 0; i <= 1; i += 0.25) {
        let xInterp = Phaser.Math.Interpolation.Linear([this.x_interp, x], i);
        let yInterp = Phaser.Math.Interpolation.Linear([this.y_interp, y], i);
        //console.log(`coordinates interp x:${xInterp}  y:${yInterp}`);
        this.serverInterpolation.push({
          x: xInterp,
          y: yInterp,
        });
      }
    }
  }

  update() {
    this.aoi.aoiupdate(this);
    if (this.serverInterpolation.length > 0 && !gameConfig.networkdebug) {
      const coord = this.serverInterpolation.shift();
      this.sprite.setPosition(coord.x, coord.y);
      this.x_interp = coord.x;
      this.y_interp = coord.y;
      this.layoutUI(coord.x, coord.y);
    } else {
      this.layoutUI(this.x, this.y);
    }
  }

  layoutUI(x, y) {
    this.sprite.setPosition(x, y);
    this.playertext.setPosition(x, gameConfig.networkdebug ? y - 100 : y - 50);
    if (this.hp) this.hp.setPosition(x - 45, y - 75);
  }

  destroy() {
    if (this.hp) this.hp.destroy();
    this.sprite.destroy();
    this.scene.events.off("update", this.update, this);
    this.playertext.destroy();
  }
}
