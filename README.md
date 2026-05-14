# 잔상탈출: 러너-07

**Afterimage Runner** is a browser puzzle runner where failed movement becomes the next loop's equipment.

`REWIND RUNNER SYSTEM / Archive-20` is the experiment inside the story.  
The game itself is **잔상탈출: 러너-07**, also presented in English as **Afterimage Runner**.

> 실패한 네가, 다음 너를 구한다.

## Repository

Recommended repository name:

```text
afterimage-runner
```

Short, memorable, and aligned with the core mechanic: afterimages made from previous failed runs.

## Concept

Runner-07 has already escaped once.

Archive-20 deleted the successful memory and kept only failed traces. The player does not erase those failures. Instead, each recorded failure becomes a tool: a switch holder, a shield, a timing anchor, a key, or a dash partner.

This is not a game about perfect execution first.

It is a game about **designing useful failure**.

## Core Loop

```text
Run -> Record -> Reset -> Afterimage replays -> Cooperate with yourself -> Escape
```

1. Enter a compact room.
2. Move to a useful position or perform a useful route.
3. Press `R` to record the current loop.
4. The room resets, but the afterimage keeps the recorded action.
5. Use afterimages to hold switches, block beams, open gates, or sync a stronger dash.
6. Collect all cores and reach the exit.
7. Replay, optimize, and chase better stars, ghost counts, and times.

## Game Structure

The game has **20 rooms**.

- **Rooms 1-12**: official route for judging and first clear.
- **Rooms 13-20**: advanced archive route and true ending.

The official route is designed to communicate the main fun within 10 minutes. The full 20-room route adds more advanced mechanics and completes Runner-07's story.

```text
01 First Record        02 Late Footprint       03 Blocking Myself
04 Second Hand         05 Crossed Timing       06 Wrong Record
07 Unclosing Door      08 Shielded Record      09 Shared Timing
10 Sorted Failure      11 Almost Perfect Loop  12 Official Exit
13 Deletion Deferred   14 Unauthorized Memory  15 Broken Sync
16 Saving Myself       17 Deletion Room        18 Final Sync
19 Record Zero         20 True Door
```

## Highlights

- Previous loops replay as visible afterimages.
- Stars are based on clear time and ghost count.
- Best routes are stored as faint PB pace lines.
- Clearing with better timing unlocks platinum-style designer targets.
- Result screens show a short "loop chorus" replay of Runner-07 and the afterimages.
- The story is embedded into room names, goals, endings, and failure logs.

## Controls

| Action | Key |
| --- | --- |
| Move | `WASD` / Arrow keys |
| Dash | `Space` |
| Record current loop | `R` |
| Sync near afterimage | `E` |
| Delete last afterimage | `Z` |
| Pause | `Esc` / `P` |

## Tech Stack

- Vite
- Vanilla JavaScript
- HTML Canvas
- CSS
- Local storage for progress and personal best routes

No account, payment, server, or external API key is required to play.

## Project Layout

```text
.
├─ index.html
├─ src/
│  ├─ main.js
│  └─ styles.css
├─ public/
│  └─ assets/
│     ├─ level/
│     ├─ player/
│     ├─ ui/
│     └─ vfx/
├─ scripts/
│  └─ readiness-check.mjs
├─ docs/
│  ├─ game-plan.md
│  └─ submission-outline.md
├─ package.json
└─ package-lock.json
```

Generated folders such as `dist/`, `output/`, `.playwright-cli/`, and `test-results/` are intentionally ignored.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local Vite URL in a browser.

## Build

```bash
npm run build
```

## Readiness Check

```bash
npm run verify
```

The readiness check validates the room count, story slide count, asset availability, and route-time constraints.

## Submission Positioning

**One-line pitch**

> A puzzle runner where failed movement becomes the next loop's equipment.

**Korean pitch**

> 실패한 움직임을 기록해 다음 루프의 스위치, 방패, 열쇠로 쓰는 웹 퍼즐 러너.

**Core hook**

> 완벽한 플레이보다 쓸모 있는 실패가 중요하다.

## License

This repository uses a split license:

- Source code is licensed under the MIT License.
- Game assets, story text, level design, logo, branding, and other creative content are reserved by the project authors.

See [LICENSE](./LICENSE) for details.
