export const createConfettiParticles = (width, height, isLegendary = false) => {
  const cx = width / 2;
  const cy = height / 2;

  const standardColors = [
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', 
    '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f97316'
  ];
  const legendaryColors = [
    '#ffd700', '#ffae42', '#f97316', '#a855f7', '#06b6d4', '#eab308', '#ffffff'
  ]; // Skewed gold and vibrant colors

  const colors = isLegendary ? legendaryColors : standardColors;
  const count = isLegendary ? 240 : 120;
  const particles = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const speed = isLegendary ? (4 + Math.random() * 12) : (2 + Math.random() * 8);
    const decay = isLegendary ? (0.006 + Math.random() * 0.006) : 0.012;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isLegendary ? 4 : 2), // Higher upward force
      gravity: isLegendary ? 0.08 : 0.12, // Slower fall rate for legendary
      size: (isLegendary ? 4 : 3) + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay
    });
  }

  return particles;
};
