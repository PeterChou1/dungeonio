import Phaser from "phaser";
import { collisionData } from "../../common/globalConfig";
import { Player } from '../entities/player';
import { PlayerGroup } from '../entities/playerGroup';
import { messageType } from '../../common/globalConfig';
import PhaserMatterCollisionPlugin from "../utils/matterCollision";

export class StartLevel extends Phaser.Scene {
    map : Phaser.Tilemaps.Tilemap;
    tileset: Phaser.Tilemaps.Tileset;
    ground: Phaser.Tilemaps.DynamicTilemapLayer;
    playergroup : PlayerGroup;
    objectgroup; // map collision data
    room;


    constructor(){
        super({
            key: 'start',
            physics: {
                default:'matter',
                matter: {
                    gravity: { y: 1 } // This is the default value, so we could omit this
                }
            }
        })
    }

    init(){ 
        //console.log('init');
        //@ts-ignore suppress preBoot error since we overwrote it
        this.room = this.game.config.preBoot();
        this.plugins.removeScenePlugin('matterCollision');
        this.plugins.installScenePlugin('matterCollision', PhaserMatterCollisionPlugin, 'matterCollision', this);
        console.log('---- init ----');
        setTimeout(() => {console.log('test')}, 1000);

    }

    preload(){
        console.log('preload');
        this.load.image('tiles', '../../../../common/assets/tilemaps/tilesetImage/mainlevbuild.png');
        this.load.tilemapTiledJSON('map', '../../../../common/assets/tilemaps/json/level1.json');
    }

    create(){
        //@ts-ignore playergroups
        this.playergroup = new PlayerGroup(this);
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
                }
            }
        )

    }

    addPlayer(clientid){
        this.events.once('update', () => { this.playergroup.spawn(clientid)});
    }

    removePlayer(clientid){
        this.events.once('update', () => this.playergroup.despawn(clientid));
    }

    handlePlayerInput(){
        this.room.onMessage(messageType.playerinput, (client, data) => {
            console.log("StateHandlerRoom received message from", client.sessionId, ":", data);
        })
    }

    update(){
    }
}