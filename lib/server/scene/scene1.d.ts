import Phaser from "phaser";
import { PlayerGroup } from "../entities/playerGroup";
import { ActionQueue } from "../utils/utils";
export declare class StartLevel extends Phaser.Scene {
    map: Phaser.Tilemaps.Tilemap;
    tileset: Phaser.Tilemaps.Tileset;
    ground: Phaser.Tilemaps.TilemapLayer;
    playergroup: PlayerGroup;
    objectgroup: any;
    eventQueue: ActionQueue;
    room: any;
    frameData: any;
    frameNames: any;
    constructor();
    init(): void;
    preload(): void;
    create(): void;
    addPlayer(clientid: any, playerName: any): void;
    removePlayer(clientid: any): void;
    handlePlayerInput(): void;
    update(): void;
}
