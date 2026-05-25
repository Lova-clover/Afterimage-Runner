import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "src/main.js",
  "src/styles.css",
  "README.md",
  "docs/game-plan.md",
  "docs/submission-outline.md",
  "public/assets/player/runner_sheet.png",
  "public/assets/player/ghost_sheet.png",
  "public/assets/level/tileset.png",
  "public/assets/level/devices.png",
  "public/assets/level/hazards.png",
  "public/assets/level/collectibles.png",
  "public/assets/ui/hud_sheet.png",
  "public/assets/ui/tutorial_sheet.png",
  "public/assets/ui/logo_banners.png",
  "public/assets/vfx/rewind_vfx.png",
  "public/assets/generated/switch-pad.png",
  "public/assets/generated/record-marker.png",
  "public/assets/generated/laser-gate-closed.png",
  "public/assets/generated/laser-gate-open.png",
  "public/assets/generated/crystal-core.png",
  "public/assets/generated/exit-portal.png",
  "public/assets/generated/boost-orb.png",
  "public/assets/generated/small-platform.png",
  "public/assets/generated/lock-icon.png",
  "public/assets/generated/trophy-gold.png",
  "public/assets/generated/clear-badge.png",
  "public/assets/generated/runner-celebrate.png",
];

const spriteDirs = [
  "public/assets/player/sprites",
  "public/assets/level/sprites",
  "public/assets/ui/sprites",
  "public/assets/ui/slides",
  "public/assets/vfx/sprites",
  "public/assets/generated",
];

const forbidden = [
  "CHAOS POP",
  "Daily Quest",
  "Event Pass",
  "Coins",
  "STORY ART SLOT",
  "TUTORIAL ART SLOT",
  "Small and Heavy both matter",
  "One ghost cuts power",
  "Four echoes",
];

const requiredCodeMarkers = [
  "const rooms = [",
  "const introSlides = [",
  "MAX_GHOSTS = 4",
  "function calculateStageResult",
  "function saveStageResult",
  "function recordCueLabel",
  "function drawModeBadge",
  "function drawDashGate",
  "function drawPhaseGate",
  "function dashGateBroken",
  "function phaseGateOpen",
  "function playSfx",
  "localStorage.setItem(PROGRESS_KEY",
];

const spriteCropGuards = {
  "public/assets/level/sprites/crystal-pink.png": { maxWidth: 150, maxHeight: 150 },
  "public/assets/level/sprites/crystal-teal.png": { maxWidth: 155, maxHeight: 150 },
  "public/assets/level/sprites/laser-gate-pink.png": { maxWidth: 230, maxHeight: 130 },
  "public/assets/level/sprites/key-pink.png": { maxWidth: 140, maxHeight: 100 },
  "public/assets/player/sprites/hero-dash.png": { maxWidth: 320, maxHeight: 220 },
  "public/assets/vfx/sprites/dash-trail-teal.png": { maxWidth: 180, maxHeight: 90 },
  "public/assets/vfx/sprites/gate-streak-teal.png": { maxWidth: 520, maxHeight: 150 },
  "public/assets/vfx/sprites/gate-streak-pink.png": { maxWidth: 520, maxHeight: 150 },
  "public/assets/vfx/sprites/impact-teal.png": { maxWidth: 150, maxHeight: 130 },
  "public/assets/vfx/sprites/impact-pink.png": { maxWidth: 150, maxHeight: 100 },
  "public/assets/vfx/sprites/laser-impact.png": { maxWidth: 130, maxHeight: 150 },
  "public/assets/vfx/sprites/switch-glow.png": { maxWidth: 150, maxHeight: 140 },
};

const failures = [];

function fail(message) {
  failures.push(message);
}

