const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const els = {
  goalTime: document.getElementById("goalTime"),
  fuel: document.getElementById("fuelReadout"),
  score: document.getElementById("scoreReadout"),
  speed: document.getElementById("speedReadout"),
  needle: document.getElementById("speedNeedle"),
  target: document.getElementById("targetReadout"),
  trim: document.getElementById("trimReadout"),
  engineSlider: document.getElementById("engineSlider"),
  throttle: document.getElementById("throttleReadout"),
  throttleGauge: document.getElementById("throttleGauge"),
  voyageProgress: document.getElementById("voyageProgress"),
  currentLegendRow: document.getElementById("currentLegendRow"),
  currentLegendIcon: document.getElementById("currentLegendIcon"),
  currentLegendTitle: document.getElementById("currentLegendTitle"),
  currentLegendText: document.getElementById("currentLegendText"),
  windLegendRow: document.getElementById("windLegendRow"),
  windLegendIcon: document.getElementById("windLegendIcon"),
  windLegendTitle: document.getElementById("windLegendTitle"),
  windLegendText: document.getElementById("windLegendText"),
  sailButton: document.getElementById("sailButton"),
  current: document.getElementById("currentReadout"),
  currentHelp: document.getElementById("currentHelp"),
  wind: document.getElementById("windReadout"),
  windHelp: document.getElementById("windHelp"),
  sailTip: document.getElementById("sailTip"),
  leaves: document.getElementById("leafRow"),
  bonus: document.getElementById("bonusReadout"),
  message: document.getElementById("message"),
  start: document.getElementById("startButton"),
  pause: document.getElementById("pauseButton"),
  restart: document.getElementById("restartButton"),
  difficultyButtons: document.querySelectorAll("[data-difficulty]"),
};

const shipImage = new Image();
shipImage.src = "assets/ship-sprites.png";
const obstacleImage = new Image();
obstacleImage.src = "assets/obstacle-sprites.png";
const islandImage = new Image();
islandImage.src = "assets/island-sprites.png";
const obstacleFrames = [
  { x: 50, y: 70, w: 560, h: 760 },
  { x: 650, y: 260, w: 340, h: 390 },
  { x: 1140, y: 105, w: 235, h: 690 },
  { x: 1440, y: 105, w: 230, h: 690 },
];
const islandFrames = [
  { x: 150, y: 48, w: 830, h: 410 },
  { x: 1160, y: 120, w: 310, h: 230 },
  { x: 350, y: 472, w: 470, h: 340 },
  { x: 1075, y: 400, w: 390, h: 430 },
];
const DIFFICULTIES = {
  easy: { label: "Easy", distance: 12 },
  medium: { label: "Medium", distance: 24 },
  hard: { label: "Hard", distance: 36 },
  captain: { label: "Kick-Ass Captain", distance: 48 },
};
const DISTANCE_TIME_SCALE = 90;
const MAX_SHIP_SPEED = 25;

const keys = new Set();
const world = {
  running: false,
  done: false,
  paused: false,
  time: 0,
  phaseTimer: 0,
  spawnTimer: 0,
  wake: 0,
  currentIndex: 1,
  windIndex: 0,
  obstacles: [],
  particles: [],
  score: 0,
  distance: 0,
  goalDistance: DIFFICULTIES.medium.distance,
  difficulty: "medium",
  bonusBank: 0,
  fuel: 100,
};

const ship = {
  x: canvas.width * 0.5,
  y: canvas.height * 0.66,
  angle: 0,
  throttle: 0,
  speed: 12,
  sails: false,
  invulnerable: 0,
  bump: 0,
  recenter: 0,
  recenterFromX: canvas.width * 0.5,
  recenterFromY: canvas.height * 0.66,
};

const currents = [
  {
    name: "Following current",
    force: 2.4,
    color: "rgba(83, 232, 209, 0.78)",
    label: "CURRENT FROM BEHIND",
    help: "The current pushes you forward. Lower gasoline throttle to save fuel.",
  },
  {
    name: "Opposing current",
    force: -2.8,
    color: "rgba(255, 95, 95, 0.72)",
    label: "CURRENT FROM AHEAD",
    help: "The current slows the ship. Use more gasoline only if needed.",
  },
];

