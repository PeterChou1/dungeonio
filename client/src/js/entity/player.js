import { StateMachine, SimulatedStateMachine } from '../state/stateMachine';
import { getplayerstate,  getsimplayerState }  from '../state/playerState';
import { gameConfig, messageType, collisionData } from '../../../../common/globalConfig.ts';
import { PlayerPhysics } from '../physics/playerPhysics';
const { Body } = Phaser.Physics.Matter.Matter; 


export default class Player {
    constructor(scene, x, y, scale, key) {
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(0, 0, "player", 0);
        this.playerId = key;
        this.simcount = 0;
        // const {width : w, height: h} = this.sprite;
        // console.log('---actual player ---')
        // console.log(w, h);
        // const mainBody = Bodies.rectangle(0, 0, w * 0.35, h, { chamfer: {radius: 5}});
        // console.log(mainBody.bounds);
        // this.sensors = {
        //     nearbottom: Bodies.rectangle(0, h + 25, w, 50, {isSensor: true}),
        //     bottom: Bodies.rectangle(0, h , w, 2, {isSensor: true}),
        //     left: Bodies.rectangle(-w * 0.35, 0, 2, h ,  {isSensor: true}),
        //     right: Bodies.rectangle(w * 0.35, 0, 2, h , {isSensor: true}), 
        //     top: Bodies.rectangle(0, -h, w, 2, {isSensor: true}),
        //     neartop: Bodies.rectangle(0, -h - 25, w, 50, {isSensor: true})
        // }
        // // create main body
        // const compoundBody = Body.create({
        //     parts: [mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom, this.sensors.neartop],
        //     frictionStatic: 0,
        //     frictionAir: 0.02,
        //     friction: 0.1,
        //     collisionFilter: {
        //         mask: collisionData.category.hard,
        //     }
        // })
        // this.sprite.setExistingBody(compoundBody);
        // this.sprite.setScale(scale);
        // this.sprite.setPosition(x, y);
        // this.sprite.setFixedRotation();
        // //this.sprite.setCollisionGroup(collisionData.group.player);
        // this.sprite.setCollisionCategory(collisionData.category.player);
        // initialize player state machine for client prediction
        this.stateMachine = new StateMachine(
            'idle',
            getplayerstate(),
            [scene, this]
        )
        this.physics = new PlayerPhysics(scene, this.sprite, this.stateMachine, x, y, scale);
        // default state of player values are set by server
        this.playerstate = {
            x : x,
            y : y,
            flipX : false,
            state : 'idle'
        }

        if (this.scene.sessionId === this.playerId) {
            this.simStateMachine = new SimulatedStateMachine(
                scene,
                'idle',
                getsimplayerState(),
                [this]
            )
            // only client predict for current player
            this.scene.events.on("update", this.clientpredict, this);
        } else {
            // player default animation
            this.playanimation(this.playerstate.state);
            this.sprite.world.on('beforeupdate', this.disablegravity, this);
        }
        // diasable gravity for server control object
        // this.sprite.world.on('beforeupdate', this.disablegravity, this);
    }

    simulateinput(serverstate, inputs) {
        //console.log('-------simulating inputs----------')
        //console.log(inputs);
        //console.log(inputs);
        // compare server state to client state
        // set position
        const deltaY = Math.abs(serverstate.x - this.playerstate.x);
        const deltaX = Math.abs(serverstate.y - this.playerstate.y);

        if (deltaY >= 10 || deltaX > 10) {
            this.sprite.setPosition(
                serverstate.x,
                serverstate.y
            )
            this.sprite.setVelocity(
                serverstate.velocityX,
                serverstate.velocityY
            )
            this.simStateMachine.simulateInput(
                serverstate.stateTime,
                serverstate.state,
                inputs
            )
        }
    }

    playanimation(anims) {
        this.sprite.anims.play(anims);
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
        this.playerstate = {
            x : x,
            y : y,
            flipX : flipX,
            state : state
        }
    }

    setplayerstate(){
        this.playerstate = {
            x : this.sprite.x,
            y : this.sprite.y,
            flipX : this.sprite.flipX,
            state : this.stateMachine.state
        }
    }

    getPlayerState() {
        return this.playerstate;
    }

    clientpredict() {
       this.stateMachine.step();
       this.setplayerstate();
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
        if (this.scene.sessionId === this.key) {
            this.scene.events.off('update', this.clientpredict, this);
        } else {
            this.sprite.world.off('beforeupdate', this.disablegravity, this);
        }
    }
}