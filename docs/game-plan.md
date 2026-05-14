# 잔상탈출: 러너-07 Game Plan

## One Line

실패한 움직임을 다음 루프의 장비로 쓰는 퍼즐 러너. 완벽한 플레이보다 쓸모 있는 실패를 설계하는 게임.

## Design Goal

The game should feel readable in the first 10 seconds:

```text
Switch on
Press R
Afterimage stays
Gate opens
Run with your failed self
```

No long explanation screens. Story and tutorial copy stay short, sharp, and attached to player action.

## Room Progression

Rooms 1-12 are the official 10-minute clear route for judging.
Rooms 13-20 are advanced archive rooms for players who want the true ending.
The story is about Runner-07 refusing to delete failed selves and carrying them out of Archive 20.

```text
ROOM 1 - 첫 기록
Learn that a recorded ghost can hold a switch.

ROOM 2 - 늦은 발자국
Learn that beams can be avoided or interrupted by afterimages.

ROOM 3 - 막아선 나
Learn that boost gates only break when the player commits with Space.

ROOM 4 - 두 번째 손
Record one switch ghost, sync near it with E, then spend that charge on a dash gate.

ROOM 5 - 엇갈린 타이밍
Use Heavy and Small bodies as required ghost roles.

ROOM 6 - 잘못된 기록
Use both Small and Heavy states in one compact room.

ROOM 7 - 닫히지 않는 문
Layer switch timing and a non-forced laser hazard.

ROOM 8 - 방패가 된 기록
Use four ghosts to overlap the first full rule set.

ROOM 9 - 동시에 밟는 마음
Make dash mandatory by putting the core route behind a boost gate.

ROOM 10 - 정리된 실패
Split the room into Small and Heavy lanes with two required cores.

ROOM 11 - 거의 완벽한 루프
Navigate two beams while a switch ghost holds the main gate.

ROOM 12 - 공식 탈출
Official ending: the archive offers a clean result and deletion of failed logs.

ROOM 13 - 삭제 보류
Introduce the Phase core. It temporarily disables purple collision walls.

ROOM 14 - 비인가 기억
Combine one held switch with one timed Phase pass.

ROOM 15 - 망가진 동기화
Use Small and Heavy ghosts, then route the current runner through a Phase wall.

ROOM 16 - 나를 구하는 나
Layer Phase entry, optional beam protection, and a boost exit.

ROOM 17 - 삭제실
Two switches and one laser ghost feed into a Sync dash finish.

ROOM 18 - 마지막 싱크
Collect two cores through Small and Heavy lanes, then merge through Phase.

ROOM 19 - 0번째 기록
Four ghost roles support a current-run Phase and boost chain.

ROOM 20 - 진짜 문
True ending: Runner-07 carries every deleted failure out of Archive 20.
```

## Visual Rules

```text
Current runner: white and teal.
G1: teal.
G2: pink.
G3: gold.
G4: purple.
Danger: pink.
Interactive/safe: teal.
Goal/core: gold or crystal.
Small item: teal crystal.
Heavy item: pink crystal.
Phase item: purple crystal.
Phase wall: purple, passable only while the Phase timer is active.
```

## Polish Priorities

```text
1. Ghost labels above each ghost.
2. Switch-to-gate connection lines.
3. Lasers split when a ghost blocks them.
4. Gate opening VFX.
5. Short toasts for record, core, gate, sync, fail.
6. Stage records: stars, best time, ghost count.
7. Loop-chain bonus: solving conditions in sequence shaves tenths of a second from the stage timer.
```