const winds = [
  {
    name: "Strong tailwind",
    force: 2.2,
    color: "rgba(255, 255, 255, 0.68)",
    label: "STRONG WIND FROM BEHIND",
    help: "Deploy wing sails. This is the best time to save gasoline.",
  },
  {
    name: "Light tailwind",
    force: 0.6,
    color: "rgba(255, 255, 255, 0.44)",
    label: "LIGHT WIND FROM BEHIND",
    help: "Sails help a little, but gasoline does most of the work.",
  },
  {
    name: "Strong headwind",
    force: -1.9,
    color: "rgba(255, 201, 93, 0.72)",
    label: "STRONG WIND FROM AHEAD",
    help: "Reef the sails. Headwind costs speed.",
  },
  {
    name: "Light headwind",
    force: -0.5,
    color: "rgba(255, 201, 93, 0.46)",
    label: "LIGHT WIND FROM AHEAD",
    help: "Sails do not help much. Keep gasoline steady and efficient.",
  },
];

for (let i = 0; i < 6; i += 1) {
  const leaf = document.createElement("i");
  els.leaves.appendChild(leaf);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(900, Math.floor(rect.width * ratio));
  canvas.height = Math.max(520, Math.floor(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function gameSize() {
  return { w: canvas.clientWidth || 1280, h: canvas.clientHeight || 720 };
}

function reset() {
  const { w, h } = gameSize();
  const difficulty = DIFFICULTIES[world.difficulty] || DIFFICULTIES.medium;
  world.running = true;
  world.done = false;
  world.paused = false;
  world.time = 0;
  world.phaseTimer = 0;
  world.spawnTimer = 0;
  world.wake = 0;
  world.currentIndex = 1;
  world.windIndex = 0;
  world.obstacles = [];
  world.particles = [];
  world.score = 0;
  world.distance = 0;
  world.goalDistance = difficulty.distance;
  world.bonusBank = 0;
  world.fuel = 100;
  ship.x = w * 0.5;
  ship.y = h * 0.66;
  ship.angle = 0;
  ship.speed = 10;
  ship.sails = false;
  ship.invulnerable = 0;
  ship.bump = 0;
  ship.recenter = 0;
  ship.recenterFromX = ship.x;
  ship.recenterFromY = ship.y;
  seedStartingObstacles(w, h);
  els.message.classList.add("hidden");
  els.message.classList.remove("end-state");
  els.pause.textContent = "Pause";
  els.sailButton.setAttribute("aria-pressed", "false");
  els.sailButton.textContent = "Deploy wing sails";
  setEngineThrottle(Number(els.engineSlider.value || 25));
}

function showSplash() {
  world.running = false;
  world.done = false;
  world.paused = false;
  keys.clear();
  els.pause.textContent = "Pause";
  els.start.textContent = "Start voyage";
  els.message.classList.remove("hidden", "end-state");
  els.message.querySelector("strong").textContent = "Sustainability Shipping Game";
  els.message.querySelector(".splash-copy").textContent = "Pilot a hybrid engine-and-sail vessel through changing sea conditions.";
}

function setSails(on) {
  ship.sails = on;
  els.sailButton.setAttribute("aria-pressed", String(on));
  els.sailButton.textContent = on ? "Reef wing sails" : "Deploy wing sails";
}

function setEngineThrottle(percent) {
  const throttlePercent = clamp(percent, 0, 100);
  ship.throttle = throttlePercent / 100;
  els.engineSlider.value = String(Math.round(throttlePercent));
}

let audioContext;
function playHorn() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audioContext ||= new AudioContext();
  const now = audioContext.currentTime;
  [0, 0.42].forEach((offset) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now + offset);
    osc.frequency.exponentialRampToValueAtTime(118, now + offset + 0.28);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.2, now + offset + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.34);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.36);
  });
}

