import jobsData from "../data/jobs.json";
import tier1Data from "../data/tier1Jobs.json";
import type { Element } from "./Elements";

export interface JobDef {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  weaponType: string;
  baseStats: { hp: number; mp: number; str: number; int: number; vit: number; agi: number; luk: number };
  growth: { hp: number; mp: number; str: number; int: number; vit: number; agi: number; luk: number };
  canGuard: boolean;
}

export interface Tier1JobDef {
  id: string;
  parentId: string;
  name: string;
  nameEn: string;
  hidden: boolean;
  element: Element;
  description: string;
  statBonus: { str: number; int: number; vit: number; agi: number; luk: number };
}

const JOBS: Record<string, JobDef> = jobsData as Record<string, JobDef>;
const TIER1: Tier1JobDef[] = tier1Data as Tier1JobDef[];

export const JobSystem = {
  all(): JobDef[] {
    return Object.values(JOBS);
  },

  get(id: string): JobDef {
    const job = JOBS[id];
    if (!job) throw new Error(`Unknown job id: ${id}`);
    return job;
  },

  /** 指定した基本ジョブの1段階目派生一覧(隠しも含む)を返す */
  tier1For(baseJobId: string): Tier1JobDef[] {
    return TIER1.filter((t) => t.parentId === baseJobId);
  },

  getTier1(id: string): Tier1JobDef {
    const t = TIER1.find((t1) => t1.id === id);
    if (!t) throw new Error(`Unknown tier1 job id: ${id}`);
    return t;
  },

  /**
   * ジョブと現在レベルから実ステータスを計算する。
   * 5章の方針(自動成長+自由ボーナスポイント)のうち、自動成長分のみ。
   */
  computeStats(jobId: string, level: number) {
    const job = this.get(jobId);
    const lv = Math.max(1, level) - 1;
    return {
      maxHp: Math.round(job.baseStats.hp + job.growth.hp * lv),
      maxMp: Math.round(job.baseStats.mp + job.growth.mp * lv),
      str: Math.round(job.baseStats.str + job.growth.str * lv),
      int: Math.round(job.baseStats.int + job.growth.int * lv),
      vit: Math.round(job.baseStats.vit + job.growth.vit * lv),
      agi: Math.round(job.baseStats.agi + job.growth.agi * lv),
      luk: Math.round(job.baseStats.luk + job.growth.luk * lv),
    };
  },
};
