import Phaser from "phaser";
import {gameConfig, collisionData} from '../../../../common/globalConfig.ts';
import { Player } from '../../../../server/entities/player.ts';
//import { messageType } from '../../common/globalConfig';
import PhaserMatterCollisionPlugin from "../../../../server/utils/matterCollision.ts";
import { PlayerT } from "../entity/testplayer";
import PlayerA from '../entity/player';

export class debugLevel extends Phaser.Scene {
    constructor(){
        super({
            key: 'startLevel',
            physics: {
                default:'matter',
                matter: {
                    debug: gameConfig.debug,
                    gravity: { y: 1 } // This is the default value, so we could omit this
                }
            }
        })
    }

    init(){ 
        //console.log('init');
        //@ts-ignore suppress preBoot error since we overwrote it
        //this.room = this.game.config.preBoot();
        this.plugins.removeScenePlugin('matterCollision');
        this.plugins.installScenePlugin('matterCollision', PhaserMatterCollisionPlugin, 'matterCollision', this);
        console.log('---- init ----');
    }

    preload(){
        console.log('preload');
        this.load.image('tiles',  'public/tilemaps/tilesetImage/mainlevbuild.png')//'../../../../common/assets/tilemaps/tilesetImage/mainlevbuild.png');
        this.load.tilemapTiledJSON('map', 'public/tilemaps/json/level1.json')//'../../../../common/assets/tilemaps/json/level1.json');
        this.load.spritesheet('player', 'public/spritesheet/adventurer-Sheet.png', {frameWidth: 50, frameHeight: 37 });
        this.load.multiatlas('mainchar', 'public/spritesheet/json/mainchar.json', 'public/spritesheet');

        
    }

    create(){
        //@ts-ignore playergroups
        //this.playergroup = new PlayerGroup(this);

        this.map = this.add.tilemap("map");
        this.tileset = this.map.addTilesetImage("mainlevbuild", "tiles");
        this.ground = this.map.createDynamicLayer("ground", this.tileset, 0, 0);
        this.objectgroup = { 
            soft: [],// soft tiles 
            hard: this.ground.filterTiles((tile) => !tile.properties.soft)
        };
        const platforms = this.map.getObjectLayer('platform')
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

        this.ground.forEachTile( 
            (tile)=> {
                if (tile.properties.collides){
                    const mattertile = new Phaser.Physics.Matter.TileBody(this.matter.world, tile);
                    //console.log(mattertile);
                    if (tile.properties.soft){
                        mattertile.setCollisionCategory(collisionData.category.soft);
                    } else {
                        mattertile.setCollisionCategory(collisionData.category.hard);
                    }

                    if (tile.properties.debug){
                        console.log(`x: ${tile.pixelX} y: ${tile.pixelY}`);
                    }
                }
            }
        )


        if (gameConfig.debug){
            this.matter.world.createDebugGraphic();
        }
        this.player = new PlayerT(this, 250, 100);
        this.player2 = new Player(this, 300, 100, 'testplayer');
        this.player3 = new PlayerA(this, 350, 100, 2, 'testplayer2', 'unnamed warrior');

        //this.addPlayer('testplayer');
    }

    addPlayer(clientid){
        this.events.once('update', () => { this.playergroup.spawn(clientid)});
    }

    removePlayer(clientid){
        this.events.once('update', () => this.playergroup.despawn(clientid));
    }

    update(){
    }
}