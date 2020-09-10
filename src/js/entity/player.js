import { StateMachine } from '../state/stateMachine';
import { playerState }  from '../state/playerState';
import { gameConfig } from '../config/globalconfig';

export default class Player {
    constructor(scene, x, y, scale) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, "player", 0);
        this.sprite.setScale(scale, scale);
        this.sprite.setCollideWorldBounds('true');
        // initialize player state machine
        this.stateMachine = new StateMachine(
            'idle',
            playerState,
            [scene, this.sprite]
        )
        // create player animation
        scene.anims.create({
            key: 'run',
            frames: scene.anims.generateFrameNumbers('player', {start: 8, end: 13}),
            frameRate: 10,
            repeat: -1
          })
        scene.anims.create({
            key: 'idle',
            frames: scene.anims.generateFrameNumbers('player', {start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        })
        console.log(scene.anims.generateFrameNumbers('player', {start: 0, end: 3 }));
    
        scene.anims.create({
                key: 'jump',
                frames: scene.anims.generateFrameNumbers('player', {start: 14, end: 18}),
                frameRate: 10
        })
        scene.anims.create({
            key:'fall',
            frames: scene.anims.generateFrameNumbers('player', {start: 22, end: 23 }),
            frameRate: 10,
            repeat: -1
        })
        scene.anims.create({
            key: 'landing',
            frames: scene.anims.generateFrameNames('player', {start: 4, end: 7}),
            frameRate: 10
        })
        if (gameConfig.debug){
            this.debug();
        }
    }

    update() {
        // Move sprite & change animation based on keyboard input (see CodeSandbox)
        this.stateMachine.step();
        if (gameConfig.debug){
            this.debugUpdate();
        }
    }


    debug() {
        this.playerdebug = this.scene.add.text(10, 10, `Player State: ${this.stateMachine.state}`,  { font: '"Times"' });
    }

    debugUpdate(){
        this.playerdebug.setText(`Player State: ${this.stateMachine.state}`);
    }
    
    destroy() {
        this.sprite.destroy();
    }
}