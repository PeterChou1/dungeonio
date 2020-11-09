import Phaser from 'phaser';
//@ts-ignore
import {collisionData, gameConfig} from '../../common/globalConfig.ts';
//@ts-ignore
import { playerStateMap } from '../config/playerConfig.ts';
//@ts-ignore
import { StateMachine, IdleState, RunState, JumpState, FallState } from '../state/stateMachine.ts';


// @ts-ignore: Property 'Matter' exist but retarded typescript will not see it'.
const {Body, Bodies} = Phaser.Physics.Matter.Matter;

export class Player extends Phaser.Physics.Matter.Sprite {
    isTouching;
    sensors;
    scene;
    collideswith;
    platformFall : boolean; // whether or not player is in a platform fall state
    onPlatform : boolean;
    stateMachine: StateMachine;
    lastsentclientinput : number; // the time of the last sent client input
    lastTimeEnterNewState : number; // keep track of when we enter a new state
    stateTime : number;// keep track of how long we are in each state
    playerName : string; // name supplied by client client side
    
    
    mainBody;
    allcollisionlistener;
    //currentreqId : String;
    private _clientid;
    

    constructor(scene, x, y, clientid, playerName, scale = 2){
        super(scene.matter.world, x, y, 'player')
        // give sprite data manager
        const {width : w, height: h} = this;
        this._clientid = clientid;

        console.log(`spawn player with width: ${w}  height: ${h}`)
        this.setCollisionCategory(collisionData.category.player);
        this.setDataEnabled();
        this.scene = scene;
        this.playerName = playerName;
        this.isTouching = {left: false, right: false, ground: false, top: false, nearground: false};
        this.onPlatform = false;
        this.collideswith = [collisionData.category.hard];
        this.lastsentclientinput = new Date().getTime();
        this.lastTimeEnterNewState = new Date().getTime();
        this.stateTime = 0;
        // data mapping for player input
        this.data.set(playerStateMap.clientinput, {
            left_keydown: false,
            right_keydown: false,
            up_keydown: false,
            down_keydown: false,
            left_keyup: true,
            right_keyup: true,
            up_keyup: true,
            down_keyup: true
        })
        // default player config
        const playerConfig = {
            groundspeed: 7,
            airspeed: 7,
            jumpheight: 15,
            state: 'idle',
            flipX: false
        }
        // data mapping for player properties
        const config = new Proxy(
            playerConfig, {
                set: function(config, prop, value) {
                    config[prop] = value;
                    this.data.set(playerStateMap.playerprop, config);
                    return true
                }.bind(this)
            }
        )
        this.data.set(playerStateMap.playerprop, config);
        this.mainBody = Bodies.rectangle(0, 0, w * 0.6, h * scale, { chamfer: {radius: 15}});
        this.sensors = {
            nearbottom: Bodies.rectangle(0, h + 25, w, 50, {isSensor: true}),
            bottom: Bodies.rectangle(0, h , w * 0.5, 5, {isSensor: true}),
            left: Bodies.rectangle(-w * 0.35, 0, 2, h ,  {isSensor: true}),
            right: Bodies.rectangle(w * 0.35, 0, 2, h , {isSensor: true}), 
            top: Bodies.rectangle(0, -h, w * 0.5 , 5, {isSensor: true}),
            neartop: Bodies.rectangle(0, -h - 25, w, 50, {isSensor: true})
        };

        const compoundBody = Body.create({
            parts: [this.mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom, this.sensors.neartop],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            collisionFilter: {
                mask: collisionData.category.hard,
            }
        })
        this.setExistingBody(compoundBody)
        //this.setScale(scale)
        this.setFixedRotation()
        this.setPosition(x, y)

        
        if (!gameConfig.networkdebug) {
            const playerState = {
                idle: new IdleState(),
                run: new RunState(),
                jump: new JumpState(),
                fall: new FallState(),
            }
            this.stateMachine = new StateMachine(
                'idle',
                playerState,
                [this]
            )
            this.allcollisionlistener = [
                this.scene.matterCollision.addOnCollideStart({
                    objectA: [this.mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom],
                    callback: this.onSensorCollide,
                    context: this
                }),
                this.scene.matterCollision.addOnCollideActive({
                    objectA: [this.mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom],
                    callback: this.onSensorCollide,
                    context: this
                }),
                this.scene.matterCollision.addOnCollideStart({
                    objectA: this.sensors.bottom,
                    objectB: this.scene.objectgroup.soft,
                    callback: () => {
                        if (!this.platformFall) {
                            this.onPlatform = true;
                            this.collideswith = [collisionData.category.hard, collisionData.category.soft]
                            this.setCollidesWith(this.collideswith)
                            this.sensors.ground = true;
                            this.sensors.nearground = true;
                        }
                    },
                    context: this
                }),
                this.scene.matterCollision.addOnCollideActive({
                    objectA: this.sensors.bottom,
                    objectB: this.scene.objectgroup.soft,
                    callback: () => {
                        if (!this.platformFall) {
                            this.isTouching.ground = true;
                            this.isTouching.nearground = true;
                        }
                    },
                    context: this
                }),
                this.scene.matterCollision.addOnCollideEnd({
                    objectA: this.sensors.bottom,
                    objectB: this.scene.objectgroup.soft,
                    callback: () => {
                        this.platformFall = false;
                        this.onPlatform = false;
                        this.collideswith = [collisionData.category.hard]
                        this.setCollidesWith(this.collideswith)
                    },
                    context: this
                })
            ]
            this.world.on("beforeupdate", this.resetTouching, this);
            this.scene.events.on("update", this.update, this);
            // setup callbacks for client input
            // add player to room state
            this.scene.room.state.addPlayer(clientid, playerName, x, y);
        }
    }

