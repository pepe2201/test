# samp-rp

A modern, modular SAMP/open.mp roleplay gamemode foundation, inspired by the
classic Godfather script but rebuilt from scratch on top of contemporary
tooling: open.mp, MySQL R41+, YSI 5, sscanf2, streamer, Pawn.CMD, samp-bcrypt.

This is a **foundation**, not a finished product. Core systems (accounts,
characters, factions, jobs, vehicles, houses, banking, chat, admin) are
implemented end-to-end so the server is playable on day one and content can be
added incrementally without rewriting the core.

## Requirements

- [open.mp server](https://www.open.mp/) (Linux or Windows), or SA-MP 0.3.7-R2
- [Community Pawn compiler 3.10.11+](https://github.com/pawn-lang/compiler)
- MySQL 5.7+ or MariaDB 10.4+
- Plugins: `mysql` (R41+), `streamer`, `sscanf`, `Pawn.CMD`, `samp-bcrypt`,
  `crashdetect` (debug only)
- Includes: `YSI-Includes` (5.x), `sscanf2`, `streamer`, `mysql`, `Pawn.CMD`,
  `samp-bcrypt`

The recommended way to fetch them is [sampctl](https://github.com/Southclaws/sampctl):

```bash
cd samp-rp
sampctl package ensure
sampctl package build
sampctl package run
```

## Layout

```
samp-rp/
├── gamemodes/
│   ├── rp.pwn               # entry point — includes every module
│   └── modules/
│       ├── core/            # config, database, utils
│       ├── player/          # accounts, characters, inventory
│       ├── factions/        # faction system + faction-specific logic
│       ├── jobs/            # job framework + concrete jobs
│       ├── world/           # vehicles, houses, businesses
│       ├── economy/         # banking, paycheck
│       ├── communication/   # chat, /me, /do, OOC, radio
│       ├── admin/           # admin commands + levels
│       └── misc/            # anticheat, weather, tutorial
├── sql/schema.sql           # full MySQL schema
├── pawn.json                # sampctl package manifest
└── config.json              # open.mp server config example
```

## Setup

1. `mysql -u root -p < sql/schema.sql`
2. Edit `gamemodes/modules/core/config.inc` with your DB credentials, or set
   them via environment variables in `config.json`.
3. `sampctl package build`
4. `sampctl package run`

## Adding content

Every system is module-scoped. A new job is one file under
`modules/jobs/<name>.inc` plus an `#include` line in `rp.pwn` and a row in the
`jobs` table. A new faction is a row in the `factions` table plus an optional
`modules/factions/<name>.inc` for faction-specific commands. No core file has
to be touched.

## Status

| System                  | Status                                                 |
|-------------------------|--------------------------------------------------------|
| Account (register/login)| Implemented, bcrypt-hashed                             |
| Character persistence   | Implemented, MySQL-backed                              |
| Inventory               | Slot-based, persisted                                  |
| Factions                | Framework + 6 default factions                         |
| Jobs                    | Framework + Trucker, Taxi sample jobs                  |
| Vehicles                | Ownership, fuel, locks, persistence                    |
| Houses                  | Enter/exit, ownership, interior assignment             |
| Banking                 | Deposit/withdraw, paycheck timer                       |
| Chat                    | `/me /do /low /shout /b`, OOC, faction radio           |
| Admin                   | Levels 1–6, `/kick /ban /goto /gethere /a /setlevel`   |
| Anticheat               | Money desync, weapon whitelist, teleport detection     |
| Businesses              | 24/7, gas, gun shop, restaurant, clothes; till + price |
| Phone                   | **TODO** — schema present, gameplay pending            |
| Drugs                   | **TODO** — item ids reserved, gameplay pending         |
| Tutorial                | **TODO**                                               |
