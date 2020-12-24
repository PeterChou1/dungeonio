import { StartMenu } from "../components/startMenu.components";
import * as React from "jsx-dom";

export class mainMenu extends Phaser.Scene {
  constructor() {
    super({
      key: "mainMenu",
    });
  }

  init() {}

  preload() {
    this.load.image("logo", "public/imgs/logo.png");
  }

  create() {
    this.add.image(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 100,
      "logo"
    );
    this.add.dom(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      <StartMenu scene={this.scene} />
    );
  }
}
