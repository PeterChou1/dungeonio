import { StateMachine } from '../state/stateMachine';
import { getplayerstate }  from '../state/playerState';
import { collisionData } from '../../../../common/globalConfig.ts';
import { PlayerPhysics } from '../physics/playerPhysicsLocal';
const { Body } = Phaser.Physics.Matter.Matter; 

export class LocalPlayer {
    constructor(scene, x, y, scale) {
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(x, y, 'mainchar', "adventurer-idle-00");
        const {width : w, height: h} = this.sprite;
        console.log('---actual player ---')
        console.log(w, h);
        // initialize player state machine for client prediction
        this.stateMachine = new StateMachine(
            'idle',
            getplayerstate(),
            [scene, this]
        )
        this.physics = new PlayerPhysics(scene, this.sprite, x, y, scale);
        this.scene.events.on('update', this.clientpredict, this);
    }
    
    updatePlayer({x, y, flipX, collisionData, state}) {
        //console.log('update player');
        //console.log({x, y, flipX, collisionData, state});
        //this.sprite.setPosition(x, y);
        //this.sprite.setFlipX(flipX);
        //this.sprite.setCollidesWith(collisionData);
        //if (this.playerstate.state !== state){
        //    this.playanimation(state);
        //}
        //this.playerstate = {x: x, y: y, flipX: flipX, collisionData: collisionData, state: state};
    }

    playanimation(anims) {
        this.sprite.anims.play(anims);
    }

    clientpredict() {
        this.stateMachine.step();
    }

    destroy() {
        this.sprite.destroy();
        this.scene.events.off('update', this.clientpredict, this);
    }
}
