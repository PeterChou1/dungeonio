import Phaser from "phaser";
import Player from "../entity/player";

const debug = true;

export class StartLevel extends Phaser.Scene {
    constructor() {
      super({
          key: 'StartLevel',
          active: true,
          physics:
          {
              default: 'arcade',
              arcade:
                  {
                      debug: debug,
                      gravity:
                          {
                              y: 800
                          }
                  }
          },
      });
    }
  
    preload(){
      console.log('preload');
      this.load.image('tiles', 'assets/tilemaps/tilesetImage/mainlevbuild.png');
      this.load.image('background', 'assets/tilemaps/tilesetImage/background_obj.png');
      this.load.tilemapTiledJSON('map', 'assets/tilemaps/json/level1.json');
      this.load.spritesheet('player', 'assets/spritesheet/adventurer-Sheet.png', {frameWidth: 50, frameHeight: 37 });
    }


    debug() {
        const debugGraphics = this.add.graphics().setAlpha(0.75);
        this.gamelayer.ground.renderDebug(debugGraphics, {
            tileColor: null, // Color of non-colliding tiles
            collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
            faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
        });
        console.log(this.player);
        this.player.sprite.setDebug(true, true, 255);
        //.body.setDebug(true, true, new Phaser.Display.Color(255, 0, 0, 0));
        this.playerdebug = this.add.text(10, 10, `Player State: ${this.player.stateMachine.state}`,  { font: '"Times"' });
    }


    debugUpdate(){
        this.playerdebug.setText(`Player State: ${this.player.stateMachine.state}`);
    }
  
  
    create() {
      console.log('create level 1');
      this.map = this.add.tilemap("map");
      // create cursor keys
      this.keys = this.input.keyboard.createCursorKeys();
      this.gametile = {
        mainlev : this.map.addTilesetImage("mainlevbuild", "tiles"),
        background : this.map.addTilesetImage("background_obj", "background")
      }
  
      this.gamelayer = {
        'background3' :  this.map.createStaticLayer("background3", this.gametile.background, 0, 0),
        'background2' :  this.map.createStaticLayer("background2", this.gametile.background, 0, 0),
        'background1' :  this.map.createStaticLayer("background1", this.gametile.background, 0, 0),
        'ground' :  this.map.createStaticLayer("ground", this.gametile.mainlev, 0, 0)
      }
      this.gamelayer.ground.setCollisionByProperty({collides: true});
      // add player character
      this.player = new Player(this, 32, 368, 2);
      this.physics.add.collider(this.player.sprite, this.gamelayer.ground);

      if (debug){
          this.debug();
      }
    }
  
    update(time, delta) {
      //console.log('update');
      //this.Controls.update(delta);
      this.player.update();
      if (debug){
          this.debugUpdate();
      }
    }
}

