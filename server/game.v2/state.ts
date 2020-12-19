//@ts-ignore
import { collisionData } from "../../common/globalConfig.ts";
interface PossibleStates {
  [key: string]: State;
}

export abstract class State {
  stateMachine: StateMachine;
  abstract enter(...args);
  abstract execute(...args);
}

export class StateMachine {
  initialState;
  possibleStates: PossibleStates;
  stateArgs;
  state;
  constructor(initialState, possibleStates, stateArgs = []) {
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

export class IdleState extends State {
  enter(player) {
    player.setVelocity(0);
  }

  execute(player) {
    //const cursors = scene.input.keyboard.createCursorKeys();
    const clientinput = player.input;
    const isTouching = player.isTouching;
    const state = player.state;
    ////console.log(isTouching.bottom);
    if (!isTouching.bottom) {
      console.log(isTouching.bottom);
      //console.log('idle player not touching ground transitioning');
      this.stateMachine.transition("fall");
      return;
    }
    ////console.log('idle state');
    if (clientinput.left_keydown || clientinput.right_keydown) {
      ////console.log('left');
      this.stateMachine.transition("run");
      return;
    }
    if (clientinput.up_keydown && isTouching.bottom) {
      ////console.log('jump');
      if (player.onPlatform) {
        state.collideswith = [collisionData.category.hard];
        state.onPlatform = false;
        player.setCollidesWith(state.collideswith);
      }
      this.stateMachine.transition("jump");
      return;
    }
    if (clientinput.down_keydown && player.onPlatform) {
      // reset player to only collide with hard platform
      state.collideswith = [collisionData.category.hard];
      player.setCollidesWith(player.state.collideswith);
      state.onPlatform = false;
      state.platformFall = true;
      this.stateMachine.transition("fall");
      return;
    }
  }
}

export class RunState extends State {
  enter(player) {
    //player.awakeplayer();
  }
  execute(player) {
    const clientinput = player.input;
    const isTouching = player.isTouching;
    const state = player.state;
    const attributes = player.attributes;

    if (clientinput.left_keydown) {
      //console.log('going left');
      state.flipX = true;
      player.setVelocityX(-attributes.groundspeed);
    } else if (clientinput.right_keydown) {
      //console.log('going right');
      state.flipX = false;
      player.setVelocityX(attributes.groundspeed);
    }

    if (clientinput.up_keydown && isTouching.bottom) {
      if (player.onPlatform) {
        state.collideswith = [collisionData.category.hard];
        player.setCollidesWith([collisionData.category.hard]);
        player.onPlatform = false;
      }
      this.stateMachine.transition("jump");
      return;
    } else if (!isTouching.nearbottom) {
      this.stateMachine.transition("fall");
      return;
    }

    if (clientinput.down_keydown && player.onPlatform) {
      // reset player to only collide with hard platform
      state.collideswith = [collisionData.category.hard];
      player.setCollidesWith([collisionData.category.hard]);
      state.onPlatform = false;
      this.stateMachine.transition("fall");
      return;
    }
    // transition to idle if left and right key are not pressed
    ////console.log('----keys-----');
    ////console.log(attributes.right_keyup && attributes.left_keyup);
    if (clientinput.right_keyup && clientinput.left_keyup) {
      //console.log('transition to idle');
      this.stateMachine.transition("idle");
      return;
    }
  }
}

export class FallState extends State {
  enter(player) {}
  execute(player) {
    const clientinput = player.input;
    const isTouching = player.isTouching;
    const attributes = player.attributes;

    if (clientinput.right_keydown) {
      player.setVelocityX(attributes.airspeed);
    } else if (clientinput.left_keydown) {
      player.setVelocityX(-attributes.airspeed);
    }
    if (isTouching.bottom) {
      //////console.log(player.body.onFloor());
      this.stateMachine.transition("idle");
      return;
    }
  }
}

export class JumpState extends State {
  enter(player) {
    //player.awakeplayer();
    const attributes = player.attributes;
    player.setVelocityY(-attributes.jumpheight);
    // jump animation cost 300 ms;
    setTimeout(() => {
      this.stateMachine.transition("fall");
      return;
    }, 300);
  }
  execute(player) {}
}
