import Phaser from 'phaser';
import { gameConfig } from '../../common/globalConfig';
//@ts-ignore
import { Player } from  './player.ts';

export class PlayerGroup extends Phaser.GameObjects.Group {

    constructor(scene: Phaser.Scene, config: Phaser.Types.GameObjects.Group.GroupConfig = {})
	{
		const defaults: Phaser.Types.GameObjects.Group.GroupConfig = {
			classType: Player,
			maxSize: -1
		}
        super(scene, Object.assign(defaults, config))
        //@ts-ignore add colyseues js room instance
    }
    
    spawn(clientid){
        const x = Phaser.Math.Between(0, this.scene.scale.width);
        const inactive : Player = this.getFirstDead(false, x, 370);

        if(inactive === null){
            let player;
            if (gameConfig.networkdebug){
                player = new Player(this.scene, 300, 100, clientid);
            } else {
                player = new Player(this.scene, x, 370, clientid);
            }
            this.add(player)
            console.log('added player to server id: ' , clientid);
            return player;
        }
        inactive.clientid = clientid;
        inactive.setActive(true);
        inactive.setVisible(true);
        inactive.world.add(inactive.body);
        return inactive;

    }

    despawn(clientid){
        const player : Player = this.getPlayer(clientid);
        //player.setActive(false);
        //player.setVisible(false);
        //player.removeInteractive();
        //player.world.remove(player.body, false);
        player.destroyPlayer();
        console.log('despawn player with id ', clientid);
    }


    getPlayer(clientid) : Player {
        //@ts-ignore get player with player id then despawn player for later use
        const player : Array<Player> = this.getChildren().filter(player =>  player.clientid === clientid);
        if (player.length === 1) {
            return player[0]
        }
        return null;

    }


    updatePlayerInput(clientid, playerinput){
        const player : Player = this.getPlayer(clientid);
        if (player !== null){
            console.log(`successfully handle client input id: ${clientid}`);
            player.handleClientInput(playerinput);
        }
    }


    update(){
    }

}