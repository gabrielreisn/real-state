import { describe, expect, it } from 'vitest';
import { estimateFinancing } from './financing';

const base = { price: 500_000, downPayment: 100_000, years: 30, annualRate: 12 };

describe('estimateFinancing', () => {
  it('estimates both systems', () => {
    const result = estimateFinancing(base)!;
    const monthly = 1.12 ** (1 / 12) - 1;
    expect(result.financed).toBe(400_000);
    expect(result.months).toBe(360);
    expect(result.sacFirst).toBeCloseTo(400_000 / 360 + 400_000 * monthly, 6);
    expect(result.price).toBeCloseTo((400_000 * monthly) / (1 - (1 + monthly) ** -360), 6);
  });

  it('starts higher and ends lower under SAC than Price', () => {
    const result = estimateFinancing(base)!;
    expect(result.sacFirst).toBeGreaterThan(result.price);
    expect(result.sacLast).toBeLessThan(result.price);
  });

  it('estimates ITBI on the price and the income for the first installment', () => {
    const result = estimateFinancing(base)!;
    expect(result.itbi).toBe(10_000);
    expect(result.incomeForSac).toBeCloseTo(result.sacFirst / 0.3, 6);
  });

  it('handles a zero rate', () => {
    expect(estimateFinancing({ ...base, annualRate: 0 })!.price).toBeCloseTo(400_000 / 360, 6);
  });

  it('is null when there is nothing to finance or the inputs are invalid', () => {
    expect(estimateFinancing({ ...base, downPayment: 500_000 })).toBeNull();
    expect(estimateFinancing({ ...base, years: 0 })).toBeNull();
    expect(estimateFinancing({ ...base, annualRate: Number.NaN })).toBeNull();
  });
});
