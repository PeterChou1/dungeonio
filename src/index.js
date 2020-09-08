import Phaser from "phaser";
import {StartLevel} from './js/scene/scene1';
const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scene: StartLevel
};

const game = new Phaser.Game(config);