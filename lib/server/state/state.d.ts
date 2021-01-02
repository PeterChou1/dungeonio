import { Schema, MapSchema } from "@colyseus/schema";
export declare class Player extends Schema {
    playerName: String;
    playerScore: number;
}
export declare class GameState extends Schema {
    players: MapSchema<Player>;
    addPlayer(id: any, name: any): void;
    removePlayer(id: any): void;
}
