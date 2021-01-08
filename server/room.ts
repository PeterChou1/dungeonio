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
    const hrtimeMs = function() {
      let time = process.hrtime()
      return time[0] * 1000 + time[1] / 1000000
    }
    const TICK_RATE = 60

    let previous = hrtimeMs()
    let tickLengthMs = 1000 / TICK_RATE
    
    const loop = () => {
        setTimeout(loop, tickLengthMs)
        let now = hrtimeMs()
        let delta = (now - previous) / 1000;
        //let correction = delta / this.previousdelta;
        console.log('delta', delta)
        // game.update(delta, tick) // game logic would go here
        previous = now;
        //this.previousdelta = delta;
    }
    loop() 
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
