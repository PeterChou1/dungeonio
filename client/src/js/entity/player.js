import { StateMachine } from '../state/stateMachine';
import { playerState }  from '../state/playerState';
import { gameConfig, messageType } from '../../../../common/globalConfig.ts';
import { PlayerPhysics } from '../physics/playerPhysics';

export default class Player {
    constructor(scene, x, y, scale) {
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(x, y, "player", 0);
        this.sprite.setScale(scale);
        // initialize player state machine
        //this.stateMachine = new StateMachine(
        //    'idle',
        //    playerState,
        //    [scene, this]
        //)
        //this.physics = new PlayerPhysics(scene, this.sprite, this.stateMachine, x, y, scale);
        //if (gameConfig.debug){
        //    this.debug();
        //}
        // default state of player values are set by server
        this.playerstate = {
            x : null,
            y : null,
            collisionData: null,
            flipX: null,
            state: null
        }
        //this.scene.events.on("update", this.update, this);
    }

    //update() {
    //    // Move sprite & change animation based on keyboard input (see CodeSandbox)
    //    this.stateMachine.step();
    //    // potentially slow (optimize latter)
    //    //this.room.send(messageType.move, this.stateMachine.state);
    //    if (gameConfig.debug){
    //        this.debugUpdate();
    //    }
    //}

    playanimation(anims) {
        this.sprite.anims.play(anims);
    }


    updatePlayer({x, y, flipX, collisionData, state}) {
        this.sprite.setPosition(x, y);
        this.sprite.setFlipX(flipX);
        this.sprite.setCollidesWith(collisionData);
        if (this.playerstate.state !== state){
            this.playanimation(state);
        }
        this.playerstate = {x: x, y: y, flipX: flipX, collisionData: collisionData, state: state};
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
    }
}