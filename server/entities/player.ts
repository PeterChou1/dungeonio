import Phaser from 'phaser';
import {collisionData, messageType} from '../../common/globalConfig';
import { playerStateMap, playerConfig } from '../config/playerConfig';
import { playerState, StateMachine } from '../state/stateMachine';

// @ts-ignore: Property 'Matter' exist but retarded typescript will not see it'.
const {Body, Bodies} = Phaser.Physics.Matter.Matter;

export class Player extends Phaser.Physics.Matter.Sprite {
    isTouching;
    sensors;
    scene;
    collideswith;
    onPlatform : boolean;
    stateMachine: StateMachine;
    private _clientid;

    constructor(scene, x, y, clientid, w = 50, h = 37, scale = 2){
        super(scene.matter.world, x, y, '')
        // give sprite data manager
        this.setDataEnabled();
        // find msPer frame
        this.scene = scene;
        this._clientid = clientid;
        this.isTouching = {left: false, right: false, ground: false, top: false, nearground: false};
        this.onPlatform = false;
        this.collideswith = [collisionData.category.hard];
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
        // set proxy for player collision

        this.stateMachine = new StateMachine(
            'idle',
            playerState,
            [this]
        )
        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h * scale, { chamfer: {radius: 5}});
        this.sensors = {
            nearbottom: Bodies.rectangle(0, h + 25, w, 50, {isSensor: true}),
            bottom: Bodies.rectangle(0, h , w  , 2, {isSensor: true}),
            left: Bodies.rectangle(-w * 0.35, 0, 2, h ,  {isSensor: true}),
            right: Bodies.rectangle(w * 0.35, 0, 2, h , {isSensor: true}), 
            top: Bodies.rectangle(0, -h, w, 2, {isSensor: true}),
            neartop: Bodies.rectangle(0, -h - 25, w, 50, {isSensor: true})
        };

        const compoundBody = Body.create({
            parts: [mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom, this.sensors.neartop],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            collisionFilter: {
                mask: collisionData.category.hard,
            }
        })
        this.setExistingBody(compoundBody);
        this.setScale(scale);
        this.setFixedRotation();
        this.setPosition(x, y);
        this.setCollidesWith([collisionData.category.hard]);

        this.scene.matterCollision.addOnCollideStart({
            objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom],
            callback: this.onSensorCollide,
            context: this
        });
        this.scene.matterCollision.addOnCollideActive({
            objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom],
            objectB: this.scene.objectgroup.hard,
            callback: this.onSensorCollide,
            context: this
        });
        this.scene.matterCollision.addOnCollideStart({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: () => {
                this.onPlatform = true;
                this.collideswith = [collisionData.category.hard, collisionData.category.soft]
                this.setCollidesWith(this.collideswith)
            },
            context: this
        })
        this.scene.matterCollision.addOnCollideEnd({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: () => {
                this.onPlatform = false;
                this.collideswith = [collisionData.category.hard]
                this.setCollidesWith(this.collideswith)
            },
            context: this
        })
        this.scene.matter.world.on("beforeupdate", this.resetTouching, this);
        this.scene.events.on("update", this.update, this);
        // setup callbacks for client input
        this.handleClientInput();
        // add player to room state
        this.scene.room.state.addPlayer(clientid, x, y);
    }

    handleClientInput() {
        this.scene.room.onMessage(messageType.playerinput, (client, playerinput)=> {
            //console.log(`${client.sessionId} sent player input`);
            //console.log(playerinput);
            if (client.sessionId === this.clientid) {
                //console.log('recieved correctly');
                this.data.set(playerStateMap.clientinput, playerinput);
            }
        })
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
          if (pair.separation > 0.5) this.x += pair.separation - 1;
        } else if (bodyA === this.sensors.right) {
          this.isTouching.right = true;
          if (pair.separation > 0.5) this.x -= pair.separation - 1;
        } else if (bodyA === this.sensors.bottom) {
          this.isTouching.ground = true;
        } else if (bodyA === this.sensors.top) {
          this.isTouching.top = true;
        } else if (bodyA === this.sensors.nearbottom){
          this.isTouching.nearground = true;
        }
    }

    destroy(){
        this.destroy();
    }


    update(){
        this.stateMachine.step();
        console.log(`state: ${this.stateMachine.state}`);
        //console.log(this.data.get(playerStateMap.playerprop));
        console.log(`position x: ${this.x}, y: ${this.y}`);
        //console.log('collides with', this.collideswith);
        //console.log('is Touching ?');
        //console.log(this.isTouching);
        //console.log(`on Platform: ${this.onPlatform}`);
        //console.log('player input set');
        const playerconfig = this.data.get(playerStateMap.playerprop);
        this.scene.room.state.updatePlayer(this.clientid, {
            x: this.x,
            y: this.y,
            flipX: playerconfig.flipX,
            collisionData: this.collideswith,
            state: playerconfig.state
        })
        //const p = this.data.get(playerStateMap.clientinput);
        //if (p.right_keydown){
        //    console.log(p);
        //}
    }


    set clientid (clientid){
        this._clientid = clientid
    }

    get clientid (){
        return this._clientid
    }
}