function addObstacle(type, x, y) {
  const { w } = gameSize();
  const obstacleType = type || (Math.random() < 0.5 ? "island" : "ship");
  world.obstacles.push({
    type: obstacleType,
    x: x ?? rand(80, w - 80),
    y: y ?? -80,
    r: obstacleType === "island" ? rand(64, 96) : 50,
    drift: rand(-11, 11),
    speed: rand(34, 68),
    spin: rand(-1, 1),
    angle: rand(-0.2, 0.2),
    seed: rand(0, 1000),
    variant: obstacleType === "island" ? Math.floor(rand(0, 4)) : Math.floor(rand(0, 2)),
  });
}

function seedStartingObstacles(w, h) {
  addObstacle("island", w * 0.18, h * -0.04);
  addObstacle("ship", w * 0.82, h * -0.24);
}

function spawnObstacle() {
  const { w } = gameSize();
  const types = ["island", "ship"];
  const type = types[Math.floor(Math.random() * types.length)];
  addObstacle(type, rand(80, w - 80), -80);
}

function changePhase() {
  let nextCurrent = Math.floor(Math.random() * currents.length);
  let nextWind = Math.floor(Math.random() * winds.length);
  if (nextCurrent === world.currentIndex) nextCurrent = (nextCurrent + 1) % currents.length;
  if (nextWind === world.windIndex) nextWind = (nextWind + 1) % winds.length;
  world.currentIndex = nextCurrent;
  world.windIndex = nextWind;
}

