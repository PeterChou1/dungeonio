

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
  
export class State {
    enter() {

    }

    execute() {

    }
}

export class IdleState extends State {
    enter(scene, player){
        player.setVelocity(0);
        player.anims.play('idle');
    }

    execute(scene, player){
        //const cursors = scene.input.keyboard.createCursorKeys();
        console.log('idle state');
        if (scene.keys.left.isDown){
            console.log('left');
            player.setFlipX(true);
            player.direction = playerConfig.direction.left
            this.stateMachine.transition('run');
        } else if (scene.keys.right.isDown) {
            console.log('right');
            player.setFlipX(false);
            player.direction = playerConfig.direction.right
            this.stateMachine.transition('run');
        } 

        if (scene.keys.up.isDown && player.body.onFloor()) {
            console.log('jump');
            this.stateMachine.transition('jump');
        }
    }
}

export class RunState extends State {

    enter(scene, player){
        player.anims.play('run');
    }
    execute(scene, player) {
        console.log('runstate');
        console.log(player.direction);

        //console.log(player.direction);
        if (player.direction === playerConfig.direction.left) {
            console.log('going left');
            player.setVelocityX(-playerConfig.groundspeed)
        } else if (player.direction === playerConfig.direction.right) {
            console.log('going right');
            player.setVelocityX(playerConfig.groundspeed)
        }

        if (scene.keys.up.isDown && player.body.onFloor()){
            this.stateMachine.transition('jump');
            return;
        } else if (!player.body.onFloor()) {
            this.stateMachine.transition('fall');
            return;
        }
        // transition to idle if left and right key are not pressed
        //console.log(scene.keys);
        //console.log(scene.keys.isUp && scene.keys.isUp);
        if (scene.keys.right.isUp && scene.keys.left.isUp){
            console.log('transition to idle');
            this.stateMachine.transition('idle');
            return;
        }
    }

}

export class FallState extends State {

    enter(scene, player) {
        player.anims.play('fall');
    }

    execute(scene, player) {
        console.log('fall state');
        if (scene.keys.right.isDown){
            player.setVelocityX(playerConfig.airspeed);
        } else if (scene.keys.left.isDown) {
            player.setVelocityX(-playerConfig.airspeed);
        }

        if (player.body.onFloor()){
            console.log('fall state player');
            //console.log(player.body.onFloor());
            this.stateMachine.transition('idle');
        }
        
    }

}

export class JumpState extends State {
    enter(scene, player) {
        player.anims.play('jump');
        player.setVelocityY(-playerConfig.jumpheight);
        player.once('animationcomplete', () => {
            console.log('jump state -> fall state');
            this.stateMachine.transition('fall')
            return;
        })
        //scene.anims.on('jump', () => {
        //    console.log('animation complete');
        //    player.setVelocityY(playerConfig.jumpheight);
        //}, scene)
    }
}


export const playerState = {
    idle: new IdleState(),
    run: new RunState(),
    jump: new JumpState(),
    fall: new FallState()
}