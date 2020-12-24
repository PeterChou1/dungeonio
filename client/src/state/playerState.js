import { State } from "./stateMachine";
import { collisionData, playerConfig } from "../../../common";

export class IdleState extends State {
  enter(scene, player) {
    console.log("idle");
    player.sprite.setVelocity(0);
    player.sprite.anims.play("idle");
  }

  execute(scene, player) {
    //const cursors = scene.input.keyboard.createCursorKeys();
    if (!player.physics.isTouching.ground) {
      this.stateMachine.transition("fall");
      return;
    }
    if (scene.keys.left.isDown || scene.keys.right.isDown) {
      this.stateMachine.transition("run");
      return;
    }

    if (scene.input.activePointer.leftButtonDown()) {
      this.stateMachine.transition("attack");
      return;
    }

    if (scene.keys.up.isDown && player.physics.isTouching.ground) {
      //console.log('jump');
      if (player.physics.onPlatform) {
        player.sprite.setCollidesWith([collisionData.category.hard]);
        player.physics.onPlatform = false;
      }
      this.stateMachine.transition("jump");
      return;
    }
    if (scene.keys.down.isDown && player.physics.onPlatform) {
      // reset player to only collide with hard platform
      player.sprite.setCollidesWith([collisionData.category.hard]);
      player.physics.onPlatform = false;
      player.physics.platformFall = true;
      console.log("platform fall");
      this.stateMachine.transition("fall");
      return;
    }
  }
}

export class RunState extends State {
  enter(scene, player) {
    player.sprite.anims.play("run");
  }
  execute(scene, player) {
    ////console.log(player.direction);
    if (scene.keys.left.isDown) {
      //console.log('going left');
      player.sprite.setFlipX(true);
      player.sprite.setVelocityX(-playerConfig.groundspeed);
    } else if (scene.keys.right.isDown) {
      //console.log('going right');
      player.sprite.setFlipX(false);
      player.sprite.setVelocityX(playerConfig.groundspeed);
    }

    if (scene.keys.up.isDown && player.physics.isTouching.ground) {
      if (player.physics.onPlatform) {
        player.sprite.setCollidesWith([collisionData.category.hard]);
        player.physics.onPlatform = false;
      }
      this.stateMachine.transition("jump");
      return;
    } else if (!player.physics.isTouching.nearground) {
      this.stateMachine.transition("fall");
      return;
    }

    if (scene.keys.down.isDown && player.physics.onPlatform) {
      // reset player to only collide with hard platform
      player.sprite.setCollidesWith([collisionData.category.hard]);
      player.physics.onPlatform = false;
      this.stateMachine.transition("fall");
      return;
    }
    // transition to idle if left and right key are not pressed
    ////console.log(scene.keys);
    ////console.log(scene.keys.isUp && scene.keys.isUp);
    if (scene.keys.right.isUp && scene.keys.left.isUp) {
      //console.log('transition to idle');
      this.stateMachine.transition("idle");
      return;
    }
  }
}

export class FallState extends State {
  enter(scene, player) {
    player.sprite.anims.play("fall");
  }
  execute(scene, player) {
    if (scene.keys.right.isDown) {
      player.sprite.setVelocityX(playerConfig.airspeed);
    } else if (scene.keys.left.isDown) {
      player.sprite.setVelocityX(-playerConfig.airspeed);
    }
    if (player.physics.isTouching.ground) {
      ////console.log(player.body.onFloor());
      this.stateMachine.transition("idle");
      return;
    }
  }
}

export class JumpState extends State {
  enter(scene, player) {
    player.sprite.anims.play("jump");
    player.sprite.setVelocityY(-playerConfig.jumpheight);
    player.sprite.once("animationcomplete", () => {
      this.stateMachine.transition("fall");
      return;
    });
  }

  execute(scene, player) {}
}

export class AttackState extends State {
  enter(scene, player) {
    player.sprite.anims.play("attack1");
    player.sprite.once("animationcomplete", () => {
      this.stateMachine.transition("idle");
      return;
    });
  }
  execute(scene, player) {}
}

export const getplayerstate = () => {
  const playerState = {
    idle: new IdleState(),
    run: new RunState(),
    jump: new JumpState(),
    fall: new FallState(),
    attack: new AttackState(),
  };
  return playerState;
};
