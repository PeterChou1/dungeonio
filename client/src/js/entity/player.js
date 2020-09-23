import { StateMachine } from '../state/stateMachine';
import { playerState }  from '../state/playerState';
import { gameConfig, messageType, collisionData } from '../../../../common/globalConfig.ts';
import { PlayerPhysics } from '../physics/playerPhysics';

const {Body, Bodies} = Phaser.Physics.Matter.Matter;
export default class Player {
    constructor(scene, x, y, scale) {
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(0, 0, "player", 0);
        const {width : w, height: h} = this.sprite;
        console.log('---actual player ---')
        console.log(w, h);

        const mainBody = Bodies.rectangle(0, 0, w * 0.35, h, { chamfer: {radius: 5}});
        //console.log(mainBody.bounds);
        //this.sensors = {
        //    nearbottom: Bodies.rectangle(0, h + 25, w, 50, {isSensor: true}),
        //    bottom: Bodies.rectangle(0, h , w, 2, {isSensor: true}),
        //    left: Bodies.rectangle(-w * 0.35, 0, 2, h ,  {isSensor: true}),
        //    right: Bodies.rectangle(w * 0.35, 0, 2, h , {isSensor: true}), 
        //    top: Bodies.rectangle(0, -h, w, 2, {isSensor: true}),
        //    neartop: Bodies.rectangle(0, -h - 25, w, 50, {isSensor: true})
        //}
        // create main body
        const compoundBody = Body.create({
            parts: [mainBody ], // this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom, this.sensors.neartop],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            collisionFilter: {
                mask: collisionData.category.hard,
            }
        })
        this.sprite.setExistingBody(compoundBody);
        this.sprite.setScale(scale);
        this.sprite.setPosition(x, y);
        this.sprite.setFixedRotation();

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