import { StateMachine } from '../state/stateMachine';
import { playerState }  from '../state/playerStateM';
import { gameConfig, collisionData } from '../config/globalconfig';
import Phaser from "phaser";

export default class Player {
    constructor(scene, x, y, scale) {
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(0, 0, "player", 0);
        this.isTouching = {left: false, right: false, ground: false, top: false};
        this.onPlatform = false; 
        //this.sprite.setSize(50, 50);
        //this.sprite.setCollideWorldBounds('true');
        const {Body, Bodies} = Phaser.Physics.Matter.Matter;
        const {width : w, height: h} = this.sprite;
        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h * 2, { chamfer: {radius: 10}});
        this.sprite.setScale(scale);
        // sensors to detect player collision
        this.sensors = {
            bottom: Bodies.rectangle(0, h, w , 2, {isSensor: true}),
            left: Bodies.rectangle(-w * 0.35, 0, 2, h * 0.5,  {isSensor: true}),
            right: Bodies.rectangle(w * 0.35, 0, 2, h * 0.5, {isSensor: true}), 
            top: Bodies.rectangle(0, -h, w, 2, {isSensor: true})
        };

        const compoundBody = Body.create({
            parts: [mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            collisionFilter: {
                mask: collisionData.category.hard,
            }
        })

        console.log('compound body');
        console.log(compoundBody);
        this.sprite
            .setExistingBody(compoundBody)
            .setScale(2)
            .setFixedRotation()
            .setPosition(x, y);

        scene.matterCollision.addOnCollideStart({
            objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top],
            callback: this.onSensorCollide,
            context: this
        });
        scene.matterCollision.addOnCollideActive({
            objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top],
            callback: this.onSensorCollide,
            context: this
        });

        scene.matterCollision.addOnCollideStart({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: this.onCollideSoft,
            context: this
        })

        scene.matterCollision.addOnCollideStart({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: () => {
                this.onPlatform = true;
                this.sprite.setCollidesWith([collisionData.category.hard, collisionData.category.soft])
            },
            context: this
        })

        scene.matterCollision.addOnCollideActive({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: () => {
                if (this.stateMachine.state === "platformfall"){
                    this.sprite.setCollidesWith([collisionData.category.hard])
                } 
            },
            context: this
        })
        
        scene.matterCollision.addOnCollideEnd({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: () => this.sprite.setCollidesWith([collisionData.category.hard]),
            context: this
        })

        scene.matter.world.on("beforeupdate", this.resetTouching, this);
    
        // initialize player state machine
        this.stateMachine = new StateMachine(
            'idle',
            playerState,
            [scene, this]
        )
        // create player animation
        scene.anims.create({
            key: 'run',
            frames: scene.anims.generateFrameNumbers('player', {start: 8, end: 13}),
            frameRate: 10,
            repeat: -1,
        })
        scene.anims.create({
            key: 'idle',
            frames: scene.anims.generateFrameNumbers('player', {start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        })
        scene.anims.create({
                key: 'jump',
                frames: scene.anims.generateFrameNumbers('player', {start: 14, end: 18}),
                frameRate: 10
        })
        scene.anims.create({
            key:'fall',
            frames: scene.anims.generateFrameNumbers('player', {start: 22, end: 23 }),
            frameRate: 10,
            repeat: -1,
        })
        scene.anims.create({
            key: 'landing',
            frames: scene.anims.generateFrameNames('player', {start: 4, end: 7}),
            frameRate: 10
        })
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

    resetTouching() {
        this.isTouching.left = false;
        this.isTouching.right = false;
        this.isTouching.ground = false;
        this.isTouching.top = false;
    }

    onSensorCollide({ bodyA, bodyB, pair }) {
        if (bodyB.isSensor) return; 
        if (bodyA === this.sensors.left) {
          this.isTouching.left = true;
          //if (pair.separation > 0.5) this.sprite.x += pair.separation - 0.5;
        } else if (bodyA === this.sensors.right) {
          this.isTouching.right = true;
          //if (pair.separation > 0.5) this.sprite.x -= pair.separation - 0.5;
        } else if (bodyA === this.sensors.bottom) {
          this.isTouching.ground = true;
        } else if (bodyA === this.sensors.top) {
          this.isTouching.top = true;
        }
    }

    debug() {
        this.playerdebug = this.scene.add.text(10, 10, `Player State: ${this.stateMachine.state} \n isTouching {left: ${this.isTouching.left}, right: ${this.isTouching.right}, ground: ${this.isTouching.ground}, top: ${this.isTouching.top}}`,  
                                               { font: '"Times"', fontSize: '32px' });
    }

    debugUpdate(){
        this.playerdebug.setText(`Player State: ${this.stateMachine.state} \n isTouching {left: ${this.isTouching.left}, right: ${this.isTouching.right}, ground: ${this.isTouching.ground}, top: ${this.isTouching.top}}`,   
                                             { font: '"Times"', fontSize: '32px' });
    }
    
    destroy() {
        this.sprite.destroy();
    }
}