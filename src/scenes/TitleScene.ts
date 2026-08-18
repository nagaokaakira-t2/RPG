import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 60, "[仮題] ドット絵アクションRPG", {
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height / 2 + 20, "press Z / SPACE to start", {
        fontSize: "18px",
        color: "#8bd450",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const start = () => this.scene.start("TownScene");
    this.input.keyboard!.once("keydown-Z", start);
    this.input.keyboard!.once("keydown-SPACE", start);
    this.input.once("pointerdown", start);
  }
}
