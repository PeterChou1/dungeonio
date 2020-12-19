import Phaser from "phaser";
import { collisionData } from "../../common/globalConfig";
import { PlayerGroup } from "../entities/playerGroup";
import { messageType } from "../../common/globalConfig";
import { ActionQueue, createanims } from "../utils/utils";
import { playerAnims } from "../config/playerConfig";
import PhaserMatterCollisionPlugin from "../utils/matterCollision";

export class StartLevel extends Phaser.Scene {
  map: Phaser.Tilemaps.Tilemap;
  tileset: Phaser.Tilemaps.Tileset;
  ground: Phaser.Tilemaps.DynamicTilemapLayer;
  playergroup: PlayerGroup;
  objectgroup; // map collision data
  eventQueue: ActionQueue;
  room;
  frameData;
  frameNames;

  constructor() {
    super({
      key: "start",
      physics: {
        default: "matter",
        matter: {
          gravity: { y: 1 }, // This is the default value, so we could omit this
        },
      },
    });
  }

  init() {
    //console.log('init');
    //@ts-ignore suppress preBoot error since we overwrote it
    this.room = this.game.config.preBoot();
    this.plugins.removeScenePlugin("matterCollision");
    this.plugins.installScenePlugin(
      "matterCollision",
      PhaserMatterCollisionPlugin,
      "matterCollision",
      this
    );
    this.eventQueue = new ActionQueue();
    console.log("---- init ----");
  }

  preload() {
    console.log("preload");
    this.load.image(
      "tiles",
      "../../../../common/assets/tilemaps/tilesetImage/mainlevbuild.png"
    );
    this.load.tilemapTiledJSON(
      "map",
      "../../../../common/assets/tilemaps/json/level1.json"
    );
    this.load.multiatlas(
      "mainchar",
      "../../../../common/assets/spritesheet/json/mainchar.json",
      "../../../../common/assets/spritesheet"
    );
    this.load.json("frameData", "../../../../common/assets/frameData.json");
  }

  create() {
    console.log("---start creation---");
    this.frameData = this.cache.json.get("frameData");
    this.frameNames = createanims(this, playerAnims);
    this.playergroup = new PlayerGroup(this);
    this.map = this.add.tilemap("map");
    this.tileset = this.map.addTilesetImage("mainlevbuild", "tiles");
    this.ground = this.map.createDynamicLayer("ground", this.tileset, 0, 0);
    const height = this.ground.height;
    const width = this.ground.width;
    this.matter.world.setBounds(0, 0, width, height);
    this.objectgroup = {
      soft: [], // soft tiles
      hard: this.ground.filterTiles((tile) => !tile.properties.soft),
    };
    const platforms = this.map.getObjectLayer("platform");
    platforms.objects.forEach((rect) => {
      this.objectgroup.soft.push(
        this.matter.add.rectangle(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
          rect.width,
          rect.height,
          {
            isSensor: true, // It shouldn't physically interact with other bodies
            isStatic: true, // It shouldn't move
          }
        )
      );
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
          mattertile.setCollisionCategory(collisionData.category.hard);
        }

        if (tile.properties.debug) {
          console.log(`x: ${tile.pixelX} y: ${tile.pixelY}`);
        }
      }
    });
    this.handlePlayerInput();
    console.log("---end creation---");
  }

  addPlayer(clientid, playerName) {
    this.eventQueue.enqueue({
      callback: (clientid, playerName) => {
        this.playergroup.spawn(clientid, playerName);
      },
      args: [clientid, playerName],
    });
  }

  removePlayer(clientid) {
    this.events.once("update", () => this.playergroup.despawn(clientid));
  }

  handlePlayerInput() {
    this.room.onMessage(messageType.playerinput, (client, playerinput) => {
      this.playergroup.updatePlayerInput(client.sessionId, playerinput);
    });
  }

  update() {
    this.eventQueue.executeActions();
  }
}
