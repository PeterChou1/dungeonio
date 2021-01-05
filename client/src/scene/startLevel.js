import Phaser from "phaser";
import Player from "../entity/player";
import { AOImanagerClient } from "../interest/aoi.manager";
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
          // game is completely controlled by server no need for gravity
          gravity: { y: 0 }, 
        },
      },
    });
  }

  init(data) {
    console.log(data);
    // get name recieved from start menu
    this.playerName = data.playerName;
    // launch hud scene
    this.scene.launch("hudScene", {
      playerName : this.playerName,
      key : this.scene.key
    });
    // if a client is provided use that
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
    this.setuplevel();
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
    // unique id of session
    this.sessionId = gameConfig.networkdebug ? "test" : this.room.sessionId;
    // unique id of room
    this.roomId = gameConfig.networkdebug ? "test" : this.room.id;
    //console.log('joined room with sessionId ', this.sessionId);
    this.keys = this.input.keyboard.addKeys({
      up: KeyCodes.W,
      down: KeyCodes.S,
      left: KeyCodes.A,
      right: KeyCodes.D,
      attack: KeyCodes.P,
      run: KeyCodes.SHIFT,
      ...(gameConfig.networkdebug && {
        up_p2: KeyCodes.UP,
        down_p2: KeyCodes.DOWN,
        left_p2: KeyCodes.LEFT,
        right_p2: KeyCodes.RIGHT,
        attack_p2: KeyCodes.SPACE,
        run_p2: KeyCodes.NUMPAD_ZERO
      }),
    });
    // request Id of the last request sent to server
    this.curreqId = 0;
    // attach listener to keyboard inputs
    // TODO: detach listener on destruction
    for (const prop in this.keys) {
      if (Object.prototype.hasOwnProperty.call(this.keys, prop)) {
        this.keys[prop].on("down", (key) => {
          this.updatePlayerInput(prop, key);
        });
        this.keys[prop].on("up", (key) => {
          this.updatePlayerInput(prop, key);
        });
      }
    }
    // debug purposes
    if (gameConfig.debug) {
      this.matter.world.createDebugGraphic();
    }
    if (gameConfig.networkdebug) {
      //inject server instance into client side
      this.serverinstance = await Game.createGame();
      this.serverinstance.addPlayer({ sessionId: "test" }, "test");
      this.testplayer = new Player(this, 200, 200, "test", "test", false, 100, 100, this.aoiclient, true);
      this.serverinstance.addPlayer({ sessionId: "test2" }, "test2");
      this.testplayer2 = new Player(this, 100, 200, "test2", "test2", false, 100, 100, this.aoiclient, true);
      const height = this.gamelayer.ground.height;
      const width = this.gamelayer.ground.width;
      this.matter.world.setBounds(0, 0, width, height);
      this.cameras.main.setBounds(0, 0, width, height);
      this.cameras.main.startFollow(this.testplayer.sprite);
      this.aoiclient.setMain(this.testplayer);
      this.cameras.main.roundPixels = true;
    }
  }

  setuplevel() {
    this.map = this.add.tilemap("map");
    this.gametile = {
      mainlev: this.map.addTilesetImage("mainlevbuild", "tiles"),
      background: this.map.addTilesetImage("background_obj_extruded", "background"),
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
    this.aoiclient = new AOImanagerClient(this.gamelayer.ground.height, this.gamelayer.ground.width);
  }

  setupnetwork() {
    this.allplayers = {};
    this.room.state.players.onAdd = (config, key) => {
      console.log(`--Player added with id: ${key} added--`);
      this.allplayers[key] = new Player(
        this,
        0,
        0,
        key,
        config.playerName,
        false,
        100,
        100,
        this.aoiclient
      );
      if (key === this.sessionId) {
        this.aoiclient.setMain(this.allplayers[key]);
        const height = this.gamelayer.ground.height;
        const width = this.gamelayer.ground.width;
        this.matter.world.setBounds(0, 0, width, height);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.startFollow(this.allplayers[key].sprite);
      }
    }
    this.room.state.players.onRemove = (player, key) =>  {
      console.log(`--player with id: ${key} removed--`);
      this.allplayers[key].destroy();
      delete this.allplayers[key];
    }

    this.room.onMessage(messageType.aoiupdate, (entities) => {
      //console.log("aoi update");
      for (const id in entities) {
        if (id in this.allplayers) {
          if (!this.allplayers[id].awake) {
            this.allplayers[id].setAwake();
          }
          this.allplayers[id].updatePlayer({
            x: entities[id].x,
            y: entities[id].y,
            flipX: entities[id].flipX,
            anims: entities[id].anims,
            maxhealth: entities[id].maxhealth,
            health: entities[id].health,
          });
        } else {
          throw `entity id: not recognized: ${id}`;
        }
      }
    });

    this.room.onMessage(messageType.kill, () => {
      // if id equal this session id that means player died destroy all player and leave
      this.room.removeAllListeners();
      this.room.leave();
      for (const id in this.allplayers) {
        this.allplayers[id].destroy();
        delete this.allplayers[id];
      }
      this.deactiveCaptures();
      this.scene.stop("hudScene");
      this.scene.start("deadScreen", {
        client: this.client,
      });
    })

    // if client got booted for whatever reason
    this.room.onLeave((code) => {
      console.log(`client kicked code: ${code}`);
      this.room.removeAllListeners();
      this.deactiveCaptures();
      this.scene.stop("hudScene");
      this.scene.start("mainMenu", {
        client: this.client,
      });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        console.log("hidden player");
        // TODO: if AI enemies are added AI enemies must be set asleep too
        for (const id in this.allplayers) {
          if (id !== this.sessionId) {
            this.allplayers[id].setAsleep();
          }
        }
        this.room.send(messageType.playersleep);
      } else {
        console.log('set awake player');
        this.room.send(messageType.playerawake);
      }
    });
  }

  /**
   * @description deactive capturing for keys
   */
  deactiveCaptures() {
    this.input.keyboard.removeAllListeners();
    for (const prop in this.keys) {
      this.input.keyboard.removeCapture(this.keys[prop].keyCode);
    }

  }

  updatePlayerInput(prop, key) {
    const req = {
      [prop] : {
        isDown : key.isDown,
        isUp : key.isUp
      }
    }
    // increment curr req Id for next request
    this.curreqId++;
    if (gameConfig.simulatelatency) {
      setTimeout(() => {
        this.room.send(messageType.playerinput, req);
      }, this.randlatency);
    } else if (gameConfig.networkdebug) {
      const req_p1 = {
        left: {
          isDown : this.keys.left.isDown,
          isUp : this.keys.left.isUp
        },
        right: {
          isDown : this.keys.right.isDown,
          isUp : this.keys.right.isUp
        },
        up : {
          isDown : this.keys.up.isDown,
          isUp : this.keys.up.isUp
        },
        down : {
          isDown : this.keys.down.isDown,
          isUp : this.keys.down.isUp
        },
        run : {
          isDown : this.keys.run.isDown,
          isUp: this.keys.run.isUp
        },
        attack : {
          isDown : this.keys.attack.isDown,
          isUp : this.keys.attack.isUp
        }
      };
      const req_p2 = {
        left: {
          isDown : this.keys.left_p2.isDown,
          isUp : this.keys.left_p2.isUp
        },
        right: {
          isDown : this.keys.right_p2.isDown,
          isUp : this.keys.right_p2.isUp
        },
        up : {
          isDown : this.keys.up_p2.isDown,
          isUp : this.keys.up_p2.isUp
        },
        down : {
          isDown : this.keys.down_p2.isDown,
          isUp : this.keys.down_p2.isUp
        },
        run : {
          isDown : this.keys.run_p2.isDown,
          isUp: this.keys.run_p2.isUp
        },
        attack : {
          isDown : this.keys.attack_p2.isDown,
          isUp : this.keys.attack_p2.isUp
        }
      };
      this.serverinstance.manualUpdateInput("test", req_p1);
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
        y: state.y,
        flipX: state.flipX,
        anims: state.anims,
        maxhealth: state.maxhealth,
        health: state.health,
      });
      const state2 = this.serverinstance.manualGetState("test2");
      this.testplayer2.updatePlayer({
        x: state2.x,
        y: state2.y,
        flipX: state2.flipX,
        anims: state2.anims,
        maxhealth: state2.maxhealth,
        health: state2.health,
      });
    }
  }
}
