import Phaser from "phaser";
import Player from "../entity/player";
import {
  gameConfig,
  collisionData,
  messageType,
  playerAnims,
} from "../../../common";
import { createanims } from "../utils/utils";
import { Game } from "../../../server/game.v2/game.core";

const Colyseus = require("colyseus.js");
const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

export class startLevel extends Phaser.Scene {
  constructor() {
    super({
      key: "startLevel",
      physics: {
        default: "matter",
        matter: {
          debug: gameConfig.debug,
          gravity: { y: 0 }, // set 0 to disable gravity
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
    // if data has session Id then try to restart
    if (data.hasOwnProperty("client")) {
      this.client = data.client;
    }
  }

  async connect() {
    //const host = window.document.location.host.replace(/:.*/, '');
    try {
      if (this.client === undefined) {
        var host = window.document.location.host.replace(/:.*/, "");
        let port;
        // if port is 8080 or 8081 it means we are using dev environment then default to default port
        if (
          location.port &&
          location.port !== "8081" &&
          location.port != "8080"
        ) {
          port = `:${location.port}`;
        } else {
          port = "";
        }
        var websocket =
          location.protocol.replace("http", "ws") + "//" + host + port;
        console.log(location);
        console.log(`connected to web socket protocol ${websocket}`);
        this.client = new Colyseus.Client(websocket);
        // joined defined room
      }
      return await this.client.joinOrCreate("game", {
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
    if (!gameConfig.networkdebug) {
      this.room = await this.connect();
      this.setupnetwork();
    }
    this.frameData = this.cache.json.get("frameData");
    // create player animations;
    this.frameNames = createanims(this, playerAnims);
    // track request numbers
    this.requestNum = 0;
    // random number generated for network latency test
    this.randlatency = 50; //randomInteger(0, 500);
    console.log("random latency (client) ", this.randlatency);
    // unique id of room
    this.sessionId = gameConfig.networkdebug ? "test" : this.room.sessionId;
    // unique id of session
    this.roomId = gameConfig.networkdebug ? "test" : this.room.id;
    //console.log('joined room with sessionId ', this.sessionId);
    this.keys = this.input.keyboard.addKeys({
      up: KeyCodes.W,
      down: KeyCodes.S,
      left: KeyCodes.A,
      right: KeyCodes.D,
      attack: KeyCodes.P,
      ...(gameConfig.networkdebug && {
        up_p2: KeyCodes.UP,
        down_p2: KeyCodes.DOWN,
        left_p2: KeyCodes.LEFT,
        right_p2: KeyCodes.RIGHT,
        attack_p2: KeyCodes.SPACE,
      }),
    });
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
    // track all players in game
    this.setuplevel();
    // debug purposes
    if (gameConfig.debug) {
      this.matter.world.createDebugGraphic();
    }
    if (gameConfig.networkdebug) {
      //inject server instance into client side
      this.serverinstance = await Game.createGame();
      this.serverinstance.addPlayer({ sessionId: "test" }, "test");
      this.testplayer2 = new Player(this, 200, 200, "test", "test");
      this.serverinstance.addPlayer({ sessionId: "test2" }, "test2");
      this.testplayer = new Player(this, 100, 200, "test2", "test2");
      const height = this.gamelayer.ground.height;
      const width = this.gamelayer.ground.width;
      this.matter.world.setBounds(0, 0, width, height);
      this.cameras.main.setBounds(0, 0, width, height);
      this.cameras.main.startFollow(this.testplayer.sprite);
    }
    // set initial input
    this.updatePlayerInput();
  }

  setuplevel() {
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
  }

  setupnetwork() {
    this.allplayers = {};
    this.room.onMessage(messageType.aoiadd, (entity) => {
      if (!(entity in this.allplayers)) {
        console.log("aoi add");
        console.log(`--Player added with id: ${entity.id}--`);
        // NOTE: simulation coordinates differ by 25
        entity.y -= 25;
        this.allplayers[entity.id] = new Player(
          this,
          entity.x,
          entity.y,
          entity.id,
          entity.name,
          entity.flipX,
          entity.maxhealth,
          entity.health
        );
        //this.localplayer = new LocalPlayer(this, player.x, player.y, 2);
        if (entity.id === this.sessionId) {
          // follow player
          //console.log('camera followed player');
          const height = this.gamelayer.ground.height;
          const width = this.gamelayer.ground.width;
          this.matter.world.setBounds(0, 0, width, height);
          this.cameras.main.setBounds(0, 0, width, height);
          //this.cameras.main.setZoom(0.5);
          this.cameras.main.startFollow(this.allplayers[entity.id].sprite);
        }
      }
    });

    this.room.onMessage(messageType.aoiupdate, (entities) => {
      console.log("aoi update");
      for (const id in entities) {
        if (id in this.allplayers) {
          // NOTE: simulation coordinates differ by 25
          entities[id].y -= 25;
          this.allplayers[id].updatePlayer({
            x: entities[id].x,
            y: entities[id].y,
            flipX: entities[id].flipX,
            collisionData: entities[id].collisionData,
            state: entities[id].state,
            maxhealth: entities[id].maxhealth,
            health: entities[id].health,
          });
        }
      }
    });
    this.room.onMessage(messageType.aoiremove, (entity) => {
      console.log("aoi remove");
      this.allplayers[entity.id].destroy();
      delete this.allplayers[entity.id];
      if (entity.id === this.sessionId) {
        // if id equal this session id that means player died destroy all player and leave
        this.room.removeAllListeners();
        this.room.leave();
        for (const id in this.allplayers) {
          if (id !== this.sessionId) {
            this.allplayers[id].destroy();
            delete this.allplayers[id];
          }
        }
        this.scene.start("deadScreen", {
          client: this.client,
        });
      }
    });
    // if client got booted for whatever reason
    this.room.onLeave((code) => {
      console.log(`client kicked code: ${code}`);
      this.scene.start("mainMenu", {
        client: this.client,
      });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        console.log("hidden player");
        // TODO: if AI enemies are added AI enemies must be deleted too
        for (const id in this.allplayers) {
          if (id !== this.sessionId) {
            this.allplayers[id].destroy();
            delete this.allplayers[id];
          }
        }
        this.room.send(messageType.playersleep);
      } else {
        this.room.send(messageType.playerawake);
      }
    });
  }

  updatePlayerInput() {
    const req = {
      left_keydown: this.keys.left.isDown,
      right_keydown: this.keys.right.isDown,
      up_keydown: this.keys.up.isDown,
      down_keydown: this.keys.down.isDown,
      attack_keydown: this.keys.attack.isDown,
      left_keyup: this.keys.left.isUp,
      right_keyup: this.keys.right.isUp,
      up_keyup: this.keys.up.isUp,
      down_keyup: this.keys.down.isUp,
      attack_keyup: this.keys.attack.isUp,
    };
    // increment curr req Id for next request
    this.curreqId++;
    if (gameConfig.simulatelatency) {
      setTimeout(() => {
        this.room.send(messageType.playerinput, req);
      }, this.randlatency);
    } else if (gameConfig.networkdebug) {
      const req_p2 = {
        left_keydown: this.keys.left_p2.isDown,
        right_keydown: this.keys.right_p2.isDown,
        up_keydown: this.keys.up_p2.isDown,
        down_keydown: this.keys.down_p2.isDown,
        attack_keydown: this.keys.attack_p2.isDown,
        left_keyup: this.keys.left_p2.isUp,
        right_keyup: this.keys.right_p2.isUp,
        up_keyup: this.keys.up_p2.isUp,
        down_keyup: this.keys.down_p2.isUp,
        attack_keyup: this.keys.attack_p2.isUp,
      };
      this.serverinstance.manualUpdateInput("test", req);
      this.serverinstance.manualUpdateInput("test2", req_p2);
    } else {
      this.room.send(messageType.playerinput, req);
    }
  }

  update() {
    if (gameConfig.networkdebug && this.serverinstance) {
      const state = this.serverinstance.manualGetState("test");
      this.testplayer.updatePlayer({
        x: state.x,
        y: state.y - 25,
        flipX: state.flipX,
        collisionData: state.collisionData,
        state: state.state,
        maxhealth: state.maxhealth,
        health: state.health,
      });
      const state2 = this.serverinstance.manualGetState("test2");
      this.testplayer2.updatePlayer({
        x: state2.x,
        y: state2.y - 25,
        flipX: state2.flipX,
        collisionData: state2.collisionData,
        state: state2.state,
        maxhealth: state2.maxhealth,
        health: state2.health,
      });
    }
  }
}
