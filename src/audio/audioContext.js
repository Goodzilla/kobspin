let ctx = null;

export const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
};
