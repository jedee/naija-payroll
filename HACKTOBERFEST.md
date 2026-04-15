# Hacktoberfest 2026 — naija-payroll

This repository participates in **Hacktoberfest 2026**.

> Build Nigerian payroll tools that actually work for Nigerian developers.

## What is Hacktoberfest?

Hacktoberfest is an annual event organized by DigitalOcean and GitHub that encourages developers around the world to contribute to open source projects during the month of October.

## What we're building

**naija-payroll** is a Node.js library that calculates Nigerian payroll — PAYE, NHF, pension, reliefs — correctly, without requiring a server or a 6-figure SaaS subscription.

## How to contribute

1. **Read the CLAUDE.md** — it explains how the codebase works
2. **Pick an issue** labeled `good first issue` or `help wanted`
3. **Fork the repo** and create your branch: `git checkout -b feat/your-feature`
4. **Write the code** and add tests
5. **Open a PR** with a clear description of what you changed and why
6. **Await review** — we review within 48 hours

## What counts as a valid contribution?

- Writing or improving a function in `src/paye.ts`
- Adding or improving tests in `src/paye.test.ts`
- Improving documentation (README, HACKTOBERFEST, CLAUDE.md)
- Reporting bugs via GitHub Issues
- Providing usage feedback

## What does NOT count?

- Submitting pure refactors with no functional change
- Adding unrelated files
- Spamming issues or PRs

## Communication

- GitHub Issues for bug reports and feature requests
- Keep discussions technical and focused

## Quick start

```bash
git clone https://github.com/jedee/naija-payroll
cd naija-payroll
bun install
bun test

# Try the CLI
bun run src/cli.ts
```

## Labels we use

| Label | Meaning |
|-------|---------|
| `good first issue` | Ideal starting point for first-time contributors |
| `help wanted` | We'd love help on this but it's not trivial |
| `enhancement` | New feature or significant improvement |
| `bug` | Something is wrong and needs fixing |
| `documentation` | README, comments, or guide improvements |

---

*Maintained by [@jedee](https://github.com/jedee) — PRs welcome.*
