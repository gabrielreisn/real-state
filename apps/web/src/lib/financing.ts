export type FinancingInput = { price: number; downPayment: number; years: number; annualRate: number };

const ITBI_RATE = 0.02;
/** Banks commonly cap the installment at about this share of the household income. */
const INCOME_SHARE = 0.3;

/**
 * First-installment estimate for both amortization systems, before TR, insurance and bank fees.
 * The annual rate is treated as effective. Null when the inputs describe no loan.
 */
export function estimateFinancing({ price, downPayment, years, annualRate }: FinancingInput) {
  const financed = price - downPayment;
  const months = Math.round(years * 12);
  if (!(financed > 0) || !(downPayment >= 0) || !(months > 0) || !(annualRate >= 0)) return null;

  const monthlyRate = (1 + annualRate / 100) ** (1 / 12) - 1;
  const amortization = financed / months;
  const sacFirst = amortization + financed * monthlyRate;
  const sacLast = amortization * (1 + monthlyRate);
  const priceInstallment = monthlyRate === 0 ? amortization : (financed * monthlyRate) / (1 - (1 + monthlyRate) ** -months);

  return {
    financed,
    months,
    sacFirst,
    sacLast,
    price: priceInstallment,
    incomeForSac: sacFirst / INCOME_SHARE,
    itbi: price * ITBI_RATE,
  };
}
