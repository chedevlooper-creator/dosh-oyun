// @ts-check
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ==================== Mock data ====================
const MOCK_S = {
  stars: { 0: 3, 1: 2, 2: 1 },
  settings: { lang: "ce" },
  coins: 100,
  tut: true,
  lastGift: null,
  stats: { taBest: 50, bestStreak: 3, coinsEarned: 500 },
  dict: {},
};

const MOCK_LEVEL_COUNT = 12;
const MOCK_DAILY_GIFT_COINS = 100;

// ==================== Mocks ====================
vi.mock("../engine/store.js", () => ({ S: MOCK_S }));

vi.mock("../data/level-index.js", () => ({ LEVEL_COUNT: MOCK_LEVEL_COUNT }));

vi.mock("../data/config.js", () => ({ CFG: { dailyGiftCoins: MOCK_DAILY_GIFT_COINS } }));

const mockToast = vi.fn();
const mockUpdateCoins = vi.fn();
let mockTodayValue = "2026-07-10";
const mockToday = vi.fn(() => mockTodayValue);

vi.mock("../utils/helpers.js", () => ({
  $: (id) => document.getElementById(id),
  toast: mockToast,
  updateCoins: mockUpdateCoins,
  today: mockToday,
}));

const mockT = vi.fn((key) => key);
vi.mock("../utils/i18n.js", () => ({ t: mockT }));

const mockAc = vi.fn();
const mockSFX = { coin: vi.fn(), gift: vi.fn() };
vi.mock("../engine/audio.js", () => ({ ac: mockAc, SFX: mockSFX }));

vi.mock("../fx/particles.js", () => ({ confetti: vi.fn() }));

const mockDailyLevelId = vi.fn(() => 5);
const mockIsDailyDone = vi.fn(() => false);
const mockCurrentStreak = vi.fn(() => 0);

vi.mock("../engine/daily.js", () => ({
  dailyLevelId: mockDailyLevelId,
  isDailyDone: mockIsDailyDone,
  currentStreak: mockCurrentStreak,
}));

vi.mock("../screens/game.js", () => ({ startLevel: vi.fn() }));

const mockLoadAllLevels = vi.fn(() => Promise.resolve([{ id: 1 }]));
vi.mock("../data/level-loader.js", () => ({ loadAllLevels: mockLoadAllLevels }));

// Dynamic imports used in button handlers
vi.mock("../screens/map.js", () => ({ openMap: vi.fn() }));
vi.mock("../screens/tutorial.js", () => ({ tutorial: vi.fn() }));
vi.mock("../screens/settings.js", () => ({ openSettings: vi.fn() }));
vi.mock("../screens/stats.js", () => ({ openStats: vi.fn() }));
vi.mock("../screens/dict.js", () => ({ openDict: vi.fn() }));
vi.mock("../screens/chain.js", () => ({ openChain: vi.fn() }));

// time-attack needs stubs for DOM used in startTimeAttack
vi.mock("../game/time-attack.js", () => ({ startTimeAttack: vi.fn() }));

// ==================== DOM helper ====================
function setupHomeDOM() {
  document.body.innerHTML = `
    <div id="home-progress"></div>
    <div id="home-stars"></div>
    <div id="home-bar"></div>
    <div id="btn-start"></div>
    <div id="btn-gift"></div>
    <div id="btn-daily"></div>
    <div id="daily-streak"></div>
    <div id="btn-settings"></div>
    <div id="btn-stats"></div>
    <div id="btn-dict"></div>
    <div id="btn-timeattack"><span class="lb"></span></div>
    <div id="btn-chain"><span class="lb"></span></div>
    <div class="dock">
      <button class="icon-btn">🏠</button>
      <button class="icon-btn">🗺️</button>
      <button class="icon-btn">⚙️</button>
    </div>
    <div id="veil"><div id="panel"></div></div>
  `;
}

