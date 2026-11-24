# Tenno Arsenal — complete Warframe tracker

A mobile-friendly, single-page Warframe mastery, inventory and farming tracker.

## Publish and use

This repository contains a **self-contained `index.html`**, a small icon, install manifest and optional service worker. To enable the permanent site, open **Settings → Pages** in GitHub, choose **Deploy from a branch**, branch **main**, folder **/(root)**, then Save. The site should become available at:

https://thulasizwe999.github.io/tenno-arsenal/

The live app is updated by changes to `index.html` on the same branch, without installing new ZIP packages.

## Your private profile

**There is no personal player inventory in this public repository.** The private import file `Tenno_Arsenal_Full_Private_Import.json` was delivered separately in ChatGPT. In the app, select **Restore collection**, choose that JSON once, then use **Backup** to save updates in a private location (e.g. OneDrive). The browser stores your data locally; there is not yet cross-device automatic sync.

Do not commit any private player collection backup, video screenshots or data extracts to this repository.

## Functionality

- Mastery, current ownership, blueprints, components and Helminth subsuming for Warframes, weapons, companions, robotic weapons, vehicles, Necramechs, Amps, modular items, Arch-Guns and Arch-Melees
- Mod quantities **at individual ranks**, including duplicates, plus in-game-inspired card and compact table views
- Arcanes, Rivens, normal star chart, Steel Path, Drifter/Railjack intrinsics and notes/trades
- Session planner, including ready-to-level, partially crafted equipment and farming targets
- Public game catalogue from a packaged baseline and live daily refresh attempts from [WFCD/warframe-items](https://github.com/WFCD/warframe-items)

**Limitations:** Community catalogue refresh may lag new Warframe releases or partially fail; the app shows the last check. The app cannot automatically read your PlayStation owned/mastered status. The imported workbook records historical progress from March 2026 and only manually verified November 2026 video inventory changes; uncertain readings are retained for review, not silently applied.

## Game progression (new)

The public `progression.js` module extends the existing `World & story` screen with separate tabs for:

- **Star chart:** individual mission-node completion in Normal and Steel Path; mission names are loaded from the public [WFCD Warframe Worldstate Data](https://github.com/WFCD/warframe-worldstate-data) and can be refreshed or manually extended
- **Quests:** main story and side-quest states including the October 2026 Prologue to Tau; incomplete and unrecorded are distinct
- **Focus schools:** five schools, per-ability rank, Waybound unlocks, Focus balances and Tauron unlocks
- **Archon Shards:** 6 colours, Tauforged or standard, spare stock and installed slots by Warframe
- **Intrinsics:** all five Railjack and four Drifter skill trees, each with a rank 0–10 or unknown; old workbook totals remain unchanged
- **Milestones:** additional game activity and system unlocks

Game progress is stored within the same **private browser profile** as equipment and mods; no replacement import is necessary if an existing full profile is already loaded. JSON backups include the added fields. Personal progress is not committed to this public repository.

**Accuracy:** historical planet checkmarks do *not* imply all missions are done. The source workbook has no Focus/shard/quest specifics; their initial status is unknown, not zero/incomplete. The external node list can contain incomplete or outdated community names; use the game as authority. Equipment catalogues and mission-node names have refresh features; the quest and Focus reference lists are currently maintained in the app code, not synchronized from PlayStation.


## Syndicates & game-mode progress (November 2026)

Within **World & story**, the following additional tabs are available:

- **Syndicates:** 20 currently trackable factions (six Relay, ten Open-world, four Specialist), with per-faction rank, Standing/resource progress, pledge, next target and notes. Includes Nightcap's Field Guide rank/mushroom count, which does not use normal Standing. Supports adding custom/future factions.
- **Game modes:** 44 missions, weekly endgame activities, Duviri variants, open-world bounties, adversaries, Nightwave, the 1999 Calendar, Railjack, collection systems, and optional modes. Progress is manually marked unknown/locked/available/in progress/completed, with optional numeric count and a farming goal. Only actionable entries become session-plan tasks. Repeatable entries never auto-reset, preventing misleading completion status.
- **1999 KIM:** chemistry notes and next goals for six original Hex KIM members plus Marie, Lyon and Roathe in The Old Peace GIM, with custom contacts.

**Current as of 24 November 2026:** The Icebind released on 7 October 2026 and can be tracked. Warframe: Tau and **The Cleaving Glaive** Syndicate were announced for December 2026 and are deliberately *not* marked playable. Future Syndicate/mode names are a manually maintained reference list; unlike the item catalogue, this list does not auto-sync to every game release.

For factual context, see Digital Extremes' [Syndicates support guide](https://support.warframe.com/hc/en-us/articles/38802406697229-Syndicates), [The Vallis Undermind notes](https://www.warframe.com/en/patch-notes/ios/40-0-0), [The Icebind update](https://www.warframe.com/en/patch-notes/psn/44-1-0) and [Devstream 198](https://www.warframe.com/en/news/198).

The public repository contains reference lists and UI code only; **no personal ranks, Standing, mushroom counts, Hex chemistry or mission completion data**.


## Progression command centre (home screen)

The **Command centre** replaces the old equipment-only homepage with an overview of real game progress, preserving all original profile data:

- Six quick metrics: mastery, quests, individually recorded star-chart nodes, Syndicates, Intrinsics and immediately actionable activities/equipment
- Review coverage across quests, Focus abilities, intrinsics, Syndicates, modes and system unlocks — clearly labelled **records reviewed**, not a false overall game completion percentage
- **Next useful actions** from the session planner and a daily/weekly pulse. Repeatable activities are never automatically marked complete across resets
- **Quick reference** for saved Syndicate ranks/Standing, Focus schools, Railjack/Drifter Intrinsics and Archon Shard spare quantities/installed count
- **Efficient in-game verification route:** Orbiter, Navigation, hub vendors and specialised systems. Each progression area shows where to find its in-game information
- Individual **Mark checked** controls record the date you last verified a section in-game. They do not set any quest, node, activity or collection item to Complete
- Links into all 12 progression areas without having to remember where the corresponding information lives within the tracker

**Privacy and accuracy:** The home screen is entirely generated from your *browser-local* private profile and the *public* game catalogue. No personal Standing, Focus ranks, shards, task history or review dates are committed to this repository. An empty browser shows an import prompt, never another player's data. Mission completion and new account progress cannot be retrieved automatically from PlayStation. Private profile backups remain the way to migrate between devices.

**Review freshness:** Daily rows older than one day and weekly rows older than seven days are labelled for rechecking. Those are reminders, not a claim to match Warframe's exact reset boundaries.
