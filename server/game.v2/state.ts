import { collisionData, gameEvents, staminaCost } from "../../common";
import { EventEmitter } from "events";
import { Player } from "./player";
import { Vector } from "matter-js";

type hitConfig = {
  parent: Player;
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

type eventBlock = {
  id: number;
  category: "block";
  eventConfig: {
    blockstun: number
  }
}
type eventGrab = {
  id: number;
  category: "grab";
  eventConfig: {
    // to be implemented
  };
};

export type event = eventHit | eventGrab | eventDeath | eventBlock;

export interface PossibleStates {
  [key: string]: State;
}

export abstract class State {
  stateMachine: StateMachine;
  abstract enter(...args);
  abstract execute(...args);
  //deregister any events and clean up state and quit
  abstract quit(...args);
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
  // since duration can sometimes be float point number
  // we have to set a tolerance for 0 equality comparison
  // Note a tolerance of 0.1 we tolerate up to 0.1ms error rate 
  // meaning no frame data should have increments lower than 0.1ms or 1/16th of a frame 
  tolerance = 0.1;

  constructor(frameInfo) {
    this.frame = null;
    this.key = null;
    this.frameInfo = frameInfo;
    this.event = new EventEmitter();
  }

  play(key) {
    clearTimeout(this.clearId);
    setTimeout(() => {
      this.key = key;
      this.anims = this.frameInfo[this.key];
      this.duration = this.anims.duration;
      this.repeat = this.anims.repeat;
      this.playAnimation();
    }, 0);
  }
  /**
   * @description return current key of animation return null if no animation is playing
   */
  getKey() {
    return this.key;
  }
  /**
   * plays animation until end
   * @param prevkey internal variable used to keep track of previous callstate
   */
  playAnimation(prevkey?) {
    console.log(this.key);
    if (prevkey === undefined || this.key === prevkey) {
      this.duration -= this.anims.interval;
      this.frame = this.anims.frames[Math.trunc(this.duration / this.anims.interval)];
      if (this.frame === undefined) {
        //find out what fucked up
        debugger;
      }
      this.event.emit(gameEvents.anims.framechange, this.frame);
      if (Math.abs(this.duration) < this.tolerance) {
        if (this.repeat > 0 || this.repeat === -1) {
          this.event.emit(gameEvents.anims.animationrepeat, this.key);
          if (this.repeat > 0) this.repeat -= 1;
          this.clearId = setTimeout(this.playAnimation.bind(this, this.key), this.anims.interval);
          this.duration = this.anims.duration;
        } else if (this.repeat === 0) {
          this.event.emit(gameEvents.anims.animationcomplete, this.key);
        }
      } else {
        this.clearId = setTimeout(this.playAnimation.bind(this, this.key), this.anims.interval)
      }
    }
    
  }

  destroy() {
    clearTimeout(this.clearId);
  }
}

export class StateMachine {
  initialState;
  event: EventEmitter;
  possibleStates: PossibleStates;
  // mock animation manager to minick phaser animation manager
  anims: MockAnimsManager;
  stateArgs;
  prevstate;
  // state the player is in
  state;

  constructor(initialState, possibleStates, frameInfo, stateArgs = []) {
    this.initialState = initialState;
    this.possibleStates = possibleStates;
    this.stateArgs = stateArgs;
    this.anims = new MockAnimsManager(frameInfo);
    this.event = new EventEmitter();
    this.prevstate = null;
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
          this.possibleStates[this.state].quit(...this.stateArgs);
          switch (event.category) {
            case "hit":
              this.stateArgs.push(event.eventConfig);
              this.transition("hurt");
              const hitresolve = (state) => {
                if (state !== "hitstun" && state !== "hurt") {
                  this.stateArgs = this.stateArgs.slice(0, 1);
                  this.event.off(gameEvents.stateMachine.enter, hitresolve);
                  this.event.emit(
                    gameEvents.stateMachine.dispatchcomplete,
                    "hit"
                  );
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
                  this.event.emit(
                    gameEvents.stateMachine.dispatchcomplete,
                    "death"
                  );
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
      this.prevstate = this.initialState;
      this.state = this.initialState;
      this.event.emit(gameEvents.stateMachine.enter, this.state);
      this.possibleStates[this.state].enter(...this.stateArgs);
    }
    // Run the current state's execute
    this.possibleStates[this.state].execute(...this.stateArgs);
  }

  transition(newState, ...enterArgs) {
    this.prevstate = this.state;
    this.state = newState;
    this.event.emit(gameEvents.stateMachine.enter, this.state);
    this.possibleStates[this.state].enter(...this.stateArgs, ...enterArgs);
  }

  destroy() {
    console.log('state Machine destroy');
    this.stateArgs = null;
    this.anims.event.removeAllListeners();
    this.event.removeAllListeners();
    this.anims.destroy();
  }
}

export class IdleState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play("idle");
    player.setInternalState({ airjumps: 0 });
    player.setVelocityY(0);
  }

  execute(player: Player) {
    //const cursors = scene.input.keyboard.createCursorKeys();
    const clientinput = player.input;
    const clientrepeats = player.inputrepeats;
    const isTouching = player.getIsTouching();
    const state = player.getInternalState();
    const attributes = player.getAttributes();
    const newstamina = state.stamina + attributes.staminaregen;
    player.setInternalState({ stamina: newstamina });
    ////console.log(isTouching.bottom);
    if (!isTouching.bottom) {
      //console.log('idle player not touching ground transitioning');
      this.stateMachine.transition("fall");
      return;
    }
    ////console.log('idle state');
    if (clientinput.left.isDown || clientinput.right.isDown) {
      if (
        clientinput.roll.isDown &&
        clientrepeats.roll === 0 &&
        newstamina >= staminaCost.standroll
      ) {
        this.stateMachine.transition("roll");
      } else {
        this.stateMachine.transition("walk");
      }
      return;
    }

    if (clientinput.roll.isDown) {
      this.stateMachine.transition("block");
      return;
    }
    if (clientinput.up.isDown && isTouching.bottom) {
      this.stateMachine.transition("jump");
      return;
    }
    if (clientinput.down.isDown && state.onPlatform) {
      player.setInternalState({ platformFall: true });
      this.stateMachine.transition("fall");
      return;
    }

    if (
      clientinput.attack.isDown &&
      clientrepeats.attack === 0 &&
      newstamina >= staminaCost.attack1
    ) {
      this.stateMachine.transition("attack1");
    }
    if (
      clientinput.stratk.isDown &&
      clientrepeats.attack === 0 &&
      newstamina >= staminaCost.stratk
    ) {
      this.stateMachine.transition("stratk");
    }
  }

  quit() {}
}

export class WalkState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play("walk");
    //player.awakeplayer();
  }
  execute(player: Player) {
    const clientinput = player.input;
    const clientrepeats = player.inputrepeats;
    const isTouching = player.getIsTouching();
    const state = player.getInternalState();
    const attributes = player.getAttributes();
    const newstamina = state.stamina + attributes.staminaregen;
    player.setInternalState({ stamina: newstamina });

    if (clientinput.left.isDown) {
      //console.log('going left');
      player.setInternalState({ flipX: true });
      player.setVelocityX(-attributes.groundspeed);
    } else if (clientinput.right.isDown) {
      //console.log('going right');
      player.setInternalState({ flipX: false });
      player.setVelocityX(attributes.groundspeed);
    }

    if (clientinput.run.isDown && newstamina >= staminaCost.runinit) {
      this.stateMachine.transition("run");
      return;
    }

    if (
      clientinput.roll.isDown &&
      clientrepeats.roll === 0 &&
      newstamina >= staminaCost.walkroll
    ) {
      this.stateMachine.transition("roll");
      return;
    }

    if (clientinput.up.isDown && isTouching.bottom) {
      this.stateMachine.transition("jump");
      return;
    } else if (!isTouching.nearbottom) {
      this.stateMachine.transition("fall");
      return;
    }

    if (clientinput.down.isDown && state.onPlatform) {
      // reset player to only collide with hard platform
      player.setInternalState({ platformFall: true });
      this.stateMachine.transition("fall");
      return;
    }
    if (
      clientinput.attack.isDown &&
      clientrepeats.attack === 0 &&
      newstamina >= staminaCost.attack1
    ) {
      this.stateMachine.transition("attack1");
      return;
    }

    if (
      clientinput.stratk.isDown &&
      clientrepeats.attack === 0 &&
      newstamina >= staminaCost.stratk
    ) {
      this.stateMachine.transition("stratk");
      return;
    }

    if (clientinput.right.isUp && clientinput.left.isUp) {
      //console.log('transition to idle');
      this.stateMachine.transition("idle");
      return;
    }
  }

  quit() {}
}

