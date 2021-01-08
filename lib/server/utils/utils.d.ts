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
export declare const createanims: (scene: any, anims: any) => any[];
export declare const createFrameNames: (animsManager: any, anims: any) => any[];
export {};
