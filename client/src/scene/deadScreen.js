import { DeadScreen } from "../components/deadScreen.component";
import * as React from "jsx-dom";

export class deadScreen extends Phaser.Scene {
  constructor() {
    super({
      key: "deadScreen",
    });
  }

  init(data) {
    this.client = data.client;
  }

  preload() {}

  create() {
    this.add.dom(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      <DeadScreen
        restart={{
          scene: this.scene,
          client: this.client,
        }}
      />
    );
  }
}
