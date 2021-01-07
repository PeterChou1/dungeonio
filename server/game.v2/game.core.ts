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
  private clearid;
  private engine;
  // stores simulate player instances
  private allplayers: {
    [id: string]: Player;
  };
  // tick rate is in ms
  //(Game loop) 60fps
  private tickrate = 1000 / 60;
  //(Broad cast loop) per 10 updates per second
  private updaterate = 1000 / 10;
  // game timer
  private gametimer;
  // update timer for broadcast to client
  private updatetimer;
  // colyseus.js room
  private room;
  private aoimanager: AOImanager;
  // frame data of player character
  private framesInfo;
  private frameData;
  private objectgroup;
  private render;
  private previoustick;
  private previousdelta;
  private hrtimeMs = function() {
    let time = process.hrtime()
    return time[0] * 1000 + time[1] / 1000000
  }

  public static async createGame(room?): Promise<Game> {
    const { engine, framesInfo, frameData, objectgroup } = await setupGame();
    return new Game(engine, framesInfo, frameData, objectgroup, room);
  }

  private constructor(engine, framesInfo, frameData, objectgroup, room?) {
    this.engine = engine;
    this.allplayers = {};
    this.framesInfo = framesInfo;
    this.frameData = frameData;
    this.objectgroup = objectgroup;
    this.previoustick = this.hrtimeMs();
    this.previousdelta = this.tickrate;

    console.log(`running at tick rate ${Math.trunc(this.tickrate)}m`);
    if (gameConfig.networkdebug) {
      this.clearid = setInterval(this.updateGame.bind(this), this.tickrate);
      this.render = Render.create({
        element: document.getElementById("debug"),
        engine: this.engine,
      });
      // run the renderer
      Render.run(this.render);
    } else {
      this.aoimanager = new AOImanager();
      const NanoTimer = require("nanotimer");
      this.gametimer = new NanoTimer();
      this.updatetimer = new NanoTimer();
      this.updatetimer.setInterval(
        this.broadcastClients.bind(this),
        "",
        `${Math.trunc(this.updaterate)}m`
      );
      this.gametimer.setInterval(
        this.updateGame.bind(this),
        "",
        `${Math.trunc(this.tickrate)}m`
      );
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

  updateGame() {
    let now = this.hrtimeMs()
    let delta = (now - this.previoustick);
    let correction = (delta / this.previousdelta);
    for (const clientId in this.allplayers) {
      this.allplayers[clientId].update();
    }
    this.previousdelta = delta;
    this.previoustick = now;
    Engine.update(this.engine, delta, correction);
  }

  broadcastClients() {
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
    if (gameConfig.networkdebug) {
      clearInterval(this.clearid);
    } else {
      this.gametimer.clearInterval();
      this.updatetimer.clearInterval();
      //clearInterval(this.gametimer);
      //clearInterval(this.updatetimer);
    }
  }
}
