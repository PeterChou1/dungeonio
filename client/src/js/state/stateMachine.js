export class StateMachine {
    constructor(initialState, possibleStates, stateArgs=[]) {
      this.initialState = initialState;
      this.possibleStates = possibleStates;
      this.stateArgs = stateArgs;
      this.state = null;
  
      // State instances get access to the state machine via this.stateMachine.
      for (const state of Object.values(this.possibleStates)) {
        state.stateMachine = this;
      }
    }
  
    step() {
      // On the first step, the state is null and we need to initialize the first state.
      if (this.state === null) {
        this.state = this.initialState;
        this.possibleStates[this.state].enter(...this.stateArgs);
      }
  
      // Run the current state's execute
      this.possibleStates[this.state].execute(...this.stateArgs);
    }
  
    transition(newState, ...enterArgs) {
      this.state = newState;
      this.possibleStates[this.state].enter(...this.stateArgs, ...enterArgs);
    }
}
  
export class State {}


export class SimulatedStateMachine extends StateMachine {
  constructor(scene, initialState, possibleStates, stateArgs=[]) {
     super(initialState,  possibleStates, stateArgs)
     this.scene = scene;
     this.simInputs = {};
  }

  /*
   sync state machine with server statemachine
   */
  syncState(stateTime, playerstate) {
    this.state = playerstate;
    this.possibleStates[playerstate].enter(...this.stateArgs, stateTime);

  }

  simulateInput(stateTime, playerstate, inputs) {
    console.log('SIM START');
    console.log('---syncing to player state---')
    console.log(`state time: ${stateTime} playerstate: ${playerstate}`);
    this.syncState(stateTime, playerstate);
    let index = 0
    let current_input;
    while (index < inputs.length){
      current_input = inputs[index];
      this.simInputs = current_input;
      console.log('----processing inputs----');
      console.log(current_input);
      let inputtime = current_input.elapsed
      console.log('----processed input time---')
      console.log(inputtime);
      while ( inputtime >= 0 ) {
        // every step is 16.6 ms by default 60fps
        console.log('x : ', this.stateArgs[0].sprite.x);
        console.log('y : ', this.stateArgs[0].sprite.y);
        console.log('state: ', this.state);
        inputtime -= 16.66;
        this.scene.matter.step();
        this.step();
      }
      index += 1
    }
  }

  
}