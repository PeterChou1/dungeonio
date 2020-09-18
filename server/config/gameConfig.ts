import Phaser from "phaser";
import {StartLevel} from '../scene/scene1';
export const config = {
    type: Phaser.HEADLESS,
    parent: "phaser-example",
    width: 800,
    height: 600,
    scene: StartLevel,
    callbacks: null,
};
