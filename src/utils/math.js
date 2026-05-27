export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Deterministic pseudo-random number generator for render purity (avoids Math.random during render)
export const getPseudoRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};
