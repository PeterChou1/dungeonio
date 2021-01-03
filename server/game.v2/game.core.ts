import { setupGame } from "./engine";
import { Player } from "./player";
import { messageType, gameConfig } from "../../common/config/globalConfig";
import { AOImanager } from "../interest/aoi.manager";
import { Engine, World, Render, Events } from "matter-js";
const NanoTimer = require('nanotimer');
//declare document for injection into client side code
declare let document: any;
/**
 * Core game engine loop
 */
export class Game {
  private id;
  private engine;
  // stores simulate player instances
  private allplayers: {
    [id: string]: Player;
  };
  // tick rate is in ms 
  //(Game loop) 60fps
  private tickrate = 1000 / 60;
  //(Broad cast loop) per 100ms
  private updaterate = 1000 / 30;
  // game timer
  private gametimer;
  // update timer for broadcast to client
  private updatetimer;
  // colyseus.js room
  private room;
  private aoimanager : AOImanager;
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
    this.gametimer = new NanoTimer();
    this.updatetimer = new NanoTimer();
    console.log(`running at tick rate ${Math.trunc(this.tickrate)}m`);
    if (gameConfig.networkdebug) {
      setInterval(this.updateGame.bind(this), this.tickrate);
    } else {
      this.updatetimer.setInterval(this.broadcastClients.bind(this), '', `${Math.trunc(this.updaterate)}m`);
      this.gametimer.setInterval(this.updateGame.bind(this), '', `${Math.trunc(this.tickrate)}m`);
    }
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

  updateGame(delta = 16) {
    for (const clientId in this.allplayers) {
      this.allplayers[clientId].update();
    }
    Engine.update(this.engine, delta);
  }

  broadcastClients()  {
    this.aoimanager.aoibroadcast();
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
      this.room.state.addPlayer(client.sessionId, name);
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
    this.gametimer.clearInterval();
    this.updatetimer.clearInterval();
  }
}
