import Phaser from "phaser";
import {StartLevel} from './js/scene/scene1';
import {MatterJS} from './js/scene/scene2';
import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";
const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scene: MatterJS,
  plugins: {
    scene: [
      {
        plugin: PhaserMatterCollisionPlugin,
        key: "matterCollision",
        mapping: "matterCollision"
      }
    ]
  }
};

const game = new Phaser.Game(config);