import Phaser from 'phaser';
import { Player } from './player.ts';
export declare class PlayerGroup extends Phaser.GameObjects.Group {
    constructor(scene: Phaser.Scene, config?: Phaser.Types.GameObjects.Group.GroupConfig);
    spawn(clientid: any, playerName: any): any;
    despawn(clientid: any): void;
    getPlayer(clientid: any): Player;
    updatePlayerInput(clientid: any, playerinput: any): void;
    getPlayers(): Phaser.GameObjects.GameObject[];
}
