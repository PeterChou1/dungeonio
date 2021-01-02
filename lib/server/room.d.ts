import { Room } from "colyseus";
import { GameState } from "./state/state";
import "@geckos.io/phaser-on-nodejs";
import { Game } from "./game.v2/game.core";
export declare class GameRoom extends Room<GameState> {
    game: Game;
    onCreate(options: any): Promise<void>;
    onJoin(client: any, options: any): Promise<void>;
    onLeave(client: any): Promise<void>;
    onDispose(): Promise<void>;
}
