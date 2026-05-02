# Project context for Claude Code

This file is the single source of truth for any Claude Code session — including
sessions on a different account than the one that started this work. Read it
end-to-end before suggesting changes.

## Repository

`pepe2201/test` (or wherever this repo is now hosted after a transfer/fork).

There are **two unrelated projects** in this repo:

1. **Root TypeScript / Replit web app** — `client/`, `server/`, `desktop/`,
   `shared/`. Existing prior to this work, untouched. Use the existing
   `package.json`, `vite.config.ts`, etc.

2. **`samp-rp/`** — A SAMP/open.mp roleplay gamemode in Pawn, built from
   scratch on the `claude/samp-protocol-research-FRJk9` branch. Inspired by
   the classic Godfather script but rebuilt modularly with modern tooling.
   **All Claude work has been on the SAMP project.**

When in doubt, work on `samp-rp/`. Do not touch the TS app unless explicitly
asked.

## Branch policy

- Active branch: `claude/samp-protocol-research-FRJk9`
- All commits/pushes go there. Never push to `main` without explicit
  permission.
- Commit messages follow the existing style: short subject ("Add X module"),
  paragraph body explaining the why, ending with the Claude session URL.

## samp-rp — stack

| Layer        | Choice                                                    |
|--------------|-----------------------------------------------------------|
| Runtime      | open.mp (Linux/Windows), backwards-compatible to SA-MP 0.3.7-R2 |
| Compiler     | community Pawn 3.10.11 (`pawn-lang/compiler`)             |
| Build tool   | sampctl                                                   |
| Includes     | YSI 5 (y_hooks, y_iterate), sscanf2, streamer, mysql R41+, Pawn.CMD, samp-bcrypt |
| DB           | MySQL 5.7+ / MariaDB 10.4+; prepared stmts via `mysql_format` `%e` |
| Auth         | bcrypt-hashed passwords (samp-bcrypt)                     |

## Architecture rules

- **Modular includes.** Every subsystem is a single `.inc` under
  `samp-rp/gamemodes/modules/<area>/`. The entry point `gamemodes/rp.pwn` only
  `#include`s modules and defines lifecycle callbacks. Modules use `y_hooks`
  to hook into SAMP callbacks rather than redefining `public On...`.
- **Order matters in `rp.pwn`** for direct function calls. Specifically:
  `phone.inc` must come before `account.inc` because `OnCharacterCreated`
  calls `Phone_AssignNumber`. Hooks themselves resolve at link time so their
  order doesn't matter.
- **Player state** lives in `gPlayer[MAX_PLAYERS][E_PLAYER_DATA]` defined in
  `modules/player/character.inc`. Always access via the `Player_Get*` /
  `Player_Set*` accessors so the storage layer can be swapped.
- **Money** must always go through `Money_Set` / `Money_Give` in
  `modules/core/utils.inc`. Never call `GivePlayerMoney` directly — it
  bypasses the anti-cheat sync and the `MAX_CASH_SANE` cap.
- **Names**: `GetPlayerName` does NOT round-trip cleanly through a Pawn
  helper (returning arrays from functions is unreliable). Always use a local
  buffer:
  ```pawn
  new pname[MAX_PLAYER_NAME];
  GetPlayerName(playerid, pname, sizeof pname);
  ```
- **Strings + comma operator**: Pawn does NOT support C-style `(a, b)` comma
  operator. `strcat((dest[0]=0, dest), src, len)` will not compile. Always
  split into two statements.
- **MySQL**: every user-supplied string goes through `'%e'` in
  `mysql_format`. No raw concatenation. Use `mysql_pquery` for selects
  (callback) and `mysql_tquery` for fire-and-forget writes.

## Modules — current status

Source paths are relative to `samp-rp/gamemodes/`.

| Module                            | Status     | Notes                                |
|-----------------------------------|------------|--------------------------------------|
| `modules/core/config.inc`         | done       | All compile-time constants           |
| `modules/core/database.inc`       | done       | `g_DB` MySQL handle owner            |
| `modules/core/utils.inc`          | done       | `Send*`, `Money_*`, name lookup notes|
| `modules/player/character.inc`    | done       | `gPlayer`, load/save                 |
| `modules/player/account.inc`      | done       | bcrypt register/login, ban check     |
| `modules/player/inventory.inc`    | done       | 24 slots, persisted                  |
| `modules/factions/factions.inc`   | done       | 6 default factions, `/f` radio       |
| `modules/jobs/jobs.inc`           | done       | framework + Trucker + Taxi           |
| `modules/world/vehicles.inc`      | done       | persistent, fuel tick, locks         |
| `modules/world/houses.inc`        | done       | enter/exit/buy/lock + 3D labels      |
| `modules/world/businesses.inc`    | done       | 5 types, till, owner menu            |
| `modules/economy/banking.inc`     | done       | ATM dialog, paycheck timer           |
| `modules/communication/chat.inc`  | done       | `/me /do /low /shout /b /pm`         |
| `modules/communication/phone.inc` | done       | call FSM, SMS, inbox                 |
| `modules/admin/admin.inc`         | done       | levels 1–6                           |
| `modules/misc/anticheat.inc`      | done       | money desync, weapon whitelist       |
| `modules/misc/drugs.inc`          | done       | weed/coke/meth + effects             |
| Tutorial                          | **TODO**   | starter flow for new chars           |
| Multi-character per account       | **TODO**   | schema supports it (FK), gameplay no |
| Houses-interior streamer          | **TODO**   | currently same interior_id for all   |
| Faction-specific commands         | **TODO**   | `/cuff`, `/heal` (medic), etc.       |
| Voice-style chat zones            | **TODO**   | factional radio over distance        |

## Build / run

```bash
cd samp-rp
mysql -u <user> -p < sql/schema.sql
sampctl package ensure
sampctl package build
sampctl package run
```

Edit DB credentials in `gamemodes/modules/core/config.inc` (or pass as
environment overrides via `config.json` if you adapt the loader).

## Conventions

- Two-space indent, but the codebase already uses four — match what's there
  in any file you edit.
- No comments that describe *what* the code does. Only add a comment when
  *why* is non-obvious (a workaround, a hidden invariant, a quirk of an
  underlying library).
- Pawn doesn't support emoji in source. Don't introduce non-ASCII characters
  in strings unless the user asks for it.
- When adding a new feature, prefer **a new module file** over extending an
  existing one. The `#include` in `rp.pwn` is the only wiring required.

## Things that have already gone wrong (so you don't repeat them)

1. **Tried to "return a string" from a Pawn function.** Doesn't work. Use a
   local buffer.
2. **Used C comma operator inside `strcat`.** Pawn rejects it.
3. **Forgot decrement counter for repeating timer** — passed the same value
   on every tick. Fix: use a `PVar` counter.
4. **Forward-reference into a not-yet-included module.** Direct function
   calls (not hooks) require the callee module to be `#include`d first in
   `rp.pwn`.
5. **Used `floatmin`** — not in stock Pawn float lib. Use explicit
   `if (x > limit) x = limit;`.

## Where to pick up next

The user was deciding whether to migrate this work to a different GitHub
account. Three sensible follow-ups regardless of the account question:

1. **Tutorial flow** for new characters (gender/age/skin pick, brief
   how-to-RP message).
2. **Faction-specific commands** — `/cuff /uncuff /arrest` for cops,
   `/heal /revive` for medics, `/news` for reporters.
3. **First end-to-end smoke test** on a real `samp03svr` or `omp-server`
   binary. Nothing has actually been compiled or run yet — there will be
   warnings / surprises on first build.
