import Phaser from "phaser";
import { StateMachine } from "../state/stateMachine.ts";
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
    playerName: string;
    collisionContainer: any;
    matterFrameData: any;
    debugText: any;
    allcollisionlistener: any;
    mainBody: any;
    private _clientid;
    constructor(scene: any, x: any, y: any, clientid: any, playerName: any, scale?: number);
    /**
     * @description generate the matterjs body for a set of players
     */
    generateBodyFrames(): void;
    /**
     * @description set player collison hitbox according to frame data defined in common/assets/frameData.json
     */
    setFrameData(): void;
    /**
     * @description last time the player enters a new state
     */
    resetEnterState(): void;
    /**
     * @description sets how long player is in current state
     */
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
