import Phaser from "phaser";
import Player from "../entity/player";
import {gameConfig, collisionData, serverport} from '../../../../common/globalConfig.ts';
import { messageType } from '../../../../common/globalConfig.ts';
import { PlayerGroup } from '../entity/testplayerGroup'; 
import { PlayerM } from '../entity/testplayer'; 
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
        client.joinOrCreate('game').then(
            room => {
                room.state.players.onAdd = function (player, sessionId) {
                    console.log('added player id: ', sessionId);
                    console.log('player object:', player)
                }
            }
        )
    }

    preload(){
        this.load.image('tiles', 'public/tilemaps/tilesetImage/mainlevbuild.png');
        //this.load.image('background', 'public/tilemaps/tilesetImage/background_obj.png');
        this.load.tilemapTiledJSON('map', 'public/tilemaps/json/level1.json');
        this.load.image('circle', 'public/spritesheet/circle.png');
        this.load.spritesheet('player', 'public/spritesheet/adventurer-Sheet.png', {frameWidth: 50, frameHeight: 37 });
    }


    async create(){
        await this.connect();
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
        this.keys = this.input.keyboard.createCursorKeys();
        this.playerinput = new Proxy({
            left: this.keys.left.isDown,
            right: this.keys.right.isDown,
            up: this.keys.up.isDown,
            down: this.keys.down.isDown
        },  {
         set: (playerinput, prop, value) => {
             // if any key change send the input
             const changed = value !== playerinput[prop];
             playerinput[prop] = value
             //if (changed && this.room) {
             //   console.log('changed input');
             //   playerinput[prop] = value
             //   this.room.send(messageType.playerinput, this.playerinput);
             //}
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
        console.log(this.objectgroup);
        const image = this.matter.add.image(100, 100, "circle");
        image.setCircle( image.width / 2, { restitution: 1, friction: 0.25});
        image.setScale(0.5);
        image.setCollidesWith([collisionData.category.soft, collisionData.category.hard]);

        //this.player2 = new Player(this, 32, 368, 2, this.room);


        this.playergroup = this.add.existing(new PlayerGroup(this));//new PlayerM(this, 32, 300);
        this.player = this.playergroup.spawn();
        console.log('done');
        console.log(this.playergroup.getChildren());

        setTimeout(()=> {
            this.playergroup.despawn(this.player)
        }, 1000);

        setTimeout(() => {
            this.playergroup.spawn();
        }, 2000)

        createanims(this, playerAnims);

        if (gameConfig.debug){
           this.matter.world.createDebugGraphic();

        }
    }


    updatePlayerInput() {
        this.playerinput.left = this.keys.left.isDown;
        this.playerinput.right = this.keys.right.isDown;
        this.playerinput.up = this.keys.up.isDown;
        this.playerinput.down = this.keys.down.isDown;
    }


    update() {
        if (this.playerinput){
            this.updatePlayerInput();
            //console.log(this.playerinput)
        }
        // listen for state updates
        //if (this.room){
        //    console.log(this.room.state.players.onChange(
        //        (change) => {
        //            console.log('--single change--');
        //            console.log(change);
        //    }));
        //}
    }

}