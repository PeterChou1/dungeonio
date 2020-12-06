import Phaser from "phaser";
import { Engine, World, Bodies, use } from "matter-js";
import { collisionData } from "../../common/globalConfig";
import "@geckos.io/phaser-on-nodejs";
require("./matter-collision");
//install plugin matterjs
use("matter-collision-events");
/**
 * @description creates matterjs engine using phaser to parse tmx files for the environment
 */
export const createEngine = () => {
  // create an engine
  const engine = Engine.create();
  const config = {
    type: Phaser.HEADLESS,
    parent: "phaser-example",
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
      "../../../../common/assets/tilemaps/tilesetImage/mainlevbuild.png"
    );
    this.load.tilemapTiledJSON(
      "map",
      "../../../../common/assets/tilemaps/json/level1.json"
    );
  }

  function create() {
    const map = this.add.tilemap("map");
    const gametile = map.addTilesetImage("mainlevbuild", "tiles");
    //console.log(this.gametile);
    const gamelayer = {
      ground: map.createDynamicLayer("ground", gametile, 0, 0),
    };
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
    gamelayer.ground.forEachTile((tile) => {
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
    this.game.destroy(true);
  }
  new Phaser.Game(config);
  return engine;
};
