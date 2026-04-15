#!/usr/bin/env bun
import { calculatePAYE, formatInput, formatCurrency } from "./paye";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
naija-payroll CLI

Usage:
  bun run src/cli.ts [options]

Options:
  --basic <amount>       Monthly basic salary (required)
  --housing <amount>     Monthly housing allowance
  --transport <amount>   Monthly transport allowance
  --bonus <amount>      Annual bonus
  --children <count>     Number of children (education relief)
  --nhf <amount>         Monthly NHF contribution
  --pension <amount>     Monthly pension contribution
  --disability          Flag if employee has disability
  --monthly             Show monthly breakdown
  --json                Output as JSON
  --help, -h            Show this help

Example:
  bun run src/cli.ts --basic 300000 --housing 50000 --transport 20000
  bun run src/cli.ts --basic 300000 --housing 50000 --children 2 --json
`);
  process.exit(0);
}

// Parse args
function getArg(name: string, fallback = 0): number {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? parseFloat(args[idx + 1] ?? String(fallback)) : fallback;
}
function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

const input = {
  basic:           getArg("basic", 0),
  housing:         getArg("housing"),
  transport:       getArg("transport"),
  utility:         getArg("utility"),
  meal:            getArg("meal"),
  medical:         getArg("medical"),
  education:       getArg("children", 0) * 2500,
  otherAllowances: getArg("other-allowances"),
  bonus:           getArg("bonus"),
  overtime:        getArg("overtime"),
  nhf:             getArg("nhf"),
  pension:         getArg("pension"),
  lifeAssurance:   getArg("life-assurance"),
  disability:      hasFlag("disability"),
};

if (!input.basic) {
  console.error("Error: --basic is required\nRun with --help for usage.");
  process.exit(1);
}

const result = calculatePAYE(input);

if (hasFlag("json")) {
  console.log(JSON.stringify({ input, result }, null, 2));
} else {
  console.log(formatInput(input));
  console.log("\n── Reliefs ──────────────────────────");
  console.log(`Consolidated Relief: ${formatCurrency(result.breakdown.consolidatedRelief)}`);
  console.log(`Pension Relief:     ${formatCurrency(result.breakdown.pensionRelief)}`);
  console.log(`NHF Relief:         ${formatCurrency(result.breakdown.nhfRelief)}`);
  console.log(`Children Relief:    ${formatCurrency(result.breakdown.childrenRelief)}`);
  if (result.breakdown.disabilityExemption > 0) {
    console.log(`Disability Exempt: ${formatCurrency(result.breakdown.disabilityExemption)}`);
  }
}