function update(dt) {
  if (!world.running || world.done || world.paused) return;

  const { w, h } = gameSize();
  const current = currents[world.currentIndex];
  const wind = winds[world.windIndex];
  const tailwindSailDrive = ship.sails && wind.force > 0 ? wind.force * 1.35 : 0;
  const headwindSailDrag = ship.sails && wind.force < 0 ? Math.abs(wind.force) * 1.65 : 0;

  world.time += dt;
  world.phaseTimer += dt;
  world.spawnTimer += dt;
  world.wake += dt;
  ship.invulnerable = Math.max(0, ship.invulnerable - dt);
  ship.bump = Math.max(0, ship.bump - dt);
  ship.recenter = Math.max(0, ship.recenter - dt);

  if (world.phaseTimer > rand(10, 16)) {
    world.phaseTimer = 0;
    changePhase();
  }

  if (world.spawnTimer > 1.65) {
    world.spawnTimer = 0;
    if (Math.random() < 0.62) spawnObstacle();
  }

  const canControl = ship.recenter <= 0;

  let throttlePercent = ship.throttle * 100;
  if (canControl && keys.has("ArrowUp")) throttlePercent += 58 * dt;
  if (canControl && keys.has("ArrowDown")) throttlePercent -= 58 * dt;
  setEngineThrottle(throttlePercent);

  const steerPower = clamp(ship.speed / 15, 0.7, 1.45);
  if (canControl && keys.has("ArrowLeft")) ship.angle -= 3.45 * steerPower * dt;
  else if (canControl && keys.has("ArrowRight")) ship.angle += 3.45 * steerPower * dt;
  else ship.angle += (0 - ship.angle) * 1.2 * dt;
  ship.angle = clamp(ship.angle, -1.05, 1.05);

  const engine = ship.throttle * 4.9;
  const water = current.force;
  const drag = (ship.speed - 12) * 0.46;
  ship.speed += (engine + water + tailwindSailDrive - headwindSailDrag - drag) * dt;
  ship.speed = clamp(ship.speed, 3.5, MAX_SHIP_SPEED);

  if (ship.recenter > 0) {
    const progress = 1 - ship.recenter / 0.48;
    const eased = 1 - Math.pow(1 - clamp(progress, 0, 1), 3);
    ship.x = ship.recenterFromX + (w * 0.5 - ship.recenterFromX) * eased;
    ship.y = ship.recenterFromY + (h * 0.66 - ship.recenterFromY) * eased;
    ship.angle += (0 - ship.angle) * 9 * dt;
  } else {
    const forward = ship.speed * 7.8;
    ship.x += Math.sin(ship.angle) * forward * dt;
    ship.x += current.force * 10 * dt;
    ship.y += Math.abs(ship.angle) * 8 * dt;
  }
  ship.x = clamp(ship.x, 52, w - 52);
  ship.y = clamp(ship.y, h * 0.42, h - 68);

  const engineLoad = Math.max(0, ship.throttle);
  const sailSaving = ship.sails && wind.force > 0 ? wind.force * 0.12 : 0;
  const throttlePenalty = engineLoad * engineLoad * 0.8;
  const highSpeedPenalty = Math.max(0, ship.speed - 14) * engineLoad * 0.04;
  world.fuel -= Math.max(0.003, (engineLoad * 0.12 + throttlePenalty + highSpeedPenalty - sailSaving) * dt);
  world.fuel = clamp(world.fuel, 0, 100);

  const sailBonus = ship.sails && wind.force > 0 ? clamp(wind.force * 0.18, 0, 0.45) : 0;
  const currentBonus = current.force > 0 && engineLoad < 0.25 ? 0.12 : 0;
  const distanceRate = Math.max(0, ship.speed) * DISTANCE_TIME_SCALE / 3600;
  world.distance += distanceRate * (1 + sailBonus + currentBonus) * dt;
  world.score = world.distance;
  world.bonusBank += (sailBonus + currentBonus) * dt;

  for (const obstacle of world.obstacles) {
    obstacle.y += (obstacle.speed + ship.speed * 5) * dt;
    obstacle.x += obstacle.drift * dt + Math.sin(world.time + obstacle.y * 0.01) * 8 * dt;
    obstacle.angle += obstacle.spin * dt * 0.25;
    const dx = obstacle.x - ship.x;
    const dy = obstacle.y - ship.y;
    const hit = Math.hypot(dx, dy) < obstacle.r + 34;
    if (hit && ship.invulnerable <= 0) {
      ship.invulnerable = 1.5;
      ship.bump = 0.42;
      ship.recenter = 0.48;
      ship.recenterFromX = ship.x;
      ship.recenterFromY = ship.y;
      world.fuel = clamp(world.fuel - 4, 0, 100);
      ship.speed = clamp(ship.speed - 1.2, 3.5, MAX_SHIP_SPEED);
      world.score = Math.max(0, world.score - 80);
      world.particles.push({ x: ship.x, y: ship.y, life: 0.8, maxLife: 0.8, type: "impact" });
      obstacle.y = h + 160;
    }
  }
  world.obstacles = world.obstacles.filter((obstacle) => obstacle.y < h + 130);
  world.particles = world.particles.filter((particle) => (particle.life -= dt) > 0);

  if (world.distance >= world.goalDistance) {
    world.distance = world.goalDistance;
    world.done = true;
    world.running = false;
    els.message.classList.add("end-state");
    els.message.classList.remove("hidden");
    els.message.querySelector("strong").textContent = "Voyage complete.";
    els.message.querySelector("span").textContent = `Tut tut. You reached ${world.goalDistance} nautical miles with ${Math.round(world.fuel)}% fuel left.`;
    els.start.textContent = "Sail again";
    playHorn();
  }

  if (world.fuel <= 0) {
    world.done = true;
    world.running = false;
    els.message.classList.add("end-state");
    els.message.classList.remove("hidden");
    els.message.querySelector("strong").textContent = "Game Over";
    els.message.querySelector("span").textContent = `You sailed ${world.distance.toFixed(1)} of ${world.goalDistance} nautical miles. Use less gasoline and deploy sails when wind helps.`;
    els.start.textContent = "Try again";
  }
}

