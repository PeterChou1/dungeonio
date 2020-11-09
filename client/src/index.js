import Phaser from "phaser";
import { gameConfig } from "../../common/globalConfig.ts";
import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { debugLevel } from './js/scene/debugLevel';
import { startLevel } from './js/scene/startLevel';
import { bootScene } from './js/scene/boot';
import { mainMenu }  from './js/scene/mainMenu';
import { hudScene } from './js/scene/hud';


const config = {
  type: Phaser.AUTO,
  parent: "phaser-container",
  dom: {
    createContainer: true
  },
  width: gameConfig.size.width,
  height: gameConfig.size.height,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  plugins: {
    scene: [
      {
        plugin: PhaserMatterCollisionPlugin,
        key: "matterCollision",
        mapping: "matterCollision"
      },
      {
				key: 'rexUI',
				plugin: RexUIPlugin,
				mapping: 'rexUI'
			}
    ]
  }
};

const game = new Phaser.Game(config);



let level = gameConfig.networkdebug ? debugLevel : startLevel;

game.scene.add('startLevel', level);
game.scene.add('bootScene', bootScene);
game.scene.add('mainMenu', mainMenu);
game.scene.add('hudScene', hudScene);
game.scene.start('mainMenu');
