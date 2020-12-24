import { Room } from "colyseus";
import { GameState } from "./state/state";
import "@geckos.io/phaser-on-nodejs";
import { Game } from "./game.v2/game.core";
import { propertyDefined } from "../common";

export class GameRoom extends Room<GameState> {
  game: Game;
  async onCreate(options) {
    // how many client each room can hold
    this.maxClients = 50;
    // every 100ms send an update to all clients
    this.setPatchRate(100);
    this.setState(new GameState());
    this.game = await Game.createGame(this);
  }

  async onJoin(client, options) {
    await propertyDefined(this, (room) => room.game);
    console.log(`client with id: (${client.sessionId}) joined`);
    this.game.addPlayer(client, options.playerName);
  }

  async onLeave(client) {
    await propertyDefined(this, (room) => room.game);
    console.log(`client with id (${client.sessionId}) left`);
    this.game.removePlayer(client);
  }

  async onDispose() {
    await propertyDefined(this, (room) => room.game);
    console.log("destory game");
    this.game.destroy();
    //throw Error('disposed of game');
  }
}
