import { Room } from "colyseus";
import { GameState } from "./state/state";
import '@geckos.io/phaser-on-nodejs';
import Phaser from 'phaser';
export declare class GameRoom extends Room<GameState> {
    game: Phaser.Game;
    scene: Phaser.Scene;
    onCreate(options: any): void;
    onJoin(client: any, options: any): void;
    onLeave(client: any): void;
    onDispose(): void;
}
