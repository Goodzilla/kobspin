import { useRef, useEffect, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import { audio } from '../audio';
import { easeOutCubic } from '../utils/math';
import { generateShards } from '../utils/animation';
import { drawWheel as drawWheelRenderer } from '../renderers/wheelRenderer';
import { createConfettiParticles } from '../renderers/particleRenderer';
import { getDynamicSegments as getDynamicSegmentsHelper } from '../utils/segments';
import styles from './WheelView.module.css';

const WheelView = forwardRef(({
  wheel,
  autoSpin = false,
  onClearAutoSpin,
  onWinnerDetermined,
  onSpinEnd,
  onBackHome,
  onOpenSettings,
  onExportWheel,
  isSpinning,
  setIsSpinning,
  winner,
  setWinner,
  setWinnerModalOpen,
  setResetConfirmOpen,
  setRevealingOptionId,
  setDepletingOptionId
}, ref) => {
  const canvasRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  // Debounced window resize handler to trigger re-render on orientation or layout shifts
  useEffect(() => {
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Animation state refs to avoid React re-render lag
  const angleRef = useRef(0); // Current rotation angle
  const velocityRef = useRef(0);
  const lastSegmentIndex = useRef(-1);
  const particlesRef = useRef([]);
  const requestRef = useRef(null);

  // Juice & logic refs
  const pointerWobbleRef = useRef(0);
  const pointerWobbleVelRef = useRef(0);
  const borderFlashRef = useRef(0);
  const screenShakeRef = useRef(0);

  // Depletion & celebration refs
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
  const isSpinningRef = useRef(isSpinning);

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

  // Sync refs to avoid closures inside animate loop
  const activeOptionsRef = useRef(activeOptions);
  const segmentsRef = useRef(segments);
  const onSpinEndRef = useRef(onSpinEnd);

  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  useEffect(() => {
    onSpinEndRef.current = onSpinEnd;
  }, [onSpinEnd]);

  useEffect(() => {
    isSpinningRef.current = isSpinning;
  }, [isSpinning]);

  useEffect(() => {
    activeOptionsRef.current = activeOptions;
    segmentsRef.current = segments;

    if (depletingOptionIdRef.current && !activeOptions.some(o => o.id === depletingOptionIdRef.current)) {
      depletingOptionIdRef.current = null;
    }

    if (pendingAppearingOptionRef.current) {
      const optionExists = activeOptions.some(o => o.id === pendingAppearingOptionRef.current);
      if (optionExists) {
        appearingOptionIdRef.current = pendingAppearingOptionRef.current;
        const appOptionId = pendingAppearingOptionRef.current;
        setRevealingOptionId(appOptionId);
        pendingAppearingOptionRef.current = null;
        appearPhaseRef.current = 'growing';
        appearStartRef.current = Date.now();

        if (requestRef.current === null) {
          requestRef.current = requestAnimationFrame(animate);
        }

        setTimeout(() => {
          setRevealingOptionId(prev => prev === appOptionId ? null : prev);
        }, 2500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOptions, segments]);

  // Handle autoSpin on mounting
  useEffect(() => {
    if (autoSpin) {
      const spinTimeout = setTimeout(() => {
        handleSpin();
        if (onClearAutoSpin) onClearAutoSpin();
      }, 350);
      return () => clearTimeout(spinTimeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpin]);

  // Clean unmount for animations
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    confirmWinner(winnerOpt) {
      const hasShrouds = winnerOpt && (winnerOpt.currentShrouds || 0) > 0;
      const hasShields = winnerOpt && (winnerOpt.currentShields || 0) > 0;
      if (winnerOpt && winnerOpt.lives > 0 && winnerOpt.currentLives === 1 && !hasShrouds && !hasShields) {
        const winningIndex = activeOptionsRef.current.findIndex(opt => opt.id === winnerOpt.id);
        if (winningIndex !== -1) {
          depletingOptionIdRef.current = winnerOpt.id;
          setDepletingOptionId(winnerOpt.id);
          depletionIndexRef.current = winningIndex;
          depletionPhaseRef.current = 'cracking';
          depletionStartRef.current = Date.now();
          depletionShardsRef.current = [];

          if (requestRef.current === null) {
            requestRef.current = requestAnimationFrame(animate);
          }
        } else {
          if (!onSpinEndCalledRef.current) {
            onSpinEnd(winnerOpt);
            onSpinEndCalledRef.current = true;
          }
          setWinner(null);
        }
      } else {
        if (!onSpinEndCalledRef.current) {
          onSpinEnd(winnerOpt);
          onSpinEndCalledRef.current = true;
        }
        setWinner(null);
      }
    },
    reset() {
      depletingOptionIdRef.current = null;
      appearingOptionIdRef.current = null;
      appearPhaseRef.current = null;
      depletionPhaseRef.current = null;
      setRevealingOptionId(null);
      setDepletingOptionId(null);
      bannerTextRef.current = null;
      celebrationTypeRef.current = null;
    }
  }));

  const getDynamicSegments = () => {
    return getDynamicSegmentsHelper({
      activeOptions: activeOptionsRef.current,
      depletingOptionId: depletingOptionIdRef.current,
      depletionPhase: depletionPhaseRef.current,
      depletionStart: depletionStartRef.current,
      appearPhase: appearPhaseRef.current,
      appearingOptionId: appearingOptionIdRef.current,
      appearStart: appearStartRef.current
    });
  };

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

  const createConfetti = (isLegendary = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    particlesRef.current = createConfettiParticles(rect.width, rect.height, isLegendary);

    if (!isSpinningRef.current && requestRef.current === null) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const drawWheel = (ctx, width, height, currentAngle) => {
    drawWheelRenderer(ctx, width, height, currentAngle, {
      screenShake: screenShakeRef.current,
      activeOptions: activeOptionsRef.current,
      celebrationType: celebrationTypeRef.current,
      celebrationStart: celebrationStartRef.current,
      appearingOptionId: appearingOptionIdRef.current,
      depletingOptionId: depletingOptionIdRef.current,
      depletionIndex: depletionIndexRef.current,
      depletionPhase: depletionPhaseRef.current,
      depletionStart: depletionStartRef.current,
      appearPhase: appearPhaseRef.current,
      appearStart: appearStartRef.current,
      borderFlash: borderFlashRef.current,
      pointerWobble: pointerWobbleRef.current,
      particles: particlesRef.current,
      depletionShards: depletionShardsRef.current,
      bannerText: bannerTextRef.current,
      bannerStart: bannerStartRef.current
    });
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

    const resizeObserver = new ResizeObserver(() => {
      render();
    });
    resizeObserver.observe(canvas);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [activeOptions, segments, windowWidth]);

  function animate() {
    let continueAnimation = false;

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
      const velocityRadSec = (angularDistance * 3 * Math.pow(1 - t, 2)) / (duration / 1000);
      const isStillMoving = elapsed < duration && (elapsed < 1000 || velocityRadSec > 0.015);

      if (isStillMoving) {
        const easeVal = easeOutCubic(t);
        const nextAngle = startAngleRef.current + angularDistance * easeVal;
        
        velocityRef.current = nextAngle - angleRef.current;
        angleRef.current = nextAngle;
        continueAnimation = true;

        const currentSegment = getSelectedSegmentIndex(angleRef.current);
        if (currentSegment !== -1 && currentSegment !== lastSegmentIndex.current) {
          audio.playTick();
          lastSegmentIndex.current = currentSegment;
          pointerWobbleRef.current = 0.38;
          pointerWobbleVelRef.current = -0.05;
          borderFlashRef.current = 1.0;
          screenShakeRef.current = Math.min(2.5, velocityRef.current * 70);
        }

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
        angleRef.current = targetAngleRef.current;
        velocityRef.current = 0;
        setIsSpinning(false);
        isSpinningRef.current = false;

        const winningIndex = getSelectedSegmentIndex(angleRef.current);
        const winningOpt = activeOptionsRef.current[winningIndex];

        if (winningOpt) {
          setWinner(winningOpt);
          onSpinEndCalledRef.current = false;
          onWinnerDetermined(winningOpt, isWinnerLegendary);

          if (isWinnerLegendary) {
            celebrationTypeRef.current = 'legendary';
            celebrationStartRef.current = Date.now();
            audio.playLegendaryChime();
            createConfetti(true);
          } else {
            celebrationTypeRef.current = 'standard';
            celebrationStartRef.current = Date.now();
            audio.playFanfare();
            createConfetti(false);
          }
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
        depletionStartRef.current = Date.now();
        audio.playGlassShatter();

        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
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
      }
    } else if (depletionPhaseRef.current === 'exploding') {
      const elapsed = Date.now() - depletionStartRef.current;
      continueAnimation = true;

      depletionShardsRef.current.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += s.gravity;
        s.angle += s.spin;
        s.alpha -= 0.018;
      });

      if (elapsed >= 800) {
        depletionPhaseRef.current = null;
        depletionIndexRef.current = -1;
        depletionShardsRef.current = [];
        setDepletingOptionId(null);
        audio.playThump();

        const currentWinner = winnerRef.current;
        const hasSubOption = currentWinner && currentWinner.subOption;

        if (currentWinner && !onSpinEndCalledRef.current) {
          onSpinEndRef.current(currentWinner);
          onSpinEndCalledRef.current = true;
        }

        if (currentWinner && hasSubOption) {
          pendingAppearingOptionRef.current = currentWinner.subOption.id;
          audio.playLegendaryChime();
          createConfetti(false);

          bannerTextRef.current = `🔓 UNLOCKED: ${currentWinner.subOption.name}`;
          bannerStartRef.current = Date.now();
        } else {
          bannerTextRef.current = null;
        }

        setWinner(null);
      }
    }

    if (appearPhaseRef.current === 'growing') {
      const elapsed = Date.now() - appearStartRef.current;
      continueAnimation = true;

      if (elapsed >= 1000) {
        appearPhaseRef.current = null;
        appearingOptionIdRef.current = null;
        depletingOptionIdRef.current = null;
      }
    }

    if (bannerTextRef.current) {
      const elapsed = Date.now() - bannerStartRef.current;
      if (elapsed < 3000) {
        continueAnimation = true;
      } else {
        bannerTextRef.current = null;
        depletingOptionIdRef.current = null;
      }
    }

    if (celebrationTypeRef.current) {
      const elapsed = Date.now() - celebrationStartRef.current;
      if (elapsed < 4000) {
        continueAnimation = true;
      } else {
        celebrationTypeRef.current = null;
      }
    }

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay || 0.012;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      } else {
        continueAnimation = true;
      }
    }

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
    
    celebrationTypeRef.current = null;
    depletionPhaseRef.current = null;
    depletionIndexRef.current = -1;
    depletionShardsRef.current = [];

    startAngleRef.current = angleRef.current % (2 * Math.PI);
    angleRef.current = startAngleRef.current;

    const rotations = 6 + Math.random() * 3;
    targetAngleRef.current = startAngleRef.current + rotations * 2 * Math.PI + Math.random() * 2 * Math.PI;
    lastSegmentIndex.current = -1;

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className={styles.page}>
      {/* Top Navbar Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        zIndex: 10
      }}>
        <button onClick={onBackHome} className="btn btn-secondary">
          Back to Home
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setResetConfirmOpen(true)} className="btn btn-secondary" style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            Reset Wheel
          </button>
          <button 
            onClick={() => onExportWheel(wheel)} 
            className="btn btn-secondary" 
            style={{ borderColor: 'rgba(6, 182, 212, 0.3)', color: 'var(--color-info)' }} 
            title="Export Wheel Config"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ marginRight: '6px' }}
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Export
          </button>
          <button 
            onClick={onOpenSettings} 
            className="btn btn-secondary" 
            style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}
            title="Edit Wheel Configuration"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ marginRight: '6px' }}
            >
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Edit Wheel
          </button>
        </div>
      </div>

      {/* Responsive columns layout */}
      <div className={styles.layout}>
        {/* Left Spacer for centering (desktop only) */}
        <div className={styles.spacerCol} />
        
        {/* Center Column: Main Wheel Viewport */}
        <div className={styles.mainCol}>
          <h2 style={{
            fontSize: '2rem',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#fff',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}>
            {wheel.name}
          </h2>

          <div className={styles.wheelContainer}>
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
            className="btn btn-primary btn-sheen-container"
            style={{
              marginTop: '36px',
              fontSize: '1.1rem',
              fontWeight: '700',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '16px 48px',
              borderRadius: '30px',
              minWidth: '200px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)',
              boxShadow: '0 0 25px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              animation: !isSpinning && activeOptions.length > 0 ? 'pulse-glow 2.5s infinite' : 'none',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              cursor: isSpinning || activeOptions.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {isSpinning ? 'SPINNING' : 'SPIN NOW'}
          </button>
        </div>

        {/* Right Column: Choices and Lives Sidebar */}
        <div className={styles.sidebarCol}>
          {sortedOptions.map((opt) => {
            const chance = totalWeight > 0 ? ((opt.weight / totalWeight) * 100).toFixed(1) : '0.0';
            
            // Hearts/Shrouds/Shields representation
            const hearts = [];
            const maxShrouds = opt.shrouds || 0;
            const currentShrouds = opt.currentShrouds || 0;
            const maxShields = opt.shields || 0;
            const currentShields = opt.currentShields || 0;

            if (currentShrouds > 0) {
              if (maxShrouds <= 3) {
                for (let i = 0; i < maxShrouds; i++) {
                  hearts.push(
                    <span 
                      key={`shroud-${i}`} 
                      style={{ 
                        color: i < currentShrouds ? '#a855f7' : 'var(--color-text-muted)',
                        fontSize: '1rem',
                        marginRight: '3px',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                      title={`${currentShrouds} shrouds remaining`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ filter: i < currentShrouds ? 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.6))' : 'none' }}>
                        <path d="M19.36 10.04a6 6 0 0 0-11.32-2.24 4.5 4.5 0 0 0-.28 8.92h11.6a4 4 0 0 0 0-8z" />
                      </svg>
                    </span>
                  );
                }
              } else {
                hearts.push(
                  <div key="shroud-scaled" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 650 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: '#a855f7', filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.6))' }}>
                      <path d="M19.36 10.04a6 6 0 0 0-11.32-2.24 4.5 4.5 0 0 0-.28 8.92h11.6a4 4 0 0 0 0-8z" />
                    </svg>
                    <span>{currentShrouds} / {maxShrouds}</span>
                  </div>
                );
              }
            } else if (currentShields > 0) {
              if (maxShields <= 3) {
                for (let i = 0; i < maxShields; i++) {
                  hearts.push(
                    <span 
                      key={`shield-${i}`} 
                      style={{ 
                        color: i < currentShields ? '#06b6d4' : 'var(--color-text-muted)',
                        fontSize: '1rem',
                        marginRight: '3px',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                      title={`${currentShields} shields remaining`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ filter: i < currentShields ? 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.6))' : 'none' }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                  );
                }
              } else {
                hearts.push(
                  <div key="shield-scaled" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 650 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: '#06b6d4', filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.6))' }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>{currentShields} / {maxShields}</span>
                  </div>
                );
              }
            } else {
              if (opt.lives === 0) {
                hearts.push(<span key="unlimited" style={{ color: 'var(--color-success)', fontSize: '1.2rem', fontWeight: 700, lineHeight: 1 }}>♾️</span>);
              } else if (opt.lives <= 3) {
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
              } else {
                hearts.push(
                  <div key="lives-scaled" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 650 }}>
                    <span style={{ color: 'var(--color-danger)', textShadow: '0 0 6px rgba(239, 68, 68, 0.6)', fontSize: '1.05rem' }}>❤️</span>
                    <span>{opt.currentLives} / {opt.lives}</span>
                  </div>
                );
              }
            }

            return (
              <div key={opt.id} className={styles.sidebarOptionRow}>
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
                      {currentShrouds > 0 ? 'Hidden option' : opt.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                      {hearts}
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--color-info)', fontSize: '0.9rem' }}>
                      {chance}%
                    </span>
                  </div>
                </div>

                {/* Horizontal progress bar */}
                <div className={styles.sidebarProgressBg}>
                  <div className={styles.sidebarProgressFill} style={{
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
    </div>
  );
});

export default WheelView;
