# Tenno Arsenal — Complete Warframe tracker

A mobile-friendly web app for **all sections** of the SpineCrown tracker: Warframes, primary/secondary/melee weapons, companions, adversary and robotic weapons, vehicles, Necramechs, Arch-Guns/Melees, amps and modular items; equipment mastery, owned state, blueprints, crafting components and subsuming; mod duplicates and individual upgrade ranks; Arcanes; Rivens; star chart and Steel Path; intrinsics; a session planner; trading; and notes.

## Getting started

1. Enable GitHub Pages in **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
2. Open **https://thulasizwe999.github.io/tenno-arsenal/**.
3. Use **Restore collection** once and select the separately supplied `Tenno_Arsenal_Full_Private_Import.json`. **Do not upload that file here.**
4. Use **Backup** periodically to save your player progress privately (e.g., OneDrive). Your changes are stored in the browser, not in this repository.

## Current game catalogue

The public starter catalogue is built into `index.html`. When online, the app checks the [WFCD warframe-items](https://github.com/WFCD/warframe-items) item catalogue approximately once per 24 hours, and offers a manual **Update game data** button. New items are merged without overwriting saved ownership, mastery, duplicate or rank records. WFCD is community maintained and may lag a game patch.

## Privacy and limitations

This **public** repository contains app code and public item metadata only. The owner's personal inventory, spreadsheet progression and video review are supplied separately and remain on the user's device after import. Never commit a private backup, raw video, or user data here.

PlayStation does not expose a complete player inventory to the website, so gameplay changes need updating manually or importing a verified reconciliation. There is no cross-device automatic personal-profile sync yet. The original Google Sheet is unchanged.

The initial personal import is based on the March 2026 Google Sheet and manually verified November 2026 video corrections; uncertain video text readings are preserved as an audit rather than applied to mod quantities.
