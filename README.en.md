# Afterimage Runner

<p align="center">
  <strong>English</strong> · <a href="./README.md">한국어</a>
</p>

<p align="center">
  <img src="./docs/images/hero-menu.png" alt="Afterimage Runner main menu" width="960" />
</p>

<p align="center">
  <strong>A browser puzzle runner where failed movement becomes equipment for the next loop.</strong><br />
  <code>REWIND RUNNER SYSTEM / Archive-20</code>
</p>

> Your failed self saves your next self.

## Elevator Pitch

**Afterimage Runner** is a browser-based puzzle runner about recording failed movement and reusing it as switches, shields, keys, and timing anchors in the next loop.

You control Runner-07 inside Archive-20, a facility that wants to erase imperfect records. The game turns that premise around: the player does not delete failure. The player designs it.

```text
Run.
Fail.
Record.
Return with your afterimage.
Open the door together.
```

## What Makes It Different

- **Failure becomes a resource**: a failed route is not just a reset state. It can become a working tool in the next attempt.
- **Puzzle logic and action timing share one screen**: switches, lasers, dash walls, phase barriers, and paradox pressure are solved through movement.
- **Built for short judging sessions**: the 12-room official route teaches the full loop quickly, while the 20-room true route proves depth.
- **Replay motivation is built in**: stars, best times, designer routes, replay summaries, and the endless tower give players a reason to return.
- **Story and system reinforce each other**: Runner-07 escapes by carrying every failed self forward.

## Screenshots

| Main Menu | Stage Select |
| --- | --- |
| <img src="./docs/images/hero-menu.png" alt="Main menu and mechanic preview" width="470" /> | <img src="./docs/images/stage-select.png" alt="Stage select with official and unauthorized routes" width="470" /> |

| Gameplay | Route Shift Briefing |
| --- | --- |
| <img src="./docs/images/room-03-afterimage-hook.png" alt="Gameplay screen with afterimage recording and dash wall logic" width="470" /> | <img src="./docs/images/route-shift-briefing.png" alt="Room 13 briefing where the player leaves the official route" width="470" /> |

## Game Structure

| Section | Description |
| --- | --- |
| Rooms 1-12 | Official route. Teaches recording, afterimages, switches, lasers, dash, sync, and form changes. |
| Rooms 13-20 | Unauthorized archive route. Adds timeline distortion, phase gates, paradox collisions, and pursuit pressure. |
| Room 12 target | Official escape target: 5 minutes 30 seconds total. |
| Room 20 target | True door target: 10 minutes total. |
| Endless Tower | Post-game advanced-room variant challenge unlocked after clearing Room 20. |

### Room List

```text
01 First Record          02 Late Footprint       03 Blocking Myself
04 Second Hand           05 Crossed Timing       06 Wrong Record
07 Unclosing Door        08 Shielded Record      09 Shared Timing
10 Sorted Failure        11 Almost Perfect Loop  12 Official Exit

13 Deletion Deferred     14 Unauthorized Memory  15 Broken Sync
16 Saving Myself         17 Deletion Room        18 Final Sync
19 Record Zero           20 True Door
```

## Core Mechanics

| Mechanic | Role |
| --- | --- |
| Afterimage recording | Press `R` to save the current loop and replay it as a ghost in the next loop. |
| Switch holding | A past self holds a switch while the current self passes through the opened path. |
| Beam blocking | A stopped afterimage can act as a shield against lasers. |
| Dash walls | Barriers that require boost or sync dash timing. |
| Sync dash | Press `E` near a ghost to chain a stronger dash. |
| Form change | Record small and heavy routes to solve different switch and gate requirements. |
| Phase | Temporarily pass through sealed archive barriers. |
| Paradox | From Room 13 onward, colliding with an afterimage collapses the loop. |
| Endless Tower | Reuses Rooms 13-20 with floor-based speed, time pressure, and added hazards. |

## Controls

| Action | Key |
| --- | --- |
| Move | `WASD` / Arrow keys |
| Dash / break through | `Space` |
| Record current loop | `R` |
| Sync | `E` |
| Delete last recording | `Z` |
| Pause | `Esc` / `P` |

Mobile play includes a virtual D-pad and action buttons for dash, record, sync, delete, and pause.

## Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build and Verify

```bash
npm run build
npm run verify
```

`npm run verify` checks the submission-critical basics:

- 20 rooms
- 7 slides
- separated PNG assets
- official and true-route timing constraints

## Tech Stack

| Area | Details |
| --- | --- |
| Runtime | Vite, Vanilla JavaScript |
| Rendering | HTML Canvas |
| UI | HTML, CSS, responsive overlays |
| Persistence | LocalStorage progress, best times, and best route data |
| Assets | Separated PNG sprites, UI slides, and VFX |

No server, account, payment flow, or API key is required.

## Project Layout

```text
.
├─ index.html
├─ src/
│  ├─ main.js          # Game state, room data, collision, loops, results
│  └─ styles.css       # UI, responsive layout, modals, mobile controls
├─ public/
│  └─ assets/          # Player, level, UI, and VFX PNG assets
├─ docs/
│  └─ images/          # Current README screenshots
├─ scripts/
│  └─ readiness-check.mjs
├─ package.json
└─ README.md
```

## Submission Hook

The entire game can be understood through one short sequence:

1. The current self runs to a switch.
2. The player records that failed route with `R`.
3. The afterimage holds the switch in the next loop.
4. The current self escapes through the opened path.

That is the promise of the game:

> Failure is not the end. It is equipment for the next self.

## License

This repository uses a split license.

- Source code is available under the MIT License.
- Game assets, story text, room design, logo, branding, screenshots, and other creative content are reserved by the project authors.
- Web typography uses **Galmuri11** by Minseo Lee under the SIL Open Font License 1.1.

See [LICENSE](./LICENSE) for details.
