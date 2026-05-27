import { easeOutCubic } from './math';

export const getDynamicSegments = ({
  activeOptions = [],
  depletingOptionId = null,
  depletionPhase = null,
  depletionStart = 0,
  appearPhase = null,
  appearingOptionId = null,
  appearStart = 0
}) => {
  if (activeOptions.length === 0) return [];

  const dynamicWeights = activeOptions.map(opt => {
    let w = opt.weight;

    // Adjust weight if the option is depleting
    if (opt.id === depletingOptionId) {
      if (depletionPhase === 'exploding') {
        const elapsed = Date.now() - depletionStart;
        const duration = 800; // explosion duration
        const progress = Math.min(1, elapsed / duration);
        w = opt.weight * (1 - progress);
      } else if (depletionPhase === 'cracking') {
        w = opt.weight;
      } else {
        // Exploded but still in activeOptions pending state update
        w = 0;
      }
    }

    // Adjust weight if the option is appearing
    if (appearPhase === 'growing' && opt.id === appearingOptionId) {
      const elapsed = Date.now() - appearStart;
      const duration = 1000; // growth duration
      const progress = Math.min(1, elapsed / duration);
      const t = easeOutCubic(progress);
      w = opt.weight * t;
    }

    return w;
  });

  const sum = dynamicWeights.reduce((s, w) => s + w, 0);
  if (sum <= 0) return [];

  const segs = [];
  let currentAngle = 0;
  for (let i = 0; i < activeOptions.length; i++) {
    const opt = activeOptions[i];
    const w = dynamicWeights[i];
    const angleSize = (w / sum) * 2 * Math.PI;
    segs.push({
      option: opt,
      startAngle: currentAngle,
      endAngle: currentAngle + angleSize,
      angleSize,
      weight: w
    });
    currentAngle += angleSize;
  }
  return segs;
};
