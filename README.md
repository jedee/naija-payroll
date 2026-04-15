# naija-payroll

> Zero-dependency TypeScript package for Nigerian payroll calculations. PAYE, NHF, Pension — done right.

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue)](https://www.npmjs.com/package/naija-payroll)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Why

Nigerian payroll has a compounding complexity that every organisation rebuilds from scratch. PAYE brackets that are slightly wrong. NHF calculations nobody double-checked. Consolidated relief applied inconsistently. Pension contributions that don't match the Pension Reform Act 2014.

`naija-payroll` exists because after a year of building attendance and payroll systems for a real government parastatal — and getting every figure audited by Finance monthly — I know exactly how Nigerian payroll should work.

## Install

```bash
bun add naija-payroll
# or
npm install naija-payroll
```

## Use

```typescript
import { calculatePayroll } from "naija-payroll";

const payslip = calculatePayroll({
  basic: 260000,
  housing: 65000,
  transport: 30000,
  utility: 10000,
  housingAllow: 15000,
  other: 20000,
  taxYear: 2026,
});

console.log(payslip);
/*
{
  grossIncome: 380000,
  taxableIncome: 298400,
  payeTax: 37240,
  nhfContribution: 7500,
  employeePension: 28500,
  employerPension: 28500,
  totalDeductions: 73240,
  netPay: 306760
}
*/
```

## What It Calculates

| Field | Detail |
|---|---|
| **Gross Income** | basic + all allowances |
| **Taxable Income** | gross − consolidated relief (0.2 × gross income, capped at ₦500,000) |
| **PAYE** | FIRS 2026 brackets — 7%, 11%, 15%, 18%, 22%, 24% |
| **NHF** | 2.5% of basic, capped at ₦7,500/month for basic ≥ ₦300,000 |
| **Employee Pension** | 7.5% of (basic + housing + transport + utility) |
| **Employer Pension** | 7.5% or 10% depending on scheme — documented in ARCHITECTURE.md |
| **Net Pay** | gross − PAYE − NHF − employee pension |

Every figure has a source. Every deduction is the correct Nigerian interpretation.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — Full architecture writeup: biometric device integration, sync strategy, timezone normalization, mapping tables
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contributor guide, good first issues, npm publishing process

## Architecture: The AMML Background

This package was extracted from building the attendance and payroll system for Abuja Markets Management Limited (AMML) — a government parastatal managing 19 markets across the FCT.

The biometric device integration, cross-referencing logic, and payroll calculation pipeline were all battle-tested against real Finance audits before becoming this package.

Read the full story: **[jedi.zo.space/hacktoberfest](https://jedi.zo.space/hacktoberfest)**

## Contributing

Open an issue. Pick a labeled bug. Ship a PR.

```bash
git clone https://github.com/jedee/naija-payroll
bun install
bun test
```

Good first issues: [Issues labeled `good first issue`](https://github.com/jedee/naija-payroll/issues?q=label%3A%22good+first+issue%22)

## License

MIT