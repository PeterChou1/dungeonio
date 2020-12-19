import Phaser from "phaser";
import { Engine, World, Bodies, use } from "matter-js";
//@ts-ignore
import { collisionData, gameConfig } from "../../common/globalConfig.ts";

require("../utils/matter-collision.ts");
//install plugin matterjs
use("matter-collision-events");
/**
 * @description creates matterjs engine using phaser to parse tmx files for the environment
 */
export const createEngine = () => {
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
        : "../../../../common/assets/tilemaps/tilesetImage/mainlevbuild.png"
    );
    this.load.tilemapTiledJSON(
      "map",
      gameConfig.networkdebug
        ? "public/tilemaps/json/level2.json"
        : "../../../../common/assets/tilemaps/json/level2.json"
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
        //console.log(engine.world.bounds.max);
        //@ts-ignore
        World.addBody(engine.world, mattertile.body);
      }
    });
    engine.world.bounds.min.x = 0;
    engine.world.bounds.min.y = 0;
    engine.world.bounds.max.x = levelmap.width;
    engine.world.bounds.max.y = levelmap.height;
    console.log(engine.world.bounds);
    this.game.destroy(true);
  }
  new Phaser.Game(config);
  return engine;
};
