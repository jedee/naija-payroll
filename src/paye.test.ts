import { describe, expect, test } from "bun:test";
import { calculatePAYE, calculateMonthlyPayslip } from "./paye";

describe("Nigerian PAYE", () => {
  test("₦300k basic salary — no reliefs", () => {
    const result = calculatePAYE({
      basic: 300000, housing: 0, transport: 0, utility: 0,
      meal: 0, medical: 0, education: 0, otherAllowances: 0,
      bonus: 0, overtime: 0, nhf: 0, pension: 0,
      lifeAssurance: 0, disability: false,
    });
    expect(result.grossAnnual).toBe(3_600_000);
    expect(result.taxPayable).toBeLessThan(result.grossAnnual);
    expect(result.takeHomeMonthly).toBeGreaterThan(0);
    expect(result.effectiveRate).toBeGreaterThan(0);
    expect(result.effectiveRate).toBeLessThan(25);
  });

  test("₦500k basic with housing and transport", () => {
    const result = calculatePAYE({
      basic: 500000, housing: 75000, transport: 30000,
      utility: 0, meal: 0, medical: 0, education: 0,
      otherAllowances: 0, bonus: 0, overtime: 0,
      nhf: 0, pension: 0, lifeAssurance: 0, disability: false,
    });
    expect(result.grossAnnual).toBe(7_260_000);
    expect(result.taxableIncome).toBeLessThan(result.grossAnnual);
    expect(result.takeHomeMonthly).toBeGreaterThan(result.grossMonthly * 0.7);
  });

  test("NHF deduction is capped at ₦250,000 annually", () => {
    const resultHigh = calculatePAYE({
      basic: 5_000_000, housing: 500_000, transport: 200_000,
      utility: 50000, meal: 30000, medical: 50000, education: 0,
      otherAllowances: 100000, bonus: 0, overtime: 0,
      nhf: 50000,   // ₦50k/mo × 12 = ₦600k → capped to ₦250k
      pension: 0, lifeAssurance: 0, disability: false,
    });
    expect(resultHigh.breakdown.nhfRelief).toBe(125000); // 50% of 250k cap
  });

  test("Children relief — max 4 children", () => {
    const six = calculatePAYE({
      basic: 500000, housing: 0, transport: 0, utility: 0,
      meal: 0, medical: 0, education: 15000, // 6 children worth
      otherAllowances: 0, bonus: 0, overtime: 0,
      nhf: 0, pension: 0, lifeAssurance: 0, disability: false,
    });
    expect(six.breakdown.childrenRelief).toBe(10_000 * 12); // capped at 4

    const two = calculatePAYE({
      basic: 500000, housing: 0, transport: 0, utility: 0,
      meal: 0, medical: 0, education: 5000, // 2 children
      otherAllowances: 0, bonus: 0, overtime: 0,
      nhf: 0, pension: 0, lifeAssurance: 0, disability: false,
    });
    expect(two.breakdown.childrenRelief).toBe(5_000 * 12); // 2 × 2500
  });

  test("Disability exemption — 10% of gross", () => {
    const withDisability = calculatePAYE({
      basic: 500000, housing: 0, transport: 0, utility: 0,
      meal: 0, medical: 0, education: 0, otherAllowances: 0,
      bonus: 0, overtime: 0, nhf: 0, pension: 0,
      lifeAssurance: 0, disability: true,
    });
    expect(withDisability.breakdown.disabilityExemption).toBe(
      withDisability.grossAnnual * 0.10
    );
    const withoutDisability = calculatePAYE({
      basic: 500000, housing: 0, transport: 0, utility: 0,
      meal: 0, medical: 0, education: 0, otherAllowances: 0,
      bonus: 0, overtime: 0, nhf: 0, pension: 0,
      lifeAssurance: 0, disability: false,
    });
    expect(withDisability.taxPayable).toBeLessThan(withoutDisability.taxPayable);
  });

  test("Monthly payslip — proration reduces pay", () => {
    const fullMonth = calculateMonthlyPayslip({
      month: "January 2026",
      basic: 200000, housing: 30000, transport: 15000,
      utility: 5000, meal: 5000, medical: 0,
      education: 0, otherAllowances: 0,
      bonus: 0, overtime: 0,
      nhf: 7000, pension: 16000, lifeAssurance: 0, disability: false,
      daysWorked: 22,
    });
    const halfMonth = calculateMonthlyPayslip({
      month: "January 2026",
      basic: 200000, housing: 30000, transport: 15000,
      utility: 5000, meal: 5000, medical: 0,
      education: 0, otherAllowances: 0,
      bonus: 0, overtime: 0,
      nhf: 7000, pension: 16000, lifeAssurance: 0, disability: false,
      daysWorked: 11,
    });
    expect(halfMonth.netPay).toBeLessThan(fullMonth.netPay);
    expect(halfMonth.employee.grossPay).toBeLessThan(fullMonth.employee.grossPay);
    expect(isNaN(halfMonth.netPay)).toBe(false);
  });

  test("Effective rate is within expected range", () => {
    const result = calculatePAYE({
      basic: 1_000_000, housing: 200000, transport: 100000,
      utility: 30000, meal: 20000, medical: 30000, education: 0,
      otherAllowances: 50000, bonus: 0, overtime: 0,
      nhf: 70000, pension: 80000, lifeAssurance: 0, disability: false,
    });
    expect(result.effectiveRate).toBeGreaterThan(5);
    expect(result.effectiveRate).toBeLessThan(30);
    expect(result.taxMonthly).toBeGreaterThan(0);
    expect(result.takeHomeMonthly).toBeGreaterThan(result.grossMonthly / 2);
  });
});