export class BlockState extends State {
  callback;

  enter(player: Player) {
    //debugger;
    //this.stateMachine.anims.play("block");
    this.callback = () => {
      this.stateMachine.anims.play("block");
    };
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      this.callback
    );
    this.stateMachine.anims.play("block-startup");
  }

  execute(player: Player) {
    const clientinput = player.input;
    const isTouching = player.getIsTouching();
    if (!isTouching.bottom && !isTouching.nearbottom) {
      this.quit();
      this.stateMachine.transition("fall");
    }
    if (clientinput.roll.isUp) {
      this.quit();
      this.stateMachine.transition("idle");
    }
  }

  quit() {
    this.stateMachine.anims.event.off(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }
}

//export class BlockStun extends State {
//
//  enter() {
//
//  }
//  execute() {
//
//  }
//  quit() {
//
//  }
//}

export class RunState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play("run");
    //player.awakeplayer();
  }
  execute(player: Player) {
    const clientinput = player.input;
    const clientrepeats = player.inputrepeats;
    const isTouching = player.getIsTouching();
    const state = player.getInternalState();
    const attributes = player.getAttributes();
    const newstamina = state.stamina - staminaCost.run;
    player.setInternalState({ stamina: newstamina });

    if (clientinput.left.isDown) {
      //console.log('going left');
      player.setInternalState({ flipX: true });
      player.setVelocityX(-attributes.runspeed);
    } else if (clientinput.right.isDown) {
      //console.log('going right');
      player.setInternalState({ flipX: false });
      player.setVelocityX(attributes.runspeed);
    }
    if (
      clientinput.roll.isDown &&
      clientrepeats.roll === 0 &&
      newstamina >= staminaCost.runroll
    ) {
      this.stateMachine.transition("roll");
      return;
    }
    if (clientinput.run.isUp || newstamina <= staminaCost.run) {
      this.stateMachine.transition("walk");
      return;
    }
    if (clientinput.up.isDown && isTouching.bottom) {
      this.stateMachine.transition("jump");
      return;
    } else if (!isTouching.nearbottom) {
      this.stateMachine.transition("fall");
      return;
    }

    if (clientinput.down.isDown && state.onPlatform) {
      // reset player to only collide with hard platform
      player.setInternalState({ platformFall: true });
      this.stateMachine.transition("fall");
      return;
    }
    if (
      clientinput.attack.isDown ||
      (clientinput.stratk.isDown &&
        clientrepeats.attack === 0 &&
        state.stamina >= staminaCost.dashattack)
    ) {
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

export class RollState extends State {
  clearid;
  enter(player: Player) {
    this.stateMachine.anims.play("smrslt");
    const clientinput = player.input;
    player.setFriction(0);
    const attributes = player.getAttributes();
    const state = player.getInternalState();
    var newstamina = state.stamina;
    var rolltime;
    var rolldistance = attributes.rolldistance;
    // roll based on previous state
    // TODO: extract this to a config file
    if (this.stateMachine.prevstate === "idle") {
      newstamina -= staminaCost.standroll;
      rolltime = 200;
    } else if (this.stateMachine.prevstate === "walk") {
      newstamina -= staminaCost.walkroll;
      rolldistance *= 1.25;
      rolltime = 300;
    } else {
      newstamina -= staminaCost.runroll;
      rolldistance *= 1.5;
      rolltime = 400;
    }
    player.setInternalState({ stamina: newstamina });
    var flipX =
      clientinput.left.isDown === state.flipX ? !state.flipX : state.flipX;
    if (clientinput.right.isDown) {
      player.setVelocityX(rolldistance);
    } else {
      player.setVelocityX(-rolldistance);
    }
    //TODO add enemy category in future
    player.removeCollidesWith([collisionData.category.player]);
    this.clearid = setTimeout(() => {
      player.setFriction(0.1);
      const isTouching = player.getIsTouching();
      if (isTouching.bottom) {
        this.stateMachine.transition("idle");
      } else {
        this.stateMachine.transition("fall");
      }
      player.addCollidesWith([collisionData.category.player]);
      player.setInternalState({ flipX: flipX });
    }, rolltime);
  }

  execute() {}

  quit(player: Player) {
    player.setFriction(0.1);
    player.addCollidesWith([collisionData.category.player]);
    clearTimeout(this.clearid);
  }
}

export class FallState extends State {
  enter(player: Player) {
    this.stateMachine.anims.play("fall");
  }
  execute(player: Player) {
    const clientinput = player.input;
    const clientrepeats = player.inputrepeats;
    const isTouching = player.getIsTouching();
    const attributes = player.getAttributes();
    const state = player.getInternalState();
    const newstamina = state.stamina + attributes.staminaregen;
    player.setInternalState({ stamina: newstamina });

    const v = player.getVelocity();
    if (clientinput.right.isDown && !isTouching.right) {
      Vector.add(v, { x: attributes.airaccel.x, y: 0 }, v);
      if (Math.abs(v.x) >= attributes.airspeed.x) {
        player.setVelocityX(attributes.airspeed.x);
      } else {
        player.setVelocity(v.x, v.y);
      }
    } else if (clientinput.left.isDown && !isTouching.left) {
      Vector.add(v, { x: -attributes.airaccel.x, y: 0 }, v);
      if (Math.abs(v.x) >= attributes.airspeed.x) {
        player.setVelocityX(-attributes.airspeed.x);
      } else {
        player.setVelocity(v.x, v.y);
      }
    } else if (clientinput.down.isDown && !isTouching.bottom) {
      Vector.add(v, { x: 0, y: attributes.airaccel.y }, v);
      if (Math.abs(v.y) >= attributes.airspeed.y) {
        player.setVelocityY(attributes.airspeed.y);
      } else {
        player.setVelocity(v.x, v.y);
      }
    }

    if (
      (clientinput.left.isDown && isTouching.left) ||
      (clientinput.right.isDown && isTouching.right)
    ) {
      player.setVelocityX(0);
    }
    if (
      state.airjumps < attributes.maxairjumps &&
      clientinput.up.isDown &&
      clientrepeats.up === 0
    ) {
      this.stateMachine.transition("airjump");
      return;
    }
    if (clientinput.stratk.isDown && newstamina >= staminaCost.strairatk) {
      this.stateMachine.transition("strairatk");
      return;
    }
    if (
      clientinput.attack.isDown &&
      clientrepeats.attack === 0 &&
      newstamina >= staminaCost.airattack1
    ) {
      this.stateMachine.transition("airattack1");
      return;
    }
    if (isTouching.bottom) {
      //////console.log(player.body.onFloor());
      this.stateMachine.transition("idle");
      return;
    }
  }
  quit() {}
}

export class AirJump extends State {
  callback;
  enter(player: Player) {
    this.stateMachine.anims.play("smrslt");
    const attributes = player.getAttributes();
    const state = player.getInternalState();
    player.setInternalState({ airjumps: (state.airjumps += 1) });
    player.setVelocityY(-attributes.jumpheight);
    // two rolls before transition to fall state

    this.callback = () => {
      this.stateMachine.transition("fall");
      this.stateMachine.anims.event.off(
        gameEvents.anims.animationrepeat,
        this.callback
      );
    };
    this.stateMachine.anims.event.on(
      gameEvents.anims.animationrepeat,
      this.callback
    );
  }

  execute() {}

  quit() {
    this.stateMachine.anims.event.off(
      gameEvents.anims.animationrepeat,
      this.callback
    );
  }
}

export class JumpState extends State {
  callback;

  enter(player: Player) {
    //debugger;
    //player.awakeplayer();
    const attributes = player.getAttributes();
    this.callback = () => {
      const clientinput = player.input;
      const vx =
        this.stateMachine.prevstate === "run"
          ? attributes.airspeed.x
          : attributes.airspeed.x / 2;
      if (clientinput.right.isDown) {
        player.setVelocityX(vx);
      } else if (clientinput.left.isDown) {
        player.setVelocityX(-vx);
      }
      player.setVelocityY(-attributes.jumpheight);
      setTimeout(() => {
        this.stateMachine.transition("fall");
      }, 100);
      return;
    };
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      this.callback
    );
    this.stateMachine.anims.play("jump");
  }

  execute() {}

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
    const state = player.getInternalState();
    const newstamina = state.stamina - staminaCost.dashattack;
    player.setInternalState({ stamina: newstamina });
    this.clearId = setTimeout(() => {
      const clientinput = player.input;
      if (
        clientinput.attack.isDown &&
        this.dashcount < 5 &&
        newstamina >= staminaCost.dashattack
      ) {
        this.dashcount += 1;
        this.stateMachine.transition("dashattack");
      } else {
        this.dashcount = 0;
        this.stateMachine.transition("idle");
      }
    }, 200);
    this.stateMachine.anims.play("dashattack");
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
    const state = player.getInternalState();
    const newstamina = state.stamina - staminaCost.attack1;
    player.setInternalState({ stamina: newstamina });
    this.callback = () => {
      const clientinput = player.input;
      if (clientinput.attack.isDown && newstamina >= staminaCost.attack2) {
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
    this.stateMachine.anims.play("attack1");
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
    //debugger;
    const state = player.getInternalState();
    const newstamina = state.stamina - staminaCost.attack2;
    player.setInternalState({ stamina: newstamina });
    this.callback = () => {
      const clientinput = player.input;
      if (clientinput.attack.isDown && newstamina >= staminaCost.attack3) {
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
    this.stateMachine.anims.play("attack2");
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
    const state = player.getInternalState();
    const newstamina = state.stamina - staminaCost.attack3;
    player.setInternalState({ stamina: newstamina });
    this.callback = () => {
      this.stateMachine.transition("idle");
      return;
    };
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      this.callback
    );
    this.stateMachine.anims.play("attack3");
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

export class StrongAttack extends State {
  callback;
  endcallback;
  holdthreshold = 2;
  holdlimit = 10;
  multiplier;

  enter(player: Player) {
    var heldcount = 0;
    this.multiplier = 1;
    const state = player.getInternalState();
    const newstamina = state.stamina - staminaCost.stratk;
    player.setInternalState({ stamina: newstamina });
    // callback for start of
    this.callback = () => {
      heldcount += 1;
      this.multiplier += 1;
      const clientinput = player.input;
      if (this.holdthreshold <= heldcount && heldcount <= this.holdlimit) {
        const state = player.getInternalState();
        if (
          clientinput.stratk.isUp ||
          heldcount === this.holdlimit ||
          state.stamina <= staminaCost.stratkheld
        ) {
          player.setInternalState({ atkmultiplier: this.multiplier });
          this.stateMachine.anims.event.off(
            gameEvents.anims.animationrepeat,
            this.callback
          );
          this.stateMachine.anims.play("strattack-end");
          this.stateMachine.anims.event.once(
            gameEvents.anims.animationcomplete,
            this.endcallback
          );
        }
        const newstamina = state.stamina - staminaCost.stratkheld;
        player.setInternalState({ stamina: newstamina });
      }
    };
    this.endcallback = () => {
      player.setInternalState({ atkmultiplier: 1 });
      const isTouching = player.getIsTouching();
      if (isTouching.bottom) {
        this.stateMachine.transition("idle");
      } else {
        this.stateMachine.transition("fall");
      }
    };
    this.stateMachine.anims.event.on(
      gameEvents.anims.animationrepeat,
      this.callback
    );
    this.stateMachine.anims.play("strattack-start");
  }

  execute(player: Player) {
    const clientinput = player.input;
    if (clientinput.left.isDown) {
      player.setInternalState({ flipX: true });
    } else if (clientinput.right.isDown) {
      player.setInternalState({ flipX: false });
    }
  }

  quit() {
    this.stateMachine.anims.event.off(
      gameEvents.anims.animationcomplete,
      this.endcallback
    );
    this.stateMachine.anims.event.off(
      gameEvents.anims.animationrepeat,
      this.callback
    );
  }
}

export class StrongAirAtk extends State {
  finished;
  callback;

  enter(player: Player) {
    this.finished = false;
    this.stateMachine.anims.play("strairatk-loop");
    const state = player.getInternalState();
    const newstamina = state.stamina - staminaCost.strairatk;
    player.setInternalState({ stamina: newstamina });
  }

  execute(player: Player) {
    const isTouching = player.getIsTouching();
    const clientinput = player.input;
    const attributes = player.getAttributes();
    const v = player.getVelocity();
    if (clientinput.down.isDown && !isTouching.bottom) {
      Vector.add(v, { x: 0, y: attributes.airaccel.y }, v);
      if (Math.abs(v.y) >= attributes.airspeed.y) {
        player.setVelocityY(attributes.airspeed.y);
      } else {
        player.setVelocity(v.x, v.y);
      }
    }
    this.callback = () => {
      this.stateMachine.transition("idle");
    };
    if (isTouching.bottom && !this.finished) {
      this.stateMachine.anims.play("strairatk-loop-end");
      this.finished = true;
      this.stateMachine.anims.event.once(
        gameEvents.anims.animationcomplete,
        this.callback
      );
    }
  }

  quit() {
    this.stateMachine.event.off(
      gameEvents.anims.animationcomplete,
      this.callback
    );
  }
}

export class AirAttack2 extends State {
  callback;
  enter(player: Player) {
    this.stateMachine.anims.play("airattack2");
    const state = player.getInternalState();
    const newstamina = state.stamina - staminaCost.airattack2;
    player.setInternalState({ stamina: newstamina });
    this.callback = () => {
      const isTouching = player.getIsTouching();
      if (isTouching.bottom) {
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

  execute(player: Player) {}

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
    const state = player.getInternalState();
    const newstamina = state.stamina - staminaCost.airattack1;
    player.setInternalState({ stamina: newstamina });
    this.callback = () => {
      const isTouching = player.getIsTouching();
      const clientinput = player.input;
      if (isTouching.bottom) {
        //console.log('idle player not touching ground transitioning');
        this.stateMachine.transition("idle");
      } else if (
        clientinput.attack.isDown &&
        newstamina >= staminaCost.airattack2
      ) {
        this.stateMachine.transition("airattack2");
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
    //const isTouching = player.getIsTouching();
    //if (isTouching.bottom) {
    //  //console.log('idle player not touching ground transitioning');
    //  this.stateMachine.transition("idle");
    //}
    //return;
  }

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
    if (hitconfig.flipX) {
      player.setVelocity(-hitconfig.knockback.x, hitconfig.knockback.y);
    } else {
      player.setVelocity(hitconfig.knockback.x, hitconfig.knockback.y);
    }
    const state = player.getInternalState();
    const enemystate = hitconfig.parent.getInternalState();
    const newhealth =
      state.health - hitconfig.damage * enemystate.atkmultiplier;
    player.setInternalState({ health: newhealth });

    this.callback = () => {
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
  execute() {}

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
    if (hitconfig !== undefined) {
      this.timerhandle = setTimeout(() => {
        const isTouching = player.getIsTouching();
        if (isTouching.bottom) {
          this.stateMachine.transition("idle");
        } else {
          this.stateMachine.transition("fall");
        }
      }, hitconfig.hitstun);
    } else {
      //TODO: sometimes hitconfig will not be passed to this classed this is a temporary solution
      this.timerhandle = setTimeout(() => {
        const isTouching = player.getIsTouching();
        if (isTouching.bottom) {
          this.stateMachine.transition("idle");
        } else {
          this.stateMachine.transition("fall");
        }
      }, 200);
    }
  }

  execute() {}

  quit() {
    clearTimeout(this.timerhandle);
  }
}

export class Death extends State {
  enter(player: Player) {
    this.stateMachine.anims.play("death");
    this.stateMachine.anims.event.once(
      gameEvents.anims.animationcomplete,
      () => {
        this.stateMachine.anims.play("dead");
      }
    );
  }

  execute() {}

  quit() {}
}
