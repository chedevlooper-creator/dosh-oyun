// @ts-check
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ==================== Mock data ====================
const MOCK_ENTRIES = [
  {
    lemma: "борз",
    gloss: { ce: "борз", tr: "kurt" },
    ipa: "/borz/",
    examples: ["Борз хӀумма ю."],
    etymology: "Native Nakh — wolf",
    tags: ["animal"],
    found: true,
  },
  {
    lemma: "беркат",
    gloss: { ce: "машар", tr: "bereket" },
    ipa: "/berˈkat/",
    examples: [],
    etymology: "Arabic loan — baraka",
    tags: ["abstract"],
    found: false,
  },
  {
    lemma: "бепиг",
    gloss: { ce: "маца", tr: "ekmek" },
    ipa: "/beˈpig/",
    examples: ["Бепиг маца ю."],
    tags: ["food"],
    found: true,
  },
  {
    lemma: "нускал",
    gloss: { ce: "нускал", tr: "" },           // tr eksik ama ce var
    ipa: "/nusˈkal/",
    tags: ["family"],
    found: false,
  },
  {
    lemma: "атагӀи",
    gloss: {},                                    // hiç gloss yok
    ipa: "",
    tags: ["nature"],
    found: true,
  },
];

const MOCK_LEVEL_STATS = {
  total: 200,
  withGloss: 180,
  found: 72,
  missing: 20,
};

const MOCK_TAGS = ["abstract", "action", "animal", "body", "color", "family", "food", "home",
  "language", "nature", "number", "object", "time", "weather"];

// ==================== Mocks ====================
// grapheme: dispG uppercases (as real code does), norm lowercases
const mockDispG = vi.fn((s) => String(s).toUpperCase().replace(/[Ӏӏ]/g, "I"));
const mockNorm = vi.fn((s) => String(s).toLowerCase().replace(/[Ӏӏ]|[iI]/g, "Ӏ").trim());

vi.mock("../engine/grapheme.js", () => ({
  dispG: mockDispG,
  norm: mockNorm,
}));

vi.mock("../engine/store.js", () => ({
  S: {
    dict: { борз: 1700000000000, бепиг: 1700000000001 },
    settings: { lang: "ce" },
    coins: 100,
  },
  setG: vi.fn(),
}));

const mockT = vi.fn((key) => key);
vi.mock("../utils/i18n.js", () => ({ t: mockT }));

const mockSpeak = vi.fn();
vi.mock("../utils/tts.js", () => ({ speak: mockSpeak }));

const mockOpenFeedback = vi.fn();
vi.mock("../screens/feedback.js", () => ({ openFeedback: mockOpenFeedback }));

const mockOpenPanel = vi.fn((html) => {
  const panel = document.getElementById("panel");
  if (panel) panel.innerHTML = html;
});
const mockClosePanel = vi.fn();

vi.mock("../screens/panel.js", () => ({
  openPanel: mockOpenPanel,
  closePanel: mockClosePanel,
}));

vi.mock("../utils/helpers.js", () => ({
  $: (id) => document.getElementById(id),
}));

const mockSearch = vi.fn();
const mockGet = vi.fn();
const mockStats = vi.fn();
const mockListTags = vi.fn();
const mockExportJSON = vi.fn(() => '{"json":true}');
const mockExportCSV = vi.fn(() => "lemma,ce,tr");

vi.mock("../data/dictionary.js", () => ({
  search: mockSearch,
  get: mockGet,
  stats: mockStats,
  listTags: mockListTags,
  exportJSON: mockExportJSON,
  exportCSV: mockExportCSV,
}));

