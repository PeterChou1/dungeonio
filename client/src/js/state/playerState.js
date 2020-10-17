import {State} from './stateMachine'
import {playerConfig} from '../config/playerconfig';
import {collisionData} from '../../../../common/globalConfig.ts';


export class SimIdleState extends State {
    enter(player, stateTime) {
        player.sprite.setVelocity(0);
    }

    execute(player) {
        if (!player.physics.isTouching.ground){
            this.stateMachine.transition('fall');
            return;
        }
        if (this.stateMachine.simInputs.left_keydown || 
            this.stateMachine.simInputs.right_keydown){
            this.stateMachine.transition('run');
            return;
        }

        if (this.stateMachine.simInputs.up_keydown && player.physics.isTouching.ground) {
            if (player.physics.onPlatform) {
                player.sprite.setCollidesWith([collisionData.category.hard])
                player.physics.onPlatform = false;
            }
            this.stateMachine.transition('jump');
            return;
        }
        if (this.stateMachine.simInputs.down_keydown && player.physics.onPlatform){
            // reset player to only collide with hard platform
            player.sprite.setCollidesWith([collisionData.category.hard])
            player.physics.onPlatform = false;
            this.stateMachine.transition('fall');
            return;
        }

    }
}

export class IdleState extends State {
  
    enter(scene, player){
        player.sprite.setVelocity(0);
        player.sprite.anims.play('idle');
    }

    execute(scene, player){
        //const cursors = scene.input.keyboard.createCursorKeys();
        if (!player.physics.isTouching.ground){
            this.stateMachine.transition('fall');
            return;
        }
        if (scene.keys.left.isDown || scene.keys.right.isDown){
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

export class SimRunState extends State {

    enter(player, stateTime){}

    execute(player){
        if (this.stateMachine.simInputs.left_keydown) {
            //console.log('going left');
            player.sprite.setFlipX(true)
            player.sprite.setVelocityX(-playerConfig.groundspeed)
        } else if (this.stateMachine.simInputs.right_keydown) {
            //console.log('going right');
            player.sprite.setFlipX(false)
            player.sprite.setVelocityX(playerConfig.groundspeed)
        }

        if (this.stateMachine.simInputs.up_keydown && player.physics.isTouching.ground){
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
        
        if (this.stateMachine.simInputs.down_keydown && player.physics.onPlatform){
            // reset player to only collide with hard platform
            player.sprite.setCollidesWith([collisionData.category.hard])
            player.physics.onPlatform = false;
            this.stateMachine.transition('fall');
            return;
        }
        // transition to idle if left and right key are not pressed
        ////console.log(scene.keys);
        ////console.log(scene.keys.isUp && scene.keys.isUp);
        if (this.stateMachine.simInputs.left_keyup && this.stateMachine.simInputs.right_keyup){
            //console.log('transition to idle');
            this.stateMachine.transition('idle');
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
        if (scene.keys.left.isDown) {
            //console.log('going left');
            player.sprite.setFlipX(true)
            player.sprite.setVelocityX(-playerConfig.groundspeed)
        } else if (scene.keys.right.isDown) {
            //console.log('going right');
            player.sprite.setFlipX(false)
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

export class SimFallState extends State {
    enter(player, stateTime) {}

    execute(player) {
        if (this.stateMachine.simInputs.right_keydown) {
            player.sprite.setVelocityX(playerConfig.airspeed);
        } else if (this.stateMachine.simInputs.left_keydown) {
            player.sprite.setVelocityX(-playerConfig.airspeed);
        }
        if (player.physics.isTouching.ground){
            ////console.log(player.body.onFloor());
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


export class SimJumpState extends State {
    enter(player, stateTime) {
        if (stateTime !== undefined) {
            this.generator = this.countdown(300 - stateTime, 16.66);
        } else {
            player.sprite.setVelocityY(-playerConfig.jumpheight)
            this.generator = this.countdown(300, 16.66);
        }
    }

    execute(player) {
        const finished = this.generator.next().done
        if (finished){
            this.stateMachine.transition('fall')
            return;
        }
    }

    *countdown(time, delta){
        while (time > 0) {
            time -= delta;
            yield time;
        }
        return;

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
    }

    execute(scene, player){}
}

export const getplayerstate = () => {
    const playerState = {
        idle: new IdleState(),
        run: new RunState(),
        jump: new JumpState(),
        fall: new FallState(),
    }
    return playerState;
}

export const getsimplayerState = () => {
    const simplayerState = {
        idle : new SimIdleState(),
        run : new SimRunState(),
        jump : new SimJumpState(),
        fall : new SimFallState()
    }
    return simplayerState;
}