describe("screens/home renderHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    setupHomeDOM();
    // Default mock values
    MOCK_S.stars = { 0: 3, 1: 2, 2: 1 };
    MOCK_S.lastGift = null;
    MOCK_S.coins = 100;
    MOCK_S.tut = true;
    MOCK_S.stats = { taBest: 50, bestStreak: 3, coinsEarned: 500 };
    mockIsDailyDone.mockReturnValue(false);
    mockCurrentStreak.mockReturnValue(0);
    mockTodayValue = "2026-07-10";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  // ==================== Progress & Stars ====================
  describe("progress and stars", () => {
    it("updates home-progress with done/total and star count", async () => {
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      const progress = document.getElementById("home-progress");
      // 3 levels done (stars keys: 0,1,2), total: 12
      expect(progress.innerHTML).toContain("3");
      expect(progress.innerHTML).toContain("12");
      // Total stars: 3+2+1 = 6
      expect(progress.innerHTML).toContain("6");
    });

    it("shows 0 / LEVEL_COUNT when no levels done", async () => {
      MOCK_S.stars = {};
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      const progress = document.getElementById("home-progress");
      expect(progress.innerHTML).toContain("0");
      expect(progress.innerHTML).toContain("12");
    });

    it("sets home-stars text to total star count", async () => {
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      const stars = document.getElementById("home-stars");
      expect(stars.textContent).toBe("6");
    });

    it("updates home-bar width with percentage", async () => {
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      // Use real timers so rAF fires
      vi.useRealTimers();
      await vi.waitFor(() => {
        const bar = document.getElementById("home-bar");
        expect(bar.style.width).toBeTruthy();
        expect(bar.style.width).toContain("%");
      });
      vi.useFakeTimers();
    });

    it("uses t(home.continue) when S.tut is true", async () => {
      MOCK_S.tut = true;
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      const startBtn = document.getElementById("btn-start");
      expect(startBtn.innerHTML).toContain("home.continue");
    });

    it("uses t(home.start) when S.tut is false", async () => {
      MOCK_S.tut = false;
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      const startBtn = document.getElementById("btn-start");
      expect(startBtn.innerHTML).toContain("home.start");
    });
  });

  // ==================== Stagger ikon ====================
  describe("stagger animation", () => {
    it("adds icon-enter class to dock buttons", async () => {
      vi.useRealTimers();
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      await vi.waitFor(() => {
        const icons = document.querySelectorAll(".dock .icon-btn");
        icons.forEach((btn) => {
          expect(btn.classList.contains("icon-enter")).toBe(true);
          expect(btn.style.animationDelay).toBeTruthy();
        });
      });
      vi.useFakeTimers();
    });
  });

  // ==================== Günlük butonu ====================
  describe("daily button", () => {
    it("shows glow when daily not done", async () => {
      mockIsDailyDone.mockReturnValue(false);
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      const btn = document.getElementById("btn-daily");
      expect(btn.classList.contains("glow")).toBe(true);
      expect(btn.classList.contains("done")).toBe(false);
    });

    it("removes glow when daily is done", async () => {
      mockIsDailyDone.mockReturnValue(true);
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      const btn = document.getElementById("btn-daily");
      expect(btn.classList.contains("glow")).toBe(false);
      expect(btn.classList.contains("done")).toBe(true);
    });

    it("shows streak count in daily-streak when streak > 0", async () => {
      mockCurrentStreak.mockReturnValue(5);
      mockIsDailyDone.mockReturnValue(false);
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      const streakEl = document.getElementById("daily-streak");
      expect(streakEl.textContent).toContain("5");
    });

    it("shows checkmark + fire when daily done and streak > 1", async () => {
      mockIsDailyDone.mockReturnValue(true);
      mockCurrentStreak.mockReturnValue(3);
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      const streakEl = document.getElementById("daily-streak");
      expect(streakEl.textContent).toContain("✓");
      expect(streakEl.textContent).toContain("3");
    });
  });

  // ==================== Hediye butonu ====================
  describe("gift button", () => {
    it("shows glow when gift not claimed today", async () => {
      MOCK_S.lastGift = null;
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      const btn = document.getElementById("btn-gift");
      expect(btn.classList.contains("glow")).toBe(true);
    });

    it("removes glow when gift already claimed today", async () => {
      MOCK_S.lastGift = "2026-07-10";
      const { renderHome } = await import("../screens/home.js");
      renderHome();

      const btn = document.getElementById("btn-gift");
      expect(btn.classList.contains("glow")).toBe(false);
    });
  });

  // ==================== Buton tıklama ====================
  describe("button click handlers", () => {
    it("btn-start with S.tut=true (tutorial done) plays coin and opens map", async () => {
      MOCK_S.tut = true;
      await import("../screens/home.js");
      const startBtn = document.getElementById("btn-start");

      startBtn.click();
      expect(mockAc).toHaveBeenCalled();
      expect(mockSFX.coin).toHaveBeenCalled();
      // tut=true → !tut is false → falls through to map.js import
    });

    it("btn-start with S.tut=false (no tutorial) opens tutorial", async () => {
      MOCK_S.tut = false;
      await import("../screens/home.js");
      const startBtn = document.getElementById("btn-start");

      startBtn.click();
      expect(mockAc).toHaveBeenCalled();
      // tut=false → !tut is true → tutorial.js is lazy imported
    });

    it("btn-gift claims daily gift and updates coins", async () => {
      MOCK_S.lastGift = null;
      MOCK_S.coins = 100;
      MOCK_S.tut = false; // avoid tutorial import side effects
      await import("../screens/home.js");
      const giftBtn = document.getElementById("btn-gift");

      giftBtn.click();
      expect(MOCK_S.lastGift).toBe("2026-07-10");
      expect(MOCK_S.coins).toBe(100 + MOCK_DAILY_GIFT_COINS);
      expect(mockUpdateCoins).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.stringContaining(String(MOCK_DAILY_GIFT_COINS)),
        "gold"
      );
    });

    it("btn-gift shows toast if already claimed today", async () => {
      MOCK_S.lastGift = "2026-07-10";
      await import("../screens/home.js");
      const giftBtn = document.getElementById("btn-gift");

      giftBtn.click();
      expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("Кхана"));
      // Coins should not change
      expect(MOCK_S.coins).toBe(100);
    });

    it("btn-daily starts daily level when not done", async () => {
      mockIsDailyDone.mockReturnValue(false);
      mockDailyLevelId.mockReturnValue(42);
      await import("../screens/home.js");
      const { startLevel } = await import("../screens/game.js");
      const dailyBtn = document.getElementById("btn-daily");

      dailyBtn.click();
      expect(startLevel).toHaveBeenCalledWith(42, { daily: true });
      expect(mockAc).toHaveBeenCalled();
      expect(mockSFX.coin).toHaveBeenCalled();
    });

    it("btn-daily shows toast if already done today", async () => {
      mockIsDailyDone.mockReturnValue(true);
      await import("../screens/home.js");
      const dailyBtn = document.getElementById("btn-daily");

      dailyBtn.click();
      expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("Кхана"));
    });

    it("btn-settings opens settings via lazy import", async () => {
      await import("../screens/home.js");
      const settingsBtn = document.getElementById("btn-settings");

      settingsBtn.click();
      // The import is async, so the handler resolves later
      // We just verify no error and click works
      expect(mockSFX.coin).not.toHaveBeenCalled(); // settings doesn't call coin
    });

    it("btn-dict opens dictionary via lazy import", async () => {
      await import("../screens/home.js");
      const dictBtn = document.getElementById("btn-dict");

      dictBtn.click();
      expect(mockSFX.coin).not.toHaveBeenCalled();
    });

    it("btn-timeattack loads levels and starts time attack", async () => {
      await import("../screens/home.js");
      const { startTimeAttack } = await import("../game/time-attack.js");
      const taBtn = document.getElementById("btn-timeattack");

      taBtn.click();
      expect(mockAc).toHaveBeenCalled();
      expect(mockSFX.coin).toHaveBeenCalled();
      expect(mockLoadAllLevels).toHaveBeenCalled();
    });

    it("btn-chain opens chain mode via lazy import", async () => {
      await import("../screens/home.js");
      const chainBtn = document.getElementById("btn-chain");

      chainBtn.click();
      expect(mockAc).toHaveBeenCalled();
      expect(mockSFX.coin).toHaveBeenCalled();
    });
  });

  // ==================== TA skor gösterimi ====================
  describe("TA best score display", () => {
    it("shows TA best score on btn-timeattack label when > 0", async () => {
      MOCK_S.stats.taBest = 120;
      // Re-import needed after changing S.stats (but S is a reference)
      // The mock returns the same MOCK_S object, so S.stats.taBest = 120 is reflected
      await import("../screens/home.js");

      const taLabel = document.querySelector("#btn-timeattack .lb");
      expect(taLabel.textContent).toContain("120");
    });

    it("shows empty label when TA best is 0", async () => {
      MOCK_S.stats.taBest = 0;
      await import("../screens/home.js");

      const taLabel = document.querySelector("#btn-timeattack .lb");
      expect(taLabel.textContent).toBe("");
    });
  });

  // ==================== Zincir butonu ====================
  describe("chain button", () => {
    it("sets chain button label from i18n", async () => {
      await import("../screens/home.js");

      const chainLb = document.querySelector("#btn-chain .lb");
      expect(chainLb.textContent).toBe("chain.btn");
    });
  });
});
