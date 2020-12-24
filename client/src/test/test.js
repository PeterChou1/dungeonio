import Phaser from "phaser";
const { Body } = Phaser.Physics.Matter.Matter;
import { collisionData } from "../../../common/config/globalConfig.ts";

export class test {
  constructor(scene) {
    this.scene = scene;
    this.rectangle = scene.matter.add.rectangle(300, 300, 20, 5, {
      isSensor: true,
      collisionFilter: {
        mask: collisionData.category.hard,
        category: collisionData.category.player,
      },
    });
    //scene.matter.add.gameObject(this.rectangle);
    this.sensor = false;
    scene.input.on(
      "pointermove",
      function (pointer) {
        //console.log(this.clicksensor);
        Body.setPosition(this.rectangle, { x: pointer.x, y: pointer.y });
        //this.clicksensor.setPosition(pointer.x, pointer.y);
      }.bind(this)
    );

    this.debugtext = scene.add.text(10, 300, "");
    scene.matterCollision.addOnCollideStart({
      objectA: [this.rectangle],
      callback: this.onClickSensorCollide,
      context: this,
    });
    scene.matterCollision.addOnCollideActive({
      objectA: [this.rectangle],
      callback: this.onClickSensorCollide,
      context: this,
    });
    scene.matter.world.on("beforeupdate", this.cancelgravity, this);
    scene.events.on("update", this.debugUpdate, this);
    scene.matter.world.on("beforeupdate", this.resetSensor, this);
  }
  cancelgravity() {
    var gravity = this.scene.matter.world.localWorld.gravity;
    Body.applyForce(this.rectangle, this.rectangle.position, {
      x: -gravity.x * gravity.scale * this.rectangle.mass,
      y: -gravity.y * gravity.scale * this.rectangle.mass,
    });
  }

  resetSensor() {
    this.sensor = false;
  }

  onClickSensorCollide() {
    this.sensor = true;
    console.log("click sensor collided");
  }

  debugUpdate() {
    this.debugtext.setText(`sensor: ${this.sensor}`);
  }
}
