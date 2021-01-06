import Phaser from "phaser";

class Bar {
  constructor(scene, x, y, width, scaleY, fade) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.percent = 1;
    this.scaleY = scaleY;
    this.fade = fade;
    this.alpha = this.fade ? 0 : 1;
  }

  getPercent() {
    return this.percent;
  }

  withLeftCap(cap) {
    this.leftCap = cap;
    this.leftCap
      .setOrigin(0, 0.5)
      .setScale(1, this.scaleY)
      .setDepth(1)
      .setAlpha(this.alpha);
    return this;
  }

  withMiddle(middle) {
    this.middle = middle;
    this.middle
      .setOrigin(0, 0.5)
      .setScale(1, this.scaleY)
      .setDepth(1)
      .setAlpha(this.alpha);
    return this;
  }

  withRightCap(cap) {
    this.rightCap = cap;
    this.rightCap
      .setOrigin(0, 0.5)
      .setScale(1, this.scaleY)
      .setDepth(1)
      .setAlpha(this.alpha);
    return this;
  }

  withLeftBg(cap) {
    this.leftBg = cap;
    this.leftBg.setOrigin(0, 0.5).setScale(1, this.scaleY).setAlpha(this.alpha);
    return this;
  }

  withMidBg(middle) {
    this.midBg = middle;
    this.midBg.setOrigin(0, 0.5).setScale(1, this.scaleY).setAlpha(this.alpha);
    return this;
  }

  withRightBg(cap) {
    this.rightBg = cap;
    this.rightBg
      .setOrigin(0, 0.5)
      .setScale(1, this.scaleY)
      .setAlpha(this.alpha);
    return this;
  }

  layout() {
    if (this.middle) {
      this.middle.displayWidth = this.width * this.percent;
    }
    if (this.midBg) {
      this.midBg.displayWidth = this.width;
    }
    this.layoutSegments(this.leftBg, this.midBg, this.rightBg);
    this.layoutSegments(this.leftCap, this.middle, this.rightCap);
    return this;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.layout();
  }

  layoutSegments(leftCap, middle, rightCap) {
    if (!leftCap || !middle || !rightCap) {
      return this;
    }
    leftCap.x = this.x;
    leftCap.y = this.y;

    middle.x = leftCap.x + leftCap.width;
    middle.y = leftCap.y;

    rightCap.x = middle.x + middle.displayWidth;
    rightCap.y = middle.y;

    return this;
  }

  setHidden() {
    const images = [
      this.middle,
      this.rightCap,
      this.leftCap,
      this.midBg,
      this.rightBg,
      this.leftBg,
    ];
    images.forEach((cap) => cap.setActive(false).setVisible(false));
  }

  setVisible() {
    const images = [
      this.middle,
      this.rightCap,
      this.leftCap,
      this.midBg,
      this.rightBg,
      this.leftBg,
    ];
    images.forEach((cap) => cap.setActive(true).setVisible(true));
  }

  animateToFill(fill, duration = 100) {
    const newpercent = Math.max(0, Math.min(1, fill));
    if (!this.middle || this.percent === newpercent) {
      return this;
    }
    //clamp percent between 0 and 1
    this.percent = newpercent;
    if (this.fade) {
      const images = [
        this.middle,
        this.rightCap,
        this.leftCap,
        this.midBg,
        this.rightBg,
        this.leftBg,
      ];
      images.forEach((cap) => cap.setAlpha(1));
      clearTimeout(this.clearId);
      this.clearId = setTimeout(() => {
        images.forEach((cap) => cap.setAlpha(0));
      }, 1000);
      this.middle.displayWidth = this.width * this.percent;
      if (this.percent === 0) {
        this.rightCap.displayWidth = 0;
        this.leftCap.displayWidth = 0;
      }
    } else {
      this.scene.tweens.add({
        targets: this.middle,
        displayWidth: this.width * this.percent,
        duration,
        ease: Phaser.Math.Easing.Sine.Out,
        onUpdate: () => {
          this.layoutSegments(this.leftCap, this.middle, this.rightCap);
        },
      });
    }

    return this;
  }

  destroy() {
    const images = [
      this.middle,
      this.rightCap,
      this.leftCap,
      this.midBg,
      this.rightBg,
      this.leftBg,
    ];
    images.forEach((img) => img.destroy());
  }
}
export class HealthBar extends Bar {
  constructor(scene, x, y, width, scaleY = 1, fade = false) {
    super(scene, x, y, width, scaleY, fade);
    // default caps
    this.withLeftBg(this.scene.add.image(0, 0, "left-cap-shadow"))
      .withMidBg(this.scene.add.image(0, 0, "middle-shadow"))
      .withRightBg(this.scene.add.image(0, 0, "right-cap-shadow"))
      .withLeftCap(this.scene.add.image(0, 0, "left-cap-red"))
      .withMiddle(this.scene.add.image(0, 0, "middle-red"))
      .withRightCap(this.scene.add.image(0, 0, "right-cap-red"))
      .layout();
  }
}

export class StaminaBar extends Bar {
  constructor(scene, x, y, width, scaleY = 1, fade = false) {
    super(scene, x, y, width, scaleY, fade);
    // default caps
    this.withLeftBg(this.scene.add.image(0, 0, "left-cap-shadow"))
      .withMidBg(this.scene.add.image(0, 0, "middle-shadow"))
      .withRightBg(this.scene.add.image(0, 0, "right-cap-shadow"))
      .withLeftCap(this.scene.add.image(0, 0, "left-cap-green"))
      .withMiddle(this.scene.add.image(0, 0, "middle-green"))
      .withRightCap(this.scene.add.image(0, 0, "right-cap-green"))
      .layout();
  }
}
