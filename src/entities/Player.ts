import Phaser from "phaser";

/**
 * トップダウンシーン用のプレイヤーキャラクター。
 * ドット絵アセットが揃うまでは、方向ごとに色分けした矩形のプレースホルダーで表現する。
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private speed = 160;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: { [key: string]: Phaser.Input.Keyboard.Key };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player-placeholder");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(20, 24);
    this.setOffset(6, 8);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = scene.input.keyboard!.addKeys("W,A,S,D") as {
      [key: string]: Phaser.Input.Keyboard.Key;
    };
  }

  update() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    const len = Math.hypot(vx, vy) || 1;
    body.setVelocity((vx / len) * this.speed, (vy / len) * this.speed);
  }
}
