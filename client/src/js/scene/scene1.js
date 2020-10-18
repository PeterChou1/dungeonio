import Phaser from "phaser";
import Player from "../entity/player"; 
import { gameConfig, collisionData, messageType, serverport} from '../../../../common/globalConfig.ts';
import { PlayerT } from '../entity/testplayer'; 
import { LocalPlayer } from '../entity/localplayer';
import { playerAnims } from '../config/playerconfig';
import { createanims, randomInteger } from '../utils/utils';
import { RequestQueue } from '../state/playerSimulation';
import { v4 as uuidv4 } from 'uuid';
const Colyseus = require("colyseus.js");


export class StartLevel extends Phaser.Scene {
    constructor(){
        super({
            key: 'Scene2',
            physics: {
                default:'matter',
                matter: {
                    debug: gameConfig.debug,
                    gravity: { y: 1 } // set 0 to disable gravity
                }
            }
        })

        //this.socket = io();
        ////console.log(this.socket);
    }

    /*
     handle network logic
     */
    async connect(){
        //const host = window.document.location.host.replace(/:.*/, '');
        var host = window.document.location.host.replace(/:.*/, '');
        // game server is located on port 4000
        let port;
        // if port is 8080 it means we are using dev environment then default to default port
        if (location.port && location.port !== '8080') {
            port = `:${location.port}`;
        } else {
            port = '';
        }
        var websocket = location.protocol.replace('http', 'ws')  + "//" + host + port;

        console.log(location);
        console.log(`connected to web socket protocol ${websocket}`)
        const client = new Colyseus.Client(websocket)
        // joined defined room
        return await client.joinOrCreate('game');
    }

    preload(){
        this.load.image('tiles', 'public/tilemaps/tilesetImage/mainlevbuild.png');
        this.load.image('background', 'public/tilemaps/tilesetImage/background_obj.png');
        this.load.tilemapTiledJSON('map', 'public/tilemaps/json/level1.json');
        this.load.image('circle', 'public/spritesheet/circle.png');
        this.load.spritesheet('player', 'public/spritesheet/adventurer-Sheet.png', {frameWidth: 50, frameHeight: 37 });
    }


    async create(){
        this.room = await this.connect();
        // history to track request
        this.clientpredictNUM = 0;
        // random number generated for network latency test
        this.randlatency = 20//randomInteger(0, 500);
        console.log('random latency (client) ' , this.randlatency);
        this.sessionId = this.room.sessionId;
        // request queue to keep track of last request acknowledeged by server
        this.requestQueue = new RequestQueue();
        //console.log('joined room with sessionId ', this.sessionId);
        this.keys = this.input.keyboard.createCursorKeys();
        this.clientpredictNUM = 0;

        // attach listener to keyboard inputs 
        // TODO: detach listener on destruction
        for (var prop in this.keys){
            if (Object.prototype.hasOwnProperty.call(this.keys, prop)){
                this.keys[prop].on('down', () => {
                    this.updatePlayerInput();
                })
                this.keys[prop].on('up', () => {
                    this.updatePlayerInput();
                })
            }
        }
        // create player animations;
        createanims(this, playerAnims);
        this.map = this.add.tilemap("map");
        this.gametile = {
            mainlev : this.map.addTilesetImage("mainlevbuild", "tiles"),
            background : this.map.addTilesetImage("background_obj", "background")
        }

        this.gamelayer = {
            'background3' :  this.map.createStaticLayer("background3", this.gametile.background, 0, 0),
            'background2' :  this.map.createStaticLayer("background2", this.gametile.background, 0, 0),
            'background1' :  this.map.createStaticLayer("background1", this.gametile.background, 0, 0),
            'ground' :  this.map.createDynamicLayer("ground", this.gametile.mainlev, 0, 0)
        }

        
        ////console.log(convertedlayer);
        this.objectgroup = { 
            soft: [],// soft tiles 
            hard: this.gamelayer.ground.filterTiles((tile) => !tile.properties.soft)
        };
        
        const platforms = this.map.getObjectLayer('platform');
        platforms.objects.forEach( 
            rect => {
                this.objectgroup.soft.push(
                    this.matter.add.rectangle(
                        rect.x + rect.width / 2,
                        rect.y + rect.height / 2,
                        rect.width,
                        rect.height,
                        {
                          isSensor: true, // It shouldn't physically interact with other bodies
                          isStatic: true // It shouldn't move
                        }
                    )
                )
            }
        )
        this.gamelayer.ground.forEachTile( 
            (tile)=> {
                if (tile.properties.collides){
                    const mattertile = new Phaser.Physics.Matter.TileBody(this.matter.world, tile);
                    ////console.log(mattertile);
                    if (tile.properties.soft){
                        mattertile.setCollisionCategory(collisionData.category.soft);
                    } else {
                        mattertile.setCollisionCategory(collisionData.category.hard);
                    }
                    if (tile.properties.debug && gameConfig.debug){
                        //console.log(`x: ${tile.pixelX} y: ${tile.pixelY}`);
                    }
                }
            }
        )
        // track all players in game
        this.allplayers = {};
        if (gameConfig.debug){
           //console.log('---game debug mode---');
           this.matter.world.createDebugGraphic();
        }
        // set initial input
        this.updatePlayerInput();
        this.setupnetwork();
    }

