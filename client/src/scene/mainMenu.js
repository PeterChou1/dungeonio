import { StartMenu, Controls } from "../components/startMenu.components";
import * as React from "jsx-dom";

export class mainMenu extends Phaser.Scene {
  constructor() {
    super({
      key: "mainMenu",
    });
  }

  init(data) {
    // if player is restarting
    if (data) {
      this.client = data.client;
    }
  }

  preload() {
    this.load.image("logo", "public/imgs/logo.png");
  }

  create() {
    this.add.image(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 100,
      "logo"
    );
    console.log(Controls);
    this.add.dom(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 150,
      <Controls />
    );
    this.add.dom(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      <StartMenu
        start={{
          scene: this.scene,
          ...(this.sessionId && {
            client: this.client,
          }),
        }}
      />
    );
  }
}
