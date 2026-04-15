// ─────────────────────────────────────────────
//  naija-payroll — PAYE (Pay As You Earn) Engine
//  Based on Nigerian Personal Income Tax Act 1993
//  Consolidated Relief Allowance, Children, Pension, NHF, etc.
// ─────────────────────────────────────────────

export interface PayPeriod {
  basic: number;       // Annual or monthly (pass monthly × 12 for annual calc)
  housing: number;
  transport: number;
  utility: number;
  meal: number;
  medical: number;
  education: number;    // Children's education allowance
  otherAllowances: number;
  bonus: number;        // Annual bonus
  overtime: number;
  nhf: number;          // National Housing Fund (7% of basic, capped at ₦250k/yr)
  pension: number;      // Pension contributions (8% of basic)
  lifeAssurance: number; // Annual premium paid
  disability: boolean;   // Self or dependent with disability
}

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;  // decimal, e.g. 0.07 for 7%
}

export interface PAYEResult {
  grossAnnual: number;
  grossMonthly: number;
  totalReliefs: number;
  taxableIncome: number;
  taxPayable: number;   // Annual
  taxMonthly: number;
  effectiveRate: number; // percentage
  takeHomeAnnual: number;
  takeHomeMonthly: number;
  breakdown: {
    consolidatedRelief: number;
    pensionRelief: number;
    nhfRelief: number;
    lifeAssuranceRelief: number;
    disabilityExemption: number;
    childrenRelief: number;
  };
}

// ─── Nigerian Tax Brackets (PITA 1993, as amended) ───────────────────────────

const TAX_BRACKETS: TaxBracket[] = [
  { min: 0,        max: 300000,   rate: 0 },
  { min: 300000,   max: 600000,   rate: 0.07 },
  { min: 600000,   max: 1100000,  rate: 0.11 },
  { min: 1100000,  max: 1600000,  rate: 0.15 },
  { min: 1600000,  max: 2100000,  rate: 0.19 },
  { min: 2100000,  max: 2600000,  rate: 0.21 },
  { min: 2600000,  max: Infinity, rate: 0.24 },
];

// Consolidated Relief Allowance: 1% of gross + ₦200,000
const CRA_FLOOR = 200000;
const CRA_RATE  = 0.01;

// Children relief: ₦2,500 per child, max 4 children (₦10,000)
// Valid for children under 21 or in full-time education
const CHILD_RELIEF = 2500;
const MAX_CHILDREN = 4;

// NHF rate: 2.5% of basic salary (employer) + employee's 7% is optional
// Annual cap: ₦250,000 (₦20,833/month)
const NHF_RATE = 0.07;
const NHF_CAP  = 250000;

// Pension: 8% of basic (employee voluntary contribution)
const PENSION_RATE = 0.08;

// Life Assurance premium deduction (annual premiums, must not exceed 50% of gross)
const LIFE_ASSURANCE_CAP_RATE = 0.50;

// Disability: 10% of gross income tax exempt
const DISABILITY_EXEMPTION_RATE = 0.10;

// ─── Core Calculator ─────────────────────────────────────────────────────────

