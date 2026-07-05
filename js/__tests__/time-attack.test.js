// @ts-check
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getLeaderboard } from "../game/time-attack.js";

describe("time-attack.getLeaderboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array when nothing is stored", () => {
    expect(getLeaderboard()).toEqual([]);
  });

  it("returns parsed array when valid data exists", () => {
    const data = [
      { score: 100, words: 5, date: "2026-07-04" },
      { score: 50, words: 3, date: "2026-07-03" },
    ];
    localStorage.setItem("dosh-ta-best", JSON.stringify(data));
    expect(getLeaderboard()).toEqual(data);
  });

  it("returns empty array when stored data is malformed", () => {
    localStorage.setItem("dosh-ta-best", "not json");
    expect(getLeaderboard()).toEqual([]);
  });

  it("returns empty array when stored data is not an array", () => {
    localStorage.setItem("dosh-ta-best", JSON.stringify({ score: 100 }));
    expect(getLeaderboard()).toEqual([]);
  });

  it("returns empty array when localStorage throws", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = vi.fn(() => { throw new Error("quota"); });
    expect(getLeaderboard()).toEqual([]);
    Storage.prototype.getItem = original;
  });
});