    resetEnterState() {
        this.lastTimeEnterNewState = new Date().getTime();
    }

    setStateTime() {
        this.stateTime = new Date().getTime() - this.lastTimeEnterNewState;
    }


    handleClientInput(playerinput) {
        //console.log(`handle player input ${this.clientid}`);

        const playerconfig = this.data.get(playerStateMap.playerprop);
        // sent out acknowledgment 
        this.scene.room.state.updatePlayer(this.clientid, {
            x: this.x,
            y: this.y,
            velocityX : this.body.velocity.x,
            velocityY : this.body.velocity.y,
            stateTime : this.stateTime,
            flipX: playerconfig.flipX,
            collisionData: this.collideswith,
            state: playerconfig.state,
            isTouching: gameConfig.debug ? Object.values(this.isTouching) : null,
            onPlatform: gameConfig.debug ? this.onPlatform : null,
            reqId:  playerinput.id,
            elaspsedTime: 0
        })
        // set last sent client input
        this.lastsentclientinput = new Date().getTime();
        this.data.set(playerStateMap.clientinput, playerinput);
    }

    resetTouching() {
        this.isTouching.left = false;
        this.isTouching.right = false;
        this.isTouching.ground = false;
        this.isTouching.top = false;
        this.isTouching.nearground = false;
    }

    onSensorCollide({ bodyA, bodyB, pair }) {
        //console.log('sensor collide???')
        if (bodyB.isSensor) return; 
        if (bodyA === this.sensors.left) {
            this.isTouching.left = true;
            //if (bodyB.gameObject instanceof Phaser.Physics.Matter.Sprite) {
            //    //bodyB.gameObject.x -= (pair.separation - 0.5);
            //    this.x += (pair.separation + 0.5)
            //} else {
            if (pair.separation > 0.5) this.x += pair.separation - 0.5;
            //}
        } else if (bodyA === this.sensors.right) {
            this.isTouching.right = true;
            //if (bodyB.gameObject instanceof Phaser.Physics.Matter.Sprite) {
            //    //bodyB.gameObject.x += (pair.separation - 0.5);
            //    this.x -= (pair.separation + 0.5)
            //} else {
            if (pair.separation > 0.5) this.x -= pair.separation - 0.5;
            //}
        } else if (bodyA === this.sensors.bottom) {
            this.isTouching.ground = true;
        } else if (bodyA === this.sensors.top) {
            this.isTouching.top = true;
        } else if (bodyA === this.sensors.nearbottom){
            this.isTouching.nearground = true;
        } else if (bodyA === this.mainBody) {
          //console.log(bodyA.vertices);
          //console.log('--------')
          //console.log(`ground x: ${bodyB.position.x} y: ${bodyB.position.y}`);
          //const  getbottom = this.getBottomCenter();
          //console.log(getbottom);
          //console.log(`ground difference ${getbottom.y - bodyB.position.y}`)
          //console.log(`body x: ${bodyA.position.x} y: ${bodyA.position.y}`);
          //console.log(`true body x: ${this.x} y: ${this.y}`);
          //const bounds = this.getBounds();
          //console.log(bounds)
          //console.log(this.scene.matter.intersectRect(bounds.x, bounds.y, bounds.width, bounds.height, false));
          //console.log('-------')
        }
    }


    destroyPlayer() {
        // unsubscribe from all collision listeners
        console.log(`shutting down player ${this.clientid}`);
        this.allcollisionlistener.forEach(
            listenerUnsubcribe => {
                listenerUnsubcribe();
            }
        )
        // unsubscribe all matter events
        this.world.off('beforeupdate', this.resetTouching, this);
        // unsubscribe to scene events
        this.scene.events.off('update', this.update, this);
        this.scene.room.state.removePlayer(this.clientid);
        this.destroy();
    }

    update(){
        this.stateMachine.step();
        //console.log(`-----${this.clientid}-----`);
        //console.log(`state: ${this.stateMachine.state}`);
        //console.log(this.data.get(playerStateMap.playerprop));
        //console.log(`position x: ${this.x}, y: ${this.y}`);
        //console.log('collides with', this.collideswith);
        //console.log('is Touching ?');
        //console.log(this.isTouching);
        //console.log(`on Platform: ${this.onPlatform}`);
        const playerconfig = this.data.get(playerStateMap.playerprop);
        this.scene.room.state.updatePlayer(this.clientid, {
            timestamp : new Date().getTime(),
            x: this.x,
            y: this.y,
            velocityX : this.body.velocity.x,
            velocityY : this.body.velocity.y,
            stateTime : this.stateTime,
            flipX: playerconfig.flipX,
            collisionData: this.collideswith,
            state: playerconfig.state,
            isTouching: gameConfig.debug ? Object.values(this.isTouching) : null,
            onPlatform: gameConfig.debug ? this.onPlatform : null,
            elaspsedTime : new Date().getTime() - this.lastsentclientinput
        })

    }

    set clientid (clientid){
        this._clientid = clientid
    }

    get clientid (){
        return this._clientid
    }
}