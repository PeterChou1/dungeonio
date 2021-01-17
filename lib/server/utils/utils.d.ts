interface Action {
    callback: (...args: any[]) => any | void;
    args: Array<any>;
}
export declare const registerCollisionCallback: (body: any) => any;
export declare class ActionQueue {
    items: Array<Action>;
    constructor();
    isEmpty(): boolean;
    enqueue(element: Action): void;
    dequeue(): Action;
    executeActions(): void;
}
export declare function randomInteger(min: any, max: any): any;
/**
 * @description generates frame data from player animations configurations
 * @param frameinfo
 */
export declare const generateFrameTiming: (frameinfo: any) => {};
export declare const generateFrameNames: (config: any) => Array<String>;
export {};
