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
  /**
   * @description return current key of animation return null if no animation is playing
   */
  getKey() {
    return this.key;
  }

  frameExecution() {
    this.duration -= this.anims.interval;
    this.frame = this.anims.frames[this.duration / this.anims.interval];
    this.event.emit(gameEvents.anims.framechange, this.frame);
    if (this.duration === 0) {
      if (this.repeat > 0) {
        this.event.emit(gameEvents.anims.animationrepeat, this.key);
        this.repeat -= 1;
      } else if (this.repeat === 0) {
        clearInterval(this.clearId);
        this.event.emit(gameEvents.anims.animationcomplete, this.key);
      } else if (this.repeat === -1) {
        this.event.emit(gameEvents.anims.animationrepeat, this.key);
        this.duration = this.anims.duration;
      }
    }
  }

  destroy() {
    clearInterval(this.clearId);
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
    console.log('dispatched called');
    return new Promise((resolve, reject) => {
      // you can't cheat death
      if (this.state !== "death") {
        // quit current state and transition to new state
        this.possibleStates[this.state].quit();
        switch (event.category) {
          case "hit":
            this.stateArgs.push(event.eventConfig);
            this.transition("hurt");
            const hitresolve = (state) => {
              if (state !== "hurt" && state !== "hitstun") {
                console.log('hitresolve ', state);
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
                  gameEvents.stateMachine.dispatchcomplete,
                  deathresolve
                );
                this.event.emit(gameEvents.stateMachine.dispatchcomplete);
                resolve(true);
              }
            };
            this.anims.event.on(
              gameEvents.anims.animationrepeat,
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

  destroy() {
    this.anims.event.removeAllListeners();
    this.event.removeAllListeners();
    this.anims.destroy();
  }

}

export class IdleState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play('idle');
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "idle");
    player.setVelocity(0);
  }

  execute(player: Player) {
    //const cursors = scene.input.keyboard.createCursorKeys();
    const clientinput = player.input;
    const clientrepeats = player.inputrepeats;
    const isTouching = player.getIsTouching();
    const state = player.getInternalState();
    ////console.log(isTouching.bottom);
    if (!isTouching.bottom) {
      //console.log('idle player not touching ground transitioning');
      this.stateMachine.transition("fall");
      return;
    }
    ////console.log('idle state');
    if (clientinput.left.isDown || clientinput.right.isDown) {
      ////console.log('left');
      this.stateMachine.transition("walk");
      return;
    }
    if (clientinput.up.isDown && isTouching.bottom) {
      ////console.log('jump');
      if (state.onPlatform) {
        player.setInternalState({ onPlatform: false });
        player.setCollidesWith([collisionData.category.hard]);
      }
      this.stateMachine.transition("jump");
      return;
    }
    if (clientinput.down.isDown && state.onPlatform) {
      player.setCollidesWith([collisionData.category.hard]);
      player.setInternalState({ onPlatform: false, platformFall: true });
      this.stateMachine.transition("fall");
      return;
    }
    if (clientinput.attack.isDown && clientrepeats.attack === 0) {
      this.stateMachine.transition("attack1");
    }
  }

  quit() {}
}


export class WalkState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play('walk');
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "walk");
    //player.awakeplayer();
  }
  execute(player: Player) {
    const clientinput = player.input;
    const clientrepeats = player.inputrepeats;
    const isTouching = player.getIsTouching();
    const state = player.getInternalState();
    const attributes = player.getAttributes();

    if (clientinput.left.isDown) {
      //console.log('going left');
      player.setInternalState({ flipX: true });
      player.setVelocityX(-attributes.groundspeed);
    } else if (clientinput.right.isDown) {
      //console.log('going right');
      player.setInternalState({ flipX: false });
      player.setVelocityX(attributes.groundspeed);
    }

    if (clientinput.run.isDown) {
      this.stateMachine.transition("run");
    }

    if (clientinput.up.isDown && isTouching.bottom) {
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

    if (clientinput.down.isDown && state.onPlatform) {
      // reset player to only collide with hard platform
      player.setCollidesWith([collisionData.category.hard]);
      player.setInternalState({ onPlatform: false });
      this.stateMachine.transition("fall");
      return;
    }
    if (clientinput.attack.isDown && clientrepeats.attack === 0) {
      this.stateMachine.transition("attack1");
    }

    if (clientinput.right.isUp && clientinput.left.isUp) {
      //console.log('transition to idle');
      this.stateMachine.transition("idle");
      return;
    }
  }

  quit() {}

}



export class RunState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play('run');
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "run");
    //player.awakeplayer();
  }
  execute(player: Player) {
    const clientinput = player.input;
    const clientrepeats = player.inputrepeats;
    const isTouching = player.getIsTouching();
    const state = player.getInternalState();
    const attributes = player.getAttributes();

    if (clientinput.left.isDown) {
      //console.log('going left');
      player.setInternalState({ flipX: true });
      player.setVelocityX(-attributes.runspeed);
    } else if (clientinput.right.isDown) {
      //console.log('going right');
      player.setInternalState({ flipX: false });
      player.setVelocityX(attributes.runspeed);
    }

    if (clientinput.run.isUp) {
      this.stateMachine.transition("walk");
    }

    if (clientinput.up.isDown && isTouching.bottom) {
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

    if (clientinput.down.isDown && state.onPlatform) {
      // reset player to only collide with hard platform
      player.setCollidesWith([collisionData.category.hard]);
      player.setInternalState({ onPlatform: false });
      this.stateMachine.transition("fall");
      return;
    }
    if (clientinput.attack.isDown && clientrepeats.attack === 0) {
      this.stateMachine.transition("dashattack");
    }

    if (clientinput.right.isUp && clientinput.left.isUp) {
      //console.log('transition to idle');
      this.stateMachine.transition("idle");
      return;
    }
  }

  quit() {}
  
}

