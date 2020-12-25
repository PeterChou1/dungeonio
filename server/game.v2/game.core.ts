import { setupGame } from "./engine";
import { Player } from "./player";
import { messageType, gameConfig } from "../../common/config/globalConfig";
import { AOImanager } from "../interest/aoi.manager";
import { Engine, World, Render, Events } from "matter-js";
//declare document for injection into client side code
declare let document: any;
/**
 * Core game engine loop
 */
export class Game {
  private engine;
  // stores simulate player instances
  private allplayers: {
    [id: string]: Player;
  };
  // tick rate is in ms
  private tickrate = 1000 / 60;
  // colyseus.js room
  private room;
  private clearId;
  private aoimanager;
  // frame data of player character
  private framesInfo;
  private frameData;
  private render;

  public static async createGame(room?): Promise<Game> {
    const { engine, framesInfo, frameData } = await setupGame();
    return new Game(engine, framesInfo, frameData, room);
  }

  private constructor(engine, framesInfo, frameData, room?) {
    this.engine = engine;
    this.allplayers = {};
    this.framesInfo = framesInfo;
    this.frameData = frameData;
    this.clearId = setInterval(this.gameLoop.bind(this), this.tickrate);
    this.aoimanager = new AOImanager();
    if (gameConfig.networkdebug) {
      this.render = Render.create({
        element: document.getElementById("debug"),
        engine: this.engine,
      });
      // run the renderer
      Render.run(this.render);
    } else {
      this.room = room;
      this.room.onMessage(messageType.playerinput, (client, playerinput) => {
        this.allplayers[client.sessionId].updatePlayerInput(playerinput);
      });
      this.room.onMessage(messageType.playersleep, (client) => {
        this.allplayers[client.sessionId].setInternalState({ asleep: true });
      });
      this.room.onMessage(messageType.playerawake, (client) => {
        this.allplayers[client.sessionId].setInternalState({ asleep: false });
      });
    }
  }

  gameLoop() {
    for (const clientId in this.allplayers) {
      this.allplayers[clientId].update();
    }
    Engine.update(this.engine);
  }

  manualUpdateInput(clientId, playerinput) {
    this.allplayers[clientId].updatePlayerInput(playerinput);
  }

  manualGetState(clientId) {
    return this.allplayers[clientId].getState();
  }

  addPlayer(client, name) {
    // add in internal colyseus js
    this.allplayers[client.sessionId] = new Player(this, name, client, 96, 582);
    if (gameConfig.networkdebug && client.sessionId === "test") {
      Events.on(
        this.engine,
        "beforeUpdate",
        function () {
          this.allplayers["test"].setCamera(this.render);
        }.bind(this)
      );
    } else if (!gameConfig.networkdebug) {
      this.room.state.addPlayer(client.sessionId, name, 100, 100);
    }
  }

  removePlayer(client) {
    this.allplayers[client.sessionId].destroy();
    delete this.allplayers[client.sessionId];
    if (!gameConfig.networkdebug) {
      this.room.state.removePlayer(client.sessionId);
    }
  }

  destroy() {
    World.clear(this.engine.world);
    Engine.clear(this.engine);
    clearInterval(this.clearId);
  }
}
