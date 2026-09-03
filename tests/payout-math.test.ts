import { describe, it, expect } from "vitest";
import { calculateEarnings, formatCentsToCurrency } from "../src/shared/types";

describe("Payout Math & Calculations", () => {
  const payoutPer1k = 500; // $5.00 (in cents)

  it("returns 0 for views below 1,000 (floor behavior)", () => {
    expect(calculateEarnings(0, payoutPer1k)).toBe(0);
    expect(calculateEarnings(450, payoutPer1k)).toBe(0);
    expect(calculateEarnings(999, payoutPer1k)).toBe(0);
  });

  it("returns exactly 1k payout for 1,000 to 1,999 views", () => {
    expect(calculateEarnings(1000, payoutPer1k)).toBe(500);
    expect(calculateEarnings(1500, payoutPer1k)).toBe(500);
    expect(calculateEarnings(1999, payoutPer1k)).toBe(500);
  });

  it("scales linearly by thousands of views", () => {
    expect(calculateEarnings(2000, payoutPer1k)).toBe(1000); // 2 * $5 = $10 (1000 cents)
    expect(calculateEarnings(5500, payoutPer1k)).toBe(2500); // 5 * $5 = $25 (2500 cents)
    expect(calculateEarnings(10999, payoutPer1k)).toBe(5000); // 10 * $5 = $50 (5000 cents)
  });

  it("handles high view counts without floating point errors", () => {
    const highViews = 1_250_000; // 1.25M views -> 1,250 thousands
    const earnings = calculateEarnings(highViews, payoutPer1k);
    expect(earnings).toBe(1250 * 500); // 625,000 cents ($6,250.00)
    expect(Number.isInteger(earnings)).toBe(true);
  });

  it("correctly formats integer cents to USD currency strings", () => {
    expect(formatCentsToCurrency(500)).toBe("$5.00");
    expect(formatCentsToCurrency(15000)).toBe("$150.00");
    expect(formatCentsToCurrency(0)).toBe("$0.00");
  });
});
