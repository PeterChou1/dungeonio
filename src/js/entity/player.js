import { StateMachine } from '../state/stateMachine';
import { playerState }  from '../state/playerState';
import { gameConfig } from '../config/globalconfig';
import { playerAnims } from '../config/playerconfig';
import { PlayerPhysics } from '../physics/playerPhysics';
import { createanims } from '../utils/utils';


export default class Player {
    constructor(scene, x, y, scale) {
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(0, 0, "player", 0);
        // initialize player state machine
        this.stateMachine = new StateMachine(
            'idle',
            playerState,
            [scene, this]
        )
        console.log('---player---');
        console.log(playerAnims);
        this.physics = new PlayerPhysics(scene, this.sprite, this.stateMachine, x, y, scale);
        // create player animation
        createanims(scene, playerAnims);
        if (gameConfig.debug){
            this.debug();
        }
        this.scene.events.on("update", this.update, this);
    }

    update() {
        // Move sprite & change animation based on keyboard input (see CodeSandbox)
        this.stateMachine.step();
        if (gameConfig.debug){
            this.debugUpdate();
        }
    }

    debug() {
        this.playerdebug = this.scene.add.text(10, 10, `Player State: ${this.stateMachine.state} \n isTouching {left: ${this.physics.isTouching.left}, right: ${this.physics.isTouching.right}, ground: ${this.physics.isTouching.ground}, top: ${this.physics.isTouching.top}, nearbottom: ${this.physics.isTouching.nearground}} onPlatfrom: ${this.physics.onPlatform}`,  
                                               { font: '"Times"', fontSize: '32px' });
    }

    debugUpdate(){
        this.playerdebug.setText(`Player State: ${this.stateMachine.state} \n isTouching {left: ${this.physics.isTouching.left}, right: ${this.physics.isTouching.right}, ground: ${this.physics.isTouching.ground}, top: ${this.physics.isTouching.top}, nearbottom: ${this.physics.isTouching.nearground}} onPlatfrom: ${this.physics.onPlatform}`,   
                                             { font: '"Times"', fontSize: '32px' });
    }
    
    destroy() {
        this.sprite.destroy();
    }
}