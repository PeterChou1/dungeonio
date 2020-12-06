import Phaser from "phaser";
import Player from "../entity/player";
import {
  gameConfig,
  collisionData,
  messageType,
} from "../../../../common/globalConfig.ts";
import { LocalPlayer } from "../entity/localplayer";
import { test } from "../test/test";
import { playerAnims } from "../config/playerconfig";
import { createanims, randomInteger } from "../utils/utils";
const Colyseus = require("colyseus.js");

export class startLevel extends Phaser.Scene {
  constructor() {
    super({
      key: "startLevel",
      physics: {
        default: "matter",
        matter: {
          debug: gameConfig.debug,
          gravity: { y: 1 }, // set 0 to disable gravity
        },
      },
    });

    //this.socket = io();
    ////console.log(this.socket);
  }

  init(data) {
    console.log(data);
    // get name recieved from start menu
    this.playerName = data.playerName;
  }

  async connect() {
    //const host = window.document.location.host.replace(/:.*/, '');
    var host = window.document.location.host.replace(/:.*/, "");
    let port;
    // if port is 8080 or 8081 it means we are using dev environment then default to default port
    if (location.port && location.port !== "8081" && location.port != "8080") {
      port = `:${location.port}`;
    } else {
      port = "";
    }

    var websocket =
      location.protocol.replace("http", "ws") + "//" + host + port;
    console.log(location);
    console.log(`connected to web socket protocol ${websocket}`);
    const client = new Colyseus.Client(websocket);
    // joined defined room
    try {
      return await client.joinOrCreate("game", {
        playerName: this.playerName,
      });
    } catch (e) {
      // if there is an error redirect user back to main menu with error msg
      // TODO : not implemented
      this.scene.start("mainMenu", {
        error: e,
      });
    }
  }

  async create() {
    this.room = await this.connect();
    this.setupnetwork();
    this.frameData = this.cache.json.get("frameData");
    // create player animations;
    this.frameNames = createanims(this, playerAnims);
    // track request numbers
    this.requestNum = 0;
    // random number generated for network latency test
    this.randlatency = 50; //randomInteger(0, 500);
    console.log("random latency (client) ", this.randlatency);
    this.sessionId = this.room.sessionId;
    //console.log('joined room with sessionId ', this.sessionId);
    this.keys = this.input.keyboard.createCursorKeys();
    // request Id of the last request sent to server
    this.curreqId = 0;

    // attach listener to keyboard inputs
    // TODO: detach listener on destruction
    for (var prop in this.keys) {
      if (Object.prototype.hasOwnProperty.call(this.keys, prop)) {
        this.keys[prop].on("down", () => {
          this.updatePlayerInput();
        });
        this.keys[prop].on("up", () => {
          this.updatePlayerInput();
        });
      }
    }
    this.map = this.add.tilemap("map");
    this.gametile = {
      mainlev: this.map.addTilesetImage("mainlevbuild", "tiles"),
      background: this.map.addTilesetImage("background_obj", "background"),
    };

    this.gamelayer = {
      background3: this.map.createStaticLayer(
        "background3",
        this.gametile.background,
        0,
        0
      ),
      background2: this.map.createStaticLayer(
        "background2",
        this.gametile.background,
        0,
        0
      ),
      background1: this.map.createStaticLayer(
        "background1",
        this.gametile.background,
        0,
        0
      ),
      ground: this.map.createDynamicLayer(
        "ground",
        this.gametile.mainlev,
        0,
        0
      ),
    };

    ////console.log(convertedlayer);
    this.objectgroup = {
      soft: [], // soft tiles
      hard: this.gamelayer.ground.filterTiles((tile) => !tile.properties.soft),
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
    this.gamelayer.ground.forEachTile((tile) => {
      if (tile.properties.collides) {
        const mattertile = new Phaser.Physics.Matter.TileBody(
          this.matter.world,
          tile
        );
        if (tile.properties.soft) {
          mattertile.setCollisionCategory(collisionData.category.soft);
        } else {
          mattertile.setCollisionCategory(collisionData.category.hard);
        }
        if (tile.properties.debug && gameConfig.debug) {
          //console.log(`x: ${tile.pixelX} y: ${tile.pixelY}`);
        }
      }
    });
    // track all players in game

    if (gameConfig.debug) {
      //console.log('---game debug mode---');
      this.matter.world.createDebugGraphic();
    }
    // set initial input
    this.updatePlayerInput();
  }

  setupnetwork() {
    this.allplayers = {};
    this.room.state.players.onAdd = (player, key) => {
      // check if player is added already
      //console.log(`---${key}---`)
      if (!(key in this.allplayers) && key === this.sessionId) {
        console.log(`--Player added with id: ${key}--`);
        if (gameConfig.debug) {
          //this.allplayers[key] = new LocalPlayer(this, player.x, player.y, 2)
          //var x = new test(this);
          this.allplayers[key] = new Player(
            this,
            player.x,
            player.y,
            2,
            key,
            player.playerName
          );
        } else {
          this.allplayers[key] = new Player(
            this,
            player.x,
            player.y,
            2,
            key,
            player.playerName
          );
          //this.localplayer = new LocalPlayer(this, player.x, player.y, 2);
        }
        if (key === this.sessionId) {
          // follow player
          //console.log('camera followed player');
          const height = this.gamelayer.ground.height;
          const width = this.gamelayer.ground.width;
          this.matter.world.setBounds(0, 0, width, height);
          this.cameras.main.setBounds(0, 0, width, height);
          this.cameras.main.startFollow(this.allplayers[key].sprite);
        }
      }
    };

    this.room.state.players.onChange = (change, key) => {
      if (key in this.allplayers && key === this.sessionId) {
        this.allplayers[key].updatePlayer({
          x: change.x,
          y: change.y,
          flipX: change.flipX,
          collisionData: change.collisionData,
          state: change.state,
          misc: change,
        });
      }
    };

    this.room.state.players.onRemove = (player, key) => {
      console.log(`player id ${key} was removed`);
      if (key === this.sessionId) {
        this.allplayers[key].destroy();
      }
    };
  }

  updatePlayerInput() {
    const req = {
      left_keydown: this.keys.left.isDown,
      right_keydown: this.keys.right.isDown,
      up_keydown: this.keys.up.isDown,
      down_keydown: this.keys.down.isDown,
      left_keyup: this.keys.left.isUp,
      right_keyup: this.keys.right.isUp,
      up_keyup: this.keys.up.isUp,
      down_keyup: this.keys.down.isUp,
      id: this.curreqId,
    };
    // increment curr req Id for next request
    this.curreqId++;
    if (gameConfig.simulatelatency) {
      setTimeout(() => {
        this.room.send(messageType.playerinput, req);
      }, this.randlatency);
    } else {
      this.room.send(messageType.playerinput, req);
    }
  }

  update() {}
}
