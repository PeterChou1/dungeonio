import { State } from "./stateMachine";
import { collisionData, playerConfig } from "../../../common";

export class SimIdleState extends State {
  enter(player, stateTime) {
    player.sprite.setVelocity(0);
  }

  execute(player) {
    if (!player.physics.isTouching.ground) {
      this.stateMachine.transition("fall");
      return;
    }
    if (
      this.stateMachine.simInputs.left_keydown ||
      this.stateMachine.simInputs.right_keydown
    ) {
      this.stateMachine.transition("run");
      return;
    }

    if (
      this.stateMachine.simInputs.up_keydown &&
      player.physics.isTouching.ground
    ) {
      if (player.physics.onPlatform) {
        player.sprite.setCollidesWith([collisionData.category.hard]);
        player.physics.onPlatform = false;
      }
      this.stateMachine.transition("jump");
      return;
    }
    if (this.stateMachine.simInputs.down_keydown && player.physics.onPlatform) {
      // reset player to only collide with hard platform
      player.sprite.setCollidesWith([collisionData.category.hard]);
      player.physics.onPlatform = false;
      this.stateMachine.transition("fall");
      return;
    }
  }
}

export class SimRunState extends State {
  enter(player, stateTime) {}

  execute(player) {
    if (this.stateMachine.simInputs.left_keydown) {
      //console.log('going left');
      player.sprite.setFlipX(true);
      player.sprite.setVelocityX(-playerConfig.groundspeed);
    } else if (this.stateMachine.simInputs.right_keydown) {
      //console.log('going right');
      player.sprite.setFlipX(false);
      player.sprite.setVelocityX(playerConfig.groundspeed);
    }

    if (
      this.stateMachine.simInputs.up_keydown &&
      player.physics.isTouching.ground
    ) {
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

    if (this.stateMachine.simInputs.down_keydown && player.physics.onPlatform) {
      // reset player to only collide with hard platform
      player.sprite.setCollidesWith([collisionData.category.hard]);
      player.physics.onPlatform = false;
      this.stateMachine.transition("fall");
      return;
    }
    // transition to idle if left and right key are not pressed
    ////console.log(scene.keys);
    ////console.log(scene.keys.isUp && scene.keys.isUp);
    if (
      this.stateMachine.simInputs.left_keyup &&
      this.stateMachine.simInputs.right_keyup
    ) {
      //console.log('transition to idle');
      this.stateMachine.transition("idle");
      return;
    }
  }
}

export class SimFallState extends State {
  enter(player, stateTime) {}

  execute(player) {
    if (this.stateMachine.simInputs.right_keydown) {
      player.sprite.setVelocityX(playerConfig.airspeed);
    } else if (this.stateMachine.simInputs.left_keydown) {
      player.sprite.setVelocityX(-playerConfig.airspeed);
    }
    if (player.physics.isTouching.ground) {
      ////console.log(player.body.onFloor());
      this.stateMachine.transition("idle");
      return;
    }
  }
}

export class SimJumpState extends State {
  enter(player, stateTime) {
    if (stateTime !== undefined) {
      this.generator = this.countdown(300 - stateTime, 16.66);
    } else {
      player.sprite.setVelocityY(-playerConfig.jumpheight);
      this.generator = this.countdown(300, 16.66);
    }
  }

  execute(player) {
    const finished = this.generator.next().done;
    if (finished) {
      this.stateMachine.transition("fall");
      return;
    }
  }

  *countdown(time, delta) {
    while (time > 0) {
      time -= delta;
      yield time;
    }
    return;
  }
}

export const getsimplayerState = () => {
  const simplayerState = {
    idle: new SimIdleState(),
    run: new SimRunState(),
    jump: new SimJumpState(),
    fall: new SimFallState(),
  };
  return simplayerState;
};
