import {State} from './stateMachine'
import {playerConfig} from '../config/playerconfig';
import {collisionData} from '../config/globalconfig';

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

        if (scene.keys.up.isDown && player.physics.isTouching.ground) {
            //console.log('jump');
            if (player.physics.onPlatform) {
                player.sprite.setCollidesWith([collisionData.category.hard])
                player.physics.onPlatform = false;
            }
            this.stateMachine.transition('jump');
            return;
        }
        if (scene.keys.down.isDown && player.physics.onPlatform){
            // reset player to only collide with hard platform
            player.sprite.setCollidesWith([collisionData.category.hard])
            player.physics.onPlatform = false;
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

        if (scene.keys.up.isDown && player.physics.isTouching.ground){
            if (player.physics.onPlatform) {
                player.sprite.setCollidesWith([collisionData.category.hard])
                player.physics.onPlatform = false;
            }
            this.stateMachine.transition('jump');
            return;
        } else if (!player.physics.isTouching.nearground) {
            this.stateMachine.transition('fall');
            return;
        }
        
        if (scene.keys.down.isDown && player.physics.onPlatform){
            // reset player to only collide with hard platform
            player.sprite.setCollidesWith([collisionData.category.hard])
            player.physics.onPlatform = false;
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
        player.sprite.anims.play('fall');
    }
    execute(scene, player) {
        if (scene.keys.right.isDown){
            player.sprite.setVelocityX(playerConfig.airspeed);
        } else if (scene.keys.left.isDown) {
            player.sprite.setVelocityX(-playerConfig.airspeed);
        }
        if (player.physics.isTouching.ground){
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

export const playerState = {
    idle: new IdleState(),
    run: new RunState(),
    jump: new JumpState(),
    fall: new FallState(),
}