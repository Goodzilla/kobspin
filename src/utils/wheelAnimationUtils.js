export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const generateCracks = (angleSize, radius) => {
  const paths = [];
  const numMainPaths = 3;
  
  for (let p = 0; p < numMainPaths; p++) {
    const path = [];
    path.push({ x: 0, y: 0 });
    
    const numSteps = 6;
    const skewFactor = (p - (numMainPaths - 1) / 2) * 0.5; // -0.5, 0, 0.5
    
    for (let s = 1; s <= numSteps; s++) {
      const targetX = (s / numSteps) * radius * (0.95 + Math.random() * 0.05);
      const maxLimitY = targetX * Math.sin(angleSize / 2);
      
      const targetY = skewFactor * maxLimitY + (Math.random() * 2 - 1) * 0.3 * maxLimitY;
      path.push({ x: targetX, y: targetY });
      
      if (s > 2 && s < numSteps && Math.random() < 0.4) {
        const branch = [{ x: targetX, y: targetY }];
        const branchSteps = 3;
        let branchX = targetX;
        let branchY = targetY;
        for (let b = 1; b <= branchSteps; b++) {
          const bx = branchX + (b / branchSteps) * (radius - targetX) * 0.8;
          const bMaxY = bx * Math.sin(angleSize / 2);
          const by = branchY + (Math.random() * 2 - 1) * 0.4 * bMaxY;
          branch.push({ x: bx, y: Math.max(-bMaxY, Math.min(bMaxY, by)) });
        }
        paths.push(branch);
      }
    }
    paths.push(path);
  }
  return paths;
};

export const generateShards = (segAngleStart, segAngleEnd, sliceColor, radius, cx, cy, currentAngle) => {
  const shards = [];
  const numShards = 40;
  
  for (let i = 0; i < numShards; i++) {
    const angle = segAngleStart + currentAngle + Math.random() * (segAngleEnd - segAngleStart);
    const dist = radius * (0.2 + Math.random() * 0.7);
    
    const x = cx + dist * Math.cos(angle);
    const y = cy + dist * Math.sin(angle);
    
    const speed = 4 + Math.random() * 9;
    const vx = Math.cos(angle) * speed + (Math.random() * 2 - 1) * 2.5;
    const vy = Math.sin(angle) * speed - 4 + (Math.random() * 2 - 1) * 2.5;
    
    const size = 6 + Math.random() * 12;
    const points = [];
    const numPoints = 3 + Math.floor(Math.random() * 2);
    for (let p = 0; p < numPoints; p++) {
      const ptAngle = (p / numPoints) * 2 * Math.PI + Math.random() * 0.5;
      points.push({
        x: Math.cos(ptAngle) * size * 0.5,
        y: Math.sin(ptAngle) * size * 0.5
      });
    }
    
    shards.push({
      x,
      y,
      vx,
      vy,
      points,
      angle: Math.random() * 2 * Math.PI,
      spin: (Math.random() * 2 - 1) * 0.2,
      color: sliceColor,
      alpha: 1,
      gravity: 0.16
    });
  }
  return shards;
};
