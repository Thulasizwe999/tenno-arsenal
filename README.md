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