// ==================== Tests ====================
describe("screens/dict openDict", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = `
      <div id="veil"><div id="panel"></div></div>
    `;
    // Default mock implementations
    mockSearch.mockReturnValue(MOCK_ENTRIES);
    mockGet.mockImplementation((lemma) =>
      MOCK_ENTRIES.find((e) => e.lemma === lemma) || null
    );
    mockStats.mockReturnValue(MOCK_LEVEL_STATS);
    mockListTags.mockReturnValue(MOCK_TAGS);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  // ==================== Panel ve stats ====================
  describe("panel & stats", () => {
    it("opens panel with correct title and subtitle", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      expect(mockOpenPanel).toHaveBeenCalledOnce();
      const html = mockOpenPanel.mock.calls[0][0];
      expect(html).toContain("dict.title");
      expect(html).toContain("dict.desc");
    });

    it("renders stats from dict.stats()", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      expect(mockStats).toHaveBeenCalledOnce();
      const panel = document.getElementById("panel");
      expect(panel.querySelector(".dict-search")).not.toBeNull();
      expect(panel.textContent).toContain("200");
      expect(panel.textContent).toContain("180");
      expect(panel.textContent).toContain("72");
      expect(panel.textContent).toContain("20");
    });

    it("renders tag filter buttons from dict.listTags()", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      expect(mockListTags).toHaveBeenCalledOnce();
      const panel = document.getElementById("panel");
      const tagBtns = panel.querySelectorAll(".dict-tag-btn");
      expect(tagBtns.length).toBe(MOCK_TAGS.length);
      expect(tagBtns[0].textContent).toBe("abstract");
    });

    it("calls dict.search() with default (no filter)", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      expect(mockSearch).toHaveBeenCalledWith("", {});
    });
  });

  // ==================== Kart içeriği ====================
  describe("card rendering", () => {
    it("renders one .dict-card per entry", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");
      expect(cards.length).toBe(MOCK_ENTRIES.length);
    });

    it("shows lemma text in each card (uppercased via dispG)", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");
      expect(cards[0].textContent).toContain("БОРЗ");
      expect(cards[1].textContent).toContain("БЕРКАТ");
      expect(cards[2].textContent).toContain("БЕПИГ");
    });

    it("shows gloss (ce and tr) in card body", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");
      // борз: ce=борз, tr=kurt → dispG uppercases → БОРЗ, KURT
      expect(cards[0].innerHTML).toContain("чеч.");
      expect(cards[0].innerHTML).toContain("БОРЗ");   // ce gloss (uppercased)
      expect(cards[0].innerHTML).toContain("тр.");
      expect(cards[0].innerHTML).toContain("KURT");   // tr gloss (uppercased)
    });

    it("shows IPA when available", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");
      expect(cards[0].innerHTML).toContain("/borz/");
    });

    it("renders status badge: found (✓) vs unfound (○)", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");
      // борз is found
      expect(cards[0].querySelector(".dict-badge-found")).not.toBeNull();
      // беркат is not found
      expect(cards[1].querySelector(".dict-badge")).not.toBeNull();
    });

    it("includes speak button 🔊", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");
      const speakBtns = cards[0].querySelectorAll(".dict-speak");
      expect(speakBtns.length).toBe(1);
      expect(speakBtns[0].getAttribute("data-w")).toBe("борз");
    });

    it("includes feedback button ✍️", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");
      const fbBtns = cards[0].querySelectorAll(".dict-fb");
      expect(fbBtns.length).toBe(1);
      expect(fbBtns[0].getAttribute("data-w")).toBe("борз");
    });

    it("shows tags row with colored tag spans", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");
      const firstCardTags = cards[0].querySelectorAll(".dict-tag");
      expect(firstCardTags.length).toBe(1);
      expect(firstCardTags[0].textContent).toBe("animal");
    });

    it("shows examples if present", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");
      const examples = cards[0].querySelectorAll(".dict-ex");
      expect(examples.length).toBe(1);
    });

    it("shows miss link when gloss is empty", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");
      const lastCard = cards[4]; // атагӀи has empty gloss
      const miss = lastCard.querySelector(".dict-miss");
      expect(miss).not.toBeNull();
      const link = miss.querySelector("a");
      expect(link).not.toBeNull();
      expect(link.getAttribute("href")).toContain("github.com");
    });
  });

  // ==================== Buton delegasyonu ====================
  describe("button delegation", () => {
    it("clicking .dict-speak calls speak()", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const speakBtn = panel.querySelector(".dict-speak");
      speakBtn.click();

      expect(mockSpeak).toHaveBeenCalledWith("борз", "ce");
    });

    it("clicking .dict-fb calls openFeedback()", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const fbBtn = panel.querySelector(".dict-fb");
      fbBtn.click();

      expect(mockOpenFeedback).toHaveBeenCalledWith({ word: "борз", type: "fix" });
    });

    it("clicking #dc-close calls closePanel()", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const closeBtn = panel.querySelector("#dc-close");
      closeBtn.click();

      expect(mockClosePanel).toHaveBeenCalledOnce();
    });
  });

  // ==================== Expand / Collapse ====================
  describe("expand / collapse", () => {
    it("toggles aria-expanded on card click", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");
      const firstCard = cards[0];

      expect(firstCard.getAttribute("aria-expanded")).toBe("false");

      firstCard.click();
      expect(firstCard.getAttribute("aria-expanded")).toBe("true");

      firstCard.click();
      expect(firstCard.getAttribute("aria-expanded")).toBe("false");
    });

    it("loads detail via dict.get() on expand", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");

      cards[0].click();
      expect(mockGet).toHaveBeenCalledWith("борз");

      const detail = cards[0].querySelector(".dict-card-detail");
      expect(detail).not.toBeNull();
      // dispG uppercases example text
      expect(detail.innerHTML).toContain("Native Nakh");
      expect(detail.innerHTML).toContain("БОРЗ ХIУММА Ю");
      expect(detail.innerHTML).toContain("Масаланаш");
    });

    it("clears detail on collapse", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");

      cards[0].click();
      expect(cards[0].querySelector(".dict-card-detail").innerHTML).not.toBe("");

      cards[0].click();
      expect(cards[0].querySelector(".dict-card-detail").innerHTML).toBe("");
    });

    it("accordion: expanding one card collapses others", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");

      cards[0].click();
      expect(cards[0].getAttribute("aria-expanded")).toBe("true");

      cards[1].click();
      expect(cards[0].getAttribute("aria-expanded")).toBe("false");
      expect(cards[1].getAttribute("aria-expanded")).toBe("true");
    });

    it("shows detail container only when extra content (etymology or >1 examples)", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");

      // бепиг: 1 example, NO etymology → hasExtra=false → no .dict-card-detail
      const bepigCard = cards[2];
      expect(bepigCard.querySelector(".dict-card-detail")).toBeNull();

      // борз: 1 example + etymology → hasExtra=true → has .dict-card-detail
      expect(cards[0].querySelector(".dict-card-detail")).not.toBeNull();
    });
  });

  // ==================== Filtreleme ve Arama ====================
  describe("filter & search", () => {
    it("tag filter toggles .on class and re-renders with tag", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const tagBtns = panel.querySelectorAll(".dict-tag-btn");
      const animalBtn = Array.from(tagBtns).find((b) => b.textContent === "animal");

      mockSearch.mockClear();
      animalBtn.click();
      expect(animalBtn.classList.contains("on")).toBe(true);
      expect(mockSearch).toHaveBeenCalledWith("", { tags: ["animal"] });

      mockSearch.mockClear();
      animalBtn.click();
      expect(animalBtn.classList.contains("on")).toBe(false);
      expect(mockSearch).toHaveBeenCalledWith("", {});
    });

    it("search input triggers search with query", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const searchInput = panel.querySelector(".dict-search");

      mockSearch.mockClear();
      mockSearch.mockReturnValue([MOCK_ENTRIES[0]]);

      searchInput.value = "борз";
      searchInput.dispatchEvent(new Event("input"));

      expect(mockSearch).toHaveBeenCalledWith("борз", { sortBy: "lemma", limit: 200 });
    });

    it("found-only checkbox toggles onlyFound and re-renders", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const foundCheckbox = panel.querySelector("#dict-only-found");

      mockSearch.mockClear();
      foundCheckbox.checked = true;
      foundCheckbox.dispatchEvent(new Event("change"));

      expect(mockSearch).toHaveBeenCalledWith("", { onlyFound: true });
    });

    it("missing-only checkbox unchecks found checkbox", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const missingCheckbox = panel.querySelector("#dict-only-missing");
      const foundCheckbox = panel.querySelector("#dict-only-found");

      mockSearch.mockClear();
      missingCheckbox.checked = true;
      missingCheckbox.dispatchEvent(new Event("change"));

      expect(mockSearch).toHaveBeenCalledWith("", { onlyMissing: true });
      expect(foundCheckbox.checked).toBe(false);
    });
  });

  // ==================== Empty state ====================
  describe("empty state", () => {
    it("shows empty-state when no results", async () => {
      mockSearch.mockReturnValue([]);
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const emptyState = panel.querySelector(".empty-state");
      expect(emptyState).not.toBeNull();
    });

    it("calls search with query when input has value", async () => {
      mockSearch.mockReturnValue([]);
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const searchInput = panel.querySelector(".dict-search");
      searchInput.value = "xxxxx";
      searchInput.dispatchEvent(new Event("input"));

      expect(mockSearch).toHaveBeenCalledWith("xxxxx", { sortBy: "lemma", limit: 200 });
    });
  });

  // ==================== Export ====================
  describe("export", () => {
    it("JSON export button calls dict.exportJSON()", async () => {
      const mockCreateObjectURL = vi.fn(() => "blob:url");
      const origCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = mockCreateObjectURL;
      const origRevokeObjectURL = URL.revokeObjectURL;
      URL.revokeObjectURL = vi.fn();

      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const jsonBtn = panel.querySelector("#dict-export-json");
      jsonBtn.click();

      expect(mockExportJSON).toHaveBeenCalledOnce();
      expect(mockCreateObjectURL).toHaveBeenCalledOnce();

      URL.createObjectURL = origCreateObjectURL;
      URL.revokeObjectURL = origRevokeObjectURL;
    });

    it("CSV export button calls dict.exportCSV()", async () => {
      const mockCreateObjectURL = vi.fn(() => "blob:url");
      const origCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = mockCreateObjectURL;
      const origRevokeObjectURL = URL.revokeObjectURL;
      URL.revokeObjectURL = vi.fn();

      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const csvBtn = panel.querySelector("#dict-export-csv");
      csvBtn.click();

      expect(mockExportCSV).toHaveBeenCalledOnce();
      expect(mockCreateObjectURL).toHaveBeenCalledOnce();

      URL.createObjectURL = origCreateObjectURL;
      URL.revokeObjectURL = origRevokeObjectURL;
    });
  });

  // ==================== Stagger animasyonu ====================
  describe("stagger animation", () => {
    it("adds .card-enter class with staggered delays", async () => {
      const { openDict } = await import("../screens/dict.js");
      openDict();

      const panel = document.getElementById("panel");
      const cards = panel.querySelectorAll(".dict-card");

      expect(cards.length).toBeGreaterThan(0);
      cards.forEach((card) => {
        expect(card.classList.contains("card-enter")).toBe(true);
        expect(card.style.animationDelay).toBeTruthy();
      });

      // First card delay should be 0ms
      expect(cards[0].style.animationDelay).toBe("0ms");
      // Second card: 35ms (5 cards < 30 → 35ms per card)
      expect(cards[1].style.animationDelay).toBe("35ms");
    });
  });
});
