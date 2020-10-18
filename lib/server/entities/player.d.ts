import Phaser from 'phaser';
import { StateMachine } from '../state/stateMachine.ts';
export declare class Player extends Phaser.Physics.Matter.Sprite {
    isTouching: any;
    sensors: any;
    scene: any;
    collideswith: any;
    platformFall: boolean;
    onPlatform: boolean;
    stateMachine: StateMachine;
    lastsentclientinput: number;
    lastTimeEnterNewState: number;
    stateTime: number;
    mainBody: any;
    allcollisionlistener: any;
    private _clientid;
    constructor(scene: any, x: any, y: any, clientid: any, scale?: number);
    resetEnterState(): void;
    setStateTime(): void;
    handleClientInput(playerinput: any): void;
    resetTouching(): void;
    onSensorCollide({ bodyA, bodyB, pair }: {
        bodyA: any;
        bodyB: any;
        pair: any;
    }): void;
    destroyPlayer(): void;
    update(): void;
    set clientid(clientid: any);
    get clientid(): any;
}
