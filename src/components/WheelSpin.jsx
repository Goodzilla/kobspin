import { useRef, useEffect, useState, useMemo } from 'react';
import { audio } from '../audio';
import { easeOutCubic, generateShards } from '../utils/wheelAnimationUtils';
import WinnerModal from './WinnerModal';
import ResetConfirmModal from './ResetConfirmModal';

export default function WheelSpin({ 
  wheel, 
  wheels = [],
  autoSpin = false,
  onClearAutoSpin,
  onTransitionToWheel,
  nestedResult = null,
  onClearNestedResult,
  onSpinEnd, 
  onOpenSettings, 
  onBackHome, 
  onResetWheel 
}) {
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  
  // Animation state refs to avoid React re-render lag
  const angleRef = useRef(0); // Current rotation angle
  const velocityRef = useRef(0);
  const lastSegmentIndex = useRef(-1);
  const particlesRef = useRef([]);
  const requestRef = useRef(null);

  // New visual & auditory enhancement refs
  const celebrationTypeRef = useRef(null);
  const celebrationStartRef = useRef(0);
  const depletionIndexRef = useRef(-1);
  const depletionStartRef = useRef(0);
  const depletionPhaseRef = useRef(null);
  const depletionShardsRef = useRef([]);
  const depletingOptionIdRef = useRef(null);
  const appearingOptionIdRef = useRef(null);
  const appearPhaseRef = useRef(null);
  const appearStartRef = useRef(0);
  const bannerTextRef = useRef(null);
  const bannerStartRef = useRef(0);
  const onSpinEndCalledRef = useRef(false);
  const spinStartTimeRef = useRef(0);
  const spinDurationRef = useRef(10000);
  const startAngleRef = useRef(0);
  const targetAngleRef = useRef(0);
  const winnerRef = useRef(null);
  const pendingAppearingOptionRef = useRef(null);

  // Juice & logic refs
  const isSpinningRef = useRef(false);
  const pointerWobbleRef = useRef(0);
  const pointerWobbleVelRef = useRef(0);
  const borderFlashRef = useRef(0);
  const screenShakeRef = useRef(0);

  // Memoize options and segments to maintain reference stability across state-induced renders
  const activeOptions = useMemo(() => {
    return wheel.activeOptions || [];
  }, [wheel.activeOptions]);

  const sortedOptions = useMemo(() => {
    return [...activeOptions].sort((a, b) => b.weight - a.weight);
  }, [activeOptions]);


  const totalWeight = useMemo(() => {
    return activeOptions.reduce((sum, opt) => sum + opt.weight, 0);
  }, [activeOptions]);

  const segments = useMemo(() => {
    const segs = [];
    let currentAngle = 0;
    for (let i = 0; i < activeOptions.length; i++) {
      const opt = activeOptions[i];
      const angleSize = (opt.weight / totalWeight) * 2 * Math.PI;
      segs.push({
        option: opt,
        startAngle: currentAngle,
        endAngle: currentAngle + angleSize,
        angleSize
      });
      currentAngle += angleSize;
    }
    return segs;
  }, [activeOptions, totalWeight]);

  const isWinnerLegendary = useMemo(() => {
    if (!winner || totalWeight === 0) return false;
    const odds = winner.weight / totalWeight;
    if (odds >= 0.05) return false;
    const sortedAsc = [...activeOptions].sort((a, b) => a.weight - b.weight);
    const thresholdWeight = sortedAsc.length >= 3 ? sortedAsc[2].weight : Infinity;
    return winner.weight <= thresholdWeight;
  }, [winner, activeOptions, totalWeight]);

  // Sync to refs to avoid closure stale-ness inside animate loop
  const activeOptionsRef = useRef(activeOptions);
  const segmentsRef = useRef(segments);

  // Sync winner state to ref
  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  useEffect(() => {
    activeOptionsRef.current = activeOptions;
    segmentsRef.current = segments;

    // Clear depletingOptionIdRef once the option is actually removed from the activeOptions prop
    if (depletingOptionIdRef.current && !activeOptions.some(o => o.id === depletingOptionIdRef.current)) {
      depletingOptionIdRef.current = null;
    }

    // Synchronize the growing phase trigger
    if (pendingAppearingOptionRef.current) {
      const optionExists = activeOptions.some(o => o.id === pendingAppearingOptionRef.current);
      if (optionExists) {
        appearingOptionIdRef.current = pendingAppearingOptionRef.current;
        pendingAppearingOptionRef.current = null;
        appearPhaseRef.current = 'growing';
        appearStartRef.current = Date.now();

        if (requestRef.current === null) {
          requestRef.current = requestAnimationFrame(animate);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOptions, segments]);

  // Handle autoSpin on mounting (linked wheel auto-run)
  useEffect(() => {
    if (autoSpin) {
      console.log('[WHEEL] Auto-spin triggered for:', wheel.name);
      
      const spinTimeout = setTimeout(() => {
        handleSpin();
        if (onClearAutoSpin) onClearAutoSpin();
      }, 350);

      return () => {
        clearTimeout(spinTimeout);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpin]);

  // Handle returned nested result from sub-wheel
  useEffect(() => {
    if (nestedResult) {
      console.log('[WHEEL] Received nestedResult:', nestedResult);
      const originOption = activeOptionsRef.current.find(opt => opt.id === nestedResult.originOptionId);
      if (originOption) {
        setWinner(originOption);
        setWinnerModalOpen(true);
      } else {
        if (onClearNestedResult) onClearNestedResult();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nestedResult]);

  const getDynamicSegments = () => {
    const opts = activeOptionsRef.current;
    if (opts.length === 0) return [];

    const dynamicWeights = opts.map(opt => {
      let w = opt.weight;

      // Adjust weight if the option is depleting
      if (opt.id === depletingOptionIdRef.current) {
        if (depletionPhaseRef.current === 'exploding') {
          const elapsed = Date.now() - depletionStartRef.current;
          const duration = 800; // explosion duration
          const progress = Math.min(1, elapsed / duration);
          w = opt.weight * (1 - progress);
        } else if (depletionPhaseRef.current === 'cracking') {
          w = opt.weight;
        } else {
          // Exploded but still in activeOptionsRef because React state update is pending
          w = 0;
        }
      }

      // Adjust weight if the option is appearing
      if (appearPhaseRef.current === 'growing' && opt.id === appearingOptionIdRef.current) {
        const elapsed = Date.now() - appearStartRef.current;
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
    for (let i = 0; i < opts.length; i++) {
      const opt = opts[i];
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

  // Find which segment is currently under the top pointer (at angle -Math.PI / 2)
  const getSelectedSegmentIndex = (currentAngle) => {
    const activeSegs = getDynamicSegments();
    if (activeSegs.length === 0) return -1;
    const pointerAngle = -Math.PI / 2;
    let relativeAngle = (pointerAngle - currentAngle) % (2 * Math.PI);
    if (relativeAngle < 0) {
      relativeAngle += 2 * Math.PI;
    }
    
    return activeSegs.findIndex(seg => 
      relativeAngle >= seg.startAngle && relativeAngle < seg.endAngle
    );
  };

  // Centralized Draw Function
  const drawWheel = (ctx, width, height, currentAngle) => {
    const radius = Math.max(0, Math.min(width, height) / 2 - 20);
    if (radius <= 0) return;
    const cx = width / 2;
    const cy = height / 2;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    ctx.save();
    if (screenShakeRef.current > 0.01) {
      const shakeAmt = screenShakeRef.current;
      const dx = (Math.random() * 2 - 1) * shakeAmt;
      const dy = (Math.random() * 2 - 1) * shakeAmt;
      ctx.translate(dx, dy);
    }

    if (activeOptionsRef.current.length === 0) {
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
      return;
    }

    // Draw celebration searchlights and glow behind the wheel
    if (celebrationTypeRef.current) {
      const elapsed = Date.now() - celebrationStartRef.current;
      if (elapsed < 4000) {
        ctx.save();
        const glow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.5);
        if (celebrationTypeRef.current === 'legendary') {
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
        if (celebrationTypeRef.current === 'legendary') {
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
    const activeSegs = getDynamicSegments();
    activeSegs.forEach((seg, idx) => {
      if (seg.angleSize < 0.001 && seg.option.id !== appearingOptionIdRef.current) {
        return;
      }

      const start = seg.startAngle + currentAngle;
      const end = seg.endAngle + currentAngle;

      const isCurrentlyExploding = (depletionIndexRef.current === idx && depletionPhaseRef.current === 'exploding');
      const isCurrentlyCracking = (depletionIndexRef.current === idx && depletionPhaseRef.current === 'cracking');

      if (isCurrentlyExploding) {
        return; // Skip drawing the slice entirely so that both its color and its lines disappear
      }

      let shakeX = 0;
      let shakeY = 0;
      if (isCurrentlyCracking) {
        const elapsed = Date.now() - depletionStartRef.current;
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

      // Outer arc border line (only if not cracking/exploding to avoid outer border crack visuals)
      if (!isCurrentlyCracking && !isCurrentlyExploding) {
        ctx.beginPath();
        ctx.arc(cx + shakeX, cy + shakeY, radius, start, end);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#07050f';
        ctx.stroke();
      }

      // Radial separator lines (only drawn for boundaries not touching a cracking/exploding slice)
      const prevIdx = (idx - 1 + activeSegs.length) % activeSegs.length;
      const isBoundaryDepleting = (depletionIndexRef.current === idx || depletionIndexRef.current === prevIdx) && depletionPhaseRef.current !== null;
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

      // Now the centerline of the slice points along the positive X-axis.
      if (seg.angleSize >= 0.06) {
        // Draw the lives dots along the outer arc of this slice.
        const maxLives = seg.option.lives;
        const currentLives = seg.option.currentLives;
        
        if (maxLives > 0) {
          const arcRadius = radius - 15;
          const spacingAngle = 0.055; // Spacing between dots in radians (approx 3.2 degrees)
          const startDotAngle = -((maxLives - 1) * spacingAngle) / 2;

          for (let l = 0; l < maxLives; l++) {
            const dotAngle = startDotAngle + l * spacingAngle;
            const dotX = arcRadius * Math.cos(dotAngle);
            const dotY = arcRadius * Math.sin(dotAngle);
            
            ctx.beginPath();
            ctx.arc(dotX, dotY, 4.5, 0, 2 * Math.PI);
            
            if (l < currentLives) {
              ctx.fillStyle = '#ef4444'; // Bright neon red
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 5;
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; // Inactive grey
              ctx.shadowBlur = 0;
            }
            ctx.fill();
            
            // Add a slight dark outline to make them pop against slice color
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#07050f';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // Reset shadows for text rendering
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Soft, high-quality drop shadow for text readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';

        // Define text boundaries (leave room for outer arc dots and center hub)
        const maxTextWidth = radius - 30 - (radius * 0.18 + 15);
        
        const maxLen = 20;
        const displayName = seg.option.name.length > maxLen
          ? seg.option.name.substring(0, maxLen - 2) + '..'
          : seg.option.name;

        // Dynamic font size scaling: starts larger on bigger viewports, but remains at a safe minimum on mobile
        let fontSize = Math.max(18, Math.min(24, Math.floor(radius / 14.5)));
        ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
        let textWidth = ctx.measureText(displayName).width;
        while (textWidth > maxTextWidth && fontSize > 11) {
          fontSize--;
          ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
          textWidth = ctx.measureText(displayName).width;
        }

        const isOnLeftSide = angle > Math.PI / 2 && angle < 3 * Math.PI / 2;

        if (isOnLeftSide) {
          // Since we are already rotated by `angle`, to flip the text we rotate by Math.PI (180 degrees)
          ctx.rotate(Math.PI);
          ctx.textAlign = 'left';
          ctx.fillText(displayName, -radius + 30, 0, maxTextWidth);
        } else {
          // No extra rotation needed since we are already rotated by `angle`
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
    if (borderFlashRef.current > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.lineWidth = 6;
      ctx.strokeStyle = `rgba(168, 85, 247, ${borderFlashRef.current * 0.85})`;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20 * borderFlashRef.current;
      ctx.stroke();
      ctx.restore();
    }

    // Outer light dots (pegs)
    const numPegs = Math.max(12, activeOptionsRef.current.length * 2);
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
    ctx.rotate(pointerWobbleRef.current);

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

    // Pointer hinge peg
    ctx.beginPath();
    ctx.arc(0, -14, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'var(--color-accent)';
    ctx.fill();
    
    ctx.restore();

    // 5. Draw particles
    const particles = particlesRef.current;
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
    depletionShardsRef.current.forEach((s) => {
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
    if (bannerTextRef.current) {
      const elapsed = Date.now() - bannerStartRef.current;
      const duration = 3000;
      if (elapsed < duration) {
        ctx.save();
        
        // Calculate animation properties
        // Fade in (first 400ms), solid, fade out (last 500ms)
        let alpha = 1;
        if (elapsed < 400) {
          alpha = elapsed / 400;
        } else if (elapsed > duration - 500) {
          alpha = (duration - elapsed) / 500;
        }
        
        // Bounce / Float up animation: start slightly below center, float up
        // We want Y-offset to go from +20 down to -30
        const progress = elapsed / duration;
        const yOffset = 20 - 50 * easeOutCubic(progress);
        
        // Scale animation: pop in slightly, then settle
        let scale = 1;
        if (elapsed < 400) {
          scale = 0.8 + 0.25 * easeOutCubic(elapsed / 400); // springy pop
        }
        
        ctx.translate(cx, cy + yOffset);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        
        // Text configuration
        const text = bannerTextRef.current;
        ctx.font = 'bold 20px Outfit, sans-serif';
        const textWidth = ctx.measureText(text).width;
        
        const padX = 28;
        const padY = 14;
        const boxWidth = textWidth + padX * 2;
        const boxHeight = 20 + padY * 2;
        
        // Draw Glassmorphic capsule background
        const isUnlock = text.includes('UNLOCKED');
        const gradient = ctx.createLinearGradient(-boxWidth / 2, 0, boxWidth / 2, 0);
        if (isUnlock) {
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.95)'); // Emerald Green
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0.95)');  // Cyan
        } else {
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.95)');  // Red
          gradient.addColorStop(1, 'rgba(249, 115, 22, 0.95)'); // Orange
        }
        
        ctx.fillStyle = gradient;
        
        // Shadow glow
        ctx.shadowColor = isUnlock ? 'rgba(6, 182, 212, 0.6)' : 'rgba(249, 115, 22, 0.6)';
        ctx.shadowBlur = 25;
        
        // Draw rounded capsule
        ctx.beginPath();
        ctx.roundRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 24);
        ctx.fill();
        
        // Subtle white inner border
        ctx.shadowBlur = 0; // reset shadow for stroke
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(text, 0, 0);
        
        ctx.restore();
      }
    }
  };

  // Canvas static draw setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      drawWheel(ctx, rect.width, rect.height, angleRef.current);
    };

    render();

    const handleResize = () => render();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOptions, segments]);

  // Clean unmount for animations (ensures no memory leaks)
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Main animation ticker loop
  function animate() {
    let continueAnimation = false;

    // Update visual effect decays and pointer spring wiggles
    pointerWobbleVelRef.current += (0 - pointerWobbleRef.current) * 0.25;
    pointerWobbleVelRef.current *= 0.75;
    pointerWobbleRef.current += pointerWobbleVelRef.current;

    borderFlashRef.current *= 0.92;
    screenShakeRef.current *= 0.88;

    if (isSpinningRef.current) {
      const now = Date.now();
      const elapsed = now - spinStartTimeRef.current;
      const duration = spinDurationRef.current;
      const t = Math.min(1, elapsed / duration);
      const angularDistance = targetAngleRef.current - startAngleRef.current;

      // Analytical velocity in rad/sec: derivative of easeOutCubic is 3 * (1 - t)^2
      const velocityRadSec = (angularDistance * 3 * Math.pow(1 - t, 2)) / (duration / 1000);

      const isStillMoving = elapsed < duration && (elapsed < 1000 || velocityRadSec > 0.015);

      if (isStillMoving) {
        const easeVal = easeOutCubic(t);
        const nextAngle = startAngleRef.current + angularDistance * easeVal;
        
        velocityRef.current = nextAngle - angleRef.current;
        angleRef.current = nextAngle;
        continueAnimation = true;

        // Check boundary crossings for tick sound, wiggle impulse, ring flash, and camera shake
        const currentSegment = getSelectedSegmentIndex(angleRef.current);
        if (currentSegment !== -1 && currentSegment !== lastSegmentIndex.current) {
          audio.playTick();
          lastSegmentIndex.current = currentSegment;
          pointerWobbleRef.current = 0.38;
          pointerWobbleVelRef.current = -0.05;
          borderFlashRef.current = 1.0;
          screenShakeRef.current = Math.min(2.5, velocityRef.current * 70);
        }

        // Spawn golden sparks shooting downwards from the pointer
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const radius = Math.max(0, Math.min(rect.width, rect.height) / 2 - 20);
          const sparkCount = Math.floor(Math.abs(velocityRef.current) * 150);
          for (let i = 0; i < sparkCount; i++) {
            particlesRef.current.push({
              x: cx + (Math.random() * 8 - 4),
              y: cy - radius + 15,
              vx: (Math.random() * 4 - 2),
              vy: Math.random() * 3 + 1,
              gravity: 0.18,
              size: 1.5 + Math.random() * 2.5,
              color: '#f59e0b',
              alpha: 1.0,
              decay: 0.02 + Math.random() * 0.03
            });
          }
        }
      } else {
        // Stop spinning and process winner landing
        angleRef.current = targetAngleRef.current;
        velocityRef.current = 0;
        setIsSpinning(false);
        isSpinningRef.current = false;

        const winningIndex = getSelectedSegmentIndex(angleRef.current);
        const winningOpt = activeOptionsRef.current[winningIndex];

        if (winningOpt) {
          setWinner(winningOpt);
          onSpinEndCalledRef.current = false;

          // Determine Rarity (under 5% odds and one of the least 3 probable)
          const totalW = activeOptionsRef.current.reduce((sum, opt) => sum + opt.weight, 0);
          const odds = totalW > 0 ? winningOpt.weight / totalW : 0;
          const sortedAsc = [...activeOptionsRef.current].sort((a, b) => a.weight - b.weight);
          const thresholdWeight = sortedAsc.length >= 3 ? sortedAsc[2].weight : Infinity;
          const isLegendary = (odds < 0.05) && (winningOpt.weight <= thresholdWeight);

          if (isLegendary) {
            celebrationTypeRef.current = 'legendary';
            celebrationStartRef.current = Date.now();
            audio.playLegendaryChime();
            createConfetti(true); // Double density confetti
          } else {
            celebrationTypeRef.current = 'standard';
            celebrationStartRef.current = Date.now();
            audio.playFanfare(); // Play trumpet fanfare for standard wins!
            createConfetti(false); // Standard confetti
          }

          // Normal transition: Open winner modal immediately
          setWinnerModalOpen(true);
        }
      }
    }

    // Handle depletion cracking/exploding states if active
    if (depletionPhaseRef.current === 'cracking') {
      const elapsed = Date.now() - depletionStartRef.current;
      continueAnimation = true;

      if (elapsed >= 900) {
        depletionPhaseRef.current = 'exploding';
        depletionStartRef.current = Date.now(); // reset timer for explosion
        audio.playGlassShatter(); // Glass shatter sound

        // Generate polygon shard objects
        const rect = canvasRef.current.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const radius = Math.max(0, Math.min(rect.width, rect.height) / 2 - 20);
        const seg = segmentsRef.current[depletionIndexRef.current];

        if (seg) {
          depletionShardsRef.current = generateShards(
            seg.startAngle,
            seg.endAngle,
            seg.option.color,
            radius,
            cx,
            cy,
            angleRef.current
          );
        }
      }
    } else if (depletionPhaseRef.current === 'exploding') {
      const elapsed = Date.now() - depletionStartRef.current;
      continueAnimation = true;

      // Update flying shard vectors
      depletionShardsRef.current.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += s.gravity;
        s.angle += s.spin;
        s.alpha -= 0.018; // Fade out
      });

      if (elapsed >= 800) {
        depletionPhaseRef.current = null;
        depletionIndexRef.current = -1;
        depletionShardsRef.current = [];
        audio.playThump(); // Settle thump sound

        // Check if there is a sub-option to unlock before we execute the state update
        const currentWinner = winnerRef.current;
        const hasSubOption = currentWinner && currentWinner.subOption;

        console.log('[ANIMATE] Explosion finished. currentWinner:', currentWinner, 'hasSubOption:', hasSubOption, 'onSpinEndCalled:', onSpinEndCalledRef.current);

        // Now trigger the parent state update to remove the option or substitute it
        if (currentWinner && !onSpinEndCalledRef.current) {
          console.log('[ANIMATE] Calling onSpinEnd with:', currentWinner);
          onSpinEnd(currentWinner);
          onSpinEndCalledRef.current = true;
        }

        // Set up the appearing phase for the new sub-option (if any)
        if (currentWinner && hasSubOption) {
          pendingAppearingOptionRef.current = currentWinner.subOption.id;
          console.log('[ANIMATE] Set pendingAppearingOptionRef:', pendingAppearingOptionRef.current);
          
          audio.playLegendaryChime();
          createConfetti(false); // Pop some standard confetti for the new unlock!

          bannerTextRef.current = `🔓 UNLOCKED: ${currentWinner.subOption.name}`;
          bannerStartRef.current = Date.now();
        } else {
          bannerTextRef.current = null;
        }

        setWinner(null);
      }
    }

    // Growing / appear transition logic
    if (appearPhaseRef.current === 'growing') {
      const elapsed = Date.now() - appearStartRef.current;
      continueAnimation = true;

      if (elapsed >= 1000) {
        appearPhaseRef.current = null;
        appearingOptionIdRef.current = null;
        depletingOptionIdRef.current = null;
      }
    }

    // Banner display keeper
    if (bannerTextRef.current) {
      const elapsed = Date.now() - bannerStartRef.current;
      if (elapsed < 3000) {
        continueAnimation = true;
      } else {
        bannerTextRef.current = null;
        depletingOptionIdRef.current = null;
      }
    }

    // Celebration duration keeper
    if (celebrationTypeRef.current) {
      const elapsed = Date.now() - celebrationStartRef.current;
      if (elapsed < 4000) {
        continueAnimation = true;
      } else {
        celebrationTypeRef.current = null;
      }
    }

    // Update confetti/spark particles
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay || 0.012; // Custom fade rate

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      } else {
        continueAnimation = true;
      }
    }

    // Trigger redraw
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const expectedWidth = Math.floor(rect.width * dpr);
      const expectedHeight = Math.floor(rect.height * dpr);
      
      if (canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
        canvas.width = expectedWidth;
        canvas.height = expectedHeight;
        ctx.scale(dpr, dpr);
      }
      
      drawWheel(ctx, rect.width, rect.height, angleRef.current);
    }

    if (continueAnimation) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      requestRef.current = null;
    }
  }

  const handleSpin = () => {
    if (
      isSpinningRef.current || 
      activeOptionsRef.current.length === 0 || 
      depletionPhaseRef.current !== null ||
      appearPhaseRef.current !== null ||
      bannerTextRef.current !== null
    ) return;

    audio.init();
    setWinner(null);
    setIsSpinning(true);
    isSpinningRef.current = true;
    onSpinEndCalledRef.current = false;

    spinStartTimeRef.current = Date.now();
    const durationSec = wheel.spinDuration || 10;
    spinDurationRef.current = durationSec * 1000;
    startAngleRef.current = angleRef.current % (2 * Math.PI);
    angleRef.current = startAngleRef.current; // Prevent velocity jump on first frame

    // Easing target: spin 6 to 9 full rotations plus a random offset
    const rotations = 6 + Math.random() * 3;
    targetAngleRef.current = startAngleRef.current + rotations * 2 * Math.PI + Math.random() * 2 * Math.PI;

    lastSegmentIndex.current = -1;

    // Reset animation timers/states
    celebrationTypeRef.current = null;
    depletionPhaseRef.current = null;
    depletionIndexRef.current = -1;
    depletionShardsRef.current = [];

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);
  };

  const createConfetti = (isLegendary = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const standardColors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f97316'];
    const legendaryColors = ['#ffd700', '#ffae42', '#f97316', '#a855f7', '#06b6d4', '#eab308', '#ffffff']; // Skewed gold and vibrant colors

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

    particlesRef.current = particles;

    if (!isSpinningRef.current && requestRef.current === null) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const handleConfirmWinner = () => {
    setWinnerModalOpen(false);
    
    // Check if the option is a link to another wheel
    if (winner && winner.linkedWheelId) {
      console.log('[WHEEL] Confirming linked wheel transition to:', winner.linkedWheelId);
      onTransitionToWheel(winner.linkedWheelId, winner);
      return;
    }

    // Clear nested result state in parent when returning
    if (nestedResult && onClearNestedResult) {
      onClearNestedResult();
    }

    if (winner && winner.lives > 0 && winner.currentLives === 1) {
      const winningIndex = activeOptionsRef.current.findIndex(opt => opt.id === winner.id);
      if (winningIndex !== -1) {
        depletingOptionIdRef.current = winner.id;
        depletionIndexRef.current = winningIndex;
        depletionPhaseRef.current = 'cracking';
        depletionStartRef.current = Date.now();

        depletionShardsRef.current = [];

        if (requestRef.current === null) {
          requestRef.current = requestAnimationFrame(animate);
        }
      } else {
        if (!onSpinEndCalledRef.current) {
          onSpinEnd(winner);
          onSpinEndCalledRef.current = true;
        }
        setWinner(null);
      }
    } else {
      if (!onSpinEndCalledRef.current) {
        onSpinEnd(winner);
        onSpinEndCalledRef.current = true;
      }
      setWinner(null);
    }
  };

  return (
    <div className="wheelspin-page animate-fade-in">
      
      {/* Top Navbar Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        zIndex: 10
      }}>
        <button onClick={onBackHome} className="btn btn-secondary">
          ⬅️ Back to Home
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setResetConfirmOpen(true)} className="btn btn-secondary" style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            🔄 Reset Wheel
          </button>
          <button 
            onClick={onOpenSettings} 
            className="btn-icon" 
            title="Edit Wheel Configuration"
            style={{ fontSize: '1.25rem' }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Responsive columns layout */}
      <div className="wheelspin-layout">
        
        {/* Left Spacer for centering (desktop only) */}
        <div className="wheelspin-spacer-col" />
        
        {/* Center Column: Main Wheel Viewport */}
        <div className="wheelspin-main-col">
          <h2 style={{
            fontSize: '2rem',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#fff',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}>
            {wheel.name}
          </h2>

          <div className="wheel-container">
            <canvas 
              ref={canvasRef} 
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                cursor: isSpinning ? 'not-allowed' : 'pointer',
                position: 'relative',
                zIndex: 1
              }}
              onClick={handleSpin}
            />
          </div>

          <button 
            onClick={handleSpin} 
            disabled={isSpinning || activeOptions.length === 0}
            className="btn btn-primary"
            style={{
              marginTop: '36px',
              fontSize: '1.2rem',
              padding: '14px 44px',
              borderRadius: '16px',
              minWidth: '180px',
              animation: !isSpinning && activeOptions.length > 0 ? 'pulse-glow 2s infinite' : 'none'
            }}
          >
            {isSpinning ? 'SPINNING...' : 'SPIN! ✨'}
          </button>
        </div>

        {/* Right Column: Choices and Lives Sidebar */}
        <div className="wheelspin-sidebar-col">
          {sortedOptions.map((opt) => {
            const chance = totalWeight > 0 ? ((opt.weight / totalWeight) * 100).toFixed(1) : '0.0';
            
            // Lives representation
            const hearts = [];
            if (opt.lives === 0) {
              hearts.push(<span key="unlimited" style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>🛡️ Unlimited</span>);
            } else {
              for (let i = 0; i < opt.lives; i++) {
                hearts.push(
                  <span 
                    key={i} 
                    style={{ 
                      color: i < opt.currentLives ? 'var(--color-danger)' : 'var(--color-text-muted)',
                      fontSize: '1.05rem',
                      marginRight: '2px',
                      textShadow: i < opt.currentLives ? '0 0 6px rgba(239, 68, 68, 0.6)' : 'none'
                    }}
                  >
                    {i < opt.currentLives ? '❤️' : '🖤'}
                  </span>
                );
              }
            }

            return (
              <div key={opt.id} className="sidebar-option-row">
                {/* Top info line */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: opt.color,
                      boxShadow: `0 0 8px ${opt.color}`,
                      flexShrink: 0
                    }} />
                    <span style={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {opt.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {/* Hearts / Remaining lives */}
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                      {hearts}
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--color-info)', fontSize: '0.9rem' }}>
                      {chance}%
                    </span>
                  </div>
                </div>

                {/* Horizontal progress bar */}
                <div className="sidebar-progress-bg">
                  <div className="sidebar-progress-fill" style={{
                    width: `${chance}%`,
                    backgroundColor: opt.color,
                    boxShadow: `0 0 8px ${opt.color}`
                  }} />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Landing Winner Popup Overlay */}
      <WinnerModal 
        isOpen={winnerModalOpen}
        winner={winner}
        isWinnerLegendary={isWinnerLegendary}
        nestedResult={nestedResult}
        wheels={wheels}
        onConfirm={handleConfirmWinner}
      />

      {/* Reset confirmation popup */}
      <ResetConfirmModal 
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          setResetConfirmOpen(false);
          depletingOptionIdRef.current = null;
          appearingOptionIdRef.current = null;
          appearPhaseRef.current = null;
          depletionPhaseRef.current = null;
          bannerTextRef.current = null;
          celebrationTypeRef.current = null;
          onResetWheel();
        }}
      />
    </div>
  );
}