export function calculatePAYE(input: PayPeriod): PAYEResult {
  // Normalise to annual figures
  const annual = {
    basic:            input.basic * 12,
    housing:          input.housing * 12,
    transport:        input.transport * 12,
    utility:          input.utility * 12,
    meal:             input.meal * 12,
    medical:          input.medical * 12,
    education:        input.education * 12,
    otherAllowances:  input.otherAllowances * 12,
    bonus:            input.bonus,
    overtime:         input.overtime,
    nhf:              Math.min(input.nhf * 12, NHF_CAP),
    pension:          input.pension * 12,
    lifeAssurance:    input.lifeAssurance,
    disability:       input.disability,
  };

  // ── Gross Income ──
  const grossAnnual = Object.values(annual)
    .reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0);

  // ── Reliefs ──

  // Consolidated Relief Allowance
  const craRelief = Math.max(grossAnnual * CRA_RATE, CRA_FLOOR);

  // Pension Relief (8% of basic, no cap for relief purposes)
  const pensionRelief = annual.pension * PENSION_RATE * 12; // already the employee contribution

  // NHF Relief (50% of NHF contributions — employer gets relief, employee does too)
  // Actually: NHF contributions are deductible — employee 7% is deductible
  const nhfRelief = annual.nhf * 0.5; // 50% of NHF is deductible

  // Life Assurance Relief (50% of premium, capped at 50% of gross)
  const lifeReliefRaw = annual.lifeAssurance * 0.5;
  const lifeRelief = Math.min(lifeReliefRaw, grossAnnual * LIFE_ASSURANCE_CAP_RATE);

  // Disability Exemption
  const disabilityExemption = annual.disability
    ? grossAnnual * DISABILITY_EXEMPTION_RATE
    : 0;

  // Children's Education Relief
  const childrenCount = Math.min(
    Math.floor(annual.education / (CHILD_RELIEF * 12)),
    MAX_CHILDREN
  );
  const childrenRelief = childrenCount * CHILD_RELIEF * 12;

  const totalReliefs = craRelief + pensionRelief + nhfRelief
    + lifeRelief + disabilityExemption + childrenRelief;

  // ── Taxable Income ──
  const taxableIncome = Math.max(0, grossAnnual - totalReliefs);

  // ── Tax Payable (progressive brackets) ──
  let taxPayable = 0;
  let remaining = taxableIncome;

  for (const bracket of TAX_BRACKETS) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
    taxPayable += taxableInBracket * bracket.rate;
    remaining  -= taxableInBracket;
  }

  const taxMonthly    = taxPayable / 12;
  const takeHomeAnnual  = grossAnnual - taxPayable - annual.pension - annual.nhf;
  const takeHomeMonthly  = takeHomeAnnual / 12;
  const effectiveRate    = grossAnnual > 0 ? (taxPayable / grossAnnual) * 100 : 0;

  return {
    grossAnnual,
    grossMonthly: grossAnnual / 12,
    totalReliefs,
    taxableIncome,
    taxPayable,
    taxMonthly,
    effectiveRate,
    takeHomeAnnual,
    takeHomeMonthly,
    breakdown: {
      consolidatedRelief:   craRelief,
      pensionRelief,
      nhfRelief,
      lifeAssuranceRelief:  lifeRelief,
      disabilityExemption,
      childrenRelief,
    },
  };
}

// ─── Monthly Payroll ──────────────────────────────────────────────────────────

export interface MonthlyPayPeriod extends PayPeriod {
  month: string;    // e.g. "January 2026"
  daysWorked: number;
}

export interface MonthlyPayslip {
  month: string;
  employee: {
    basic: number;
    housing: number;
    transport: number;
    otherAllowances: number;
    grossPay: number;
  };
  deductions: {
    pension: number;   // Employee 8%
    nhf: number;       // Employee 7%
    paye: number;      // Monthly tax
    total: number;
  };
  netPay: number;
  annualProjection: PAYEResult;
}

export function calculateMonthlyPayslip(
  monthly: MonthlyPayPeriod
): MonthlyPayslip {
  const annualInput = { ...monthly, bonus: 0, overtime: 0 };
  const projection = calculatePAYE(annualInput);

  // Pro-rata adjustments for partial month
  const prorationFactor = monthly.daysWorked / 22; // standard working days

  const grossPay = (monthly.basic + monthly.housing + monthly.transport
    + monthly.utility + monthly.meal + monthly.otherAllowances) * prorationFactor;

  const pension = monthly.pension * prorationFactor;
  const nhf    = Math.min(monthly.nhf * prorationFactor, NHF_CAP / 12);
  const paye   = projection.taxMonthly;

  const totalDeductions = pension + nhf + paye;
  const netPay          = grossPay - totalDeductions;

  return {
    month: monthly.month,
    employee: {
      basic:           monthly.basic,
      housing:         monthly.housing,
      transport:       monthly.transport,
      otherAllowances: monthly.otherAllowances,
      grossPay,
    },
    deductions: { pension, nhf, paye, total: totalDeductions },
    netPay,
    annualProjection: projection,
  };
}

// ─── Export for CLI use ───────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatInput(input: PayPeriod): string {
  const result = calculatePAYE(input);
  return `
Gross Annual:        ${formatCurrency(result.grossAnnual)}
Total Reliefs:       -${formatCurrency(result.totalReliefs)}
Taxable Income:       ${formatCurrency(result.taxableIncome)}
───────────────────────────────
PAYE (Annual):        ${formatCurrency(result.taxPayable)}
PAYE (Monthly):       ${formatCurrency(result.taxMonthly)}
Effective Rate:       ${result.effectiveRate.toFixed(2)}%
───────────────────────────────
Take Home (Annual):   ${formatCurrency(result.takeHomeAnnual)}
Take Home (Monthly):  ${formatCurrency(result.takeHomeMonthly)}
`.trim();
}
