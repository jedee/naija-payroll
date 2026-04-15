# How I Built a Biometric Attendance System for 19 Markets in Abuja

*What nobody told me before I started.*

---

## The Ask

Abuja Markets Management Limited manages 18 physical markets across the FCT. Staff go to work every day. Nobody really knows who showed up and who didn't.

Their process before I got involved: a paper register. Supervisor signs it. Nobody cross-checks. Nobody knows if the names match real people.

The parastatal needed something that could track attendance for 46 staff across 19 locations, work with biometric devices that were already sitting idle in storage, and produce payroll data that Finance could actually use.

That was the entire brief.

---

## The Constraint Nobody Mentioned

The biometric devices were Realand AL325 and AL321 terminals — ZK Technology hardware. They had a fingerprint database of about 500 staff members. The software that shipped with them was a Windows desktop application that:

- Required one device per market, manually configured
- Ran on a local PC that had to stay on
- Exported to a USB stick once a month
- The export was a `.dat` file with no documentation

No API. No cloud. No connectivity between sites.

So when they said "biometric attendance" they actually meant: "we have fingerprint devices that don't talk to each other."

---

## First Problem: The Data Format

The Realand devices output transaction logs in a binary format that looks like this in a hex editor:

```
[ZK][DATA][TIME][IN/OUT][ZKID][VERIFY]
```

I spent two days just figuring out what the fields meant before I could even parse the logs. No public documentation. I had to open the Windows software in a VM, clock in with a test fingerprint, export the `.dat`, and reverse-engineer the structure byte by byte.

Once I understood the format, I could write a parser that extracted:
- ZK device user ID
- Timestamp of the clock event  
- Whether it was a clock-in or clock-out
- Verification method (fingerprint, password, card)

That was step one.

---

## Second Problem: Cross-Referencing to Staff

The ZK device has its own user IDs. AMML's staff registry has its own IDs. Neither system knew about the other.

This is the problem that kills most implementations — because the answer is always "just enter the IDs manually." And for 46 staff across 19 markets, that works for about a week. Then someone changes a device, reformats the user list, and suddenly you've lost 20% of your mappings with no way to recover them.

My approach: build a mapping table (`zk_id → amml_staff_id`) that lives independently of both systems. When an attendance record comes in from a device, I look it up in the mapping. If it's not there, I flag it for review rather than silently dropping it.

The key insight: never trust the device as the source of truth. The AMML staff registry is the only system that matters.

---

## Third Problem: Network Topology

Most of these markets don't have IT infrastructure. The "network" is a 4G MiFi device that multiple people share.

Devices with TCP/IP capability (the AL325 has WiFi) can push logs to a central server — but only if that server is reachable and the device can authenticate to it. In practice, devices would go offline, miss sync windows, and accumulate logs locally until someone manually exported them.

The solution was a hybrid architecture:
- Devices store logs locally first (500,000 transaction capacity)
- Sync runs on a schedule when connectivity is available  
- On failure, the device queue continues accumulating
- A reconciliation job runs daily to match local logs against what the server received

This way, connectivity is a "nice to have" — not a hard dependency.

---

## Fourth Problem: Payroll Integration

Attendance data without payroll context is just a headcount. The Finance team needed:

- Who was late and by how many minutes
- Who worked full days vs partial days
- Deductions that matched Nigeria's PAYE brackets
- NHF and pension contributions per staff member

I built a payroll calculator that takes the attendance log and produces a payroll report. The logic:
1. For each staff member, calculate total hours worked in the period
2. Apply late penalties (deduct from salary if clock-in > configured threshold)
3. Calculate gross pay based on daily rate × days worked
4. Apply PAYE bracket (15% to 24% depending on annual income)
5. Subtract NHF (2.5% of basic salary, capped at N75,000/year)
6. Subtract pension (7.5% of gross, employee portion)
7. Output net pay per staff member

The output is a structured JSON file that Finance can use directly — no more manual spreadsheet calculations.

---

## Fifth Problem: The Devices That Wouldn't Sync

Two devices at Kugbo International Market kept dropping offline. After troubleshooting for two days, I found the issue: the devices were set to the wrong timezone (UTC instead of WAT). Clock events were being stamped with times that were 1 hour in the future — which meant the sync service was rejecting them as "future events."

Fix: add a timezone normalization step in the parser. All device timestamps get converted to WAT before storage. Devices can have wrong clocks; the system adapts.

---

## What I'd Do Differently

If I started this knowing what I know now, I'd choose a different device strategy from day one. The Realand hardware is functional but the firmware is unstable — devices need firmware updates more often than the vendor publishes them.

I'd also push harder for a real backend earlier. The localStorage approach worked for the demo phase, but a production system needs a proper database. We eventually migrated to IndexedDB, which was better — but the migration took time we didn't plan for.

The original scope was "a simple attendance app." What we built was closer to an ERP module.

---

## What Actually Ships

The system runs. Every market has a device that records attendance. Every morning, the management team can see who was on time, who was late, and who didn't show up. Payroll calculates itself. Finance gets a report they can actually audit.

That's the part nobody talks about in architecture docs — the part that matters most.

---

*This was built as a contribution to Hacktoberfest 2026. The attendance engine powers AMML's daily operations. The lessons here informed the [naija-payroll](https://github.com/jedee/naija-payroll) npm package, now available for any Nigerian organisation to use off the shelf.*