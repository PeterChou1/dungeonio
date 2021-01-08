import { Room } from "colyseus";
import { GameState } from "./state/state";
import "@geckos.io/phaser-on-nodejs";
import { Game } from "./game.v2/game.core";
import { propertyDefined } from "../common";

export class GameRoom extends Room<GameState> {
  game: Game;

  previoustick;
  previousdelta;
  tolerance = 0.01;
  private hrtimeMs() {
    let time = process.hrtime()
    return time[0] * 1000 + time[1] / 1000000
  }


  async onCreate(options) {
    // how many client each room can hold
    this.maxClients = 10;
    // every 100ms send an update to all clients
    this.setPatchRate(100);
    this.setState(new GameState());


    const NanoTimer = require("nanotimer");
    const gametimer = new NanoTimer();

    gametimer.setInterval(() => {
      let now = this.hrtimeMs()
      let delta = (now - this.previoustick);
      let correction = (delta / this.previousdelta);
      this.previousdelta = delta;
      this.previoustick = now;
      //console.log(`delta: ${delta} correction: ${correction}`)
      //Engine.update(this.engine, 16);
      if (Math.abs(1 - correction) <= this.tolerance) {
        console.log(`delta: ${delta} correction: ${correction}`);
        //Engine.update(this.engine, delta, correction);
      } else {
        console.log(`delta threshold not met delta: ${delta} correction: ${correction}`);
        //Engine.update(this.engine, delta);
      }
    }, "", '100m')
    //this.game = await Game.createGame(this);
  }

  async onJoin(client, options) {
    //await propertyDefined(this, (room) => room.game);
    //console.log(`client with id: (${client.sessionId}) joined`);
    //this.game.addPlayer(client, options.playerName);
  }

  async onLeave(client) {
    //await propertyDefined(this, (room) => room.game);
    //console.log(`client with id (${client.sessionId}) left`);
    //this.game.removePlayer(client);
  }

  async onDispose() {
    //await propertyDefined(this, (room) => room.game);
    //console.log("destory game");
    //this.game.destroy();
    //throw Error('disposed of game');
  }
}
