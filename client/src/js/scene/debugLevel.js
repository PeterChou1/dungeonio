import Phaser from "phaser";
import { gameConfig, collisionData } from "../../../../common/globalConfig.ts";
import PhaserMatterCollisionPlugin from "../../../../server/utils/matterCollision.ts";
// imported from server for hitbox comparison
//import { Player } from "../../../../server/entities/player.ts";
import { Player } from "../../../../server/gameinstance_v2/player.ts";
import PlayerA from "../entity/player";
// local player
//import { LocalPlayer } from "../entity/localplayer";
// actual player used
import { createanims } from "../utils/utils";
import { playerAnims } from "../config/playerconfig";
const { Body, Bodies, Bounds } = Phaser.Physics.Matter.Matter;
const PhysicsEditorParser = Phaser.Physics.Matter.PhysicsEditorParser;

export class debugLevel extends Phaser.Scene {
  constructor() {
    super({
      key: "startLevel",
      physics: {
        default: "matter",
        matter: {
          debug: gameConfig.debug,
          gravity: { y: 1 }, // This is the default value, so we could omit this
        },
      },
    });
  }

  init() {
    //console.log('init');
    //@ts-ignore suppress preBoot error since we overwrote it
    //this.room = this.game.config.preBoot();
    this.plugins.installScenePlugin(
      "matterCollision",
      PhaserMatterCollisionPlugin,
      "matterCollision",
      this
    );
    console.log("---- init ----");
  }

  preload() {
    console.log("preload");
    this.load.image("tiles", "public/tilemaps/tilesetImage/mainlevbuild.png");
    this.load.tilemapTiledJSON("map", "public/tilemaps/json/level1.json");
    this.load.spritesheet("player", "public/spritesheet/adventurer-Sheet.png", {
      frameWidth: 50,
      frameHeight: 37,
    });
    this.load.multiatlas(
      "maincharMulti",
      "public/spritesheet/json/mainchar.json",
      "public/spritesheet"
    );
    this.load.json("frameData", "public/frameData.json");
  }

  create() {
    this.frameData = this.cache.json.get("frameData");
    //this.input.mouse.disableContextMenu();
    this.frameNames = createanims(this, playerAnims);
    this.keys = this.input.keyboard.createCursorKeys();
    this.map = this.add.tilemap("map");
    this.tileset = this.map.addTilesetImage("mainlevbuild", "tiles");
    this.ground = this.map.createDynamicLayer("ground", this.tileset, 0, 0);
    this.objectgroup = {
      soft: [], // soft tiles
      hard: this.ground.filterTiles((tile) => !tile.properties.soft),
    };
    const platforms = this.map.getObjectLayer("platform");
    platforms.objects.forEach((rect) => {
      const platforms = this.matter.add.rectangle(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        rect.width,
        rect.height,
        {
          isSensor: true, // It shouldn't physically interact with other bodies
          isStatic: true, // It shouldn't move
          category: collisionData.category.hard,
          mask: collisionData.category.player,
        }
      );
      this.objectgroup.soft.push(platforms);
    });

    this.ground.forEachTile((tile) => {
      if (tile.properties.collides) {
        const mattertile = new Phaser.Physics.Matter.TileBody(
          this.matter.world,
          tile
        );
        //console.log(mattertile);
        if (tile.properties.soft) {
          mattertile.setCollisionCategory(collisionData.category.soft);
        } else {
          //mattertile.setCollisionCategory(collisionData.category.hard);
        }
        if (tile.properties.debug) {
          console.log(`x: ${tile.pixelX} y: ${tile.pixelY}`);
        }
      }
    });

    if (gameConfig.debug) {
      this.matter.world.createDebugGraphic();
    }
    const height = this.ground.height;
    const width = this.ground.width;
    this.matter.world.setBounds(0, 0, width, height);
    //this.player = new PlayerT(this, 250, 100);
    this.player2 = new Player(this, 300, 100, "testplayer");
    //this.player3 = new PlayerA(this, 350, 100, 2, 'testplayer2', 'unnamed warrior');
    //this.player4 = new LocalPlayer(this, 250, 100, 2);
    //this.addPlayer('testplayer');
  }

  addPlayer(clientid) {
    this.events.once("update", () => {
      this.playergroup.spawn(clientid);
    });
  }

  removePlayer(clientid) {
    this.events.once("update", () => this.playergroup.despawn(clientid));
  }

  update() {
    this.player2.handleClientInput({
      left_keydown: this.keys.left.isDown,
      right_keydown: this.keys.right.isDown,
      up_keydown: this.keys.up.isDown,
      down_keydown: this.keys.down.isDown,
      left_keyup: this.keys.left.isUp,
      right_keyup: this.keys.right.isUp,
      up_keyup: this.keys.up.isUp,
      down_keyup: this.keys.down.isUp,
    });
  }
}
