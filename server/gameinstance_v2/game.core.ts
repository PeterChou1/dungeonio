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
  private gamerunning;

  public static async getGameInstance(room) {
    const engine = await createEngine();
    return new Game(engine, room);
  }

  private constructor(engine, room) {
    this.engine = engine;
    this.room = room;
    this.allplayers = {};
    // update player input individually
    this.room.onMessage(messageType.playerinput, (client, playerinput) => {
      this.allplayers[client.sessionId].updatePlayerInput(playerinput);
    });
    setImmediate(this.startGame.bind(this));
  }

  startGame() {
    if (this.gamerunning) {
      for (const clientId in this.allplayers) {
        this.allplayers[clientId].update();
      }
      setImmediate(this.startGame.bind(this));
    }
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
      100,
      75,
      25
    );
  }

  removePlayer(sessionId) {
    this.allplayers[sessionId].destroy();
    delete this.allplayers[sessionId];
  }

  destroy() {
    this.gamerunning = false;
    World.clear(this.engine.world);
    Engine.clear(this.engine);
  }
}
