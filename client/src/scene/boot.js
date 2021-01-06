import Phaser from "phaser";

export class bootScene extends Phaser.Scene {
  constructor() {
    super({
      key: "bootScene",
    });
  }

  init(data) {
    console.log(data);
    // get name recieved from start menu
    this.playerName = data.playerName;
  }

  preload() {
    /* load ui */
    this.load.image("left-cap-red", "public/ui/barHorizontal_red_left.png");
    this.load.image("middle-red", "public/ui/barHorizontal_red_mid.png");
    this.load.image("right-cap-red", "public/ui/barHorizontal_red_right.png");

    this.load.image("left-cap-green", "public/ui/barHorizontal_green_left.png");
    this.load.image("middle-green", "public/ui/barHorizontal_green_mid.png");
    this.load.image(
      "right-cap-green",
      "public/ui/barHorizontal_green_right.png"
    );

    this.load.image(
      "left-cap-shadow",
      "public/ui/barHorizontal_shadow_left.png"
    );
    this.load.image("middle-shadow", "public/ui/barHorizontal_shadow_mid.png");
    this.load.image(
      "right-cap-shadow",
      "public/ui/barHorizontal_shadow_right.png"
    );
    this.load.image("Interface", "public/tilemaps/tilesetImage/Interface.png");
    this.load.tilemapTiledJSON("uimap", "public/tilemaps/json/uimap.json");
    /* load level */
    this.load.image("tiles", "public/tilemaps/tilesetImage/mainlevbuild.png");
    this.load.image(
      "background",
      "public/tilemaps/tilesetImage/background_obj_extruded.png"
    );
    this.load.tilemapTiledJSON("map", "public/tilemaps/json/level2.json");

    /* load gameobject/playersprites */
    this.load.multiatlas(
      "mainchar",
      "public/spritesheet/json/mainchar.json",
      "public/spritesheet"
    );
  }

  create() {
    this.scene.start("startLevel", {
      playerName: this.playerName,
    });
  }
}
