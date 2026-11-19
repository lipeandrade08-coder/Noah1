function createFlightEngine({ random = Math.random, stepMode = false } = {}) {
  const goal = 10;
  const maxShield = 2;
  const rowCount = 18;
  const spacing = 0.27;
  const firstY = stepMode ? 0.6 : 0.22;
  const shipY = 0.83;
  const rows = [];
  const objects = [];
  let pathLane = 1;

  for (let index = 0; index < rowCount; index++) {
    if (index > 0) {
      const choices = [pathLane - 1, pathLane, pathLane + 1].filter(lane => lane >= 0 && lane <= 2);
      pathLane = choices[Math.floor(random() * choices.length)];
    }
    const hazards = [0, 1, 2].filter(lane => lane !== pathLane);
    const asteroidLane = hazards[Math.floor(random() * hazards.length)];
    rows.push({ star: pathLane, asteroid: asteroidLane });
    objects.push(
      { id: index * 2, row: index, kind: "star", lane: pathLane, x: (pathLane + 0.5) / 3, y: firstY - index * spacing, active: true },
      { id: index * 2 + 1, row: index, kind: "asteroid", lane: asteroidLane, x: (asteroidLane + 0.5) / 3, y: firstY - index * spacing, active: true }
    );
  }

  const state = {
    phase: "ready", stepMode, goal, maxShield, stars: 0, shield: maxShield,
    elapsed: 0, distance: 0, shipX: 0.5, shipY, targetLane: 1,
    nextRow: 0, invulnerableUntil: 0, rows, objects, events: []
  };

  function setPhase(phase) {
    if (state.phase === phase) return;
    state.phase = phase;
    state.events.push({ type: "phase", phase });
  }

  function collect(kind) {
    if (kind === "star") {
      state.stars++;
      state.events.push({ type: "star" });
      if (state.stars >= goal) setPhase("won");
      return;
    }
    if (state.elapsed < state.invulnerableUntil) return;
    state.shield--;
    state.invulnerableUntil = state.elapsed + 0.9;
    state.events.push({ type: "hit" });
    if (state.shield <= 0) setPhase("lost");
  }

  function positionStepObjects() {
    for (const object of objects) {
      object.y = firstY - (object.row - state.nextRow) * spacing;
    }
  }

  function command(lane) {
    if (!["ready", "running"].includes(state.phase)) return false;
    if (!Number.isInteger(lane) || lane < 0 || lane > 2 ||
        (stepMode && Math.abs(lane - state.targetLane) > 1)) {
      state.events.push({ type: "blocked" });
      return false;
    }
    state.targetLane = lane;
    if (state.phase === "ready" || stepMode) state.shipX = (lane + 0.5) / 3;
    if (!stepMode || state.phase !== "running") return true;

    state.elapsed += 1;
    const row = rows[state.nextRow];
    if (row.star === lane) collect("star");
    else if (row.asteroid === lane) collect("asteroid");
    else state.events.push({ type: "clear" });
    objects[state.nextRow * 2].active = false;
    objects[state.nextRow * 2 + 1].active = false;
    state.nextRow++;
    positionStepObjects();
    if (state.nextRow === rowCount && state.phase === "running") setPhase("lost");
    return true;
  }

  // Colisão varrida no movimento relativo entre a nave e cada objeto.
  function intersects(object, previousY, previousShipX) {
    const radiusX = object.kind === "star" ? 0.09 : 0.075;
    const radiusY = 0.085;
    const startX = (object.x - previousShipX) / radiusX;
    const startY = (previousY - shipY) / radiusY;
    const deltaX = (previousShipX - state.shipX) / radiusX;
    const deltaY = (object.y - previousY) / radiusY;
    const lengthSquared = deltaX * deltaX + deltaY * deltaY;
    let amount = 0;
    if (lengthSquared > 0) {
      amount = Math.max(0, Math.min(1, -(startX * deltaX + startY * deltaY) / lengthSquared));
    }
    const x = startX + deltaX * amount;
    const y = startY + deltaY * amount;
    return x * x + y * y <= 1;
  }

  function tick(seconds) {
    if (state.phase !== "running" || stepMode || !Number.isFinite(seconds) || seconds <= 0) return;
    const delta = Math.min(seconds, 0.1);
    const previousShipX = state.shipX;
    const previousDistance = state.distance;
    state.elapsed += delta;
    state.distance = 0.14 * state.elapsed + 0.0009 * state.elapsed * state.elapsed;
    const difference = (state.targetLane + 0.5) / 3 - state.shipX;
    state.shipX += Math.sign(difference) * Math.min(Math.abs(difference), 1.9 * delta);

    for (const object of objects) {
      if (!object.active) continue;
      const previousY = object.y;
      object.y += state.distance - previousDistance;
      if (state.phase === "running" && intersects(object, previousY, previousShipX)) {
        object.active = false;
        collect(object.kind);
      } else if (object.y > 1.15) object.active = false;
    }

    while (state.nextRow < rowCount &&
           firstY - state.nextRow * spacing + state.distance > shipY + 0.09) {
      state.nextRow++;
    }
    if (state.nextRow === rowCount && state.phase === "running") setPhase("lost");
  }

  return {
    state, command, tick,
    start() { if (state.phase === "ready") setPhase("running"); },
    pause() { if (state.phase === "running") setPhase("paused"); },
    resume() { if (state.phase === "paused") setPhase("running"); }
  };
}

if (typeof module === "object" && module.exports) module.exports = createFlightEngine;
