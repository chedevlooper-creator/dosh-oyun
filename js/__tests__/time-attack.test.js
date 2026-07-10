// @ts-check
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ==================== Mock all external dependencies ====================
vi.mock("../engine/audio.js", () => ({ SFX: { coin: vi.fn(), win: vi.fn(), pick: vi.fn() } }));
vi.mock("../data/config.js", () => ({ CFG: { targetHintCost: 25 } }));
vi.mock("../utils/i18n.js", () => ({ t: vi.fn((k, ...args) => args.length ? `${k} ${args.join(", ")}` : k) }));

const mockToast = vi.fn();
const mockUpdateCoins = vi.fn();
const mockShow = vi.fn();
const mockFlyCoins = vi.fn();

vi.mock("../utils/helpers.js", () => ({
  toast: mockToast,
  updateCoins: mockUpdateCoins,
  show: mockShow,
  flyCoins: mockFlyCoins,
}));

const mockInitState = vi.fn();
const mockGetState = vi.fn();

// Default: 2 words, NOT all solved
function defaultGetState() {
  return {
    cells: new Map(),
    words: [
      { word: "аб", row: 0, col: 0, dir: "across", g: ["а", "б"], norm: "аб", solved: false, cells: [] },
      { word: "вг", row: 1, col: 0, dir: "across", g: ["в", "г"], norm: "вг", solved: false, cells: [] },
    ],
    foundBonus: new Set(),
    targeting: false,
  };
}
mockGetState.mockImplementation(defaultGetState);

vi.mock("../game/state.js", () => ({
  initState: mockInitState,
  getState: mockGetState,
}));

vi.mock("../game/render.js", () => ({ buildWheel: vi.fn(), buildGrid: vi.fn(), fillCell: vi.fn() }));
vi.mock("../game/input.js", () => ({ attachCellHandlers: vi.fn(), onBubbleKey: vi.fn() }));
vi.mock("../game/solve.js", () => ({ submitSel: vi.fn(), selAdd: vi.fn() }));
vi.mock("../game/reward.js", () => ({ showWordInfo: vi.fn() }));
vi.mock("../screens/panel.js", () => ({ openPanel: vi.fn(), closePanel: vi.fn() }));

const mockGetLevel = vi.fn();
const mockLoadAllLevels = vi.fn();

mockGetLevel.mockResolvedValue({
  id: 1, pack: 1, letters: ["а", "б"],
  words: [{ word: "аб", row: 0, col: 0, dir: "across" }],
  bonus: [],
});

mockLoadAllLevels.mockResolvedValue([
  { id: 1, pack: 1, letters: ["а", "б"], words: [{ word: "аб", row: 0, col: 0, dir: "across" }], bonus: [] },
  { id: 2, pack: 2, letters: ["в", "г"], words: [{ word: "вг", row: 0, col: 0, dir: "across" }], bonus: [] },
]);

vi.mock("../data/level-loader.js", () => ({
  getLevel: mockGetLevel,
  loadAllLevels: mockLoadAllLevels,
}));

vi.mock("../engine/store.js", () => ({
  S: {
    stats: { taGames: 0, taBest: 0, taWords: 0 },
    settings: { lang: "ce" },
    coins: 100,
  },
  setG: vi.fn(),
}));

const MOCK_LEVELS = [
  { id: 1, pack: 1, letters: ["а", "б"], words: [{ word: "аб", row: 0, col: 0, dir: "across" }], bonus: [] },
  { id: 2, pack: 2, letters: ["в", "г"], words: [{ word: "вг", row: 0, col: 0, dir: "across" }], bonus: [] },
];

