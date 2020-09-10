import Phaser from "phaser";
import Player from "../entity/player";
import {gameConfig, collisionData} from '../config/globalconfig';


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
    }

    preload(){
        this.load.image('tiles', 'assets/tilemaps/tilesetImage/mainlevbuild.png');
        this.load.image('background', 'assets/tilemaps/tilesetImage/background_obj.png');
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/json/level1.json');
        this.load.image('circle', 'assets/spritesheet/circle.png');
        this.load.spritesheet('player', 'assets/spritesheet/adventurer-Sheet.png', {frameWidth: 50, frameHeight: 37 });
    }


    create(){
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
        console.log(this.objectgroup);
        this.keys = this.input.keyboard.createCursorKeys();
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

        console.log('--collisionFilter--');
        console.log(image.body.collisionFilter);
        console.log('--image---');
        console.log(image);

        this.player = new Player(this, 32, 368, 2);

        if (gameConfig.debug){
           //this.matter.world.createDebugGraphic();
        }
    }

}