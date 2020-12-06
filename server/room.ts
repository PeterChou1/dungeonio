import { Room, Client } from "colyseus";
import { GameState } from "./state/state";
import "@geckos.io/phaser-on-nodejs";
import Phaser from "phaser";
import { config } from "./config/gameConfig";
import { Game } from "./gameinstance_v2/game.core";

export class GameRoom extends Room<GameState> {
  game: Game;
  onCreate(options) {
    // how many client each room can hold
    this.maxClients = 50;
    // every 100ms send an update to all clients
    this.setPatchRate(50);
    this.setState(new GameState());
    this.game = new Game(this);
    // inject game room into game instance
    // config.callbacks = {
    //   preBoot: () => {
    //     return this;
    //   },
    // };
    // this.game = new Phaser.Game(config);
    // this.scene = this.game.scene.getScene("start");
    // console.log("game started");
    // console.log("---scene---");
    // console.log(
    //   `width: ${this.scene.scale.width} height: ${this.scene.scale.height}`
    // );
  }

  onJoin(client, options) {
    console.log(`client with id: (${client.sessionId}) joined`);
    console.log(options);
    console.log("------");
    //@ts-ignore add player custom method
    //this.scene.addPlayer(client.sessionId, options.playerName);
    this.game.addPlayer(client.sessionId, options.playerName);
  }

  onLeave(client) {
    console.log(`client with id (${client.sessionId}) left`);
    //@ts-ignore
    this.game.removePlayer(client.sessionId);
  }

  onDispose() {
    console.log("destory game");
    this.game.destroy();
    //throw Error('disposed of game');
  }
}
