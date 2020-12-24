import { collisionData } from "../../common";
import { EventEmitter } from "events";
import { Player } from "./player";
interface PossibleStates {
  [key: string]: State;
}

export abstract class State {
  stateMachine: StateMachine;
  abstract enter(...args);
  abstract execute(...args);
}

/**
 * @description used to minick animation frames used for setting hitbox
 * based on frames being animated and
 */
class MockAnimsManager {
  key;
  frame;
  frameInfo;
  event: EventEmitter;
  anims;
  duration;
  repeat;
  clearId;

  constructor(frameInfo) {
    this.frame = null;
    this.key = null;
    this.frameInfo = frameInfo;
    this.event = new EventEmitter();
  }

  play(key) {
    clearInterval(this.clearId);
    this.key = key;
    this.anims = this.frameInfo[this.key];
    this.duration = this.anims.duration;
    this.repeat = this.anims.repeat;
    this.frameExecution();
    this.clearId = setInterval(
      this.frameExecution.bind(this),
      this.anims.interval
    );
  }

  frameExecution() {
    this.duration -= this.anims.interval;
    this.frame = this.anims.frames[this.duration / this.anims.interval];
    this.event.emit("framechange", this.frame);
    if (this.duration === 0) {
      this.event.emit("animationcomplete");
      if (this.repeat > 0) {
        this.repeat -= 1;
      } else if (this.repeat === 0) {
        clearInterval(this.clearId);
      } else if (this.repeat === -1) {
        this.duration = this.anims.duration;
      }
    }
  }
}

export class StateMachine {
  initialState;
  possibleStates: PossibleStates;
  // mock animation manager to minick phaser animation manager
  anims: MockAnimsManager;
  stateArgs;
  // state the player is in
  state;

  constructor(initialState, possibleStates, frameInfo, stateArgs = []) {
    this.initialState = initialState;
    this.possibleStates = possibleStates;
    this.stateArgs = stateArgs;
    this.anims = new MockAnimsManager(frameInfo);
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
  enter(player: Player) {
    this.stateMachine.anims.play("idle");
    player.setVelocity(0);
  }

  execute(player: Player) {
    //const cursors = scene.input.keyboard.createCursorKeys();
    const clientinput = player.input;
    const isTouching = player.getIsTouching();
    const state = player.getInternalState();
    ////console.log(isTouching.bottom);
    if (!isTouching.bottom) {
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
      if (state.onPlatform) {
        player.setInternalState({ onPlatform: false });
        player.setCollidesWith([collisionData.category.hard]);
      }
      this.stateMachine.transition("jump");
      return;
    }
    if (clientinput.down_keydown && state.onPlatform) {
      player.setCollidesWith([collisionData.category.hard]);
      player.setInternalState({ onPlatform: false, platformFall: true });
      this.stateMachine.transition("fall");
      return;
    }
    if (clientinput.attack_keydown) {
      this.stateMachine.transition("attack1");
    }
  }
}

export class RunState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play("run");
    //player.awakeplayer();
  }
  execute(player: Player) {
    const clientinput = player.input;
    const isTouching = player.getIsTouching();
    const state = player.getInternalState();
    const attributes = player.getAttributes();

    if (clientinput.left_keydown) {
      //console.log('going left');
      player.setInternalState({ flipX: true });
      player.setVelocityX(-attributes.groundspeed);
    } else if (clientinput.right_keydown) {
      //console.log('going right');
      player.setInternalState({ flipX: false });
      player.setVelocityX(attributes.groundspeed);
    }

    if (clientinput.up_keydown && isTouching.bottom) {
      if (state.onPlatform) {
        player.setInternalState({ onPlatform: false });
        player.setCollidesWith([collisionData.category.hard]);
      }
      this.stateMachine.transition("jump");
      return;
    } else if (!isTouching.nearbottom) {
      this.stateMachine.transition("fall");
      return;
    }

    if (clientinput.down_keydown && state.onPlatform) {
      // reset player to only collide with hard platform
      player.setCollidesWith([collisionData.category.hard]);
      player.setInternalState({ onPlatform: false });
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
  enter(player: Player) {
    this.stateMachine.anims.play("fall");
  }
  execute(player: Player) {
    const clientinput = player.input;
    const isTouching = player.getIsTouching();
    const attributes = player.getAttributes();

    if (clientinput.right_keydown && !isTouching.right) {
      player.setVelocityX(attributes.airspeed);
    } else if (clientinput.left_keydown && !isTouching.left) {
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
  enter(player: Player) {
    this.stateMachine.anims.play("jump");
    //player.awakeplayer();
    const attributes = player.getAttributes();
    player.setVelocityY(-attributes.jumpheight);
    // jump animation cost 300 ms;
    this.stateMachine.anims.event.once("animationcomplete", () => {
      this.stateMachine.transition("fall");
      return;
    });
  }
  execute(player) {}
}

export class AttackState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play("attack1");
    this.stateMachine.anims.event.once("animationcomplete", () => {
      this.stateMachine.transition("idle");
      return;
    });
  }
  execute(player: Player) {}
}
