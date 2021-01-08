import { Room } from "colyseus";
import { GameState } from "./state/state";
import "@geckos.io/phaser-on-nodejs";
import { Game } from "./game.v2/game.core";


export class GameRoom extends Room<GameState> {
  game: Game;

  previoustick;
  previousdelta;
  tolerance = 0.01;
  private hrtimeMs() {
    let time = process.hrtime()
    return time[0] * 1000 + time[1] / 1000000
  }


  onCreate() {
    // how many client each room can hold
    this.maxClients = 10;
    // every 100ms send an update to all clients
    this.setPatchRate(100);
    this.setState(new GameState());
    this.game = new Game(this);
  }

  onJoin(client, options) {
    console.log(`client with id: (${client.sessionId}) joined`);
    this.game.addPlayer(client, options.playerName);
  }

  onLeave(client) {
    console.log(`client with id (${client.sessionId}) left`);
    this.game.removePlayer(client);
  }

  onDispose() {
    this.game.destroy();
  }
}