// ==================== Tests ====================
describe("time-attack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.innerHTML = `
      <div id="scr-game">
        <div class="gtop"></div>
      </div>
      <div id="grid"></div>
      <div id="lvl-num"></div>
      <div id="bonus-count">0</div>
      <div id="veil"><div id="panel"></div></div>
    `;
    mockGetState.mockImplementation(defaultGetState);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  // ==================== getLeaderboard ====================
  describe("getLeaderboard", () => {
    it("returns empty array when nothing is stored", async () => {
      const { getLeaderboard } = await import("../game/time-attack.js");
      expect(getLeaderboard()).toEqual([]);
    });

    it("returns parsed array when valid data exists", async () => {
      const { getLeaderboard } = await import("../game/time-attack.js");
      const data = [
        { score: 100, words: 5, date: "2026-07-04" },
        { score: 50, words: 3, date: "2026-07-03" },
      ];
      localStorage.setItem("dosh-ta-best", JSON.stringify(data));
      expect(getLeaderboard()).toEqual(data);
    });

    it("returns empty array when stored data is malformed", async () => {
      const { getLeaderboard } = await import("../game/time-attack.js");
      localStorage.setItem("dosh-ta-best", "not json");
      expect(getLeaderboard()).toEqual([]);
    });

    it("returns empty array when stored data is not an array", async () => {
      const { getLeaderboard } = await import("../game/time-attack.js");
      localStorage.setItem("dosh-ta-best", JSON.stringify({ score: 100 }));
      expect(getLeaderboard()).toEqual([]);
    });

    it("returns empty array when localStorage throws", async () => {
      const { getLeaderboard } = await import("../game/time-attack.js");
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => { throw new Error("quota"); });
      expect(getLeaderboard()).toEqual([]);
      Storage.prototype.getItem = original;
    });
  });

  // ==================== startTimeAttack ====================
  describe("startTimeAttack", () => {
    afterEach(async () => {
      // Clean up internal ta state after each test
      const mod = await import("../game/time-attack.js");
      mod.resetTimeAttack();
    });

    it("toasts error when no levels provided", async () => {
      const { startTimeAttack } = await import("../game/time-attack.js");
      await startTimeAttack([]);
      expect(mockToast).toHaveBeenCalled();
    });

    it("toasts error when levels is null", async () => {
      const { startTimeAttack } = await import("../game/time-attack.js");
      await startTimeAttack(null);
      expect(mockToast).toHaveBeenCalled();
    });

    it("initializes ta state and shows timer bar on success", async () => {
      const { startTimeAttack, isTimeAttack } = await import("../game/time-attack.js");
      await startTimeAttack(MOCK_LEVELS);

      expect(isTimeAttack()).toBe(true);
      const bar = document.getElementById("ta-bar");
      expect(bar).not.toBeNull();
      expect(bar.innerHTML).toContain("⏱");
      expect(bar.innerHTML).toContain("Skor: <b>0</b>");
      expect(bar.innerHTML).toContain("Streak: <b>0</b>");
    });
  });

  // ==================== isTimeAttack ====================
  describe("isTimeAttack", () => {
    it("returns false when no game active", async () => {
      const { isTimeAttack } = await import("../game/time-attack.js");
      expect(isTimeAttack()).toBe(false);
    });

    it("returns true after starting", async () => {
      const { startTimeAttack, isTimeAttack, resetTimeAttack } = await import("../game/time-attack.js");
      await startTimeAttack(MOCK_LEVELS);
      expect(isTimeAttack()).toBe(true);
      resetTimeAttack();
    });

    it("returns false after reset", async () => {
      const { startTimeAttack, isTimeAttack, resetTimeAttack } = await import("../game/time-attack.js");
      await startTimeAttack(MOCK_LEVELS);
      expect(isTimeAttack()).toBe(true);
      resetTimeAttack();
      expect(isTimeAttack()).toBe(false);
    });
  });

  // ==================== resetTimeAttack ====================
  describe("resetTimeAttack", () => {
    it("removes ta-bar from DOM", async () => {
      const { startTimeAttack, resetTimeAttack } = await import("../game/time-attack.js");
      await startTimeAttack(MOCK_LEVELS);
      expect(document.getElementById("ta-bar")).not.toBeNull();
      resetTimeAttack();
      expect(document.getElementById("ta-bar")).toBeNull();
    });

    it("is safe to call when no game active", async () => {
      const { resetTimeAttack } = await import("../game/time-attack.js");
      expect(() => resetTimeAttack()).not.toThrow();
    });
  });

  // ==================== recordTAScore ====================
  describe("recordTAScore", () => {
    afterEach(async () => {
      const mod = await import("../game/time-attack.js");
      mod.resetTimeAttack();
    });

    it("does nothing when ta is not active", async () => {
      const { recordTAScore } = await import("../game/time-attack.js");
      const { SFX } = await import("../engine/audio.js");
      recordTAScore("аб");
      expect(SFX.coin).not.toHaveBeenCalled();
      expect(mockFlyCoins).not.toHaveBeenCalled();
    });

    it("increments totalWords, streak, and updates score bar", async () => {
      const { startTimeAttack, recordTAScore } = await import("../game/time-attack.js");
      const { SFX } = await import("../engine/audio.js");

      await startTimeAttack(MOCK_LEVELS);

      // First word: 10 * 2 = 20 points
      recordTAScore("аб");
      expect(SFX.coin).toHaveBeenCalledTimes(1);
      expect(mockFlyCoins).toHaveBeenCalledWith(document.getElementById("grid"), 2);

      const bar = document.getElementById("ta-bar");
      expect(bar.textContent).toContain("Skor: 20");
      expect(bar.textContent).toContain("Streak: 1");

      // Second word: another 20 points
      recordTAScore("вг");
      expect(SFX.coin).toHaveBeenCalledTimes(2);
      expect(bar.textContent).toContain("Skor: 40");
      expect(bar.textContent).toContain("Streak: 2");
    });

    it("applies 1.5x combo multiplier at 5th consecutive word", async () => {
      const { startTimeAttack, recordTAScore } = await import("../game/time-attack.js");
      await startTimeAttack(MOCK_LEVELS);

      const bar = document.getElementById("ta-bar");
      // Each base word scores 10*2 = 20 points
      recordTAScore("аб"); // streak 1 → +20 (total: 20)
      recordTAScore("вг"); // streak 2 → +20 (total: 40)
      recordTAScore("аб"); // streak 3 → +20 (total: 60)
      recordTAScore("вг"); // streak 4 → +20 (total: 80)
      recordTAScore("аб"); // streak 5 → +Math.floor(20*1.5)=30 (total: 110)

      expect(bar.textContent).toContain("Skor: 110");
      expect(bar.textContent).toContain("Streak: 5");
    });

    it("respects word length in point calculation", async () => {
      const { startTimeAttack, recordTAScore } = await import("../game/time-attack.js");
      await startTimeAttack(MOCK_LEVELS);

      const bar = document.getElementById("ta-bar");
      // 3-letter word: 10 * 3 = 30 points
      recordTAScore("abc");
      expect(bar.textContent).toContain("Skor: 30");

      // 1-letter word: 10 * 1 = 10 points
      recordTAScore("x");
      expect(bar.textContent).toContain("Skor: 40");
    });
  });

  // ==================== advanceTALevel ====================
  describe("advanceTALevel", () => {
    afterEach(async () => {
      const mod = await import("../game/time-attack.js");
      mod.resetTimeAttack();
    });

    it("does nothing when ta is not active", async () => {
      const { advanceTALevel } = await import("../game/time-attack.js");
      await expect(advanceTALevel()).resolves.toBeUndefined();
    });

    it("does not advance when not all words solved", async () => {
      const { startTimeAttack, advanceTALevel } = await import("../game/time-attack.js");
      await startTimeAttack(MOCK_LEVELS);

      // getState returns default: not all solved (solved: false)
      await advanceTALevel();

      // Should NOT have shown level-advance toast
      const seviyeCalls = mockToast.mock.calls.filter(
        ([msg]) => typeof msg === "string" && msg.includes("Seviye")
      );
      expect(seviyeCalls).toHaveLength(0);
    });

    it("advances to next level when all words solved", async () => {
      const { startTimeAttack, advanceTALevel } = await import("../game/time-attack.js");
      await startTimeAttack(MOCK_LEVELS);

      // Override getState to return all solved
      mockGetState.mockReturnValue({
        cells: new Map(),
        words: [
          { word: "аб", row: 0, col: 0, dir: "across", g: ["а", "б"], norm: "аб", solved: true, cells: [] },
          { word: "вг", row: 1, col: 0, dir: "across", g: ["в", "г"], norm: "вг", solved: true, cells: [] },
        ],
        foundBonus: new Set(),
        targeting: false,
      });

      await advanceTALevel();

      // Should have shown "⏱ Seviye X" toast
      expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("Seviye"), "gold");
    });
  });

  // ==================== updateTABar ====================
  describe("updateTABar", () => {
    afterEach(async () => {
      const mod = await import("../game/time-attack.js");
      mod.resetTimeAttack();
    });

    it("updates DOM with remaining time, score and streak", async () => {
      const { startTimeAttack, recordTAScore } = await import("../game/time-attack.js");
      await startTimeAttack(MOCK_LEVELS);

      const bar = document.getElementById("ta-bar");
      expect(bar).not.toBeNull();
      expect(bar.textContent).toContain("⏱");
      expect(bar.textContent).toContain("Skor: 0");
      expect(bar.textContent).toContain("Streak: 0");

      recordTAScore("аб");
      expect(bar.textContent).toContain("Skor: 20");
      expect(bar.textContent).toContain("Streak: 1");
    });

    it("does nothing when ta is null", async () => {
      const { updateTABar } = await import("../game/time-attack.js");
      expect(() => updateTABar()).not.toThrow();
    });
  });
});
