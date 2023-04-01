interface PossibleStates {
    [key: string]: State;
}
export declare class StateMachine {
    initialState: any;
    possibleStates: PossibleStates;
    stateArgs: any;
    state: any;
    constructor(initialState: any, possibleStates: any, stateArgs?: any[]);
    step(): void;
    transition(newState: any, ...enterArgs: any[]): void;
}
export declare abstract class State {
    stateMachine: StateMachine;
    abstract enter(...args: any[]): any;
    abstract execute(...args: any[]): any;
}
export declare class IdleState extends State {
    enter(player: any): void;
    execute(player: any): void;
}
export declare class RunState extends State {
    enter(player: any): void;
    execute(player: any): void;
}
export declare class FallState extends State {
    enter(player: any): void;
    execute(player: any): void;
}
export declare class JumpState extends State {
    enter(player: any): void;
    execute(player: any): void;
}
export {};
