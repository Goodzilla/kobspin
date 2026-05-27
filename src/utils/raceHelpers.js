// Helper to compute progress for a horse
export const getHorseProgress = (idx, t, isWinner, horseSpeedFactors) => {
  if (t === 0) return 0;
  
  let base;
  if (isWinner) {
    base = Math.min(1, t / 0.94); // Reaches 100% at t = 0.94
  } else {
    const factor = horseSpeedFactors[idx]?.speedOffset || 0.85;
    base = (t / 0.94) * 0.9 * factor;
    base = Math.min(0.92, base); // Cap non-winners at 92%
  }
  
  const phase = horseSpeedFactors[idx]?.phase || 0;
  const wiggle = Math.sin(t * Math.PI * 4 + phase) * 0.05 * (1 - t * 0.3);
  
  let progress = base + wiggle;
  
  if (isWinner) {
    if (t >= 0.94) progress = 1.0;
    else progress = Math.min(0.99, Math.max(0, progress));
  } else {
    progress = Math.min(0.92, Math.max(0, progress));
  }
  
  return progress;
};
