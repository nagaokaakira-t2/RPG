import Phaser from "phaser";

/**
 * ドット絵アセットが揃うまでの間、簡易的な人型シルエットのプレースホルダーを
 * コード上で生成しておく起動シーン。本物のドット絵に差し替える際は、
 * このシーンのテクスチャ生成部分をスプライトシートのpreloadに置き換えるだけでよい。
 *
 * 注意: ここで作っているのはあくまで「シルエットの近似」であり、
 * 実際のドット絵(12章のアートスタイル)はアーティストによる描き起こしが必要。
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.makeHumanoidTexture("player-placeholder", 32, 32, 0x4ea3ff, 0xdcefff);
    this.makeHumanoidTexture("npc-placeholder", 32, 32, 0x8bd450, 0xe8ffd8);
    this.makeRectTexture("enemy-symbol", 24, 24, 0xff5a5a);
    this.makeRectTexture("floor-tile", 32, 32, 0x2b2b3a);
    this.makeRectTexture("wall-tile", 32, 32, 0x14141c);
    this.makeHumanoidTexture("battle-player", 48, 64, 0x4ea3ff, 0xdcefff);
    this.makeMonsterTexture("battle-enemy", 48, 48, 0xff5a5a);
    this.makeRectTexture("battle-bg", 800, 600, 0x1b1f2e);

    this.scene.start("TitleScene");
  }

  private makeRectTexture(key: string, w: number, h: number, color: number) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    g.lineStyle(2, 0x000000, 0.35);
    g.strokeRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /** 頭・胴・脚の3ブロックで構成する簡易人型シルエット */
  private makeHumanoidTexture(key: string, w: number, h: number, bodyColor: number, headColor: number) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const headSize = w * 0.4;
    const bodyW = w * 0.55;
    const bodyH = h * 0.45;
    const legW = w * 0.22;
    const legH = h * 0.3;

    // 頭
    g.fillStyle(headColor, 1);
    g.fillRect((w - headSize) / 2, 0, headSize, headSize);

    // 胴
    g.fillStyle(bodyColor, 1);
    g.fillRect((w - bodyW) / 2, headSize, bodyW, bodyH);

    // 脚(2本)
    g.fillStyle(bodyColor, 1);
    g.fillRect(w / 2 - legW - 2, headSize + bodyH, legW, legH);
    g.fillRect(w / 2 + 2, headSize + bodyH, legW, legH);

    g.lineStyle(1, 0x000000, 0.4);
    g.strokeRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /** 丸みのある簡易モンスターシルエット */
  private makeMonsterTexture(key: string, w: number, h: number, color: number) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillEllipse(w / 2, h / 2, w * 0.9, h * 0.75);
    // 目
    g.fillStyle(0x000000, 1);
    g.fillCircle(w * 0.38, h * 0.42, 3);
    g.fillCircle(w * 0.62, h * 0.42, 3);
    g.lineStyle(1, 0x000000, 0.4);
    g.strokeRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
