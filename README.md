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
