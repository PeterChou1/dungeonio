import Phaser from "phaser";
const Colyseus = require("colyseus.js");

export class bootScene extends Phaser.Scene {
    constructor(){
        super({
            key: 'bootScene'
        })
    }

    init(data) {
        console.log(data);
        // get name recieved from start menu
        this.playerName = data.playerName;
    }
    
    preload(){
        this.load.image('tiles', 'public/tilemaps/tilesetImage/mainlevbuild.png');
        this.load.image('background', 'public/tilemaps/tilesetImage/background_obj.png');
        this.load.tilemapTiledJSON('map', 'public/tilemaps/json/level1.json');
        this.load.image('circle', 'public/spritesheet/circle.png');
        this.load.spritesheet('player', 'public/spritesheet/adventurer-Sheet.png', {frameWidth: 50, frameHeight: 37 });
        this.load.multiatlas('mainchar', 'public/spritesheet/json/mainchar.json', 'public/spritesheet');
        this.load.json('frameData', 'public/frameData.json');
        
    }

    create(){
        this.scene.start('startLevel', {
            playerName: this.playerName
        });
    }
}