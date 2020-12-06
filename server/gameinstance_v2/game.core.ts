import { createEngine } from "./engine";
import { Player } from "./player";
import { messageType } from "../../common/globalConfig";
import { Engine, World } from "matter-js";

/**
 * Core game engine loop
 */
export class Game {
  private engine;
  private allplayers;
  //colyseus.js room
  private room;
  private clearId;

  constructor(room) {
    this.engine = createEngine();
    this.room = room;
    this.allplayers = {};
    // update player input individually
    this.room.onMessage(messageType.playerinput, (client, playerinput) => {
      this.allplayers[client.sessionId].updatePlayerInput(playerinput);
    });
    console.log("instanitate game");
    this.clearId = setInterval(this.startGame.bind(this), 1000 / 60);
  }

  startGame() {
    for (const clientId in this.allplayers) {
      this.allplayers[clientId].update();
    }
    Engine.update(this.engine);
  }

  addPlayer(sessionId, name) {
    // add in internal colyseus js
    this.room.state.addPlayer(sessionId, name, 100, 100);
    this.allplayers[sessionId] = new Player(
      this.engine.world,
      name,
      sessionId,
      this.room,
      100,
      300,
      75,
      25
    );
  }

  removePlayer(sessionId) {
    this.allplayers[sessionId].destroy();
    this.room.state.removePlayer(sessionId);
    delete this.allplayers[sessionId];
  }

  destroy() {
    World.clear(this.engine.world);
    Engine.clear(this.engine);
    clearInterval(this.clearId);
  }
}
