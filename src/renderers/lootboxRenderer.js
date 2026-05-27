import { getAlphaColor } from '../utils/colors';

// Helper to draw horizontal conveyor ticker on the canvas
export const drawLootboxTicker = (ctx, width, height, {
  screenShake = 0,
  currentOffset = 0,
  tickerItems = [],
  optionRarities = {},
  totalWeight = 0,
  particles = [],
  pointerWobble = 0
}) => {
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

  const cardWidth = 180;
  const cardHeight = 190;
  const cardGap = 16;
  const cardStep = cardWidth + cardGap;
  const offset = currentOffset;
  const items = tickerItems;
  
  const startIdx = Math.max(0, Math.floor(offset / cardStep) - 1);
  const endIdx = Math.min(items.length - 1, Math.ceil((offset + width) / cardStep));

  // Custom helper to wrap text character-by-character if needed
  const wrapText = (textStr, maxWidth, maxLines) => {
    const words = textStr.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(testLine).width > maxWidth) {
        if (currentLine) {
          lines.push(currentLine);
          if (ctx.measureText(word).width > maxWidth) {
            let charLine = '';
            for (let j = 0; j < word.length; j++) {
              if (ctx.measureText(charLine + word[j]).width > maxWidth) {
                lines.push(charLine);
                charLine = word[j];
              } else {
                charLine += word[j];
              }
            }
            currentLine = charLine;
          } else {
            currentLine = word;
          }
        } else {
          let charLine = '';
          for (let j = 0; j < word.length; j++) {
            if (ctx.measureText(charLine + word[j]).width > maxWidth) {
              lines.push(charLine);
              charLine = word[j];
            } else {
              charLine += word[j];
            }
          }
          currentLine = charLine;
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    if (lines.length > maxLines) {
      const result = lines.slice(0, maxLines);
      let last = result[maxLines - 1];
      while (ctx.measureText(last + '...').width > maxWidth && last.length > 0) {
        last = last.slice(0, -1);
      }
      result[maxLines - 1] = last + '...';
      return result;
    }
    return lines;
  };

  for (let i = startIdx; i <= endIdx; i++) {
    const opt = items[i];
    if (!opt) continue;
    const x = i * cardStep - offset;
    const y = (height - cardHeight) / 2;

    ctx.save();
    ctx.translate(x, y);

    const rarity = optionRarities[opt.id] || 'common';

    // 1. Draw Card Shadow/Glow based on rarity
    if (rarity === 'gold') {
      ctx.shadowColor = 'rgba(234, 179, 8, 0.4)';
      ctx.shadowBlur = 15;
    } else if (rarity === 'red') {
      ctx.shadowColor = 'rgba(239, 68, 68, 0.28)';
      ctx.shadowBlur = 12;
    } else if (rarity === 'purple') {
      ctx.shadowColor = 'rgba(168, 85, 247, 0.28)';
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    // 2. Draw Card Background
    let cardBg;
    if (rarity === 'gold') {
      cardBg = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
      cardBg.addColorStop(0, 'rgba(20, 20, 30, 0.85)');
      cardBg.addColorStop(1, 'rgba(234, 179, 8, 0.07)');
    } else if (rarity === 'red') {
      cardBg = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
      cardBg.addColorStop(0, 'rgba(20, 20, 30, 0.85)');
      cardBg.addColorStop(1, 'rgba(239, 68, 68, 0.08)');
    } else if (rarity === 'purple') {
      cardBg = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
      cardBg.addColorStop(0, 'rgba(20, 20, 30, 0.85)');
      cardBg.addColorStop(1, 'rgba(168, 85, 247, 0.08)');
    } else {
      cardBg = 'rgba(20, 20, 30, 0.65)';
    }

    ctx.fillStyle = cardBg;
    ctx.beginPath();
    ctx.roundRect(0, 0, cardWidth, cardHeight, 12);
    ctx.fill();

    // Reset shadow so it doesn't bleed into internal layers
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 3. Draw Card Border (Thicker Rarity Borders)
    let borderStroke;
    let borderWidth;
    if (rarity === 'gold') {
      borderStroke = 'rgba(234, 179, 8, 0.85)';
      borderWidth = 2.5;
    } else if (rarity === 'red') {
      borderStroke = 'rgba(239, 68, 68, 0.75)';
      borderWidth = 2;
    } else if (rarity === 'purple') {
      borderStroke = 'rgba(168, 85, 247, 0.75)';
      borderWidth = 2;
    } else {
      borderStroke = 'rgba(255, 255, 255, 0.08)';
      borderWidth = 1;
    }

    ctx.strokeStyle = borderStroke;
    ctx.lineWidth = borderWidth;
    ctx.stroke();

    // 4. Draw Preview Box inside card
    const boxX = 13;
    const boxY = 13;
    const boxW = cardWidth - 26; // 154
    const boxH = 120;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.clip();

    const currentShrouds = opt.currentShrouds || 0;
    const currentShields = opt.currentShields || 0;

    if (currentShrouds > 0) {
      ctx.fillStyle = 'rgba(30, 20, 45, 0.95)';
      ctx.fillRect(boxX, boxY, boxW, boxH);

      const time = Date.now() * 0.001;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      for (let j = 0; j < 3; j++) {
        const fx = boxX + (boxW / 2) + Math.sin(time + j * 2) * 15;
        const fy = boxY + (boxH / 2) + Math.cos(time * 0.8 + j) * 10;
        ctx.beginPath();
        ctx.arc(fx, fy, 25, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☁️', boxX + boxW / 2, boxY + boxH / 2 - 10);

      ctx.fillStyle = '#a855f7';
      ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('HIDDEN OPTION', boxX + boxW / 2, boxY + boxH / 2 + 15);

    } else if (currentShields > 0) {
      ctx.fillStyle = 'rgba(10, 25, 40, 0.6)';
      ctx.fillRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = opt.color;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.globalAlpha = 1.0;

      const glassGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
      glassGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
      glassGrad.addColorStop(1, 'rgba(6, 182, 212, 0.04)');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(boxX, boxY, boxW, boxH);

      const timeRef = (Date.now() * 0.0005) % 2;
      const lineX = boxX - 50 + timeRef * (boxW + 100);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lineX, boxY);
      ctx.lineTo(lineX + 30, boxY + boxH);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const sx = boxX + boxW / 2;
      const sy = boxY + boxH / 2 - 8;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 10, sy + 4);
      ctx.lineTo(sx + 10, sy + 12);
      ctx.quadraticCurveTo(sx + 10, sy + 20, sx, sy + 24);
      ctx.quadraticCurveTo(sx - 10, sy + 20, sx - 10, sy + 12);
      ctx.lineTo(sx - 10, sy + 4);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#06b6d4';
      ctx.font = '700 8.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SHIELDED', boxX + boxW / 2, boxY + boxH / 2 + 18);

    } else {
      const bgGrad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
      bgGrad.addColorStop(0, 'rgba(15, 15, 25, 0.9)');
      bgGrad.addColorStop(1, getAlphaColor(opt.color, 0.13));
      ctx.fillStyle = bgGrad;
      ctx.fillRect(boxX, boxY, boxW, boxH);

      const radGrad = ctx.createRadialGradient(boxX + boxW / 2, boxY + boxH / 2, 2, boxX + boxW / 2, boxY + boxH / 2, 25);
      radGrad.addColorStop(0, opt.color);
      radGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(boxX + boxW / 2, boxY + boxH / 2, 25, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = opt.color;
      ctx.beginPath();
      ctx.arc(boxX + boxW / 2, boxY + boxH / 2, 18, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 20px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opt.name.charAt(0).toUpperCase(), boxX + boxW / 2, boxY + boxH / 2);
    }
    ctx.restore(); // restores clip path

    // Draw bottom color bar inside preview box boundary
    ctx.fillStyle = opt.color;
    ctx.fillRect(boxX, boxY + boxH - 4, boxW, 4);

    // 5. Draw Option Name underneath preview box (wrapped up to 2 lines)
    const displayName = currentShrouds > 0 ? 'Hidden option' : opt.name;
    ctx.font = '600 11.5px "Plus Jakarta Sans", sans-serif';
    const lines = wrapText(displayName, cardWidth - 24, 2);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const textStartY = 141;
    const lineHeight = 13.5;
    for (let j = 0; j < lines.length; j++) {
      ctx.fillText(lines[j], cardWidth / 2, textStartY + j * lineHeight);
    }

    // 6. Draw Remaining Durability (bottom-left) and Chance Percentage (bottom-right)
    const bottomY = cardHeight - 12;
    ctx.textBaseline = 'middle';

    // Bottom Left: Durability Info
    ctx.textAlign = 'left';
    if (currentShrouds > 0) {
      ctx.fillStyle = '#a855f7';
      ctx.font = '650 10.5px Outfit, sans-serif';
      ctx.fillText(`☁️ ${currentShrouds}`, 14, bottomY);
    } else if (currentShields > 0) {
      ctx.fillStyle = '#06b6d4';
      ctx.font = '650 10.5px Outfit, sans-serif';
      ctx.fillText(`🛡️ ${currentShields}`, 14, bottomY);
    } else if (opt.lives > 0) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '650 10.5px Outfit, sans-serif';
      ctx.fillText(`❤️ ${opt.currentLives}`, 14, bottomY);
    } else {
      ctx.fillStyle = '#10b981';
      ctx.font = '650 10.5px Outfit, sans-serif';
      ctx.fillText(`♾️`, 14, bottomY);
    }

    // Bottom Right: Probability Chance %
    ctx.textAlign = 'right';
    ctx.fillStyle = '#06b6d4';
    ctx.font = '700 11px Outfit, sans-serif';
    const chance = totalWeight > 0 ? ((opt.weight / totalWeight) * 100).toFixed(1) : '0.0';
    ctx.fillText(`${chance}%`, cardWidth - 14, bottomY);

    ctx.restore();
  }

  ctx.restore();

  const fadeWidth = 80;
  const leftGrad = ctx.createLinearGradient(0, 0, fadeWidth, 0);
  leftGrad.addColorStop(0, 'rgba(15, 12, 28, 1)');
  leftGrad.addColorStop(1, 'rgba(15, 12, 28, 0)');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, fadeWidth, height);

  const rightGrad = ctx.createLinearGradient(width - fadeWidth, 0, width, 0);
  rightGrad.addColorStop(0, 'rgba(15, 12, 28, 0)');
  rightGrad.addColorStop(1, 'rgba(15, 12, 28, 1)');
  ctx.fillStyle = rightGrad;
  ctx.fillRect(width - fadeWidth, 0, fadeWidth, height);

  // Draw particles
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  });

  const pointerX = width / 2;
  const wobble = pointerWobble * 10;
  
  ctx.save();
  ctx.translate(wobble, 0);
  
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(234, 179, 8, 0.5)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(pointerX, 0);
  ctx.lineTo(pointerX, height);
  ctx.stroke();

  ctx.fillStyle = '#eab308';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(pointerX - 12, 0);
  ctx.lineTo(pointerX + 12, 0);
  ctx.lineTo(pointerX, 15);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(pointerX - 12, height);
  ctx.lineTo(pointerX + 12, height);
  ctx.lineTo(pointerX, height - 15);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
};
