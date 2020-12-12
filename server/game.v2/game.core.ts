//@ts-ignore
import { createEngine } from "./engine.ts";
//@ts-ignore
import { Player } from "./player.ts";
//@ts-ignore
import { messageType, gameConfig } from "../../common/globalConfig.ts";
//@ts-ignore
import { AOImanager } from "../interest/aoi.manager.ts";
import { Bodies, Body, Engine, World, Render, Events } from "matter-js";

/**
 * Core game engine loop
 */
export class Game {
  private engine;
  // stores simulate player instances
  private allplayers;
  //colyseus.js room
  private room;
  private clearId;
  private aoimanager;

  constructor(room?) {
    this.engine = createEngine();
    this.allplayers = {};
    this.clearId = setInterval(this.startGame.bind(this), 1000 / 60);
    this.aoimanager = new AOImanager();
    if (gameConfig.networkdebug) {
      var render = Render.create({
        //@ts-ignore
        element: document.body,
        engine: this.engine,
      });
      // run the renderer
      Render.run(render);
    } else {
      this.room = room;
      this.room.onMessage(messageType.playerinput, (client, playerinput) => {
        this.allplayers[client.sessionId].updatePlayerInput(playerinput);
      });
    }
  }

  startGame() {
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
    this.allplayers[client.sessionId] = new Player(
      this.engine,
      name,
      client,
      this.room,
      100,
      300,
      75,
      50,
      this.aoimanager
    );
    if (!gameConfig.networkdebug) {
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
