import Phaser from "phaser";
import { gameConfig } from "../../common/config/globalConfig";
import { Player } from "./player";

export class PlayerGroup extends Phaser.GameObjects.Group {
  constructor(
    scene: Phaser.Scene,
    config: Phaser.Types.GameObjects.Group.GroupConfig = {}
  ) {
    const defaults: Phaser.Types.GameObjects.Group.GroupConfig = {
      classType: Player,
      maxSize: -1,
    };
    super(scene, Object.assign(defaults, config));
    //@ts-ignore add colyseues js room instance
  }

  spawn(clientid, playerName) {
    // set random coordinates for player to spawn into
    const x = Phaser.Math.Between(0, this.scene.scale.width / 2);
    let player;
    if (gameConfig.networkdebug) {
      player = new Player(this.scene, 300, 100, clientid, playerName);
    } else {
      player = new Player(this.scene, x, 370, clientid, playerName);
    }
    this.add(player);
    console.log("added player to server id: ", clientid);
    return player;
  }

  despawn(clientid) {
    const player: Player = this.getPlayer(clientid);
    //player.setActive(false);
    //player.setVisible(false);
    //player.removeInteractive();
    //player.world.remove(player.body, false);
    this.remove(player);
    player.destroyPlayer();
    console.log("despawn player with id ", clientid);
  }

  getPlayer(clientid): Player {
    //@ts-ignore
    const player: Array<Player> = this.getChildren().filter(
      //@ts-ignore get player with player id then despawn player for later use
      (player) => player.clientid === clientid
    );
    if (player.length === 1) {
      return player[0];
    }
    return null;
  }

  updatePlayerInput(clientid, playerinput) {
    const player: Player = this.getPlayer(clientid);
    if (player !== null) {
      //console.log(`successfully handle client input id: ${clientid}`);
      player.handleClientInput(playerinput);
    }
  }

  getPlayers() {
    return this.getChildren();
  }
}
