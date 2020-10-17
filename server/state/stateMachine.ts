interface PossibleStates { [key: string]: State; }
//@ts-ignore
import { collisionData } from '../../common/globalConfig.ts';
//@ts-ignore
import { playerStateMap } from '../config/playerConfig.ts';

export class StateMachine {
    initialState;
    possibleStates : PossibleStates;
    stateArgs;
    state;

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
  
export abstract class State {
  stateMachine : StateMachine;

  abstract enter(...args)
  abstract execute(...args)
}

export class IdleState extends State {
  
  enter(player){
    player.resetEnterState();
    player.setVelocity(0);
    const playerconfig = player.data.get(playerStateMap.playerprop);
    playerconfig.state = 'idle'
  }

  execute(player){
      player.setStateTime();
      //const cursors = scene.input.keyboard.createCursorKeys();
      const clientinput = player.data.get(playerStateMap.clientinput);
      //console.log(player.isTouching.ground);
      if (!player.isTouching.ground) {
        console.log('idle player not touching ground transitioning');
        this.stateMachine.transition('fall');
        return;

      }
      //console.log('idle state');
      if (clientinput.left_keydown || clientinput.right_keydown){
          //console.log('left');
          this.stateMachine.transition('run');
          return;
      }
      //console.log('can i jump?');
      //console.log(clientinput.up);
      //console.log(player.isTouching.ground);
      if (clientinput.up_keydown && player.isTouching.ground) {
          //console.log('jump');
          if (player.onPlatform) {
              player.collideswith = [collisionData.category.hard]
              player.setCollidesWith(player.collideswith)
              player.onPlatform = false;
          }
          this.stateMachine.transition('jump');
          return;
      }
      if (clientinput.down_keydown && player.onPlatform){
          // reset player to only collide with hard platform
          player.collideswith = [collisionData.category.hard]
          player.setCollidesWith(player.collideswith)
          player.onPlatform = false;
          player.platformFall = true;
          this.stateMachine.transition('fall');
          return;
      }

  }
}

export class RunState extends State {

  enter(player){
    player.resetEnterState();
    const playerconfig = player.data.get(playerStateMap.playerprop);
    playerconfig.state = 'run'
  }
  execute(player) {
      player.setStateTime();
      ////console.log(player.direction);
      const playerconfig = player.data.get(playerStateMap.playerprop);
      const clientinput = player.data.get(playerStateMap.clientinput);
      if (clientinput.left_keydown) {
          console.log('going left');
          playerconfig.flipX = true;
          player.setVelocityX(-playerconfig.groundspeed)
      } else if (clientinput.right_keydown) {
          console.log('going right');
          playerconfig.flipX = false;
          player.setVelocityX(playerconfig.groundspeed)
      }

      if (clientinput.up_keydown && player.isTouching.ground){
          if (player.onPlatform) {
              player.setCollidesWith([collisionData.category.hard])
              player.onPlatform = false;
          }
          this.stateMachine.transition('jump');
          return;
      } else if (!player.isTouching.nearground) {
          this.stateMachine.transition('fall');
          return;
      }
      
      if (clientinput.down_keydown && player.onPlatform){
          // reset player to only collide with hard platform
          player.setCollidesWith([collisionData.category.hard])
          player.onPlatform = false;
          this.stateMachine.transition('fall');
          return;
      }
      // transition to idle if left and right key are not pressed
      //console.log('----keys-----');
      //console.log(playerconfig.right_keyup && playerconfig.left_keyup);
      if (clientinput.right_keyup && clientinput.left_keyup){
          console.log('transition to idle');
          this.stateMachine.transition('idle');
          return;
      }
  }

}

export class FallState extends State {

  enter(player) {
    player.resetEnterState();
    const playerconfig = player.data.get(playerStateMap.playerprop);
    playerconfig.state = 'fall';
  }
  execute(player) {
      player.setStateTime();
      const clientinput = player.data.get(playerStateMap.clientinput);
      const playerconfig = player.data.get(playerStateMap.playerprop);
      if (clientinput.right_keydown){
          player.setVelocityX(playerconfig.airspeed);
      } else if (clientinput.left_keydown) {
          player.setVelocityX(-playerconfig.airspeed);
      }
      if (player.isTouching.ground){
          ////console.log(player.body.onFloor());
          this.stateMachine.transition('idle');
          return;
      }   
  }
}

export class JumpState extends State {
  enter(player) {
      player.resetEnterState();
      const playerconfig = player.data.get(playerStateMap.playerprop);
      playerconfig.state = 'jump';
      player.setVelocityY(-playerconfig.jumpheight);
      // jump animation cost 3 seconds;
      setTimeout(() => {
          this.stateMachine.transition('fall')
          return;
      }, 300)
  }
  execute(player){
    player.setStateTime();
  }
}

export const playerState = {
  idle: new IdleState(),
  run: new RunState(),
  jump: new JumpState(),
  fall: new FallState(),
}