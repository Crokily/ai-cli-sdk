import { describe, it, expect } from "vitest";
import { AnsiStreamCleaner } from "../utils/AnsiStreamCleaner.js";

describe("AnsiStreamCleaner", () => {
  it("strips ANSI sequences split across chunks", () => {
    const cleaner = new AnsiStreamCleaner();

    const first = cleaner.strip("Start \u001b[3");
    const second = cleaner.strip("2mGreen\u001b[0m End");

    expect(first).toBe("Start ");
    expect(second).toBe("Green End");
  });
});
