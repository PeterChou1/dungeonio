import Phaser from "phaser";
import {StartLevel} from '../scene/scene1';
//@ts-ignore
import {gameConfig} from '../../common/globalConfig.ts';

export const config = {
    type: Phaser.HEADLESS,
    parent: "phaser-example",
    width: gameConfig.size.width,
    height: gameConfig.size.height,
    scene: StartLevel,
    callbacks: null,
};
