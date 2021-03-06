import { Schema, MapSchema, ArraySchema } from "@colyseus/schema";
export declare class Player extends Schema {
    playerName: String;
    timestamp: Number;
    velocityX: Number;
    velocityY: Number;
    x: Number;
    y: Number;
    flipX: Boolean;
    collisionData: ArraySchema<number>;
    state: String;
    ackreqIds: ArraySchema<number>;
    curreqId: number;
    onPlatform: Boolean;
    isTouching: ArraySchema<Boolean>;
    elaspsedTime: number;
    stateTime: number;
    enqueueRequestId(reqId: any): void;
}
export declare class GameState extends Schema {
    players: MapSchema<Player>;
    addPlayer(id: any, name: any, x: any, y: any): void;
    removePlayer(id: any): void;
    updatePlayer(id: any, { timestamp, x, y, velocityX, velocityY, stateTime, flipX, collisionData, state, isTouching, onPlatform, reqId, elaspsedTime, }: {
        timestamp: any;
        x: any;
        y: any;
        velocityX: any;
        velocityY: any;
        stateTime: any;
        flipX: any;
        collisionData: any;
        state: any;
        isTouching: any;
        onPlatform: any;
        reqId: any;
        elaspsedTime: any;
    }): void;
}
