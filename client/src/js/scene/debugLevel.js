import Phaser from "phaser";
import {gameConfig, collisionData} from '../../../../common/globalConfig.ts';
import PhaserMatterCollisionPlugin from "../../../../server/utils/matterCollision.ts";
// imported from server for hitbox comparison
import { Player } from '../../../../server/entities/player.ts';
// testplayer
import { PlayerT } from "../entity/testplayer";
// local player
import { LocalPlayer } from '../entity/localplayer';
// actual player used
import PlayerA from '../entity/player';
import { createanims, randomInteger } from '../utils/utils';
import { playerAnims } from '../config/playerconfig';
const {Body, Bodies, Bounds} = Phaser.Physics.Matter.Matter;
const PhysicsEditorParser = Phaser.Physics.Matter.PhysicsEditorParser;

const diff = require("deep-object-diff").diff;

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
        this.plugins.installScenePlugin('matterCollision', PhaserMatterCollisionPlugin, 'matterCollision', this);
        console.log('---- init ----');
    }

    preload(){
        console.log('preload');
        this.load.image('tiles',  'public/tilemaps/tilesetImage/mainlevbuild.png')//'../../../../common/assets/tilemaps/tilesetImage/mainlevbuild.png');
        this.load.tilemapTiledJSON('map', 'public/tilemaps/json/level1.json')//'../../../../common/assets/tilemaps/json/level1.json');
        this.load.spritesheet('player', 'public/spritesheet/adventurer-Sheet.png', {frameWidth: 50, frameHeight: 37 });
        this.load.multiatlas('maincharMulti', 'public/spritesheet/json/mainchar.json', 'public/spritesheet');
        this.load.json('frameData', 'public/frameData.json');
    }

    create(){
        //@ts-ignore playergroups
        //this.playergroup = new PlayerGroup(this);
        this.frameData = this.cache.json.get('frameData');
        //this.input.mouse.disableContextMenu();
        createanims(this, playerAnims);
        //const hitbox = Body.create(airattk.fixtures[0]);
        //const hurtbox = Body.create(airattk.fixtures[1]);
        //const compoundBody = Body.create({
        //    parts: [hitbox, hurtbox],
        //    frictionStatic: 0,
        //    frictionAir: 0.02,
        //    friction: 0.1
        //})
        //console.log(rect);
        //console.log(hitbox);
        //console.log(hurtbox);
        //console.log(compoundBody);        
        //const body0 = PhysicsEditorParser.parseBody(400, 100, this.frameData['adventurer-attack1-02'] );
        //const hashitbox = body0.parts.find( (part) => part.label === 'hitbox');
        //console.log(body0);
        //console.log('--hitbox--')
        //console.log(hashitbox);
        //this.testsprite = this.matter.add.sprite(400, 100, 'mainchar', 'adventurer-attack1-02')
        //                                 .setExistingBody(body0)
        //                                 .setScale(2)
        //                                 .setCollisionCategory(collisionData.category.player)
        //                                 .setFixedRotation();

        //this.testsprite = this.matter.add.sprite(400, 100, 'mainchar', 'adventurer-attack1-01', {shape: this.frameData['adventurer-attack1-01']})
        //                                 .setScale(2)
        //                                 .setFixedRotation();
        
        //const OrgW = (body0.bounds.max.x - body0.bounds.min.x) * 2;
        //const OrgH = (body0.bounds.max.y - body0.bounds.min.y) * 2;
        //const sensors = {
        //    test: Bodies.rectangle(0, 0, OrgH, OrgW, {isSensor: true}),
        //    bottom: Bodies.rectangle(0, OrgH / 2, OrgW * 0.95, 2, {isSensor: true}),
        //    left: Bodies.rectangle(-OrgW / 2, 0, 2, OrgH * 0.95,  {isSensor: true}),
        //    right: Bodies.rectangle(OrgW / 2, 0, 2, OrgH * 0.95, {isSensor: true}), 
        //    top: Bodies.rectangle(0, -OrgH / 2, OrgW * 0.95, 2, {isSensor: true}),
        //};
        //const compoundBody = Body.create({
        //    parts: [sensors.test], //sensors.left, sensors.right, sensors.top, sensors.bottom], //sensors.nearbottom, sensors.neartop],
        //    frictionStatic: 0,
        //    frictionAir: 0.02,
        //    friction: 0.1,
        //    collisionFilter: {
        //        mask: collisionData.category.hard,
        //    }
        //})
        //const width = compoundBody.bounds.max.x - compoundBody.bounds.min.x;
        //const height = compoundBody.bounds.max.y - compoundBody.bounds.min.y;
        //console.log(`width: ${OrgW} height: ${OrgH}`)
        //console.log(`width: ${width} height: ${height}`);
        //this.matter.world.add(compoundBody);
        //this.events.on('update',() => {
        //    Body.setPosition(compoundBody, {x : //this.testsprite.x, y: //this.testsprite.y});
        //    //Body.setPosition(sensors.left, {x:  //this.testsprite.x, y: //this.testsprite.y});
        //} , this);
        //Body.setInertia(compoundBody, Infinity);
        
                
    
        //this.testsprite.anims.play('attack1', false)
        ////this.testsprite.animation = 'attack1';
        ////this.testsprite.on('animationcomplete', function (anim, frame) {
        //    if (this.animation === 'attack1') {
        //        this.anims.play('idleOnce', false);
        //        this.animation = 'idleOnce';
        //    } else {
        //        this.anims.play('attack1', false);
        //        this.animation = 'attack1';
        //    }
        //}, //this.testsprite);

        //const func = (stuff, stuff2) => {
        //    const x = this.testsprite.x;
        //    const y = this.testsprite.y;
        //    console.log('---test frame---');
        //    console.log(this.testsprite.anims.currentFrame.textureFrame);
        //    const body0 = PhysicsEditorParser.parseBody(0, 0, this.frameData[this.testsprite.anims.currentFrame.textureFrame] );
        //    const hashitbox = body0.parts.find( (part) => part.label === 'hitbox');
        //    if (hashitbox) {
        //         const hurtbox = body0.parts.find( (part) => part.label === 'hurtbox');
        //         console.log(hurtbox.position);
        //         console.log(body0.position);
        //         body0.position.x     += hurtbox.position.x;
        //         body0.position.y     += hurtbox.position.y;
        //         body0.positionPrev.x += hurtbox.position.x;
        //         body0.positionPrev.y += hurtbox.position.y;
        //         //body0.position.x -= 10;
        //         //body0.position.y += 10;
        //         //body0.positionPrev.x -= 10;
        //         //body0.positionPrev.y += 10;
        //         //this.testsprite.setScale(1)
        //                    .setExistingBody(body0)
        //                    .setScale(2)
        //                    .setCollisionCategory(collisionData.category.player)
        //                    .setFixedRotation()
        //                    .setPosition(x, y);
        //    } else {
        //        //this.testsprite.setScale(1)
        //                        .setExistingBody(body0)
        //                        .setScale(2)
        //                        .setCollisionCategory(collisionData.category.player)
        //                        .setFixedRotation()
        //                        .setPosition(x, y);
        //    
        //    }
        //}
        //this.testsprite.on('animationupdate-attack1', func, this);
    
        this.keys = this.input.keyboard.createCursorKeys();
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
                const platforms = this.matter.add.rectangle(
                    rect.x + rect.width / 2,
                    rect.y + rect.height / 2,
                    rect.width,
                    rect.height,
                    {
                      isSensor: true, // It shouldn't physically interact with other bodies
                      isStatic: true, // It shouldn't move
                      category: collisionData.category.hard,
                      mask: collisionData.category.player
                    }
                )
                this.objectgroup.soft.push(
                    platforms
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

                        //mattertile.setCollisionCategory(collisionData.category.hard);
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
        //this.player = new PlayerT(this, 250, 100);
        this.player2 = new Player(this, 300, 100, 'testplayer');
        //this.player3 = new PlayerA(this, 350, 100, 2, 'testplayer2', 'unnamed warrior');
        this.player4 = new LocalPlayer(this, 250, 100, 2);
        //this.addPlayer('testplayer');
    }


    addPlayer(clientid){
        this.events.once('update', () => { this.playergroup.spawn(clientid)});
    }

    removePlayer(clientid){
        this.events.once('update', () => this.playergroup.despawn(clientid));
    }

    update(){
        this.player2.handleClientInput(
            {
                left_keydown: this.keys.left.isDown,
                right_keydown: this.keys.right.isDown,
                up_keydown: this.keys.up.isDown,
                down_keydown: this.keys.down.isDown,
                left_keyup: this.keys.left.isUp,
                right_keyup: this.keys.right.isUp,
                up_keyup: this.keys.up.isUp,
                down_keyup: this.keys.down.isUp
            }
        )
        
    }
}