import { drawVectorHorse } from './horseRenderer';
import { getHorseProgress } from '../utils/raceHelpers';

// Red flag pointers
const drawFlag = (ctx, fx, fy) => {
  ctx.save();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + 18, fy + 6);
  ctx.lineTo(fx, fy + 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

// Helper to draw the horse race track on canvas
export const drawHorseRace = (ctx, width, height, {
  activeOptions = [],
  winner = null,
  raceT = 0,
  horseSpeedFactors = [],
  isSpinning = false,
  spinStartTime = 0,
  particles = [],
  optionRarities = {}
}) => {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  ctx.save();

  // Turf dark green gradient background
  const turfGrad = ctx.createLinearGradient(0, 0, 0, height);
  turfGrad.addColorStop(0, '#0a160f');
  turfGrad.addColorStop(1, '#050c08');
  ctx.fillStyle = turfGrad;
  ctx.fillRect(0, 0, width, height);

  if (activeOptions.length === 0) {
    ctx.restore();
    return;
  }
  
  const laneCount = activeOptions.length;
  const laneHeight = (height - 40) / laneCount;
  const finishX = width - 120;
  const startX = 40;
  const endX = finishX;

  // Draw track rails
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= laneCount; i++) {
    const y = 20 + i * laneHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw starting gate line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, 15);
  ctx.lineTo(startX, height - 15);
  ctx.stroke();

  // Draw checkers finish line
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(finishX, 15, 12, height - 30);
  ctx.fillStyle = '#000000';
  for (let y = 15; y < height - 15; y += 12) {
    ctx.fillRect(finishX + (y % 24 === 0 ? 0 : 6), y, 6, 6);
  }
  ctx.restore();

  // Finish poles
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(finishX + 6, 5);
  ctx.lineTo(finishX + 6, height - 5);
  ctx.stroke();

  drawFlag(ctx, finishX + 6, 8);
  drawFlag(ctx, finishX + 6, height - 20);

  // Draw horses
  activeOptions.forEach((opt, idx) => {
    const isHorseWinner = opt.id === winner?.id;
    const progress = getHorseProgress(idx, raceT, isHorseWinner, horseSpeedFactors);
    const hx = startX + (endX - startX) * progress;
    const hy = 20 + idx * laneHeight + laneHeight / 2;

    // Draw Horse Number tag
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '800 14px "Plus Jakarta Sans", var(--font-body), sans-serif';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(`#${idx + 1}`, startX - 12, hy + 5);
    ctx.restore();

    // Draw option name along track
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '700 14px "Plus Jakarta Sans", var(--font-body), sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    const isShrouded = (opt.currentShrouds || 0) > 0;
    const baseName = isShrouded ? 'Hidden option' : opt.name;
    const displayName = baseName.length > 65 ? baseName.substring(0, 65) + '...' : baseName;
    ctx.fillText(displayName, startX + 60, hy + 5);
    ctx.restore();

    // Draw the horse itself
    const elapsed = isSpinning ? (Date.now() - spinStartTime) : 0;
    const rarity = optionRarities[opt.id] || 'common';
    drawVectorHorse(ctx, hx, hy, opt, isSpinning, elapsed, idx, rarity);
  });

  // Draw particles
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 2;
    ctx.fill();
    ctx.restore();
  });

  ctx.restore();
};
