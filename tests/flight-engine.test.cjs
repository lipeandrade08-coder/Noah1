const assert = require("node:assert/strict");
const test = require("node:test");
const createFlightEngine = require("../js/flight-engine.js");

function seeded(initial) {
  let seed = initial;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function autopilot(seed, delta) {
  const engine = createFlightEngine({ random: seeded(seed) });
  engine.start();
  for (let tick = 0; tick < 5000 && engine.state.phase === "running"; tick++) {
    engine.command(engine.state.rows[engine.state.nextRow].star);
    engine.tick(delta);
  }
  return engine.state;
}

test("80 random routes allow collecting all six stars without an impact", () => {
  const patterns = new Set();
  for (let seed = 1; seed <= 80; seed++) {
    const engine = createFlightEngine({ random: seeded(seed) });
    patterns.add(JSON.stringify(engine.state.rows));
    const end = autopilot(seed, 1 / 120);
    assert.equal(end.phase, "won", "Reachable route for seed " + seed);
    assert.equal(end.stars, 6);
    assert.equal(end.shield, 2);
  }
  assert.ok(patterns.size > 70, "Routes vary between games");
});

test("15–120 Hz updates preserve speed and collision outcomes", () => {
  const times = [];
  for (const delta of [1 / 15, 1 / 30, 1 / 60, 1 / 120]) {
    const result = autopilot(12, delta);
    assert.equal(result.phase, "won");
    assert.equal(result.shield, 2);
    times.push(result.elapsed);
  }
  assert.ok(Math.max(...times) - Math.min(...times) < 0.15);
});

test("ready and paused flights wait without losing progress", () => {
  const engine = createFlightEngine({ random: seeded(1) });
  engine.tick(1);
  assert.equal(engine.state.elapsed, 0);
  engine.start();
  engine.tick(0.1);
  engine.pause();
  const distance = engine.state.distance;
  engine.tick(0.1);
  assert.equal(engine.state.distance, distance);
  engine.resume();
  engine.tick(0.1);
  assert.ok(engine.state.distance > distance);
});

test("overlapping impacts cost one shield; a later impact ends the flight", () => {
  const engine = createFlightEngine({ random: seeded(3) });
  engine.state.objects.forEach(object => { object.active = false; });
  const hazards = engine.state.objects.filter(object => object.kind === "asteroid").slice(0, 2);
  for (const hazard of hazards) {
    hazard.x = 0.5;
    hazard.y = engine.state.shipY - 0.02;
    hazard.active = true;
  }
  engine.start();
  engine.tick(0.1);
  assert.equal(engine.state.shield, 1);
  for (let tick = 0; tick < 10; tick++) engine.tick(0.1);
  hazards[0].active = true;
  hazards[0].y = engine.state.shipY - 0.02;
  engine.tick(0.1);
  assert.equal(engine.state.phase, "lost");
});

test("steering through an asteroid registers a swept collision", () => {
  const engine = createFlightEngine({ random: seeded(9) });
  engine.state.objects.forEach(object => { object.active = false; });
  const asteroid = engine.state.objects.find(object => object.kind === "asteroid");
  asteroid.active = true;
  asteroid.x = 0.5;
  asteroid.y = engine.state.shipY - 0.02;
  engine.state.shipX = 0.3;
  engine.start();
  engine.command(2);
  engine.tick(0.1);
  assert.equal(engine.state.shield, 1);
});

test("reduced-motion routes wait for commands and remain reachable", () => {
  for (let seed = 1; seed <= 80; seed++) {
    const engine = createFlightEngine({ random: seeded(seed), stepMode: true });
    engine.start();
    engine.tick(5);
    assert.equal(engine.state.nextRow, 0);
    for (let row = 0; row < 6; row++) engine.command(engine.state.rows[row].star);
    assert.equal(engine.state.phase, "won");
    assert.equal(engine.state.shield, 2);
    assert.equal(engine.command(1), false);
  }
});

test("missing every star ends the route without a win", () => {
  const engine = createFlightEngine({ random: () => 0.5 });
  engine.command(0);
  engine.start();
  for (let tick = 0; tick < 6000 && engine.state.phase === "running"; tick++) engine.tick(1 / 60);
  assert.equal(engine.state.phase, "lost");
  assert.equal(engine.state.stars, 0);
});
