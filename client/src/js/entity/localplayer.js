import { StateMachine } from '../state/stateMachine';
import { getplayerstate }  from '../state/playerState';
import { collisionData } from '../../../../common/globalConfig.ts';
import { PlayerPhysics } from '../physics/playerPhysics';
const { Body } = Phaser.Physics.Matter.Matter; 

export class LocalPlayer {
    constructor(scene, x, y, scale) {
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(0, 0, "player", 0);
        const {width : w, height: h} = this.sprite;
        console.log('---actual player ---')
        console.log(w, h);
        // initialize player state machine for client prediction
        this.stateMachine = new StateMachine(
            'idle',
            getplayerstate(),
            [scene, this]
        )
        this.playerstate = {
            x : x,
            y : y,
            collisionData : [collisionData.category.hard],
            flipX : false,
            state : 'idle'
        }
        this.physics = new PlayerPhysics(scene, this.sprite, this.stateMachine, x, y, scale);

    }


    updatePlayer({x, y, flipX, collisionData, state}) {
        //console.log('update player');
        //console.log({x, y, flipX, collisionData, state});
        this.sprite.setPosition(x, y);
        this.sprite.setFlipX(flipX);
        this.sprite.setCollidesWith(collisionData);
        if (this.playerstate.state !== state){
            this.playanimation(state);
        }
        this.playerstate = {x: x, y: y, flipX: flipX, collisionData: collisionData, state: state};
    }

    playanimation(anims) {
        this.sprite.anims.play(anims);
    }

    clientpredict() {
        this.stateMachine.step();
    }

    testSimulate() {
        //if(this.scene.keys.right.isDown) {
            testSimulate(this);
        //}
    }

    disablegravity() {
        var gravity = this.sprite.world.localWorld.gravity;
        var body = this.sprite.body;
        Body.applyForce(body, body.position, {
            x: -gravity.x * gravity.scale * body.mass,
            y: -gravity.y * gravity.scale * body.mass
        });
    }

    //debug() {
    //    this.playerdebug = this.scene.add.text(10, 10, `Player State: ${this.stateMachine.state} \n isTouching {left: ${this.physics.isTouching.left}, right: ${this.physics.isTouching.right}, ground: ${this.physics.isTouching.ground}, top: ${this.physics.isTouching.top}, nearbottom: ${this.physics.isTouching.nearground}} onPlatfrom: ${this.physics.onPlatform} \n x: ${this.sprite.x} y: ${this.sprite.y}`,  
    //                                           { font: '"Times"', fontSize: '32px' });
    //}
    //
    //debugUpdate(){
    //    this.playerdebug.setText(`Player State: ${this.stateMachine.state} \n isTouching {left: ${this.physics.isTouching.left}, right: ${this.physics.isTouching.right}, ground: ${this.physics.isTouching.ground}, top: ${this.physics.isTouching.top}, nearbottom: ${this.physics.isTouching.nearground}} onPlatfrom: ${this.physics.onPlatform}\n x: ${this.sprite.x} y: ${this.sprite.y}`,   
    //                                         { font: '"Times"', fontSize: '32px' });
    //}
    
    destroy() {
        this.sprite.destroy();
        this.scene.events.off('update', this.clientpredict, this);
    }
}
