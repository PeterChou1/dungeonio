import Phaser from "phaser";
import { gameConfig } from "../../common/globalConfig.ts";

import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";
import { ServerLevel } from './js/scene/sceneserver';
import { StartLevel } from './js/scene/scene1';

let level = gameConfig.networkdebug ? ServerLevel : StartLevel;
const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scene: level,
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
