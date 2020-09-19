import Phaser from "phaser";
import Player from "../entity/player"; 
import {gameConfig, collisionData, messageType, serverport} from '../../../../common/globalConfig.ts';
import { PlayerGroup } from '../entity/testplayerGroup'; 
import { PlayerT } from '../entity/testplayer'; 
import { playerAnims } from '../config/playerconfig';
import { createanims } from '../utils/utils';
const Colyseus = require("colyseus.js");


export class StartLevel extends Phaser.Scene {
    constructor(){
        super({
            key: 'Scene2',
            physics: {
                default:'matter',
                matter: {
                    gravity: { y: 1 } // This is the default value, so we could omit this
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
        console.log('joined room');
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
        this.keys = this.input.keyboard.createCursorKeys();
        this.map = this.add.tilemap("map");
        this.tileset = this.map.addTilesetImage("mainlevbuild", "tiles");
        this.ground = this.map.createDynamicLayer("ground", this.tileset, 0, 0);
        this.objectgroup = { 
            soft: [],// soft tiles 
            hard: this.ground.filterTiles((tile) => !tile.properties.soft)
        };
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
                console.log('changed input');
                playerinput[prop] = value
                this.room.send(messageType.playerinput, this.playerinput);
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
        
        const platforms = this.map.getObjectLayer('platform')
        console.log('--softplatform--');
        console.log(platforms);
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
                }
            }
        )
        //console.log(this.objectgroup);
        //const image = this.matter.add.image(100, 100, "circle");
        //image.setCircle( image.width / 2, { restitution: 1, friction: 0.25});
        //image.setScale(0.5);
        //image.setCollidesWith([collisionData.category.soft, collisionData.category.hard]);
        //this.player2 = new Player(this, 32, 368, 2, this.room);
        //this.playergroup = this.add.existing(new PlayerGroup(this));//new PlayerM(this, 32, 300);
        //this.player = this.playergroup.spawn();
        //console.log('done');
        //console.log(this.playergroup.getChildren());
        //
        //setTimeout(()=> {
        //    this.playergroup.despawn(this.player)
        //}, 1000);
        //
        //setTimeout(() => {
        //    this.playergroup.spawn();
        //}, 2000)

        if (gameConfig.debug){
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
            this.room.state.players.onAdd = (change, key) => {
                    console.log('--Player added--');
                    console.log(change);
                    console.log(key);
                    console.log('----------------');
                    this.playerT = new PlayerT(this, change.x, change.y);
                    this.player = new Player(this, change.x, change.y, 2);
            }
            
        }
    }

}