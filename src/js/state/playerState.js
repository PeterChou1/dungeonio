import {State} from './stateMachine'

export const playerConfig = {
    direction : {
        left: 'left',
        right: 'right'
    },
    groundspeed: 200,
    airspeed: 200,
    jumpheight: 400,
}

export class IdleState extends State {
    enter(scene, player){
        player.setVelocity(0);
        player.anims.play('idle');
    }

    execute(scene, player){
        //const cursors = scene.input.keyboard.createCursorKeys();
        //console.log('idle state');
        if (scene.keys.left.isDown){
            //console.log('left');
            player.setFlipX(true);
            player.direction = playerConfig.direction.left
            this.stateMachine.transition('run');
        } else if (scene.keys.right.isDown) {
            //console.log('right');
            player.setFlipX(false);
            player.direction = playerConfig.direction.right
            this.stateMachine.transition('run');
        } 

        if (scene.keys.up.isDown && player.body.onFloor()) {
            //console.log('jump');
            this.stateMachine.transition('jump');
        }
    }
}

export class RunState extends State {

    enter(scene, player){
        player.anims.play('run');
    }
    execute(scene, player) {
        ////console.log(player.direction);
        if (player.direction === playerConfig.direction.left) {
            //console.log('going left');
            player.setVelocityX(-playerConfig.groundspeed)
        } else if (player.direction === playerConfig.direction.right) {
            //console.log('going right');
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
        ////console.log(scene.keys);
        ////console.log(scene.keys.isUp && scene.keys.isUp);
        if (scene.keys.right.isUp && scene.keys.left.isUp){
            //console.log('transition to idle');
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
        if (scene.keys.right.isDown){
            player.setVelocityX(playerConfig.airspeed);
        } else if (scene.keys.left.isDown) {
            player.setVelocityX(-playerConfig.airspeed);
        }

        if (player.body.onFloor()){
            ////console.log(player.body.onFloor());
            this.stateMachine.transition('idle');
        }
        
    }

}

export class JumpState extends State {
    enter(scene, player) {
        player.anims.play('jump');
        player.setVelocityY(-playerConfig.jumpheight);
        player.once('animationcomplete', () => {
            this.stateMachine.transition('fall')
            return;
        })
        //scene.anims.on('jump', () => {
        //    //console.log('animation complete');
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