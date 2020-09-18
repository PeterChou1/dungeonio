interface PossibleStates { [key: string]: State; }
import { collisionData } from '../../common/globalConfig';
import { playerConfig, playerStateMap } from '../config/playerConfig';

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
    player.setVelocity(0);
    const playerconfig = player.data.get(playerStateMap.playerprop);
    playerconfig.state = 'idle'
  }

  execute(player){
      //const cursors = scene.input.keyboard.createCursorKeys();
      const playerconfig = player.data.get(playerStateMap.playerprop);
      //console.log('idle state');
      if (playerconfig.left){
          //console.log('left');
          playerconfig.flipX = true;
          this.stateMachine.transition('run');
          return;
      } else if (playerconfig.right) {
          //console.log('right');
          playerconfig.flipX = false;
          this.stateMachine.transition('run');
          return;
      } 

      if (playerconfig.up && player.isTouching.ground) {
          //console.log('jump');
          if (player.onPlatform) {
              player.collideswith = [collisionData.category.hard]
              player.setCollidesWith(player.collideswith)
              player.onPlatform = false;
          }
          this.stateMachine.transition('jump');
          return;
      }
      if (playerconfig.down && player.onPlatform){
          // reset player to only collide with hard platform
          player.collideswith = [collisionData.category.hard]
          player.setCollidesWith(player.collideswith)
          player.onPlatform = false;
          this.stateMachine.transition('fall');
          return;
      }

  }
}

export class RunState extends State {

  enter(player){
    const playerconfig = player.data.get(playerStateMap.playerprop);
    playerconfig.state = 'run'
  }
  execute(player) {
      ////console.log(player.direction);
      const playerconfig = player.data.get(playerStateMap.playerprop);
      if (playerconfig.flipX) {
          //console.log('going left');
          player.setVelocityX(-playerConfig.groundspeed)
      } else {
          //console.log('going right');
          player.setVelocityX(playerConfig.groundspeed)
      }

      if (playerconfig.up && player.isTouching.ground){
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
      
      if (playerconfig.down && player.onPlatform){
          // reset player to only collide with hard platform
          player.setCollidesWith([collisionData.category.hard])
          player.onPlatform = false;
          this.stateMachine.transition('fall');
          return;
      }
      // transition to idle if left and right key are not pressed
      ////console.log(scene.keys);
      ////console.log(scene.keys.isUp && scene.keys.isUp);
      if (playerconfig.right.isUp && playerconfig.left){
          //console.log('transition to idle');
          this.stateMachine.transition('idle');
          return;
      }
  }

}

export class FallState extends State {

  enter(player) {
    const playerconfig = player.data.get(playerStateMap.playerprop);
    playerconfig.state = 'fall';
  }
  execute(player) {
      const playerconfig = player.data.get(playerStateMap.playerprop);
      if (playerconfig.right){
          player.setVelocityX(playerConfig.airspeed);
      } else if (playerconfig.keys.left.isDown) {
          player.setVelocityX(-playerConfig.airspeed);
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
      const playerconfig = player.data.get(playerStateMap.playerprop);
      playerconfig.state = 'jump';
      player.setVelocityY(-playerConfig.jumpheight);
      // jump animation cost 3 seconds;
      setTimeout(() => {
          this.stateMachine.transition('fall')
          return;
      }, 300)
  }

  execute(scene, player){}
}

export const playerState = {
  idle: new IdleState(),
  run: new RunState(),
  jump: new JumpState(),
  fall: new FallState(),
}