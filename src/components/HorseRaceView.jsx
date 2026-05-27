import { useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import { audio } from '../audio';
import { getAlphaColor } from '../utils/colors';
import { getHorseProgress } from '../utils/raceHelpers';
import { drawVectorHorse as drawVectorHorseRenderer } from '../renderers/horseRenderer';
import { drawHorseRace as drawHorseRaceRenderer } from '../renderers/horseRaceRenderer';
import { createConfettiParticles } from '../renderers/particleRenderer';
import styles from './HorseRaceView.module.css';

const HorseRaceView = forwardRef(({
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
  revealingOptionId,
  setRevealingOptionId,
  depletingOptionId,
  setDepletingOptionId
}, ref) => {
  const canvasRef = useRef(null);

  // Animation state refs to avoid React re-render lag
  const particlesRef = useRef([]);
  const requestRef = useRef(null);

  // Race variant animation state refs
  const lootboxWinnerRef = useRef(null);
  const horseSpeedFactorsRef = useRef([]);
  const raceTRef = useRef(0);

  // Depletion & celebration refs
  const celebrationTypeRef = useRef(null);
  const celebrationStartRef = useRef(0);
  const depletionStartRef = useRef(0);
  const depletionPhaseRef = useRef(null);
  const depletingOptionIdRef = useRef(null);
  const appearingOptionIdRef = useRef(null);
  const appearPhaseRef = useRef(null);
  const appearStartRef = useRef(0);
  const bannerTextRef = useRef(null);
  const bannerStartRef = useRef(0);
  const onSpinEndCalledRef = useRef(false);
  const spinStartTimeRef = useRef(0);
  const spinDurationRef = useRef(10000);
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

  const isWinnerLegendary = useMemo(() => {
    if (!winner || totalWeight === 0) return false;
    const odds = winner.weight / totalWeight;
    if (odds >= 0.05) return false;
    const sortedAsc = [...activeOptions].sort((a, b) => a.weight - b.weight);
    const thresholdWeight = sortedAsc.length >= 3 ? sortedAsc[2].weight : Infinity;
    return winner.weight <= thresholdWeight;
  }, [winner, activeOptions, totalWeight]);

  const optionRarities = useMemo(() => {
    const rarities = {};
    if (activeOptions.length === 0) return rarities;
    const weights = activeOptions.map(o => o.weight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    if (minW === maxW) {
      activeOptions.forEach(o => { rarities[o.id] = 'common'; });
      return rarities;
    }
    const uniqueSorted = Array.from(new Set(weights)).sort((a, b) => a - b);
    activeOptions.forEach(opt => {
      const rank = uniqueSorted.indexOf(opt.weight);
      if (rank === 0) {
        rarities[opt.id] = 'gold'; // rarest (Legendary)
      } else if (rank === 1 && uniqueSorted.length > 2) {
        rarities[opt.id] = 'red'; // Epic
      } else {
        const isPurple = 
          (uniqueSorted.length >= 5 && (rank === 2 || rank === 3)) ||
          (uniqueSorted.length === 4 && rank === 2) ||
          (uniqueSorted.length === 3 && rank === 1);
          
        if (isPurple) {
          rarities[opt.id] = 'purple';
        } else {
          rarities[opt.id] = 'common';
        }
      }
    });
    return rarities;
  }, [activeOptions]);

  // Sync refs to avoid closures inside animate loop
  const activeOptionsRef = useRef(activeOptions);
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
  }, [activeOptions]);

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
        const activeOpts = activeOptionsRef.current;
        const winningIndex = activeOpts.findIndex(opt => opt.id === winnerOpt.id);
        if (winningIndex !== -1) {
          depletingOptionIdRef.current = winnerOpt.id;
          setDepletingOptionId(winnerOpt.id);
          depletionPhaseRef.current = 'cracking';
          depletionStartRef.current = Date.now();

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
      raceTRef.current = 0;
    }
  }));

  const drawVectorHorse = (ctx, cx, cy, option, isRunning, elapsed, idx, scale = 1.6) => {
    const rarity = optionRarities[option.id] || 'common';
    drawVectorHorseRenderer(ctx, cx, cy, option, isRunning, elapsed, idx, rarity, scale);
  };

  const drawHorseRace = (ctx, width, height) => {
    drawHorseRaceRenderer(ctx, width, height, {
      activeOptions: activeOptionsRef.current,
      winner: lootboxWinnerRef.current,
      raceT: raceTRef.current,
      horseSpeedFactors: horseSpeedFactorsRef.current,
      isSpinning: isSpinningRef.current,
      spinStartTime: spinStartTimeRef.current,
      particles: particlesRef.current,
      optionRarities
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
      
      drawHorseRace(ctx, rect.width, rect.height);
    };

    render();

    const resizeObserver = new ResizeObserver(() => {
      render();
    });
    resizeObserver.observe(canvas);
    
    return () => {
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOptions, isSpinning]);

  const createConfetti = (isLegendary = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    particlesRef.current = createConfettiParticles(rect.width, rect.height, isLegendary);

    if (!isSpinningRef.current && requestRef.current === null) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  function animate() {
    let continueAnimation = false;

    if (isSpinningRef.current) {
      const now = Date.now();
      const elapsed = now - spinStartTimeRef.current;
      const duration = spinDurationRef.current;
      const t = Math.min(1, elapsed / duration);

      raceTRef.current = t;

      const hoofInterval = 180;
      const lastHoof = Math.floor((elapsed - 16.7) / hoofInterval);
      const currentHoof = Math.floor(elapsed / hoofInterval);
      if (currentHoof > lastHoof && elapsed < duration * 0.92) {
        audio.playHoofbeat();
      }

      if (elapsed < duration * 0.94) {
        const activeOpts = activeOptionsRef.current;
        const laneCount = activeOpts.length;
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const laneHeight = (rect.height - 40) / laneCount;
          const finishX = rect.width - 120;
          const startX = 40;
          const endX = finishX;

          activeOpts.forEach((opt, idx) => {
            const rarity = optionRarities[opt.id] || 'common';
            if (rarity !== 'common') {
              const isWinner = opt.id === lootboxWinnerRef.current?.id;
              const prog = getHorseProgress(idx, t, isWinner, horseSpeedFactorsRef.current);
              const hx = startX + (endX - startX) * prog;
              const hy = 20 + idx * laneHeight + laneHeight / 2;
              const px = hx - 18;
              const py = hy + 2;

              if (Math.random() < 0.35) {
                let pColor = '#eab308';
                if (rarity === 'red') pColor = '#ef4444';
                if (rarity === 'purple') pColor = '#a855f7';

                particlesRef.current.push({
                  x: px,
                  y: py + (Math.random() * 4 - 2),
                  vx: -1.2 - Math.random() * 1.5,
                  vy: -0.4 + Math.random() * 0.8,
                  gravity: -0.02,
                  size: rarity === 'red' ? (1.5 + Math.random() * 2) : (1 + Math.random() * 1.5),
                  color: pColor,
                  alpha: 1.0,
                  decay: 0.02 + Math.random() * 0.02
                });
              }
            }
          });
        }
      }

      if (t < 0.94) {
        continueAnimation = true;
      } else {
        if (isSpinningRef.current) {
          setIsSpinning(false);
          isSpinningRef.current = false;
          
          const winningOpt = lootboxWinnerRef.current;
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
    }

    // Handle depletion cracking/exploding states if active
    if (depletionPhaseRef.current === 'cracking') {
      const elapsed = Date.now() - depletionStartRef.current;
      continueAnimation = true;

      if (elapsed >= 900) {
        depletionPhaseRef.current = 'exploding';
        depletionStartRef.current = Date.now();
        audio.playHorseNeigh();
      }
    } else if (depletionPhaseRef.current === 'exploding') {
      const elapsed = Date.now() - depletionStartRef.current;
      continueAnimation = true;

      if (elapsed >= 800) {
        depletionPhaseRef.current = null;
        setDepletingOptionId(null);

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
        raceTRef.current = 0;
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
      
      drawHorseRace(ctx, rect.width, rect.height);
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

    audio.playRaceBell();
    const activeOpts = activeOptionsRef.current;
    const totalW = activeOpts.reduce((sum, opt) => sum + opt.weight, 0);
    let randomVal = Math.random() * totalW;
    let selectedWinner = activeOpts[0];
    for (let i = 0; i < activeOpts.length; i++) {
      if (randomVal < activeOpts[i].weight) {
        selectedWinner = activeOpts[i];
        break;
      }
      randomVal -= activeOpts[i].weight;
    }
    
    lootboxWinnerRef.current = selectedWinner;
    raceTRef.current = 0;

    const speedFactors = activeOpts.map(() => ({
      speedOffset: 0.75 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2
    }));
    horseSpeedFactorsRef.current = speedFactors;

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

      {/* Race Screen content */}
      <div className={styles.screenContainer}>
        
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Championship Turf Track
          </span>
          <h2 style={{ fontSize: '2.3rem', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)', marginTop: '5px' }}>
            {wheel.name}
          </h2>
        </div>

        {/* Racetrack canvas container */}
        <div className={styles.trackViewport} style={{
          height: `${Math.max(340, activeOptions.length * 75 + 40)}px`
        }}>
          <canvas 
            ref={canvasRef} 
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              cursor: isSpinning ? 'not-allowed' : 'pointer'
            }}
            onClick={handleSpin}
          />
        </div>

        {/* Start button */}
        <button 
          onClick={handleSpin} 
          disabled={isSpinning || activeOptions.length === 0}
          className="btn btn-primary btn-sheen-container"
          style={{
            fontSize: '1.2rem',
            fontWeight: '800',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '18px 60px',
            borderRadius: '35px',
            minWidth: '240px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            animation: !isSpinning && activeOptions.length > 0 ? 'pulse-glow 2.5s infinite' : 'none',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            cursor: isSpinning || activeOptions.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {isSpinning ? 'RACING...' : 'START RACE'}
        </button>

        {/* Contestants list */}
        <div className={styles.contestantsSection}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px', textAlign: 'center' }}>
            Contestant Horses ({activeOptions.length})
          </h3>

          <div className={styles.grid}>
            {sortedOptions.map((opt) => {
              const chance = totalWeight > 0 ? ((opt.weight / totalWeight) * 100).toFixed(1) : '0.0';
              const currentShrouds = opt.currentShrouds || 0;
              const currentShields = opt.currentShields || 0;
              const rarity = optionRarities[opt.id] || 'common';

              let borderStyle = '1px solid rgba(255, 255, 255, 0.08)';
              let cardBg = 'rgba(20, 20, 30, 0.65)';
              let cardShadow = 'none';

              if (rarity === 'gold') {
                borderStyle = '2.5px solid rgba(234, 179, 8, 0.85)';
                cardBg = 'linear-gradient(135deg, rgba(20, 20, 30, 0.85) 0%, rgba(234, 179, 8, 0.07) 100%)';
                cardShadow = '0 0 25px rgba(234, 179, 8, 0.35), inset 0 0 15px rgba(234, 179, 8, 0.18)';
              } else if (rarity === 'red') {
                borderStyle = '2px solid rgba(239, 68, 68, 0.75)';
                cardBg = 'linear-gradient(135deg, rgba(20, 20, 30, 0.85) 0%, rgba(239, 68, 68, 0.08) 100%)';
                cardShadow = '0 0 22px rgba(239, 68, 68, 0.25), inset 0 0 12px rgba(239, 68, 68, 0.12)';
              } else if (rarity === 'purple') {
                borderStyle = '2px solid rgba(168, 85, 247, 0.75)';
                cardBg = 'linear-gradient(135deg, rgba(20, 20, 30, 0.85) 0%, rgba(168, 85, 247, 0.08) 100%)';
                cardShadow = '0 0 22px rgba(168, 85, 247, 0.25), inset 0 0 12px rgba(168, 85, 247, 0.12)';
              }

              const horseIdx = activeOptions.findIndex(o => o.id === opt.id);
              const isRevealing = opt.id === revealingOptionId;
              const isDepleting = opt.id === depletingOptionId;

              return (
                <div key={opt.id} className={`race-contestant-card${isRevealing ? ' card-reveal-animate' : ''}${isDepleting ? ' card-deplete-animate' : ''}`} style={{
                  background: cardBg,
                  border: borderStyle,
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: cardShadow,
                  ...(isRevealing ? { '--reveal-glow-color': opt.color } : {})
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  if (rarity === 'gold') {
                    e.currentTarget.style.borderColor = 'rgba(234, 179, 8, 1.0)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 35px rgba(234, 179, 8, 0.6)';
                  } else if (rarity === 'red') {
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 1.0)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.5)';
                  } else if (rarity === 'purple') {
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 1.0)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 30px rgba(168, 85, 247, 0.5)';
                  } else {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.currentTarget.style.boxShadow = `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 12px ${getAlphaColor(opt.color, 0.15)}`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = rarity === 'gold' ? 'rgba(234, 179, 8, 0.85)' : rarity === 'red' ? 'rgba(239, 68, 68, 0.75)' : rarity === 'purple' ? 'rgba(168, 85, 247, 0.75)' : 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = cardShadow;
                }}
                >
                  <div style={{
                    width: '100%',
                    height: '110px',
                    borderRadius: '8px',
                    background: currentShrouds > 0 
                      ? 'linear-gradient(to bottom, rgba(30, 20, 45, 0.95), rgba(168, 85, 247, 0.15))' 
                      : currentShields > 0 
                      ? 'linear-gradient(to bottom, rgba(10, 25, 40, 0.95), rgba(6, 182, 212, 0.12))' 
                      : `linear-gradient(to bottom, rgba(15, 15, 25, 0.9), ${getAlphaColor(opt.color, 0.09)})`,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderBottom: `4px solid ${opt.color}`
                  }}>
                    {currentShrouds > 0 && (
                      <div className="shroud-smoke" style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 10%, transparent 70%)',
                        animation: 'crate-float 3s linear infinite',
                        pointerEvents: 'none',
                        zIndex: 1
                      }} />
                    )}

                    {currentShields > 0 && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(6, 182, 212, 0.02) 100%)',
                        pointerEvents: 'none',
                        zIndex: 1
                      }} />
                    )}

                    {currentShrouds > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(147, 51, 234, 0.25)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        boxShadow: '0 0 8px rgba(168, 85, 247, 0.3)',
                        zIndex: 3
                      }} title="Hidden Option (Shrouded)">☁️</div>
                    )}

                    {currentShields > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(6, 182, 212, 0.25)',
                        border: '1px solid rgba(6, 182, 212, 0.4)',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        boxShadow: '0 0 8px rgba(6, 182, 212, 0.3)',
                        zIndex: 3
                      }} title="Shielded">🛡️</div>
                    )}

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      zIndex: 2,
                      opacity: currentShrouds > 0 ? 0.55 : 1.0
                    }}>
                      <canvas
                        ref={(el) => {
                          if (!el) return;
                          const ctx = el.getContext('2d');
                          const dpr = window.devicePixelRatio || 1;
                          const cw = 90;
                          const ch = 60;
                          if (el.width !== cw * dpr || el.height !== ch * dpr) {
                            el.width = cw * dpr;
                            el.height = ch * dpr;
                          }
                          ctx.setTransform(1, 0, 0, 1, 0, 0);
                          ctx.scale(dpr, dpr);
                          ctx.clearRect(0, 0, cw, ch);
                          drawVectorHorse(ctx, cw / 2, ch / 2 + 5, opt, false, 0, horseIdx, 1.25);
                        }}
                        style={{
                          width: '90px',
                          height: '60px',
                          display: 'block'
                        }}
                      />
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        color: '#fff',
                        background: 'rgba(0,0,0,0.45)',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        border: `1px solid ${getAlphaColor(opt.color, 0.3)}`
                      }}>
                        LANE {horseIdx + 1}
                      </span>
                    </div>

                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#fff',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: 'center',
                      height: '2.8em',
                      lineHeight: '1.4'
                    }}>
                      {currentShrouds > 0 ? 'Hidden option' : opt.name}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {currentShrouds > 0 ? (
                          <span style={{ color: '#a855f7', fontSize: '0.75rem', fontWeight: 650 }}>☁️ {currentShrouds}</span>
                        ) : currentShields > 0 ? (
                          <span style={{ color: '#06b6d4', fontSize: '0.75rem', fontWeight: 650 }}>🛡️ {currentShields}</span>
                        ) : opt.lives > 0 ? (
                          <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 650 }}>❤️ {opt.currentLives}</span>
                        ) : (
                          <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 650 }}>♾️</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-info)' }}>
                        {chance}%
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
});

export default HorseRaceView;
