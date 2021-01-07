import { HealthBar, StaminaBar } from "../ui/bar";
import { frontEndEvent } from "../../../common";

export class hudScene extends Phaser.Scene {
  
  init(data) {
    this.playername = data.playerName;
    this.key = data.key;
  }

  constructor() {
    super({
      key: "hudScene",
    });
    // placement of ui
    this.coords = {
      name: { x: 48, y: 25 },
      healthbar: { x: 48, y: 50, width: 200 },
      staminabar: { x: 48, y: 70, width: 200 },
    };
    // stats ui is keeping track of
    this.stats = {};
  }

  create() {
    console.log("launch hud scene");
    const map = this.add.tilemap("uimap");
    const uiImageset = map.addTilesetImage("Interface", "Interface");
    map.createStaticLayer("ui", uiImageset, 0, 0);
    this.healthbar = new HealthBar(
      this,
      this.coords.healthbar.x,
      this.coords.healthbar.y,
      this.coords.healthbar.width,
      0.5
    );
    this.staminabar = new StaminaBar(
      this,
      this.coords.staminabar.x,
      this.coords.staminabar.y,
      this.coords.staminabar.width,
      0.5
    );
    this.playertext = this.add
      .text(this.coords.name.x, this.coords.name.y, this.playername)
      .setStyle({
        fontFamily: "uifont",
        fontSize: "12px",
        color: "black",
        fontWeight: "bold",
      });

    this.scene.get(this.key).events.on(frontEndEvent.uiupdate, (updates) => {
      const { maxhealth, health, maxstamina, stamina } = updates;
      this.healthbar.animateToFill(health / maxhealth);
      this.staminabar.animateToFill(stamina / maxstamina);
    });
  }
}
