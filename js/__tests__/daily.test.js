// @ts-check
import { describe, it, expect, beforeEach } from "vitest";
import { dailyLevelId, yesterdayKey, isDailyDone, recordDailyWin, currentStreak, dailyShareText } from "../engine/daily.js";
import { LEVEL_COUNT } from "../data/level-index.js";
import { CFG } from "../data/config.js";
import { S } from "../engine/store.js";

beforeEach(() => {
  S.daily.last = "";
  S.daily.streak = 0;
  S.daily.best = 0;
});

describe("dailyLevelId", () => {
  it("is deterministic for the same date", () => {
    expect(dailyLevelId("2026-7-4")).toBe(dailyLevelId("2026-7-4"));
  });

  it("always falls within the level range", () => {
    const d = new Date(2026, 0, 1);
    for (let i = 0; i < 400; i++) {
      const key = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
      const id = dailyLevelId(key);
      expect(id).toBeGreaterThanOrEqual(0);
      expect(id).toBeLessThan(LEVEL_COUNT);
      d.setDate(d.getDate() + 1);
    }
  });

  it("varies across days (not a constant)", () => {
    const ids = new Set();
    const d = new Date(2026, 0, 1);
    for (let i = 0; i < 30; i++) {
      const key = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
      ids.add(dailyLevelId(key));
      d.setDate(d.getDate() + 1);
    }
    expect(ids.size).toBeGreaterThan(10);
  });
});

describe("yesterdayKey", () => {
  it("matches the today() format (no zero padding)", () => {
    expect(yesterdayKey(new Date(2026, 6, 4))).toBe("2026-7-3");
  });

  it("crosses month and year boundaries", () => {
    expect(yesterdayKey(new Date(2026, 6, 1))).toBe("2026-6-30");
    expect(yesterdayKey(new Date(2026, 0, 1))).toBe("2025-12-31");
  });
});

describe("recordDailyWin", () => {
  it("first win starts the streak at 1 with base reward", () => {
    const res = recordDailyWin("2026-7-4", "2026-7-3");
    expect(res).toEqual({ streak: 1, reward: CFG.dailyRewardCoins, already: false });
    expect(S.daily.last).toBe("2026-7-4");
    expect(S.daily.best).toBe(1);
  });

  it("consecutive day increments the streak and adds streak bonus", () => {
    recordDailyWin("2026-7-3", "2026-7-2");
    const res = recordDailyWin("2026-7-4", "2026-7-3");
    expect(res.streak).toBe(2);
    expect(res.reward).toBe(CFG.dailyRewardCoins + CFG.dailyStreakBonus);
    expect(S.daily.best).toBe(2);
  });

  it("a gap resets the streak to 1 but keeps best", () => {
    S.daily.last = "2026-7-1";
    S.daily.streak = 5;
    S.daily.best = 5;
    const res = recordDailyWin("2026-7-4", "2026-7-3");
    expect(res.streak).toBe(1);
    expect(S.daily.best).toBe(5);
  });

  it("second call on the same day is a no-op", () => {
    recordDailyWin("2026-7-4", "2026-7-3");
    const res = recordDailyWin("2026-7-4", "2026-7-3");
    expect(res.already).toBe(true);
    expect(res.reward).toBe(0);
    expect(S.daily.streak).toBe(1);
  });

  it("streak bonus is capped", () => {
    S.daily.last = "2026-7-3";
    S.daily.streak = 30;
    const res = recordDailyWin("2026-7-4", "2026-7-3");
    expect(res.streak).toBe(31);
    expect(res.reward).toBe(CFG.dailyRewardCoins + CFG.dailyStreakBonusCap * CFG.dailyStreakBonus);
  });
});

describe("dailyShareText", () => {
  // L şekilli mini ızgara: (0,0) (1,0) (1,1)
  const cells = [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }];

  it("renders the grid silhouette without spoiling letters", () => {
    const text = dailyShareText({ cells, streak: 3, bonus: 2, mistakes: 0, dateStr: "2026-7-4", url: "https://dosh.example" });
    expect(text).toBe([
      "Дош 📅 2026-7-4 🔥3",
      "💎2 ✨",
      "🟩⬛",
      "🟩🟩",
      "https://dosh.example",
    ].join("\n"));
  });

  it("omits flame, badges and url when not earned", () => {
    const text = dailyShareText({ cells, streak: 1, bonus: 0, mistakes: 2, dateStr: "2026-7-4" });
    expect(text).toBe(["Дош 📅 2026-7-4", "🟩⬛", "🟩🟩"].join("\n"));
  });
});

describe("isDailyDone / currentStreak", () => {
  it("isDailyDone only for the recorded date", () => {
    expect(isDailyDone("2026-7-4")).toBe(false);
    recordDailyWin("2026-7-4", "2026-7-3");
    expect(isDailyDone("2026-7-4")).toBe(true);
    expect(isDailyDone("2026-7-5")).toBe(false);
  });

  it("currentStreak shows 0 when the chain is broken", () => {
    S.daily.last = "2026-7-1";
    S.daily.streak = 4;
    expect(currentStreak("2026-7-4", "2026-7-3")).toBe(0);
    expect(currentStreak("2026-7-2", "2026-7-1")).toBe(4);
    expect(currentStreak("2026-7-1", "2026-6-30")).toBe(4);
  });
});