function drawOcean(w, h) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "#0d5361");
  gradient.addColorStop(0.48, "#08424f");
  gradient.addColorStop(1, "#042d39");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#d7fff8";
  ctx.lineWidth = 1;
  for (let i = 0; i < 26; i += 1) {
    const y = ((i * 48 + world.time * 12) % (h + 90)) - 70;
    ctx.beginPath();
    for (let x = -40; x < w + 40; x += 36) {
      const wave = Math.sin(x * 0.014 + i + world.time * 0.55) * 5;
      if (x === -40) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawCurrentBands(w, h) {
  const current = currents[world.currentIndex];
  const direction = current.force >= 0 ? -1 : 1;
  if (Math.abs(current.force) < 0.1) {
    return;
  }
  const xs = [w * 0.34, w * 0.66];
  ctx.save();
  ctx.lineWidth = 5;
  ctx.shadowColor = current.color;
  ctx.shadowBlur = 16;
  xs.forEach((xBase, lane) => {
    const band = ctx.createLinearGradient(xBase - 90, 0, xBase + 90, 0);
    band.addColorStop(0, "rgba(255,255,255,0)");
    band.addColorStop(0.5, current.color);
    band.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = band;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(xBase - 115, 0, 230, h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = current.color;
    ctx.fillStyle = current.color;
    for (let i = -2; i < 8; i += 1) {
      const y = ((i * 132 + world.time * 86 * direction + lane * 58) % (h + 190)) - 95;
      const x = xBase + Math.sin(y * 0.012 + world.time) * 24;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 52 * direction);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + 58 * direction);
      ctx.lineTo(x - 22, y + 28 * direction);
      ctx.lineTo(x + 22, y + 28 * direction);
      ctx.closePath();
      ctx.fill();
    }
  });
  ctx.restore();
}

function drawWindOverlay(w, h) {
  const wind = winds[world.windIndex];
  const direction = wind.force >= 0 ? -1 : 1;
  ctx.save();
  ctx.strokeStyle = wind.color;
  ctx.fillStyle = wind.color;
  ctx.lineWidth = 3;
  ctx.shadowColor = wind.color;
  ctx.shadowBlur = 10;
  for (let col = 0; col < 4; col += 1) {
    const x = 140 + col * (w - 280) / 3 + Math.sin(world.time + col) * 14;
    for (let row = -1; row < 5; row += 1) {
      const y = ((row * 154 + world.time * 44 * direction + col * 34) % (h + 180)) - 90;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 18, y + 34 * direction, x, y + 68 * direction);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + 68 * direction);
      ctx.lineTo(x - 14, y + 46 * direction);
      ctx.lineTo(x + 14, y + 46 * direction);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawObstacleSprite(o, frame, width, height) {
  if (!obstacleImage.complete || !obstacleImage.naturalWidth) return false;
  const source = obstacleFrames[frame];
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.type === "ship" ? Math.PI + o.angle : o.angle);
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 20;
  ctx.drawImage(obstacleImage, source.x, source.y, source.w, source.h, -width / 2, -height / 2, width, height);
  ctx.restore();
  return true;
}

function drawIslandSprite(o, frame, width, height) {
  if (!islandImage.complete || !islandImage.naturalWidth) return false;
  const source = islandFrames[frame % islandFrames.length];
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.angle * 0.35);
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 14;
  ctx.drawImage(islandImage, source.x, source.y, source.w, source.h, -width / 2, -height / 2, width, height);
  ctx.restore();
  return true;
}

