import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("string")
  playerName: String = "";
  // time stamp of last sent request
  @type("number")
  playerScore: number = 0;
}

// General game state in a scene
export class GameState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  addPlayer(id, name) {
    this.players[id] = new Player();
    this.players[id].playerName = name;
  }
  removePlayer(id) {
     delete this.players[id];
  }
}