export class FallState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play('idle');
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "fall");
  }
  execute(player: Player) {
    const clientinput = player.input;
    const clientrepeats = player.inputrepeats;
    const isTouching = player.getIsTouching();
    const attributes = player.getAttributes();

    if (clientinput.right.isDown && !isTouching.right) {
      player.setVelocityX(attributes.airspeed);
    } else if (clientinput.left.isDown && !isTouching.left) {
      player.setVelocityX(-attributes.airspeed);
    }

    if (clientinput.attack.isDown && clientrepeats.attack === 0) {
      this.stateMachine.transition("airattack1");

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
    this.callback = () => {
      player.setVelocityY(-attributes.jumpheight);
      setTimeout(() => {this.stateMachine.transition("fall");}, 100);
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


export class DashAttack extends State {
  clearId;
  dashcount = 0;
  enter(player: Player) {
    this.stateMachine.anims.play("dashattack");
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "dashattack");
    this.clearId = setTimeout(() => {
      const clientinput = player.input;
      if (clientinput.attack.isDown && this.dashcount < 1) {
        this.dashcount += 1;
        this.stateMachine.transition("dashattack");
      } else {
        this.dashcount = 0;
        this.stateMachine.transition("idle");
      }
    }, 200)
  }

  execute(player: Player) {
    const state = player.getInternalState();
    const attributes = player.getAttributes();
    const isTouching = player.getIsTouching();
    if (state.flipX && !isTouching.left) {
      player.setVelocityX(-attributes.runspeed);
    } else if (!isTouching.right) {
      player.setVelocityX(attributes.runspeed);
    }
  }

  quit() {
    clearTimeout(this.clearId);
  }
}
export class AttackState extends State {
  callback;
  enter(player: Player) {
    this.stateMachine.anims.play("attack1");
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "attack1");
    this.callback = () => {
      const clientinput = player.input;
      if (clientinput.attack.isDown) {
        console.log('attack2');
        this.stateMachine.transition("attack2");
      } else {
        this.stateMachine.transition("idle");
      }
      return;
    };
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }

  execute(player: Player) {
    const isTouching = player.getIsTouching();
    if (!isTouching.nearbottom && !isTouching.bottom) {
      //console.log('idle player not touching ground transitioning');
      this.stateMachine.transition("fall");
      return;
    }
  }

  quit() {
    this.stateMachine.anims.event.off(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }
}


export class Attack2State extends State {
  callback;
  enter(player: Player) {
    this.stateMachine.anims.play("attack2");
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "attack2");
    this.callback = () => {
      const clientinput = player.input;
      if (clientinput.attack.isDown) {
        this.stateMachine.transition("attack3");
      } else {
        this.stateMachine.transition("idle");
      }
      return;
    };
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }

  execute(player: Player) {
    const isTouching = player.getIsTouching();
    if (!isTouching.nearbottom && !isTouching.bottom) {
      //console.log('idle player not touching ground transitioning');
      this.stateMachine.transition("fall");
      return;
    }
  }

  quit() {
    this.stateMachine.anims.event.off(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }
}

export class Attack3State extends State {
  callback;
  enter(player: Player) {
    this.stateMachine.anims.play("attack3");
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "attack3");
    this.callback = () => {
      this.stateMachine.transition("idle");
      return;
    };
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }

  execute(player: Player) {
    const isTouching = player.getIsTouching();
    if (!isTouching.nearbottom && !isTouching.bottom) {
      //console.log('idle player not touching ground transitioning');
      this.stateMachine.transition("fall");
      return;
    }
  }

  quit() {
    this.stateMachine.anims.event.off(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }
}

export class AirAttack1 extends State {
  callback;
  enter(player: Player) {
    this.stateMachine.anims.play("airattack1");
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "airattack1");
    player.setVelocityY(1);
    this.callback = () => {
      const isTouching = player.getIsTouching();
      if (isTouching.bottom) {
        //console.log('idle player not touching ground transitioning');
        this.stateMachine.transition("idle");
      } else {
        this.stateMachine.transition("fall");
      }
      return;
    };
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }

  execute(player: Player) {
    const isTouching = player.getIsTouching();
    if (isTouching.bottom) {
      //console.log('idle player not touching ground transitioning');
      this.stateMachine.transition("idle");
    }
    return;
  }

  quit() {

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
    this.stateMachine.anims.play('hitstun');
    this.stateMachine.event.emit(gameEvents.stateMachine.enter, "hitstun");
    console.log(hitconfig)
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
    this.stateMachine.anims.play("death");
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