    setupnetwork() {
        this.room.state.players.onAdd = (player, key) => {
            // check if player is added already
            //console.log(`---${key}---`)
            if (!(key in this.allplayers)){
                //console.log(`--Player added with id: ${key}--`);
                if (gameConfig.debug){
                    this.allplayers[key] = new PlayerT(this, player.x, player.y, key);
                } else {
                    this.allplayers[key] = new Player(this, player.x, player.y, 2, key);
                    //this.localplayer = new LocalPlayer(this, player.x, player.y, 2);
                }
                if (key === this.sessionId){
                    // follow player
                    //console.log('camera followed player');
                    const height = this.gamelayer.ground.height;
                    const width = this.gamelayer.ground.width
                    this.matter.world.setBounds(0, 0, width, height);
                    this.cameras.main.setBounds(0, 0, width, height);
                    this.cameras.main.startFollow(this.allplayers[key].sprite);
                }
            }
        }
        this.room.state.players.onChange = (change, key) => {
            if (this.sessionId === key){
                //console.log(change.ackreqIds);
                //console.log('request queue :', this.requestQueue.unackReq.map(x => x.id));
                this.requestQueue.dequeue(change.ackreqIds);
                this.requestQueue.setcurrentrequest(change.elaspsedTime);
                // simulate player input NOTE: simulation will not run if player is 
                // within 20 (x or y) direction of server coordinates
                if (this.clientpredictNUM === 2) {
                    this.allplayers[key].simulateinput(
                        {
                            x : change.x,
                            y: change.y,
                            velocityX : change.velocityX,
                            velocityY : change.velocityY,
                            stateTime : change.stateTime,
                            flipX: change.flipX,
                            collisionData: change.collisionData,
                            state: change.state,
                        },
                        this.requestQueue.getinputs()
                    )
                    this.clientpredictNUM = 0;
                }
                this.clientpredictNUM += 1;
                //console.log('---unacknowledged request---')
                //console.log(this.requestQueue.getinputs());
                //if (this.clientpredictNUM === 2) {
                //    this.clientpredictNUM = 0;
                //}
                // this.clientpredictNUM += 1;
                //const lastitem = this.history[this.history.length - 1];
                //if (lastitem !== change.lastackreqId && change.lastackreqId !== ''){
                //    //console.log('history :', this.history);
                //    //console.log('request queue :', this.requestQueue.unackReq.map(x => x.id));
                //}
            } else {
                this.allplayers[key].updatePlayer(
                    {
                        x: change.x,
                        y: change.y,
                        flipX: change.flipX,
                        collisionData: change.collisionData,
                        state: change.state
                    }
                )
            }
            //if (gameConfig.debug){ 
            //    this.allplayers[key].setCollidesWith(change.collisionData);
            //    this.allplayers[key].setPosition(change.x, change.y);
            //    if ( this.sessionId === key) {
            //        ////console.log('debug');
            //        this.allplayers[key].debugUpdate(
            //            {
            //                x : change.x,
            //                y: change.y,
            //                flipX: change.flipX,
            //                collisionData: change.collisionData,
            //                state: change.state,
            //                isTouching: change.isTouching,
            //                onPlatform: change.onPlatform
            //            }
            //        )
            //    }
            //} else {
            // TEST TODO: remove later
            //    this.allplayers[key].updatePlayer(
            //    {
            //        x: change.x,
            //        y: change.y,
            //        flipX: change.flipX,
            //        collisionData: change.collisionData,
            //        state: change.state
            //    }
            //)
            //    console.log('---set local player---')
            //    this.localplayer.updatePlayer(
            //        {
            //            x: change.x,
            //            y: change.y,
            //            flipX: change.flipX,
            //            collisionData: change.collisionData,
            //            state: change.state
            //        }
            //    )
            //}
        }

        this.room.state.players.onRemove = (player, key) =>  {
            //console.log(`player id ${key} was removed`);
            this.allplayers[key].destroy();
        }
    }


    updatePlayerInput() {
        const uniqueid = uuidv4();
        const req = { 
            left_keydown: this.keys.left.isDown,
            right_keydown: this.keys.right.isDown,
            up_keydown: this.keys.up.isDown,
            down_keydown: this.keys.down.isDown,
            left_keyup: this.keys.left.isUp,
            right_keyup: this.keys.right.isUp,
            up_keyup: this.keys.up.isUp,
            down_keyup: this.keys.down.isUp,
            id : uniqueid
        }
        this.requestQueue.enqueue(
            {
                ...req,
                // when was the request created
                created : new Date().getTime(),
                // last time server processed your request from clients perspective
                serveradjusted : new Date().getTime(),
                // how many ms is left of time the server did process the current request
                elapsed : 0
            }
        )
        ////console.log(req);
        if (gameConfig.simulatelatency){
            setTimeout(
                () => {
                    this.room.send(messageType.playerinput, req);
                },
                this.randlatency
            )
        } else {
            this.room.send(messageType.playerinput, req);
        }
    }


    update() {
        ////console.log('delta time: ', delta);
        // listen for state updates
        if (this.room){
            
        }
        if (this.requestQueue) {
            //this.requestQueue.setcurrentrequest();
            //console.log(`unacknowledged request:  ${this.requestQueue.unackReq.length}`)
        }
    }
}