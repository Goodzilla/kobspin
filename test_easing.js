const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function simulateSpin(durationSec, rotations) {
  const duration = durationSec * 1000;
  const startAngle = 0;
  const targetAngle = rotations * 2 * Math.PI;
  const angularDistance = targetAngle - startAngle;

  const fps = 60;
  const frameInterval = 1000 / fps;

  let elapsed = 0;
  let angle = startAngle;
  let stopTime = 0;
  let snapDistanceDeg = 0;

  // Let's run the animation loop
  for (let frame = 0; elapsed <= duration; frame++) {
    const t = Math.min(1, elapsed / duration);
    const velocityRadSec = (angularDistance * 3 * Math.pow(1 - t, 2)) / (duration / 1000);

    const isStillMoving = elapsed < duration && (elapsed < 1000 || velocityRadSec > 0.015);

    if (!isStillMoving) {
      stopTime = elapsed;
      snapDistanceDeg = ((targetAngle - angle) * 180) / Math.PI;
      break;
    }

    const easeVal = easeOutCubic(t);
    const nextAngle = startAngle + angularDistance * easeVal;
    angle = nextAngle;

    // Output debug info for last few seconds of movement
    if (elapsed > duration - 4000 || velocityRadSec < 0.2) {
      // console.log(`t=${(elapsed/1000).toFixed(2)}s, speed=${((velocityRadSec * 180) / Math.PI).toFixed(2)} deg/s, remaining angle=${(((targetAngle - angle) * 180) / Math.PI).toFixed(2)} deg`);
    }

    elapsed += frameInterval;
  }

  console.log(`Duration: ${durationSec}s | Stopped at: ${(stopTime / 1000).toFixed(2)}s | Snap: ${snapDistanceDeg.toFixed(3)} deg`);
}

console.log("Simulating with cubic easing and threshold velocityRadSec > 0.015:");
simulateSpin(10, 8);
simulateSpin(15, 8);
simulateSpin(30, 8);
simulateSpin(60, 8);
