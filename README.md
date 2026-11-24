# Tenno Arsenal

A private-by-default Warframe companion tracker you can open on desktop or mobile. It brings mastery, inventory, mission completion, Syndicates, Nightwave and your gaming-session priorities into one place.

**[Open the app](https://thulasizwe999.github.io/tenno-arsenal/)**

## Main features

- **Command centre:** recorded game progress at a glance, review dates, quick-reference rank/Standing/shards/Intrinsics values, and suggested next actions
- **Equipment and mastery:** Warframes, weapons, Archwings, companions, Necramechs, Amps and modular items, including blueprints, components and Helminth
- **Mod collection:** duplicate quantities, individual mod ranks, filters and farming targets
- **Mastery audit:** estimated XP by category, partial ranks on rank-40 gear, mission and Intrinsic estimates, and comparison with manually entered official in-game XP
- **World & story:** individual star-chart nodes (Normal and Steel Path separately), quests, Focus trees, Archon Shards, Intrinsics, faction Syndicates, activities and relationship progress
- **Nightwave:** season rank, Prestige, Cred balance, standing into a rank, 30 reward-claim checks, Daily/Weekly/Elite/Permanent Acts, plus a public current-Acts feed and manual personal progress
- **Session planner, Arcanes, Rivens, notes and trading**

## Normal versus Steel Path completion

A one-time personal-profile update marks the **322 current, supported Normal mission entries** in the bundled 24 November 2026 public node catalogue as **Completed**. This includes all categories returned by that source, not only mastery-awarding missions. It runs **only once** for a loaded private player profile.

- **Steel Path is never changed** by this update.
- New nodes discovered in a later data refresh remain **Unknown**.
- Any Normal node you manually change later stays as you set it, even after reloading or refreshing the catalogue.
- A deliberate **Mark all Normal complete** button is also available with a confirmation prompt.
- A manually marked-complete mission is **not** proof of its exact mastery XP. Verify mastery against your game profile.

## Nightwave

The built-in season reference is **Amir's Shockwave** (started 12 August 2026), but you can set a different season and archive progress when it rotates. Public Acts are fetched from the WarframeStatus world-state API when available. The public feed does **not** provide individual PlayStation account completions. Your personal Act status remains manual and private.

Official information: https://www.warframe.com/en/nightwave

## Keeping your progress safe

Your collection and progress are stored in **your browser's local storage**. They are **not** committed to this public GitHub repository and are not automatically synchronised between devices.

Select **Backup** in the app to save your complete private JSON file to OneDrive or another location you control. Use **Restore** in a new browser or device. Do not clear your browser/site storage without keeping a backup.

GitHub Pages hosts the app's public code. Future UI/catalogue updates go to the **same app address** and do not require a replacement ZIP. Public item lists refresh from community data when possible; game account data does not automatically synchronise.

## Data sources and limitations

- Equipment and mod reference: WFCD warframe-items
- Star-chart mission names: WFCD warframe-worldstate-data
- Public Nightwave Acts: WarframeStatus API
- Personal PlayStation progress: entered or imported by the player

Sources can change or lag a game patch. Some special mission entries are present in the public mission catalogue even though they do not award star-chart mastery. The game and its player profile remain authoritative.

This is an independent fan tracker, not affiliated with Digital Extremes.


## One-time Companion-app inventory reconciliation

The app provides **Settings → Merge a verified inventory capture** for a section-only import.

When a Companion app recording has been reviewed, create a `tenno-arsenal-inventory-patch` version 1 JSON containing only **observed and verified** fields. Supported sections: Arcanes (rank, extra copies, optional copies by rank), spare Archon Shards (six colours, Standard and Tauforged), Syndicate ranks/Standing, Nightwave season and Acts, and optionally known equipment owned/blueprint status.

The app shows a **before/after preview** and requests confirmation. It automatically downloads a full private backup before applying any changes. The merge deliberately leaves unmentioned items unchanged and preserves quests, mission nodes, mastery, mods, installed shards and notes. If some screenshots are unreadable, omit those fields and review them in-game rather than writing zero.

**Do not use full-profile Restore for a small inventory refresh:** Restore replaces the local collection. The dedicated inventory merge is designed to preserve any updates made since the previous imported snapshot.

The data patch, like the profile backup, is **private** and should not be committed to this public repository.


## Star-chart maps and in-game progress capture

The World & story star chart is now divided into independent maps:

- **Origin System** — regular planet missions, separately tracking Normal and Steel Path
- **Railjack Proxima** — Earth, Venus, Saturn, Uranus, Neptune, Pluto and Veil Proxima; Normal and Steel Path tracked separately
- **Höllvania 1999** — NavNow's main missions and Faceoff variants (mode-level reference, not an Origin XP node list)
- **Duviri** — Circuit, Lone Story and Duviri Experience
- **Hubs & special** — relays, free-roam destinations and inactive special entries that should not be mistaken for standard mission-clear nodes

The public mission list includes WFCD entries and official 2026 Uranus Proxima missions, which may not yet appear in the community feed. Chart grouping does not itself affect any player's saved mission status.

### Safe game-progress capture

**Import inventory → Choose verified update JSON** accepts a private, reviewable one-off game-progress snapshot in the same `tenno-arsenal-inventory-patch` format as a Companion capture. Supported values include:

- Game-profile official mastery XP, full category breakdown, Mastery Rank and XP to next rank
- Profile-confirmed Origin System Normal and Steel Path completion totals
- Focus school unlocked/active status and unspent Focus
- Railjack and Drifter Intrinsics ranks, and unspent Intrinsics
- Installed Archon Shards confirmed in-game (separate from spare inventory)
- Explicit selected mission-map completion changes, previewed before applying

The importer validates the XP breakdown, displays a before/after review, downloads a private backup, and merges only the specified values. A unique capture ID prevents importing the same in-game snapshot twice and overwriting later manual changes. Other progress, including Companion inventory, is retained.

**Do not commit player-profile screenshots, mastery totals, Focus balances or progress JSON to this public repository.** Personal data is stored only in the browser's private profile and its local backups.


## Incremental in-game confirmations

The verified-update importer also accepts a **small, one-time gameProgressDelta** file for selected progression information without requiring a new full account snapshot:

- **Drifter or Railjack Intrinsics**: only explicitly confirmed individual track ranks, plus unspent points
- **Quest journal**: individual Codex quest status, including newly added quests; unseen quests are unchanged
- **Helminth metamorphosis**: rank/level, current XP, next threshold and aggregate unlocked-ability count; this never pretends to know which individual abilities were unlocked

All changes appear in the preview before applying, and a private backup is downloaded first. Previously imported mastery, mission statuses, shards, Arcanes, equipment, Mods, Syndicates and notes remain intact. Each verified update has a unique capture ID and is a no-op on subsequent imports, preventing the same screenshot from overwriting later manual edits.

Helminth summary is available under **World & story → Helminth**, with a quick-reference tab on the Command Centre. The app's public code contains no player's personal Helminth, quest or Intrinsics values.
