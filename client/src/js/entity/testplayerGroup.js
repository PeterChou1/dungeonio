import Phaser from 'phaser';
import { PlayerT } from './testplayer'

export class PlayerGroup extends Phaser.GameObjects.Group {

    constructor(scene, config = {})
	{
		const defaults = {
			classType: PlayerM,
			maxSize: -1
		}
		super(scene, Object.assign(defaults, config))
    }
    
    spawn(){

        const x = Phaser.Math.Between(0, this.scene.scale.width);
        const inactive = this.getFirstDead(false, x, 368);
        console.log('found dead player');
        console.log(inactive);

        if(inactive === null){
            console.log('added player')
            const player = new PlayerM(this.scene, x, 368)
            this.add(player)
            //player.setActive(true);
            //player.setVisible(true);
            return player;
        }
        console.log('added back player');
        inactive.setActive(true);
        inactive.setVisible(true);
        inactive.world.add(inactive.body);

        return inactive;

    }

    despawn(player){
        player.setActive(false);
        player.setVisible(false);
        player.removeInteractive();
        player.world.remove(player.body, false);

    }

}