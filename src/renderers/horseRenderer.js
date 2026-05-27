// Helper to draw a stylized 2D horse on the canvas
export const drawVectorHorse = (ctx, cx, cy, option, isRunning, elapsed, idx, rarity = 'common', scale = 1.6) => {
  let bodyColor = '#8b5a2b'; // chestnut brown
  if (idx % 4 === 1) bodyColor = '#7a7a7a'; // steel grey
  if (idx % 4 === 2) bodyColor = '#212121'; // jet black
  if (idx % 4 === 3) bodyColor = '#d2b48c'; // tan/palomino
  
  if (rarity === 'gold') bodyColor = '#eab308'; // gold
  if (rarity === 'red') bodyColor = '#ef4444'; // red/fire
  if (rarity === 'purple') bodyColor = '#a855f7'; // purple

  ctx.save();
  
  // Horse running bob
  const bobY = isRunning ? Math.sin(elapsed * 0.025) * 3 : 0;
  ctx.translate(cx, cy + bobY);
  ctx.scale(scale, scale); // Scale the horse drawing using the passed parameter

  // Apply special glowing highlights for rare horses
  if (rarity === 'gold') {
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 12;
  } else if (rarity === 'red') {
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
  } else if (rarity === 'purple') {
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 10;
  }

  const swingAngle = isRunning ? Math.sin(elapsed * 0.02) * 0.5 : 0;
  
  // Draw legs
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // 1. Inner legs (Back leg 2 & Front leg 2 - drawn darker/faded for depth)
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = bodyColor;
  
  // Inner Back Leg
  ctx.beginPath();
  ctx.moveTo(-11, 2);
  ctx.lineTo(-13 + Math.sin(-swingAngle) * 6, 8);
  ctx.lineTo(-10 + Math.sin(-swingAngle - 0.25) * 9, 15);
  ctx.stroke();
  
  // Inner Front Leg
  ctx.beginPath();
  ctx.moveTo(10, 2);
  ctx.lineTo(12 + Math.sin(swingAngle) * 5, 8);
  ctx.lineTo(15 + Math.sin(swingAngle + 0.3) * 8, 15);
  ctx.stroke();
  ctx.restore();

  // 2. Outer legs (Back leg 1 & Front leg 1 - drawn full color)
  ctx.save();
  ctx.strokeStyle = bodyColor;
  
  // Outer Back Leg
  ctx.beginPath();
  ctx.moveTo(-7, 2);
  ctx.lineTo(-9 + Math.sin(swingAngle) * 6, 8);
  ctx.lineTo(-6 + Math.sin(swingAngle - 0.25) * 9, 15);
  ctx.stroke();
  
  // Outer Front Leg
  ctx.beginPath();
  ctx.moveTo(6, 2);
  ctx.lineTo(8 + Math.sin(-swingAngle) * 5, 8);
  ctx.lineTo(11 + Math.sin(-swingAngle + 0.3) * 8, 15);
  ctx.stroke();
  ctx.restore();

  // Draw body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw Neck/Head (Arched neck with muzzle, chin, and jaw cheeks)
  ctx.beginPath();
  ctx.moveTo(8, -5);     // Back of neck on body
  ctx.lineTo(14, -15);   // Neck arch back
  ctx.lineTo(18, -23);   // Poll (top of head)
  ctx.lineTo(29, -19);   // Snout tip
  ctx.lineTo(28, -16);   // Chin/nose bottom
  ctx.lineTo(22, -14);   // Under jaw
  ctx.lineTo(18, -11);   // Cheek/jaw corner
  ctx.lineTo(14, -6);    // Throat
  ctx.lineTo(12, -3);    // Front of neck on body
  ctx.closePath();
  ctx.fill();
   
  // Ears (Two small pointing ears at the top of head poll, adjusted for poll at y = -23)
  ctx.beginPath();
  ctx.moveTo(16.5, -23);
  ctx.lineTo(17.5, -28);
  ctx.lineTo(19, -23);
  ctx.lineTo(20.5, -27);
  ctx.lineTo(22, -23);
  ctx.fill();

  // Mane (hair) (Flowing along the back of the neck)
  ctx.fillStyle = rarity === 'gold' ? '#ffd700' : rarity === 'red' ? '#ca8a04' : rarity === 'purple' ? '#c084fc' : '#333';
  ctx.beginPath();
  ctx.moveTo(7, -5);
  ctx.lineTo(5, -10);
  ctx.lineTo(11, -17);
  ctx.lineTo(15, -23); // Top near poll
  ctx.lineTo(14, -15); // Connect to neck back
  ctx.lineTo(8, -5);
  ctx.closePath();
  ctx.fill();

  // Eye (A small white circle to give the horse personality)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(21.5, -18.5, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Tail (Flowing vector tail)
  ctx.save();
  ctx.translate(-15, -2);
  ctx.rotate(isRunning ? Math.sin(elapsed * 0.02) * 0.3 - 0.3 : -0.15);
  ctx.fillStyle = rarity === 'gold' ? '#ca8a04' : rarity === 'red' ? '#ca8a04' : rarity === 'purple' ? '#7e22ce' : '#333';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-8, 3, -12, 12);
  ctx.quadraticCurveTo(-6, 12, -2, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Draw simple U-shape saddle sitting level on the back of the horse (re-proportioned to be taller and flush)
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // Draw saddle matching option color
  ctx.fillStyle = option.color;
  ctx.beginPath();
  // Top curve of the saddle (front to back)
  ctx.moveTo(-6, -11.5);
  ctx.quadraticCurveTo(-1, -9.5, 4, -11.0);
  // Right edge
  ctx.lineTo(4, -7.4);
  // Bottom curve of the saddle (back to front, sitting on the horse's back)
  ctx.quadraticCurveTo(-1, -4.5, -6, -7.4);
  ctx.closePath();
  ctx.fill();

  // Outline saddle for visibility
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.restore();

  ctx.restore();
};
