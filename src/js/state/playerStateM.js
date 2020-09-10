import {State} from './stateMachine'
import {playerConfig} from '../config/playerconfig';

export class IdleState extends State {
    enter(scene, player){
        player.sprite.setVelocity(0);
        player.sprite.anims.play('idle');
    }

    execute(scene, player){
        //const cursors = scene.input.keyboard.createCursorKeys();
        //console.log('idle state');
        if (scene.keys.left.isDown){
            //console.log('left');
            player.sprite.setFlipX(true);
            player.direction = playerConfig.direction.left
            this.stateMachine.transition('run');
            return;
        } else if (scene.keys.right.isDown) {
            //console.log('right');
            player.sprite.setFlipX(false);
            player.direction = playerConfig.direction.right
            this.stateMachine.transition('run');
            return;
        } 

        if (scene.keys.up.isDown && player.isTouching.ground) {
            //console.log('jump');
            this.stateMachine.transition('jump');
            return;
        }
        if (scene.keys.down.isDown && player.onPlatform){
            this.stateMachine.transition('platformfall');
            return; 
        }
        if (!player.isTouching.ground){
            this.stateMachine.transition('fall');
            return;
        }
    }
}

export class RunState extends State {

    enter(scene, player){
        player.sprite.anims.play('run');
    }
    execute(scene, player) {
        ////console.log(player.direction);
        if (player.direction === playerConfig.direction.left) {
            //console.log('going left');
            player.sprite.setVelocityX(-playerConfig.groundspeed)
        } else if (player.direction === playerConfig.direction.right) {
            //console.log('going right');
            player.sprite.setVelocityX(playerConfig.groundspeed)
        }

        if (scene.keys.up.isDown && player.isTouching.ground){
            this.stateMachine.transition('jump');
            return;
        } else if (!player.isTouching.ground) {
            this.stateMachine.transition('fall');
            return;
        }
        
        if (scene.keys.down.isDown && player.onPlatform){
            this.stateMachine.transition('platformfall');
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
        player.sprite.anims.play('fall');
    }
    execute(scene, player) {
        if (scene.keys.right.isDown){
            player.sprite.setVelocityX(playerConfig.airspeed);
        } else if (scene.keys.left.isDown) {
            player.sprite.setVelocityX(-playerConfig.airspeed);
        }
        if (player.isTouching.ground){
            ////console.log(player.body.onFloor());
            this.stateMachine.transition('idle');
            return;
        }   
    }
}

export class JumpState extends State {
    enter(scene, player) {
        player.sprite.anims.play('jump');
        player.sprite.setVelocityY(-playerConfig.jumpheight);
        player.sprite.once('animationcomplete', () => {
            this.stateMachine.transition('fall')
            return;
        })
        //scene.anims.on('jump', () => {
        //    //console.log('animation complete');
        //    player.setVelocityY(playerConfig.jumpheight);
        //}, scene)
    }
}

// special fall state enable player to fall through softplatform
export class PlatformFall extends State {
    enter(scene, player) {
        player.sprite.anims.play('fall');
        player.onPlatform = false;
    }

    execute(scene, player){
        if (scene.keys.right.isDown){
            player.sprite.setVelocityX(playerConfig.airspeed);
        } else if (scene.keys.left.isDown) {
            player.sprite.setVelocityX(-playerConfig.airspeed);
        }

        if (player.isTouching.ground){
            ////console.log(player.body.onFloor());
            this.stateMachine.transition('idle');
            return;
        }

    }
}


export const playerState = {
    idle: new IdleState(),
    run: new RunState(),
    jump: new JumpState(),
    fall: new FallState(),
    platformfall: new PlatformFall()
}