function drawIsland(o) {
  if (drawIslandSprite(o, o.variant, o.r * 2.6, o.r * 1.85)) return;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.angle);
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#6e6550";
  ctx.beginPath();
  for (let i = 0; i < 12; i += 1) {
    const a = (Math.PI * 2 * i) / 12;
    const r = o.r * (0.78 + Math.sin(o.seed + i * 2.17) * 0.16);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * 0.78;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.62)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(0, o.r * 0.14, o.r * 0.9, o.r * 0.72, -0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(25,44,41,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#c8b783";
  ctx.beginPath();
  ctx.ellipse(0, o.r * 0.2, o.r * 0.66, o.r * 0.5, -0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2f8d64";
  ctx.beginPath();
  ctx.ellipse(0, -4, o.r * 0.62, o.r * 0.42, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1e6b4f";
  for (let i = 0; i < 9; i += 1) {
    const x = Math.sin(o.seed + i * 1.8) * o.r * 0.38;
    const y = -8 + Math.cos(o.seed + i * 1.4) * o.r * 0.22;
    ctx.beginPath();
    ctx.arc(x, y, 5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#5a5f57";
  for (let i = 0; i < 5; i += 1) {
    const x = Math.cos(o.seed + i) * o.r * 0.52;
    const y = Math.sin(o.seed + i * 1.7) * o.r * 0.38;
    ctx.beginPath();
    ctx.ellipse(x, y, 6, 4, i, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.beginPath();
  ctx.ellipse(0, o.r * 0.58, o.r * 0.72, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawOtherShip(o) {
  if (drawObstacleSprite(o, 2 + o.variant, 76, 158)) return;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(Math.PI + o.angle);
  ctx.shadowColor = "rgba(0,0,0,0.48)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#16282f";
  ctx.beginPath();
  ctx.roundRect(-22, -66, 44, 132, 13);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#dfe7e6";
  ctx.fillRect(-15, -48, 30, 82);
  ctx.fillStyle = "#f08b4f";
  for (let y = -42; y < 24; y += 20) {
    ctx.fillRect(-13, y, 12, 13);
    ctx.fillRect(2, y, 12, 13);
  }
  ctx.fillStyle = "#8aa3a6";
  ctx.fillRect(-12, 38, 24, 14);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, -72);
  ctx.lineTo(15, -50);
  ctx.lineTo(-15, -50);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, 68);
  ctx.quadraticCurveTo(-48, 84, -76, 76);
  ctx.moveTo(24, 68);
  ctx.quadraticCurveTo(48, 84, 76, 76);
  ctx.stroke();
  ctx.restore();
}

function drawRigidWingSails(drawH) {
  const sailPositions = [-62, -37, -12, 13, 38, 63];
  const deckX = 13;
  ctx.save();
  ctx.globalAlpha = 0.98;
  for (const y of sailPositions) {
    const baseW = ship.sails ? 18 : 18;
    const baseH = ship.sails ? 5 : 5;
    const baseY = y + (ship.sails ? 10 : 5);
    ctx.fillStyle = "rgba(18, 26, 30, 0.9)";
    ctx.beginPath();
    ctx.roundRect(deckX - baseW / 2, baseY, baseW, baseH, 3);
    ctx.fill();

    const panelW = ship.sails ? 16 : 18;
    const panelH = ship.sails ? 22 : 8;
    const topY = y - panelH / 2;
    const bottomY = y + panelH / 2;
    ctx.shadowColor = "rgba(0, 0, 0, 0.34)";
    ctx.shadowBlur = ship.sails ? 7 : 4;
    ctx.shadowOffsetX = ship.sails ? 3 : 1;
    ctx.shadowOffsetY = ship.sails ? 4 : 2;
    const panel = ctx.createLinearGradient(deckX - panelW / 2, topY, deckX + panelW / 2, topY);
    panel.addColorStop(0, ship.sails ? "#f7f5ee" : "#d8dcdd");
    panel.addColorStop(0.55, "#ffffff");
    panel.addColorStop(1, ship.sails ? "#d4dbdc" : "#aeb8bb");
    ctx.fillStyle = panel;
    ctx.strokeStyle = "rgba(128, 140, 143, 0.72)";
    ctx.lineWidth = 1.1;
    if (ship.sails) {
      ctx.beginPath();
      ctx.moveTo(deckX - panelW / 2, bottomY);
      ctx.lineTo(deckX - panelW / 2, topY + 6);
      ctx.quadraticCurveTo(deckX - panelW / 2, topY, deckX - panelW / 2 + 6, topY);
      ctx.lineTo(deckX + panelW / 2 - 3, topY);
      ctx.quadraticCurveTo(deckX + panelW / 2 + 1, topY + 2, deckX + panelW / 2, topY + 6);
      ctx.lineTo(deckX + panelW / 2, bottomY - 2);
      ctx.quadraticCurveTo(deckX + panelW / 2, bottomY, deckX + panelW / 2 - 2, bottomY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.roundRect(deckX - panelW / 2, topY, panelW, panelH, 4);
      ctx.fill();
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "rgba(201, 207, 207, 0.9)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(deckX - panelW / 2 + 1, topY + panelH * 0.36);
    ctx.lineTo(deckX + panelW / 2 - 1, topY + panelH * 0.4);
    if (ship.sails) {
      ctx.moveTo(deckX - panelW / 2 + 1, topY + panelH * 0.68);
      ctx.lineTo(deckX + panelW / 2 - 1, topY + panelH * 0.72);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawShip() {
  const spriteWidth = shipImage.width / 2;
  const spriteHeight = shipImage.height;
  const sourceX = 0;
  const drawH = 190;
  const drawW = drawH * (spriteWidth / spriteHeight);
  const bumpShake = ship.bump > 0 ? Math.sin(world.time * 70) * ship.bump * 8 : 0;
  ctx.save();
  ctx.translate(ship.x + bumpShake, ship.y);
  ctx.rotate(ship.angle);
  ctx.globalAlpha = ship.invulnerable > 0 ? 0.72 + Math.sin(world.time * 26) * 0.2 : 1;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 24;
  ctx.drawImage(shipImage, sourceX, 0, spriteWidth, spriteHeight, -drawW / 2, -drawH / 2, drawW, drawH);
  drawRigidWingSails(drawH);
  ctx.restore();
}

function drawHudOverlay(w, h) {
  const progress = clamp(world.distance / world.goalDistance, 0, 1);
  ctx.save();
  ctx.fillStyle = "rgba(88, 223, 190, 0.5)";
  ctx.fillRect(0, h - 8, w * progress, 8);
  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(w * progress, h - 8, w * (1 - progress), 8);
  ctx.restore();
}

function render() {
  const { w, h } = gameSize();
  ctx.clearRect(0, 0, w, h);
  drawOcean(w, h);
  drawCurrentBands(w, h);
  drawWindOverlay(w, h);
  for (const obstacle of world.obstacles) {
    if (obstacle.type === "island") drawIsland(obstacle);
    else if (obstacle.type === "ship") drawOtherShip(obstacle);
  }
  for (const particle of world.particles) {
    const lifeRatio = particle.life / (particle.maxLife || 1);
    ctx.save();
    ctx.globalAlpha = lifeRatio;
    ctx.strokeStyle = "#ffc95d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, (1 - lifeRatio) * 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 201, 93, ${0.16 * lifeRatio})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, (1 - lifeRatio) * 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (shipImage.complete) drawShip();
  drawHudOverlay(w, h);
}

function updateUi() {
  const current = currents[world.currentIndex];
  const wind = winds[world.windIndex];
  const throttlePercent = Math.round(ship.throttle * 100);
  const progress = clamp(world.distance / world.goalDistance, 0, 1);
  const usefulSails = ship.sails && wind.force > 0;
  const efficientThrottle = throttlePercent <= 35;
  const efficiency = clamp(1.5 + (efficientThrottle ? 1.2 : 0) + (usefulSails ? 2 : 0) + (current.force > 0 && efficientThrottle ? 1.2 : 0), 0, 6);

  els.goalTime.textContent = `${world.goalDistance} nm`;
  els.fuel.textContent = `${Math.round(world.fuel)}%`;
  els.score.textContent = `${world.distance.toFixed(1)} nm`;
  els.speed.textContent = ship.speed.toFixed(1);
  els.target.textContent = world.distance.toFixed(1);
  els.trim.textContent = `${world.goalDistance}`;
  els.throttle.textContent = `${throttlePercent}`;
  els.throttleGauge.style.width = `${throttlePercent}%`;
  els.voyageProgress.style.width = `${progress * 100}%`;
  els.current.textContent = current.name;
  els.currentHelp.textContent = current.help;
  els.wind.textContent = wind.name;
  els.windHelp.textContent = wind.help;

  const currentFromBehind = current.force > 0;
  const hasCurrent = Math.abs(current.force) > 0.1;
  els.currentLegendRow.classList.toggle("hidden", !hasCurrent);
  if (hasCurrent) {
    els.currentLegendIcon.className = currentFromBehind ? "legend-arrow current behind" : "legend-arrow current ahead";
    els.currentLegendTitle.textContent = currentFromBehind ? "Current arrows up" : "Current arrows down";
    els.currentLegendText.textContent = currentFromBehind
      ? "Current from behind pushes the ship forward."
      : "Current from ahead pushes against the bow.";
  }

  const windFromBehind = wind.force > 0;
  const hasWind = Math.abs(wind.force) > 0.1;
  els.windLegendRow.classList.toggle("hidden", !hasWind);
  if (hasWind) {
    els.windLegendIcon.className = windFromBehind ? "legend-arrow wind behind" : "legend-arrow wind ahead";
    els.windLegendTitle.textContent = windFromBehind ? "Wind arrows up" : "Wind arrows down";
    els.windLegendText.textContent = windFromBehind
      ? "Wind from behind helps only when sails are deployed."
      : "Wind from ahead slows the ship if sails are deployed.";
  }

  if (wind.force >= 1.2) {
    els.sailTip.textContent = ship.sails ? "Strong wind from behind: sails add speed and save gasoline." : "Tip: strong wind from behind. Deploy wing sails for extra speed and lower fuel burn.";
    els.sailTip.className = "sail-tip good";
  } else if (wind.force > 0) {
    els.sailTip.textContent = ship.sails ? "Light wind from behind: sails add a little speed." : "Tip: light wind from behind. Sails can help, but keep gasoline low.";
    els.sailTip.className = "sail-tip good";
  } else {
    els.sailTip.textContent = ship.sails ? "Wind from ahead: deployed sails slow the ship. Reef them." : "Wind from ahead. Keep sails reefed and use gasoline carefully.";
    els.sailTip.className = "sail-tip warning";
  }
  els.bonus.textContent = usefulSails ? "Sail assist: extra speed" : ship.sails ? "Sail drag: slowing ship" : "Sail assist: reefed";
  els.needle.style.transform = `rotate(${clamp((ship.speed / MAX_SHIP_SPEED) * 180 - 90, -85, 85)}deg)`;

  [...els.leaves.children].forEach((leaf, index) => {
    leaf.classList.toggle("on", index < Math.round(efficiency));
  });
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.035, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  updateUi();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }
  if (event.key === " ") setSails(!ship.sails);
  if (!event.repeat && world.running && !world.done && !world.paused) {
    if (event.key === "ArrowUp") setEngineThrottle(ship.throttle * 100 + 5);
    if (event.key === "ArrowDown") setEngineThrottle(ship.throttle * 100 - 5);
  }
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => keys.delete(event.key));
window.addEventListener("resize", resizeCanvas);

for (const button of document.querySelectorAll(".mobile-controls button")) {
  const key = button.dataset.key;
  button.addEventListener("pointerdown", () => keys.add(key));
  button.addEventListener("pointerup", () => keys.delete(key));
  button.addEventListener("pointerleave", () => keys.delete(key));
}

els.sailButton.addEventListener("click", () => setSails(!ship.sails));
els.engineSlider.addEventListener("input", () => setEngineThrottle(Number(els.engineSlider.value)));
els.difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    world.difficulty = button.dataset.difficulty;
    world.goalDistance = (DIFFICULTIES[world.difficulty] || DIFFICULTIES.medium).distance;
    els.difficultyButtons.forEach((choice) => choice.classList.toggle("selected", choice === button));
  });
});
els.pause.addEventListener("click", () => {
  if (!world.running || world.done) return;
  world.paused = !world.paused;
  els.pause.textContent = world.paused ? "Resume" : "Pause";
});
els.restart.addEventListener("click", showSplash);
els.start.addEventListener("click", () => {
  if (els.message.classList.contains("end-state")) {
    showSplash();
    return;
  }
  reset();
});

resizeCanvas();
setEngineThrottle(Number(els.engineSlider.value || 25));
requestAnimationFrame(frame);
