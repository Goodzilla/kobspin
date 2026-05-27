import { getDynamicSegments } from '../utils/segments';
import { easeOutCubic } from '../utils/math';

// Helper to draw the central wheel component on the canvas
export const drawWheel = (ctx, width, height, currentAngle, {
  screenShake = 0,
  activeOptions = [],
  celebrationType = null,
  celebrationStart = 0,
  appearingOptionId = null,
  depletingOptionId = null,
  depletionIndex = null,
  depletionPhase = null,
  depletionStart = 0,
  appearPhase = null,
  appearStart = 0,
  borderFlash = 0,
  pointerWobble = 0,
  particles = [],
  depletionShards = [],
  bannerText = null,
  bannerStart = 0
}) => {
  const radius = Math.max(0, Math.min(width, height) / 2 - 20);
  if (radius <= 0) return;
  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  ctx.save();
  if (screenShake > 0.01) {
    const shakeAmt = screenShake;
    const dx = (Math.random() * 2 - 1) * shakeAmt;
    const dy = (Math.random() * 2 - 1) * shakeAmt;
    ctx.translate(dx, dy);
  }

  if (activeOptions.length === 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = 'var(--color-text-secondary)';
    ctx.font = '600 18px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No active options left!', cx, cy - 10);
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Reset the wheel or add options in settings.', cx, cy + 15);
    ctx.restore();
    return;
  }

  // Draw celebration searchlights and glow behind the wheel
  if (celebrationType) {
    const elapsed = Date.now() - celebrationStart;
    if (elapsed < 4000) {
      ctx.save();
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.5);
      if (celebrationType === 'legendary') {
        const hue = (Date.now() * 0.05) % 360;
        glow.addColorStop(0, `hsla(${hue}, 95%, 60%, 0.25)`);
        glow.addColorStop(1, `hsla(${hue}, 95%, 60%, 0)`);
      } else {
        // Standard celebration pulse glow
        const pulse = 0.1 + Math.sin(Date.now() * 0.005) * 0.05;
        glow.addColorStop(0, `rgba(6, 182, 212, ${pulse})`);
        glow.addColorStop(1, 'rgba(6, 182, 212, 0)');
      }
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      // Draw searchlights if legendary
      if (celebrationType === 'legendary') {
        ctx.save();
        const numBeams = 8;
        const beamLength = radius * 3;
        const timeFactor = Date.now() * 0.001;
        
        for (let i = 0; i < numBeams; i++) {
          const baseAngle = (i / numBeams) * 2 * Math.PI;
          const angleOffset = i % 2 === 0 ? timeFactor * 0.4 : -timeFactor * 0.4;
          const angle = baseAngle + angleOffset;
          
          const beamWidth = 0.25 + Math.sin(timeFactor * 2 + i) * 0.08;
          const startAngle = angle - beamWidth / 2;
          const endAngle = angle + beamWidth / 2;
          
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, beamLength, startAngle, endAngle);
          ctx.closePath();
          
          const gradient = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, beamLength);
          const hue = (i * (360 / numBeams) + Date.now() * 0.05) % 360;
          gradient.addColorStop(0, `hsla(${hue}, 90%, 65%, 0.22)`);
          gradient.addColorStop(0.5, `hsla(${hue}, 90%, 65%, 0.08)`);
          gradient.addColorStop(1, `hsla(${hue}, 90%, 65%, 0)`);
          
          ctx.fillStyle = gradient;
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  // 1. Draw Wheel Segments
  const activeSegs = getDynamicSegments({
    activeOptions,
    depletingOptionId,
    depletionPhase,
    depletionStart,
    appearPhase,
    appearingOptionId,
    appearStart
  });

  activeSegs.forEach((seg, idx) => {
    if (seg.angleSize < 0.001 && seg.option.id !== appearingOptionId) {
      return;
    }

    const start = seg.startAngle + currentAngle;
    const end = seg.endAngle + currentAngle;

    const isCurrentlyExploding = (depletionIndex === idx && depletionPhase === 'exploding');
    const isCurrentlyCracking = (depletionIndex === idx && depletionPhase === 'cracking');

    if (isCurrentlyExploding) {
      return; // Skip drawing the slice entirely
    }

    let shakeX = 0;
    let shakeY = 0;
    if (isCurrentlyCracking) {
      const elapsed = Date.now() - depletionStart;
      const progress = Math.min(1, elapsed / 900);
      const shakeIntensity = 1 + progress * 5;
      shakeX = (Math.random() * 2 - 1) * shakeIntensity;
      shakeY = (Math.random() * 2 - 1) * shakeIntensity;
    }

    // Draw Wedge slice
    ctx.beginPath();
    ctx.moveTo(cx + shakeX, cy + shakeY);
    ctx.arc(cx + shakeX, cy + shakeY, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = seg.option.color;
    ctx.fill();
    
    // Dark translucent overlay to create depth
    const gradient = ctx.createRadialGradient(cx + shakeX, cy + shakeY, radius * 0.4, cx + shakeX, cy + shakeY, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Shroud or Shield visual overlays
    if (seg.option.currentShrouds > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx + shakeX, cy + shakeY);
      ctx.arc(cx + shakeX, cy + shakeY, radius, start, end);
      ctx.closePath();
      ctx.clip();

      // Spooky dark void backing
      const voidGrad = ctx.createRadialGradient(cx + shakeX, cy + shakeY, radius * 0.1, cx + shakeX, cy + shakeY, radius);
      voidGrad.addColorStop(0, '#06030c');
      voidGrad.addColorStop(0.5, '#0b0716');
      voidGrad.addColorStop(1, '#0e0b1a');
      ctx.fillStyle = voidGrad;
      ctx.fill();

      // Time factor for organic drifting animations
      const time = Date.now() * 0.0015;
      const midAngle = start + seg.angleSize / 2;

      // Layered fluffy, glowing mist clouds
      const cloudRadii = [radius * 0.35, radius * 0.6, radius * 0.8];
      const cloudSizes = [radius * 0.22, radius * 0.28, radius * 0.24];
      const cloudColors = [
        ['rgba(147, 51, 234, 0.45)', 'rgba(88, 28, 135, 0.12)', 'rgba(12, 10, 22, 0)'], // Violet mist
        ['rgba(216, 180, 254, 0.28)', 'rgba(147, 51, 234, 0.08)', 'rgba(12, 10, 22, 0)'], // Light purple mist
        ['rgba(139, 92, 246, 0.38)', 'rgba(12, 10, 22, 0)']
      ];

      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < cloudRadii.length; i++) {
        const rDist = cloudRadii[i] + Math.sin(time + i) * 8;
        const driftAngle = midAngle + Math.cos(time * 0.8 + i) * 0.02;
        const cloudX = cx + shakeX + rDist * Math.cos(driftAngle);
        const cloudY = cy + shakeY + rDist * Math.sin(driftAngle);
        const cloudSize = cloudSizes[i] + Math.sin(time * 1.2 + i) * 4;
        
        const grad = ctx.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, cloudSize);
        if (cloudColors[i].length === 3) {
          grad.addColorStop(0, cloudColors[i][0]);
          grad.addColorStop(0.5, cloudColors[i][1]);
          grad.addColorStop(1, cloudColors[i][2]);
        } else {
          grad.addColorStop(0, cloudColors[i][0]);
          grad.addColorStop(1, cloudColors[i][1]);
        }
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, cloudSize, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Detailed organic smoke puffs
      const numPuffs = 6;
      for (let p = 0; p < numPuffs; p++) {
        const puffSeed = idx * 7.7 + p * 15.4;
        const puffTime = time * 0.8 + puffSeed;
        const baseDist = radius * (0.2 + (p / numPuffs) * 0.7);
        const puffDist = baseDist + Math.sin(puffTime * 1.3) * 6;
        const puffAngle = midAngle + Math.cos(puffTime * 0.9) * 0.035;
        
        const puffX = cx + shakeX + puffDist * Math.cos(puffAngle);
        const puffY = cy + shakeY + puffDist * Math.sin(puffAngle);
        const baseSize = radius * (0.08 + (p / numPuffs) * 0.14);
        const puffSize = baseSize + Math.sin(puffTime * 1.7) * 4;
        
        const puffGrad = ctx.createRadialGradient(puffX, puffY, 0, puffX, puffY, puffSize);
        puffGrad.addColorStop(0, 'rgba(243, 232, 255, 0.16)');
        puffGrad.addColorStop(0.3, 'rgba(216, 180, 254, 0.09)');
        puffGrad.addColorStop(0.7, 'rgba(147, 51, 234, 0.03)');
        puffGrad.addColorStop(1, 'rgba(12, 10, 22, 0)');
        
        ctx.fillStyle = puffGrad;
        ctx.beginPath();
        ctx.arc(puffX, puffY, puffSize, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Will-o'-the-wisps
      const numWisps = 3;
      for (let w = 0; w < numWisps; w++) {
        const wispSeed = idx * 5.5 + w * 12.3;
        const wispTime = time * 0.5 + wispSeed;
        const wispR = radius * (0.25 + (wispSeed % 0.55)) + Math.sin(wispTime * 1.5) * 12;
        const wispA = start + seg.angleSize * (0.15 + (wispSeed % 0.7)) + Math.cos(wispTime) * 0.03;
        const wispX = cx + shakeX + wispR * Math.cos(wispA);
        const wispY = cy + shakeY + wispR * Math.sin(wispA);
        const wispOpacity = 0.35 + Math.sin(wispTime * 3.2) * 0.25;
        
        const wispGrad = ctx.createRadialGradient(wispX, wispY, 0, wispX, wispY, 6);
        wispGrad.addColorStop(0, `rgba(168, 85, 247, ${wispOpacity})`);
        wispGrad.addColorStop(0.3, `rgba(216, 180, 254, ${wispOpacity * 0.6})`);
        wispGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        
        ctx.fillStyle = wispGrad;
        ctx.beginPath();
        ctx.arc(wispX, wispY, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Swirling arcs
      ctx.strokeStyle = 'rgba(216, 180, 254, 0.22)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const swirlOffset = Math.sin(time) * 0.015;
      ctx.arc(cx + shakeX, cy + shakeY, radius * 0.5, start + seg.angleSize * 0.15 + swirlOffset, end - seg.angleSize * 0.15 + swirlOffset);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(168, 85, 247, 0.16)';
      ctx.beginPath();
      ctx.arc(cx + shakeX, cy + shakeY, radius * 0.75, start + seg.angleSize * 0.2 - swirlOffset, end - seg.angleSize * 0.2 - swirlOffset);
      ctx.stroke();

      ctx.restore();
    } else if (seg.option.currentShields > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx + shakeX, cy + shakeY);
      ctx.arc(cx + shakeX, cy + shakeY, radius, start, end);
      ctx.closePath();
      ctx.clip();

      // Semi-translucent base cyan pad
      ctx.fillStyle = 'rgba(14, 165, 233, 0.18)'; 
      ctx.fill();

      // Reflective glass radial gradient
      const glassGrad = ctx.createRadialGradient(
        cx + shakeX, 
        cy + shakeY, 
        radius * 0.3, 
        cx + shakeX, 
        cy + shakeY, 
        radius
      );
      glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
      glassGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.15)');
      glassGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.12)');
      glassGrad.addColorStop(1, 'rgba(3, 105, 161, 0.4)');
      ctx.fillStyle = glassGrad;
      ctx.fill();

      // Sheen line
      ctx.globalCompositeOperation = 'screen';
      const sheenGrad = ctx.createLinearGradient(
        cx + shakeX - radius, 
        cy + shakeY - radius, 
        cx + shakeX + radius, 
        cy + shakeY + radius
      );
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sheenGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
      sheenGrad.addColorStop(0.48, 'rgba(255, 255, 255, 0.25)');
      sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
      sheenGrad.addColorStop(0.52, 'rgba(255, 255, 255, 0.25)');
      sheenGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sheenGrad;
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Glass bevels
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx + shakeX, cy + shakeY, radius - 6, start + seg.angleSize * 0.05, end - seg.angleSize * 0.05);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx + shakeX, cy + shakeY, radius * 0.65, start + seg.angleSize * 0.1, end - seg.angleSize * 0.1);
      ctx.stroke();

      // Break lines/cracks based on durability ratio
      const ratio = seg.option.currentShields / seg.option.shields;
      if (ratio < 1.0) {
        ctx.strokeStyle = 'rgba(230, 248, 255, 0.9)';
        ctx.lineWidth = 1.75;
        ctx.shadowColor = '#e0f2fe';
        ctx.shadowBlur = 5;
        
        const seed = idx * 1.7 + 0.5;
        const crackAngle = start + seg.angleSize * (0.3 + (seed % 0.4));
        const numCracks = ratio <= 0.34 ? 5 : 2;
        
        for (let c = 0; c < numCracks; c++) {
          const crackSeed = seed + c * 2.3;
          ctx.beginPath();
          let curX = cx + (radius * 0.4) * Math.cos(crackAngle);
          let curY = cy + (radius * 0.4) * Math.sin(crackAngle);
          ctx.moveTo(curX, curY);

          const segmentsCount = 4;
          for (let s = 0; s < segmentsCount; s++) {
            const segAngle = crackAngle + (Math.sin(crackSeed + s) * 0.3);
            const segDist = (radius * 0.5) / segmentsCount;
            curX += segDist * Math.cos(segAngle);
            curY += segDist * Math.sin(segAngle);
            ctx.lineTo(curX, curY);
          }
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Outer arc border line
    if (!isCurrentlyCracking && !isCurrentlyExploding) {
      ctx.beginPath();
      ctx.arc(cx + shakeX, cy + shakeY, radius, start, end);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#07050f';
      ctx.stroke();
    }

    // Radial separator lines
    const prevIdx = (idx - 1 + activeSegs.length) % activeSegs.length;
    const isBoundaryDepleting = (depletionIndex === idx || depletionIndex === prevIdx) && depletionPhase !== null;
    if (!isBoundaryDepleting) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(start), cy + radius * Math.sin(start));
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#07050f';
      ctx.stroke();
    }

    // Draw Option Label & Health LEDs
    ctx.save();
    ctx.translate(cx + shakeX, cy + shakeY);
    
    // Normalize angle to [0, 2*PI]
    let angle = (seg.startAngle + seg.angleSize / 2 + currentAngle) % (2 * Math.PI);
    if (angle < 0) angle += 2 * Math.PI;

    // Rotate to the midpoint angle of the slice
    ctx.rotate(angle);

    if (seg.angleSize >= 0.06) {
      const maxShrouds = seg.option.shrouds || 0;
      const currentShrouds = seg.option.currentShrouds || 0;
      const maxShields = seg.option.shields || 0;
      const currentShields = seg.option.currentShields || 0;
      const maxLives = seg.option.lives;
      const currentLives = seg.option.currentLives;
      
      if (currentShrouds > 0) {
        // Shrouds LED
        if (maxShrouds <= 3) {
          const arcRadius = radius - 15;
          const spacingAngle = 0.055;
          const startDotAngle = -((maxShrouds - 1) * spacingAngle) / 2;
          for (let s = 0; s < maxShrouds; s++) {
            const dotAngle = startDotAngle + s * spacingAngle;
            const dotX = arcRadius * Math.cos(dotAngle);
            const dotY = arcRadius * Math.sin(dotAngle);
            ctx.beginPath();
            ctx.arc(dotX, dotY, 4.5, 0, 2 * Math.PI);
            
            if (s < currentShrouds) {
              ctx.fillStyle = '#05030a';
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
              ctx.strokeStyle = '#07050f';
              ctx.lineWidth = 1.5;
              ctx.fill();
              ctx.stroke();
            }
          }
        } else {
          const dotX = radius - 15;
          ctx.beginPath();
          ctx.arc(dotX, 0, 4.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#05030a';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Outfit, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'right';
          ctx.fillText(`x${currentShrouds}`, dotX - 8, 0);
        }
      } else if (currentShields > 0) {
        // Shields LED
        if (maxShields <= 3) {
          const arcRadius = radius - 15;
          const spacingAngle = 0.055;
          const startDotAngle = -((maxShields - 1) * spacingAngle) / 2;
          for (let s = 0; s < maxShields; s++) {
            const dotAngle = startDotAngle + s * spacingAngle;
            const dotX = arcRadius * Math.cos(dotAngle);
            const dotY = arcRadius * Math.sin(dotAngle);
            ctx.beginPath();
            ctx.arc(dotX, dotY, 4.5, 0, 2 * Math.PI);
            
            if (s < currentShields) {
              ctx.fillStyle = '#06b6d4';
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
              ctx.strokeStyle = '#07050f';
              ctx.lineWidth = 1.5;
              ctx.fill();
              ctx.stroke();
            }
          }
        } else {
          const dotX = radius - 15;
          ctx.beginPath();
          ctx.arc(dotX, 0, 4.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#06b6d4';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Outfit, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'right';
          ctx.fillText(`x${currentShields}`, dotX - 8, 0);
        }
      } else if (maxLives > 0) {
        // Lives LED
        if (maxLives <= 3) {
          const arcRadius = radius - 15;
          const spacingAngle = 0.055;
          const startDotAngle = -((maxLives - 1) * spacingAngle) / 2;
          for (let l = 0; l < maxLives; l++) {
            const dotAngle = startDotAngle + l * spacingAngle;
            const dotX = arcRadius * Math.cos(dotAngle);
            const dotY = arcRadius * Math.sin(dotAngle);
            
            ctx.beginPath();
            ctx.arc(dotX, dotY, 4.5, 0, 2 * Math.PI);
            
            if (l < currentLives) {
              ctx.fillStyle = '#ef4444';
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 5;
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
              ctx.shadowBlur = 0;
            }
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#07050f';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        } else {
          const dotX = radius - 15;
          ctx.beginPath();
          ctx.arc(dotX, 0, 4.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.strokeStyle = '#07050f';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Outfit, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'right';
          ctx.fillText(`x${currentLives}`, dotX - 8, 0);
        }
      }

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.textBaseline = 'middle';

      const maxTextWidth = radius - 30 - (radius * 0.18 + 15);
      
      const isShrouded = currentShrouds > 0;
      const displayName = isShrouded 
        ? 'Hidden option' 
        : (seg.option.name.length > 20 ? seg.option.name.substring(0, 18) + '..' : seg.option.name);

      let fontSize = Math.max(18, Math.min(24, Math.floor(radius / 14.5)));
      if (isShrouded) {
        ctx.fillStyle = '#f3e8ff';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 8;
        ctx.font = `italic bold ${Math.max(12, fontSize - 2)}px Outfit, sans-serif`;
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
      }

      let textWidth = ctx.measureText(displayName).width;
      let tempSize = isShrouded ? fontSize - 2 : fontSize;
      while (textWidth > maxTextWidth && tempSize > 11) {
        tempSize--;
        const fontPrefix = isShrouded ? 'italic bold' : 'bold';
        ctx.font = `${fontPrefix} ${tempSize}px Outfit, sans-serif`;
        textWidth = ctx.measureText(displayName).width;
      }

      const isOnLeftSide = angle > Math.PI / 2 && angle < 3 * Math.PI / 2;

      if (isOnLeftSide) {
        ctx.rotate(Math.PI);
        ctx.textAlign = 'left';
        ctx.fillText(displayName, -radius + 30, 0, maxTextWidth);
      } else {
        ctx.textAlign = 'right';
        ctx.fillText(displayName, radius - 30, 0, maxTextWidth);
      }
    }

    ctx.restore();
  });

  // 2. Draw Outer Ring Glow
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(15, 12, 27, 0.9)';
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();

  // Outer ring flash neon glow overlay
  if (borderFlash > 0.01) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = `rgba(168, 85, 247, ${borderFlash * 0.85})`;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 20 * borderFlash;
    ctx.stroke();
    ctx.restore();
  }

  // Outer light dots (pegs)
  const numPegs = Math.max(12, activeOptions.length * 2);
  for (let i = 0; i < numPegs; i++) {
    const pegAngle = (i / numPegs) * 2 * Math.PI;
    const px = cx + radius * Math.cos(pegAngle);
    const py = cy + radius * Math.sin(pegAngle);
    
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
  }

  // 3. Draw Center Glowing Hub
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.18, 0, 2 * Math.PI);
  ctx.fillStyle = '#0f0c1b';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
  ctx.fill();
  ctx.stroke();
  
  const hubGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.18);
  hubGlow.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
  hubGlow.addColorStop(1, 'rgba(139, 92, 246, 0)');
  ctx.fillStyle = hubGlow;
  ctx.fill();

  // 4. Draw Pointer (Top Center pointing down)
  ctx.save();
  ctx.translate(cx, cy - radius);
  
  // Spring-damper pointer wobble rotation
  ctx.rotate(pointerWobble);

  ctx.beginPath();
  ctx.moveTo(-16, -20);
  ctx.lineTo(16, -20);
  ctx.lineTo(0, 18);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Hinge peg
  ctx.beginPath();
  ctx.arc(0, -14, 5, 0, 2 * Math.PI);
  ctx.fillStyle = 'var(--color-accent)';
  ctx.fill();
  
  ctx.restore();

  // 5. Draw particles
  particles.forEach((p) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 2;
    ctx.fill();
    ctx.restore();
  });

  // 6. Draw depletion explosion shards
  depletionShards.forEach((s) => {
    if (s.alpha <= 0) return;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let p = 1; p < s.points.length; p++) {
      ctx.lineTo(s.points[p].x, s.points[p].y);
    }
    ctx.closePath();
    
    ctx.fillStyle = s.color;
    ctx.globalAlpha = s.alpha;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = s.size;
    ctx.fill();
    ctx.restore();
  });

  ctx.restore(); // Restore screen shake translation

  // 7. Draw floating announcement banner
  if (bannerText) {
    const elapsed = Date.now() - bannerStart;
    const duration = 3000;
    if (elapsed < duration) {
      ctx.save();
      
      let alpha = 1;
      if (elapsed < 400) {
        alpha = elapsed / 400;
      } else if (elapsed > duration - 500) {
        alpha = (duration - elapsed) / 500;
      }
      
      const progress = elapsed / duration;
      const yOffset = 20 - 50 * easeOutCubic(progress);
      
      let scale = 1;
      if (elapsed < 400) {
        scale = 0.8 + 0.25 * easeOutCubic(elapsed / 400);
      }
      
      ctx.translate(cx, cy + yOffset);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      
      ctx.font = 'bold 20px Outfit, sans-serif';
      const textWidth = ctx.measureText(bannerText).width;
      
      const padX = 28;
      const padY = 14;
      const boxWidth = textWidth + padX * 2;
      const boxHeight = 20 + padY * 2;
      
      const isUnlock = bannerText.includes('UNLOCKED');
      const gradient = ctx.createLinearGradient(-boxWidth / 2, 0, boxWidth / 2, 0);
      if (isUnlock) {
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.95)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.95)');
      } else {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
        gradient.addColorStop(1, 'rgba(249, 115, 22, 0.95)');
      }
      
      ctx.fillStyle = gradient;
      
      ctx.shadowColor = isUnlock ? 'rgba(6, 182, 212, 0.6)' : 'rgba(249, 115, 22, 0.6)';
      ctx.shadowBlur = 25;
      
      ctx.beginPath();
      ctx.roundRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 24);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(bannerText, 0, 0);
      
      ctx.restore();
    }
  }
};
