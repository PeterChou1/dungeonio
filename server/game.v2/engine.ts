import Phaser from "phaser";
import { Engine, World, Bodies, use } from "matter-js";
import { collisionData, gameConfig, playerAnims } from "../../common";
//import matter collision events
require("../utils/matter-collision");
//install plugin matterjs
use("matter-collision-events");

/**
 * @description creates matterjs engine using phaser to parse tmx files for the environment
 */
export const setupGame = (): Promise<{
  engine: Engine;
  frameData: any;
  framesInfo: any;
}> => {
  return new Promise((resolve, reject) => {
    // create an engine
    const engine = Engine.create({
      enableSleeping: true, // perf optimzation for engine
    });
    const config = {
      type: Phaser.HEADLESS,
      parent: "phaser",
      scene: {
        preload: preload,
        create: create,
      },
      physics: {
        default: "matter",
      },
    };

    function preload() {
      this.load.image(
        "tiles",
        gameConfig.networkdebug
          ? "public/tilemaps/tilesetImage/mainlevbuild.png"
          : "../../../../client/assets/tilemaps/tilesetImage/mainlevbuild.png"
      );
      this.load.tilemapTiledJSON(
        "map",
        gameConfig.networkdebug
          ? "public/tilemaps/json/level2.json"
          : "../../../../client/assets/tilemaps/json/level2.json"
      );

      this.load.multiatlas(
        "mainchar",
        gameConfig.networkdebug
          ? "public/spritesheet/json/mainchar.json"
          : "../../../../client/assets/spritesheet/json/mainchar.json",
        gameConfig.networkdebug
          ? "public/spritesheet"
          : "../../../../client/assets/spritesheet"
      );
      this.load.json(
        "frameData",
        gameConfig.networkdebug
          ? "public/frameData.json"
          : "../../../../client/assets/frameData.json"
      );
    }

    function create() {
      const map = this.add.tilemap("map");
      const gametile = map.addTilesetImage("mainlevbuild", "tiles");
      //console.log(this.gametile);
      const levelmap = map.createDynamicLayer("ground", gametile, 0, 0);
      const platforms = map.getObjectLayer("platform");
      platforms.objects.forEach((rect) => {
        World.addBody(
          engine.world,
          Bodies.rectangle(
            rect.x + rect.width / 2,
            rect.y + rect.height / 2,
            rect.width,
            rect.height,
            {
              isSensor: true, // It shouldn't physically interact with other bodies
              isStatic: true, // It shouldn't move
            }
          )
        );
      });
      levelmap.forEachTile((tile) => {
        if (tile.properties.collides) {
          const mattertile = new Phaser.Physics.Matter.TileBody(
            this.matter.world,
            tile
          );
          if (tile.properties.soft) {
            mattertile.setCollisionCategory(collisionData.category.soft);
          } else {
            mattertile.setCollisionCategory(collisionData.category.hard);
          }
          //@ts-ignore
          World.addBody(engine.world, mattertile.body);
        }
      });
      engine.world.bounds.min.x = 0;
      engine.world.bounds.min.y = 0;
      engine.world.bounds.max.x = levelmap.width;
      engine.world.bounds.max.y = levelmap.height;

      const copy = JSON.parse(JSON.stringify(playerAnims));
      const frameInfo = {};
      for (const anim of copy) {
        const frames = this.anims
          .generateFrameNames(...anim.frames)
          .map((d) => d.frame)
          .reverse();
        frameInfo[anim.key] = {
          frames: frames,
          interval: 1000 / anim.frameRate,
          duration: (frames.length * 1000) / anim.frameRate,
          repeat: anim.repeat,
        };
      }
      const frameData = this.cache.json.get("frameData");
      this.game.destroy(true);
      resolve({
        engine: engine,
        framesInfo: frameInfo,
        frameData: frameData,
      });
    }
    // start game
    const game = new Phaser.Game(config);
  });
};
