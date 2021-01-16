import Phaser from "phaser";
import Player from "../entity/player";
import { AOImanagerClient } from "../interest/aoi.manager";
import {
  gameConfig,
  messageType,
  playerAnims,
} from "../../../common";
import { createanims } from "../utils/utils";
import { Game } from "../../../server/game.v2/game.core";
import { FloatingNumbersPlugin } from "../utils/floatTextPlugin";
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
      playerName: this.playerName,
      key: this.scene.key,
    });
    // if a client is provided use that
    if (data.hasOwnProperty("client")) {
      this.client = data.client;
    }
  }

  preload() {
    this.load.scenePlugin(
      "floatingNumbersPlugin",
      FloatingNumbersPlugin,
      "floatingNumbersPlugin",
      "floatingNumbers"
    );
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
    // create player animations;
    createanims(this, playerAnims);
    // track request numbers
    this.requestNum = 0;
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
      attack: KeyCodes.O,
      stratk: KeyCodes.P,
      run: KeyCodes.SHIFT,
      roll: KeyCodes.SPACE,
      ...(gameConfig.networkdebug && {
        up_p2: KeyCodes.UP,
        down_p2: KeyCodes.DOWN,
        left_p2: KeyCodes.LEFT,
        right_p2: KeyCodes.RIGHT,
        attack_p2: KeyCodes.SEVEN,
        stratk_p2: KeyCodes.EIGHT,
        run_p2: KeyCodes.NINE,
        roll_p2: KeyCodes.ZERO,
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
      this.serverinstance = new Game();
      this.serverinstance.addPlayer({ sessionId: "test" }, "test");
      this.testplayer = new Player(
        this,
        200,
        200,
        "test",
        "test",
        this.aoiclient,
        true
      );
      this.serverinstance.addPlayer({ sessionId: "test2" }, "test2");
      this.testplayer2 = new Player(
        this,
        100,
        200,
        "test2",
        "test2",
        this.aoiclient,
        true
      );
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
      background: this.map.addTilesetImage(
        "background_obj_extruded",
        "background"
      ),
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
    this.aoiclient = new AOImanagerClient(
      this.gamelayer.ground.height,
      this.gamelayer.ground.width
    );
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
    };
    this.room.state.players.onRemove = (player, key) => {
      console.log(`--player with id: ${key} removed--`);
      this.allplayers[key].destroy();
      delete this.allplayers[key];
    };

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
            maxstamina: entities[id].maxstamina,
            stamina: entities[id].stamina,
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
      this.floatingNumbers.destroy();
      for (const id in this.allplayers) {
        this.allplayers[id].destroy();
        delete this.allplayers[id];
      }
      this.deactiveCaptures();
      this.scene.stop("hudScene");
      this.scene.start("deadScreen", {
        client: this.client,
      });
    });

    // if client got booted for whatever reason
    this.room.onLeave((code) => {
      console.log(`client kicked code: ${code}`);
      this.scene.stop("hudScene");
      this.room.removeAllListeners();
      this.deactiveCaptures();
      this.floatingNumbers.destroy();
      location.reload();
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
        console.log("set awake player");
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
      [prop]: {
        isDown: key.isDown,
        isUp: key.isUp,
      },
    };
    // increment curr req Id for next request
    this.curreqId++;
    if (gameConfig.simulatelatency) {
      setTimeout(() => {
        this.room.send(messageType.playerinput, req);
      }, this.randlatency);
    } else if (gameConfig.networkdebug) {
      if (prop.includes("_p2")) {
        delete Object.assign(req, { [prop.replace("_p2", "")]: req[prop] })[
          prop
        ];
        this.serverinstance.manualUpdateInput("test2", req);
      } else {
        this.serverinstance.manualUpdateInput("test", req);
      }
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
        maxstamina: state.maxstamina,
        stamina: state.stamina,
      });
      const state2 = this.serverinstance.manualGetState("test2");
      this.testplayer2.updatePlayer({
        x: state2.x,
        y: state2.y,
        flipX: state2.flipX,
        anims: state2.anims,
        maxhealth: state2.maxhealth,
        health: state2.health,
        maxstamina: state2.maxstamina,
        stamina: state2.stamina,
      });
    }
  }
}