function pngSize(path) {
  const bytes = readFileSync(path);
  if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

for (const file of requiredFiles) {
  const path = join(root, file);
  if (!existsSync(path)) {
    fail(`Missing required file: ${file}`);
    continue;
  }
  if (statSync(path).size <= 0) fail(`Empty required file: ${file}`);
}

for (const dir of spriteDirs) {
  const path = join(root, dir);
  if (!existsSync(path)) {
    fail(`Missing sprite directory: ${dir}`);
    continue;
  }
  const pngs = readdirSync(path).filter((item) => item.endsWith(".png"));
  if (!pngs.length) fail(`No PNG sprites in: ${dir}`);
}

for (const [file, guard] of Object.entries(spriteCropGuards)) {
  const path = join(root, file);
  if (!existsSync(path)) {
    fail(`Missing guarded sprite crop: ${file}`);
    continue;
  }
  const size = pngSize(path);
  if (!size) {
    fail(`Invalid PNG guarded sprite: ${file}`);
    continue;
  }
  if (size.width > guard.maxWidth || size.height > guard.maxHeight) {
    fail(`Suspicious sprite crop size: ${file} is ${size.width}x${size.height}, expected <= ${guard.maxWidth}x${guard.maxHeight}.`);
  }
}

const main = readFileSync(join(root, "src/main.js"), "utf8");
const html = readFileSync(join(root, "index.html"), "utf8");
const docs = ["README.md", "docs/game-plan.md", "docs/submission-outline.md"]
  .map((file) => readFileSync(join(root, file), "utf8"))
  .join("\n");
const allText = `${main}\n${html}\n${docs}`;

if (allText.includes("\uFFFD")) fail("Replacement character found in source text.");

for (const marker of requiredCodeMarkers) {
  if (!main.includes(marker)) fail(`Missing code marker: ${marker}`);
}

for (const term of forbidden) {
  if (allText.toLowerCase().includes(term.toLowerCase())) fail(`Forbidden legacy text found: ${term}`);
}

function extractArrayLiteral(source, constName) {
  const marker = `const ${constName} = [`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = source.indexOf("[", markerIndex);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

let rooms = [];
try {
  const roomsLiteral = extractArrayLiteral(main, "rooms");
  if (!roomsLiteral) throw new Error("rooms literal not found");
  rooms = Function(`"use strict"; return (${roomsLiteral});`)();
} catch (error) {
  fail(`Could not parse rooms array: ${error.message}`);
}

if (rooms.length !== 20) fail(`Expected 20 room definitions, found ${rooms.length}.`);

const officialRouteRooms = 12;
const officialParTime = rooms.slice(0, officialRouteRooms).reduce((total, room) => total + (Number(room?.parTime) || 0), 0);
const fullParTime = rooms.reduce((total, room) => total + (Number(room?.parTime) || 0), 0);
if (officialParTime > 600) fail(`Official ${officialRouteRooms}-room route par time is ${officialParTime}s, expected <= 600s.`);
if (fullParTime > 600) fail(`Full 20-room par time is ${fullParTime}s, expected <= 600s.`);

const itemTypes = new Set(["dash", "shrink", "grow", "phase"]);
const sizeNeeds = new Set(["small", "big"]);
rooms.forEach((room, index) => {
  const label = room?.chapter ?? `Room ${index + 1}`;
  if (room?.chapter !== `ROOM ${index + 1}`) fail(`${label}: chapter should be ROOM ${index + 1}.`);
  if (!room?.name) fail(`${label}: missing room name.`);
  if (!room?.tip || !room?.goal || !room?.clearLine || !room?.story) fail(`${label}: missing short copy or story.`);
  if (!Number.isFinite(room?.parGhosts) || room.parGhosts < 0 || room.parGhosts > 4) fail(`${label}: invalid parGhosts.`);
  if (!Number.isFinite(room?.parTime) || room.parTime < 10) fail(`${label}: invalid parTime.`);
  if (!room?.start || !room?.exit) fail(`${label}: missing start or exit.`);
  if (!Array.isArray(room?.cores) || room.cores.length < 1) fail(`${label}: at least one core is required.`);
  if (!Array.isArray(room?.switches) || !Array.isArray(room?.gates) || !Array.isArray(room?.lasers)) fail(`${label}: missing switch/gate/laser arrays.`);

  const switchIds = new Set((room.switches ?? []).map((sw) => sw.id));
  for (const gate of room.gates ?? []) {
    for (const need of gate.needs ?? []) {
      if (!switchIds.has(need)) fail(`${label}: gate ${gate.id} needs unknown switch ${need}.`);
    }
  }
  for (const laser of room.lasers ?? []) {
    for (const need of laser.offWhen ?? []) {
      if (!switchIds.has(need)) fail(`${label}: laser ${laser.id} references unknown switch ${need}.`);
    }
  }
  for (const item of room.items ?? []) {
    if (!itemTypes.has(item.type)) fail(`${label}: unknown item type ${item.type}.`);
  }
  for (const gate of room.sizeGates ?? []) {
    if (!sizeNeeds.has(gate.need)) fail(`${label}: invalid size gate need ${gate.need}.`);
    const itemType = gate.need === "small" ? "shrink" : "grow";
    if (!(room.items ?? []).some((item) => item.type === itemType)) fail(`${label}: ${gate.need} gate has no matching item.`);
  }
  for (const gate of room.dashGates ?? []) {
    if (!gate.id) fail(`${label}: dash gate is missing id.`);
    if (!Number.isFinite(gate.x) || !Number.isFinite(gate.y) || !Number.isFinite(gate.w) || !Number.isFinite(gate.h)) {
      fail(`${label}: dash gate ${gate.id ?? "unknown"} has invalid bounds.`);
    }
    const hasDashSource = gate.syncOnly || (room.items ?? []).some((item) => item.type === "dash");
    if (!hasDashSource) fail(`${label}: dash gate ${gate.id ?? "unknown"} has no dash item or sync source.`);
  }
  for (const gate of room.phaseGates ?? []) {
    if (!gate.id) fail(`${label}: phase gate is missing id.`);
    if (!Number.isFinite(gate.x) || !Number.isFinite(gate.y) || !Number.isFinite(gate.w) || !Number.isFinite(gate.h)) {
      fail(`${label}: phase gate ${gate.id ?? "unknown"} has invalid bounds.`);
    }
    if (!(room.items ?? []).some((item) => item.type === "phase")) fail(`${label}: phase gate ${gate.id ?? "unknown"} has no phase item.`);
  }
  for (const sw of room.switches ?? []) {
    if (sw.requires && !sizeNeeds.has(sw.requires)) fail(`${label}: invalid switch requirement ${sw.requires}.`);
    if (sw.requires) {
      const itemType = sw.requires === "small" ? "shrink" : "grow";
      if (!(room.items ?? []).some((item) => item.type === itemType)) fail(`${label}: ${sw.label} requires ${sw.requires} but has no matching item.`);
    }
  }
  const requiredGhostRoles = new Set();
  for (const gate of room.gates ?? []) for (const need of gate.needs ?? []) requiredGhostRoles.add(need);
  for (const laser of room.lasers ?? []) {
    if (laser.blockable && laser.requiresBlock) requiredGhostRoles.add(`laser:${laser.id}`);
  }
  if (requiredGhostRoles.size > 0 && room.parGhosts > requiredGhostRoles.size) {
    fail(`${label}: parGhosts ${room.parGhosts} is higher than obvious required roles ${requiredGhostRoles.size}.`);
  }
});

const slideMatches = [...main.matchAll(/type:\s*"(story|tutorial)"/g)];
if (slideMatches.length < 3) fail(`Expected at least 3 story/tutorial slides, found ${slideMatches.length}.`);

const spriteCount = spriteDirs.reduce((total, dir) => {
  const path = join(root, dir);
  return total + (existsSync(path) ? readdirSync(path).filter((item) => item.endsWith(".png")).length : 0);
}, 0);
if (spriteCount < 50) fail(`Expected at least 50 separated PNG assets, found ${spriteCount}.`);

if (failures.length) {
  console.error("Readiness check failed:");
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Readiness check passed.");
console.log(`Rooms: ${rooms.length}`);
console.log(`Slides: ${slideMatches.length}`);
console.log(`Separated PNG assets: ${spriteCount}`);
