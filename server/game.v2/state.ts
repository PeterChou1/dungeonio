import { collisionData, gameEvents } from "../../common";
import { EventEmitter } from "events";
import { Player } from "./player";

type hitConfig = {
  knockback: { x: number; y: number };
  damage: number;
  hitstun: number;
  flipX: boolean;
};
type eventDeath = {
  category: "death";
};
type eventHit = {
  id: number;
  category: "hit";
  eventConfig: hitConfig;
};
type eventGrab = {
  id: number;
  category: "grab";
  eventConfig: {
    // to be implemented
  };
};

export type event = eventHit | eventGrab | eventDeath;

export interface PossibleStates {
  [key: string]: State;
}

export abstract class State {
  stateMachine: StateMachine;
  abstract enter(...args);
  abstract execute(...args);
  //deregister any events and clean up state and quit
  abstract quit();
}

/**
 * @description used to minick animation frames used for setting hitbox
 * based on frames being animated
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
    this.event.emit(gameEvents.anims.framechange, this.frame);
    if (this.duration === 0) {
      this.event.emit(gameEvents.anims.animationcomplete, this.key);
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
  event: EventEmitter;
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
    this.event = new EventEmitter();
    this.state = null;
    // State instances get access to the state machine via this.stateMachine.
    for (const state of Object.values(this.possibleStates)) {
      state.stateMachine = this;
    }
  }

  /**
   * dispatches events to state machine which forces it to transition to
   * a certain state
   * @param events
   * @return {Promise<boolean>} whether dispatch event succeeded or failed
   */
  async dispatch(event: event): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // you can't cheat death
      if (this.state !== "death") {
        // quit current state and transition to new state
        console.log("dispatch event");
        console.log(event);
        this.possibleStates[this.state].quit();
        switch (event.category) {
          case "hit":
            this.stateArgs.push(event.eventConfig);
            this.transition("hurt");
            const hitresolve = (state) => {
              if (state !== "hurt" && state !== "hitstun") {
                this.stateArgs = this.stateArgs.slice(0, 1);
                this.event.off(gameEvents.stateMachine.enter, hitresolve);
                this.event.emit(gameEvents.stateMachine.dispatchcomplete);
                resolve(true);
              }
            };
            this.event.on(gameEvents.stateMachine.enter, hitresolve);
            //this.event.once(gameEvents.stateMachine.dispatchcomplete, () => {
            //  this.event.off(gameEvents.stateMachine.enter, callback);
            //});
            break;
          case "death":
            this.transition("death");
            const deathresolve = (anims) => {
              if (anims === "dead") {
                this.anims.event.off(
                  gameEvents.anims.animationcomplete,
                  deathresolve
                );
                this.event.emit(gameEvents.stateMachine.dispatchcomplete);
                resolve(true);
              }
            };
            this.anims.event.on(
              gameEvents.anims.animationcomplete,
              deathresolve
            );
            break;
          case "grab":
            resolve(true);
            break;
        }
      } else {
        resolve(false);
      }
    });
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
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "idle");
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

  quit() {}
}

export class RunState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play("run");
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "run");
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

  quit() {}
}

export class FallState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play("fall");
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "fall");
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
  quit() {}
}

export class JumpState extends State {
  callback;

  enter(player: Player) {
    this.stateMachine.anims.play("jump");
    //player.awakeplayer();
    const attributes = player.getAttributes();
    player.setVelocityY(-attributes.jumpheight);
    this.callback = () => {
      this.stateMachine.transition("fall");
      return;
    };
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }

  execute(player) {}

  quit() {
    this.stateMachine.anims.event.off(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }
}

export class AttackState extends State {
  callback;
  enter(player: Player) {
    this.stateMachine.anims.play("attack1");
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "attack1");
    this.callback = () => {
      this.stateMachine.transition("idle");
      return;
    };
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }

  execute(player: Player) {}

  quit() {
    this.stateMachine.anims.event.off(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }
}

export class Hurt extends State {
  callback;
  enter(player: Player, hitconfig: hitConfig) {
    this.stateMachine.anims.play("hurt");
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "hurt");
    console.log(hitconfig);
    if (hitconfig.flipX) {
      player.setVelocity(-hitconfig.knockback.x, hitconfig.knockback.y);
    } else {
      player.setVelocity(hitconfig.knockback.x, hitconfig.knockback.y);
    }

    this.callback = () => {
      const state = player.getInternalState();
      const dmgdealt = state.health - hitconfig.damage;
      const newhealth = dmgdealt >= 0 ? dmgdealt : 0;
      player.setInternalState({ health: newhealth });
      if (newhealth > 0) {
        this.stateMachine.transition("hitstun");
      }
      return;
    };
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }
  execute(player: Player, hitconfig: hitConfig) {}

  quit() {
    this.stateMachine.anims.event.off(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }
}

export class HitStun extends State {
  timerhandle;

  enter(player: Player, hitconfig: hitConfig) {
    this.stateMachine.anims.play("hitstun");
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "hitstun");
    this.timerhandle = setTimeout(() => {
      const isTouching = player.getIsTouching();
      if (isTouching.bottom) {
        this.stateMachine.transition("idle");
      } else {
        this.stateMachine.transition("fall");
      }
    }, hitconfig.hitstun);
  }

  execute(player: Player, hitconfig: hitConfig) {}

  quit() {
    clearTimeout(this.timerhandle);
  }
}

export class Death extends State {
  enter(player: Player) {
    this.stateMachine.anims.play("dying");
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "death");
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      () => {
        this.stateMachine.anims.play("dead");
      }
    );
  }

  execute(player: Player) {}

  quit() {}
}
