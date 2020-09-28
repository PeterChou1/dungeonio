import Phaser from "phaser";
import Player from "../entity/player"; 
import { gameConfig, collisionData, messageType, serverport} from '../../../../common/globalConfig.ts';
import { PlayerT } from '../entity/testplayer'; 
import { playerAnims } from '../config/playerconfig';
import { createanims, randomInteger } from '../utils/utils';
const Colyseus = require("colyseus.js");


export class StartLevel extends Phaser.Scene {
    constructor(){
        super({
            key: 'Scene2',
            physics: {
                default:'matter',
                matter: {
                    debug: gameConfig.debug,
                    gravity: { y: 0 } // disable gravity
                }
            }
        })

        //this.socket = io();
        //console.log(this.socket);
    }

    /*
     handle network logic
     */
    async connect(){
        //const host = window.document.location.host.replace(/:.*/, '');
        //TODO: replace later
        const websocket = `ws://localhost:${serverport}`;
        console.log(`connected to web socket protocol ${websocket} `)
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
        this.sessionId = this.room.sessionId;
        console.log('joined room with sessionId ', this.sessionId);
        this.keys = this.input.keyboard.createCursorKeys();
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
        // data for groups of object for collision

        
        this.playerinput = new Proxy({
            left_keydown: this.keys.left.isDown,
            right_keydown: this.keys.right.isDown,
            up_keydown: this.keys.up.isDown,
            down_keydown: this.keys.down.isDown,
            left_keyup: this.keys.left.isUp,
            right_keyup: this.keys.right.isUp,
            up_keyup: this.keys.up.isUp,
            down_keyup: this.keys.up.isUp
        },  {
         set: (playerinput, prop, value) => {
             // if any key change send the input
             const changed = value !== playerinput[prop];
             playerinput[prop] = value
             if (changed && this.room) {
                playerinput[prop] = value;
                if (gameConfig.simulatelatency){
                    const randlatency = randomInteger(0, 500)
                    console.log(`set simulated network latency to ${randlatency}`);
                    setTimeout(() => {
                        this.room.send(messageType.playerinput, this.playerinput);
                    },
                    randlatency)

                } else {
                    this.room.send(messageType.playerinput, this.playerinput);
                }
             }
             return true;
         }
        }) 
        //this.gamelayer.ground.setCollisionByProperty({collides: true});
        //const convertedlayer = this.matter.world.convertTilemapLayer(this.gamelayer.ground);
        
        //console.log(convertedlayer);
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
                    //console.log(mattertile);
                    if (tile.properties.soft){
                        mattertile.setCollisionCategory(collisionData.category.soft);
                    } else {
                        mattertile.setCollisionCategory(collisionData.category.hard);
                    }
                    if (tile.properties.debug && gameConfig.debug){
                        console.log(`x: ${tile.pixelX} y: ${tile.pixelY}`);
                    }
                }
            }
        )
        // track all players in game
        this.allplayers = {};
        if (gameConfig.debug){
           console.log('---game debug mode---');
           this.matter.world.createDebugGraphic();
        }
    }


    updatePlayerInput() {
        this.playerinput.left_keydown = this.keys.left.isDown;
        this.playerinput.right_keydown = this.keys.right.isDown;
        this.playerinput.up_keydown = this.keys.up.isDown;
        this.playerinput.down_keydown = this.keys.down.isDown;
        this.playerinput.left_keyup = this.keys.left.isUp;
        this.playerinput.right_keyup = this.keys.right.isUp;
        this.playerinput.up_keyup = this.keys.up.isUp;
        this.playerinput.down_keyup = this.keys.down.isUp;
    }


    update() {
        if (this.playerinput){
            this.updatePlayerInput();
        }
        // listen for state updates
        if (this.room){
            this.room.state.players.onAdd = (player, key) => {
                    // check if player is added already
                    console.log(`---${key}---`)
                    if (!(key in this.allplayers)){
                        console.log(`--Player added with id: ${key}--`);
                        if (gameConfig.debug){
                            this.allplayers[key] = new PlayerT(this, player.x, player.y, this.sessionId);
                        } else {
                            this.allplayers[key] = new Player(this, player.x, player.y, 2);
                            if (key === this.sessionId){
                                // follow player
                                console.log('camera followed player');
                                const height = this.gamelayer.ground.height;
                                const width = this.gamelayer.ground.width
                                this.matter.world.setBounds(0, 0, width, height);
                                this.cameras.main.setBounds(0, 0, width, height);
                                this.cameras.main.startFollow(this.allplayers[key].sprite);
                            }
                        }
                    }
            }
            this.room.state.players.onChange = (change, key) => {
                //console.log(`player id: ${key} send changes`);
                if (gameConfig.debug){ 
                    this.allplayers[key].setCollidesWith(change.collisionData);
                    this.allplayers[key].setPosition(change.x, change.y);
                    if ( this.sessionId === key) {
                        //console.log('debug');
                        this.allplayers[key].debugUpdate(
                            {
                                x : change.x,
                                y: change.y,
                                flipX: change.flipX,
                                collisionData: change.collisionData,
                                state: change.state,
                                isTouching: change.isTouching,
                                onPlatform: change.onPlatform
                            }
                        )
                    }
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
            }

            this.room.state.players.onRemove = (player, key) =>  {
                console.log(`player id ${key} was removed`);
                this.allplayers[key].destroy();
            }
        }
    }

}