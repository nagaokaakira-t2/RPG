import Phaser from "phaser";
import { JobSystem } from "../systems/JobSystem";
import { GameState } from "../systems/GameState";

const DERIVE_JP_THRESHOLD = 30; // 4.3: 恒常派生・1段階目の熟練度条件

/**
 * 街のギルド受付NPCに話しかけると開くジョブ選択画面。
 * 未派生の間は基本5ジョブの切替、JP30以上になると1段階目派生(恒常のみ)を選べる。
 * 隠し派生は本来「発見型」で非表示だが、プロトタイプでは動作確認用に
 * ロック表示(選択不可)として一覧に出している。
 */
export class JobSelectScene extends Phaser.Scene {
  private mode: "base" | "derive" = "base";
  private cursorIndex = 0;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private optionLabels: string[] = [];
  private footerText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super("JobSelectScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, 620, 440, 0x0c0c14, 0.95).setStrokeStyle(2, 0x8bd450);
    this.titleText = this.add
      .text(width / 2, height / 2 - 190, "", { fontSize: "20px", color: "#8bd450" })
      .setOrigin(0.5);

    this.footerText = this.add
      .text(width / 2, height / 2 + 190, "", { fontSize: "13px", color: "#888888" })
      .setOrigin(0.5);

    this.mode = GameState.derivedJobId ? "derive" : "base";
    this.rebuildOptions();

    this.input.keyboard!.on("keydown-UP", () => {
      if (this.optionLabels.length === 0) return;
      this.cursorIndex = (this.cursorIndex - 1 + this.optionLabels.length) % this.optionLabels.length;
      this.refreshCursor();
    });
    this.input.keyboard!.on("keydown-DOWN", () => {
      if (this.optionLabels.length === 0) return;
      this.cursorIndex = (this.cursorIndex + 1) % this.optionLabels.length;
      this.refreshCursor();
    });
    this.input.keyboard!.on("keydown-Z", () => this.confirm());
    this.input.keyboard!.on("keydown-X", () => this.toggleMode());
    this.input.keyboard!.on("keydown-ESC", () => {
      this.scene.stop();
      this.scene.resume("TownScene");
    });
  }

  private toggleMode() {
    if (GameState.derivedJobId) return; // 派生済みなら基本ジョブ選択には戻れない
    if (GameState.jp < DERIVE_JP_THRESHOLD) return;
    this.mode = this.mode === "base" ? "derive" : "base";
    this.cursorIndex = 0;
    this.rebuildOptions();
  }

  private rebuildOptions() {
    this.optionTexts.forEach((t) => t.destroy());
    this.optionTexts = [];

    if (this.mode === "base") {
      this.titleText.setText(`ギルド - ジョブ変更  (JP: ${GameState.jp})`);
      const jobs = JobSystem.all();
      this.optionLabels = jobs.map((job) => {
        const isCurrent = job.id === GameState.currentJobId;
        return `${job.name}（${job.nameEn}） - ${job.description}${isCurrent ? "  [現在]" : ""}`;
      });
      this.cursorIndex = Math.max(0, jobs.findIndex((j) => j.id === GameState.currentJobId));

      const canDerive = GameState.jp >= DERIVE_JP_THRESHOLD;
      this.footerText.setText(
        canDerive
          ? "↑↓選択 / Z決定 / X:派生選択へ / ESC閉じる"
          : `↑↓選択 / Z決定 / ESC閉じる  (派生にはJP${DERIVE_JP_THRESHOLD}以上必要 / 現在JP${GameState.jp})`
      );
    } else {
      const baseJob = JobSystem.get(GameState.currentJobId);
      this.titleText.setText(`ギルド - ${baseJob.name}の派生選択  (JP: ${GameState.jp})`);
      const options = JobSystem.tier1For(GameState.currentJobId);
      this.optionLabels = options.map((t1) => {
        if (t1.hidden) {
          return `？？？（隠し・条件未達のためロック中）`;
        }
        const isCurrent = t1.id === GameState.derivedJobId;
        return `${t1.name}（${t1.nameEn}） - ${t1.description} [属性:${t1.element}]${isCurrent ? "  [選択済]" : ""}`;
      });

      this.footerText.setText(
        GameState.derivedJobId
          ? "派生済み: 一方通行のため変更できません / ESC閉じる"
          : "↑↓選択 / Z決定(一方通行・戻れません) / X:基本ジョブ選択へ / ESC閉じる"
      );
    }

    this.optionLabels.forEach((label, i) => {
      const y = this.scale.height / 2 - 120 + i * 46;
      const text = this.add.text(this.scale.width / 2 - 260, y, label, {
        fontSize: "14px",
        color: "#ffffff",
      });
      this.optionTexts.push(text);
    });

    this.refreshCursor();
  }

  private refreshCursor() {
    this.optionTexts.forEach((t, i) => {
      const prefix = i === this.cursorIndex ? "▶ " : "";
      t.setText(prefix + this.optionLabels[i]);
      t.setColor(i === this.cursorIndex ? "#8bd450" : "#ffffff");
    });
  }

  private confirm() {
    if (this.mode === "base") {
      const jobs = JobSystem.all();
      GameState.changeJob(jobs[this.cursorIndex].id);
      this.scene.stop();
      this.scene.resume("TownScene");
      return;
    }

    if (GameState.derivedJobId) return; // 既に派生済み

    const options = JobSystem.tier1For(GameState.currentJobId);
    const chosen = options[this.cursorIndex];
    if (!chosen || chosen.hidden) return; // 隠しはロック中で選択不可

    GameState.deriveJob(chosen.id);
    this.scene.stop();
    this.scene.resume("TownScene");
  }
}
