import Phaser from "phaser";
import {StartLevel} from './js/scene/scene1';
import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scene: StartLevel,
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
