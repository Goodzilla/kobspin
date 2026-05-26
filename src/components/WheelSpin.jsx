import { useRef, useEffect, useState, useMemo } from 'react';
import { audio } from '../audio';
import { easeOutCubic, generateShards } from '../utils/wheelAnimationUtils';
import WinnerModal from './WinnerModal';
import ResetConfirmModal from './ResetConfirmModal';

// Robust helper to generate a translucent color with a specific alpha value
const getAlphaColor = (colorStr, alpha = 0.13) => {
  if (!colorStr) return `rgba(255, 255, 255, ${alpha})`;
  const trimmed = colorStr.trim();
  const lower = trimmed.toLowerCase();
  
  if (lower.startsWith('hsl')) {
    // If it already has alpha (hsla)
    if (lower.startsWith('hsla')) {
      return trimmed.replace(/hsla\(([^,]+),([^,]+),([^,]+),[^)]+\)/i, `hsla($1,$2,$3, ${alpha})`);
    }
    // Standard hsl to hsla conversion
    return trimmed.replace(/hsl\(/i, 'hsla(').replace(/\)/, `, ${alpha})`);
  }
  
  if (lower.startsWith('rgb')) {
    if (lower.startsWith('rgba')) {
      return trimmed.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/i, `rgba($1,$2,$3, ${alpha})`);
    }
    return trimmed.replace(/rgb\(/i, 'rgba(').replace(/\)/, `, ${alpha})`);
  }
  
  if (lower.startsWith('#')) {
    const hex = lower.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  
  return trimmed;
};

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
  onResetWheel,
  onExportWheel
}) {
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [isCrateOpening, setIsCrateOpening] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [revealingOptionId, setRevealingOptionId] = useState(null);
  const [depletingOptionId, setDepletingOptionId] = useState(null);

  // Debounced window resize handler to trigger re-render on orientation or layout shifts
  useEffect(() => {
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 250); // 250ms debounce to allow CSS transitions to finish
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

  // Lootbox variant animation state refs
  const lootboxWinnerRef = useRef(null);
  const tickerItemsRef = useRef([]);
  const startOffsetRef = useRef(0);
  const targetOffsetRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const isCrateOpeningRef = useRef(false);
  const horseSpeedFactorsRef = useRef([]);
  const raceTRef = useRef(0);

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
        rarities[opt.id] = 'red'; // second rarest (Epic)
      } else {
        const isPurple = 
          (uniqueSorted.length >= 5 && (rank === 2 || rank === 3)) ||
          (uniqueSorted.length === 4 && rank === 2) ||
          (uniqueSorted.length === 3 && rank === 1);
          
        if (isPurple) {
          rarities[opt.id] = 'purple'; // uncommon
        } else {
          rarities[opt.id] = 'common';
        }
      }
    });
    return rarities;
  }, [activeOptions]);

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
        const appOptionId = pendingAppearingOptionRef.current;
        setRevealingOptionId(appOptionId);
        pendingAppearingOptionRef.current = null;
        appearPhaseRef.current = 'growing';
        appearStartRef.current = Date.now();

        if (requestRef.current === null) {
          requestRef.current = requestAnimationFrame(animate);
        }

        // Clear revealing state after 2.5 seconds (duration of card entry + glow animation)
        setTimeout(() => {
          setRevealingOptionId(prev => prev === appOptionId ? null : prev);
        }, 2500);
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

  // Helper to render beautiful vector container crate (yellow/gold steel case)
  const renderVectorCrate = () => {
    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 240 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="crateBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="40%" stopColor="#ca8a04" />
            <stop offset="80%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
          <linearGradient id="crateSteelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="50%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="goldShineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(253, 224, 71, 0.4)" />
            <stop offset="30%" stopColor="rgba(253, 224, 71, 0.1)" />
            <stop offset="70%" stopColor="rgba(253, 224, 71, 0.6)" />
            <stop offset="100%" stopColor="rgba(253, 224, 71, 0)" />
          </linearGradient>
          <linearGradient id="chestGlowBeam" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(234, 179, 8, 0.45)" />
            <stop offset="60%" stopColor="rgba(168, 85, 247, 0.2)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </linearGradient>
          <filter id="crateGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Under-crate drop shadow */}
        <ellipse cx="120" cy="180" rx="90" ry="12" fill="rgba(0, 0, 0, 0.6)" />

        {/* 1. Glow beam & floaty sparks shooting out when chest is opening */}
        {isCrateOpening && (
          <g>
            <polygon 
              points="35,90 205,90 235,0 5,0" 
              fill="url(#chestGlowBeam)" 
              style={{
                mixBlendMode: 'screen',
                pointerEvents: 'none'
              }} 
            />
            {/* Sparkles */}
            <circle cx="60" cy="60" r="3.5" fill="#ffd700" opacity="0.8" style={{ animation: 'crate-float 1.2s infinite' }} />
            <circle cx="180" cy="50" r="2.5" fill="#ffd700" opacity="0.8" style={{ animation: 'crate-float 1.8s infinite' }} />
            <circle cx="120" cy="40" r="4.5" fill="#a855f7" opacity="0.9" style={{ animation: 'crate-float 1.5s infinite' }} />
          </g>
        )}

        {/* 2. Crate Base (Bottom Half) */}
        <g id="crate-base">
          {/* Base outer steel */}
          <path d="M 25 90 L 215 90 L 215 160 A 10 10 0 0 1 205 170 L 35 170 A 10 10 0 0 1 25 160 Z" fill="url(#crateSteelGrad)" stroke="#374151" strokeWidth="2.5" />
          {/* Base inner wood */}
          <path d="M 34 90 L 206 90 L 206 153 A 6 6 0 0 1 200 159 L 40 159 A 6 6 0 0 1 34 153 Z" fill="url(#crateBodyGrad)" />
          
          {/* Base horizontal grooves */}
          <rect x="42" y="108" width="156" height="22" rx="4" fill="rgba(0, 0, 0, 0.2)" stroke="rgba(255, 255, 255, 0.1)" />
          <rect x="42" y="136" width="156" height="16" rx="4" fill="rgba(0, 0, 0, 0.2)" stroke="rgba(255, 255, 255, 0.1)" />
          
          {/* Base shadow lines */}
          <path d="M42 144 L190 144 L198 140 L50 140 Z" fill="rgba(0, 0, 0, 0.15)" />
          
          {/* Bottom corners braces */}
          <path d="M25 160 L45 170 L45 150 L25 150 Z" fill="#1f2937" stroke="#374151" />
          <circle cx="37" cy="158" r="2.5" fill="#9ca3af" />
          <path d="M215 160 L195 170 L195 150 L215 150 Z" fill="#1f2937" stroke="#374151" />
          <circle cx="203" cy="158" r="2.5" fill="#9ca3af" />
          
          {/* Handles */}
          <path d="M25 95 H15 V120 H25" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M215 95 H225 V120 H215" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* LIMIT plate */}
          <rect x="60" y="86" width="35" height="12" rx="1" fill="#eab308" transform="rotate(-5, 60, 86)" />
          <text x="77.5" y="95" fill="#000" fontSize="8" fontWeight="800" textAnchor="middle" transform="rotate(-5, 60, 86)" fontFamily="monospace">LIMIT</text>
          
          {/* Stencil Purple Symbol */}
          <circle cx="120" cy="100" r="14" fill="rgba(168, 85, 247, 0.08)" stroke="#a855f7" strokeWidth="1.5" filter="url(#crateGlow)" />
          <circle cx="120" cy="100" r="5" fill="#a855f7" />
          <path d="M120 100 L112 86 A16 16 0 0 1 128 86 Z" fill="#a855f7" />
          <path d="M120 100 L132 110 A16 16 0 0 1 114 116 Z" fill="#a855f7" />
          <path d="M120 100 L97 104 A16 16 0 0 1 106 91 Z" fill="#a855f7" />
        </g>

        {/* 3. Crate Lid (Top Half) - Pivots open when isCrateOpening is active */}
        <g 
          id="crate-lid"
          style={{
            transform: isCrateOpening ? 'translateY(-22px) rotate(-14deg)' : 'none',
            transformOrigin: '25px 90px',
            transition: 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {/* Lid outer steel */}
          <path d="M 25 45 A 10 10 0 0 1 35 35 L 205 35 A 10 10 0 0 1 215 45 L 215 90 L 25 90 Z" fill="url(#crateSteelGrad)" stroke="#374151" strokeWidth="2.5" />
          {/* Lid inner wood */}
          <path d="M 34 44 A 6 6 0 0 1 40 38 L 200 38 A 6 6 0 0 1 206 44 L 206 90 L 34 90 Z" fill="url(#crateBodyGrad)" />
          
          {/* Lid details */}
          <rect x="42" y="52" width="156" height="22" rx="4" fill="rgba(0, 0, 0, 0.2)" stroke="rgba(255, 255, 255, 0.1)" />
          <rect x="42" y="80" width="156" height="10" rx="2" fill="rgba(0, 0, 0, 0.2)" stroke="rgba(255, 255, 255, 0.1)" />
          <path d="M42 54 L190 90 L198 88 L50 50 Z" fill="rgba(0, 0, 0, 0.15)" />
          
          {/* Top corners braces */}
          <path d="M25 45 L45 35 L45 55 L25 55 Z" fill="#1f2937" stroke="#374151" />
          <circle cx="37" cy="47" r="2.5" fill="#9ca3af" />
          <path d="M215 45 L195 35 L195 55 L215 55 Z" fill="#1f2937" stroke="#374151" />
          <circle cx="203" cy="47" r="2.5" fill="#9ca3af" />
          
          {/* Lock latches */}
          <rect x="104" y="30" width="32" height="28" rx="4" fill="#374151" stroke="#1f2937" strokeWidth="2" />
          <rect x="114" y="44" width="12" height="20" rx="2" fill="#111827" />
          <circle cx="120" cy="50" r="3" fill="#eab308" />
          
          {/* Shine reflection overlay */}
          <rect x="35" y="40" width="170" height="50" rx="6" fill="url(#goldShineGrad)" pointerEvents="none" opacity="0.4" />
        </g>
      </svg>
    );
  };

  // Helper to compute progress for a horse
  const getHorseProgress = (idx, t, isWinner) => {
    if (t === 0) return 0;
    
    let base;
    if (isWinner) {
      base = Math.min(1, t / 0.94); // Reaches 100% at t = 0.94
    } else {
      const factor = horseSpeedFactorsRef.current[idx]?.speedOffset || 0.85;
      base = (t / 0.94) * 0.9 * factor;
      base = Math.min(0.92, base); // Cap non-winners at 92%
    }
    
    const phase = horseSpeedFactorsRef.current[idx]?.phase || 0;
    const wiggle = Math.sin(t * Math.PI * 4 + phase) * 0.05 * (1 - t * 0.3);
    
    let progress = base + wiggle;
    
    if (isWinner) {
      if (t >= 0.94) progress = 1.0;
      else progress = Math.min(0.99, Math.max(0, progress));
    } else {
      progress = Math.min(0.92, Math.max(0, progress));
    }
    
    return progress;
  };

  // Helper to draw a stylized 2D horse on the canvas
  const drawVectorHorse = (ctx, cx, cy, option, isRunning, elapsed, idx, scale = 1.6) => {
    const rarity = optionRarities[option.id] || 'common';
    
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

  // Helper to draw the horse race track on canvas
  const drawHorseRace = (ctx, width, height) => {
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

    const activeOpts = activeOptionsRef.current;
    if (activeOpts.length === 0) {
      ctx.restore();
      return;
    }
    
    const laneCount = activeOpts.length;
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

    // Red flag pointers
    const drawFlag = (fx, fy) => {
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
    drawFlag(finishX + 6, 8);
    drawFlag(finishX + 6, height - 20);

    // Draw horses
    activeOpts.forEach((opt, idx) => {
      const isWinner = opt.id === lootboxWinnerRef.current?.id;
      const progress = getHorseProgress(idx, raceTRef.current, isWinner);
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

      // Draw option name along track (positioned to avoid start line overlap and heavily enhanced for readability)
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
      const elapsed = isSpinningRef.current ? (Date.now() - spinStartTimeRef.current) : 0;
      drawVectorHorse(ctx, hx, hy, opt, isSpinningRef.current, elapsed, idx);
    });

    // Draw particles
    const pList = particlesRef.current;
    pList.forEach((p) => {
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

  // Helper to draw horizontal conveyor ticker on the canvas
  const drawLootboxTicker = (ctx, width, height) => {
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

    const cardWidth = 180;
    const cardHeight = 190;
    const cardGap = 16;
    const cardStep = cardWidth + cardGap;
    const offset = currentOffsetRef.current;
    const items = tickerItemsRef.current;
    
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

      // 5. Draw Option Name underneath preview box (wrapped up to 2 lines, positioned to avoid overlap)
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

    const pList = particlesRef.current;
    pList.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });

    const pointerX = width / 2;
    const wobble = pointerWobbleRef.current * 10;
    
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

      // Draw Shroud or Shield visual overlays
      // Draw Shroud or Shield visual overlays
      if (seg.option.currentShrouds > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx + shakeX, cy + shakeY);
        ctx.arc(cx + shakeX, cy + shakeY, radius, start, end);
        ctx.closePath();
        ctx.clip();

        // 1. Spooky dark void backing
        const voidGrad = ctx.createRadialGradient(cx + shakeX, cy + shakeY, radius * 0.1, cx + shakeX, cy + shakeY, radius);
        voidGrad.addColorStop(0, '#06030c');
        voidGrad.addColorStop(0.5, '#0b0716');
        voidGrad.addColorStop(1, '#0e0b1a');
        ctx.fillStyle = voidGrad;
        ctx.fill();

        // Time factor for organic drifting animations
        const time = Date.now() * 0.0015;
        const midAngle = start + seg.angleSize / 2;

        // 2. Layered fluffy, glowing mist clouds with organic drift along the centerline
        const cloudRadii = [radius * 0.35, radius * 0.6, radius * 0.8];
        const cloudSizes = [radius * 0.22, radius * 0.28, radius * 0.24];
        const cloudColors = [
          ['rgba(147, 51, 234, 0.45)', 'rgba(88, 28, 135, 0.12)', 'rgba(12, 10, 22, 0)'], // Violet mist
          ['rgba(216, 180, 254, 0.28)', 'rgba(147, 51, 234, 0.08)', 'rgba(12, 10, 22, 0)'], // Light purple mist
          ['rgba(139, 92, 246, 0.38)', 'rgba(12, 10, 22, 0)']
        ];

        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < cloudRadii.length; i++) {
          const rDist = cloudRadii[i] + Math.sin(time + i) * 8; // slight drifting radius
          const driftAngle = midAngle + Math.cos(time * 0.8 + i) * 0.02; // slight swaying angle
          const cloudX = cx + shakeX + rDist * Math.cos(driftAngle);
          const cloudY = cy + shakeY + rDist * Math.sin(driftAngle);
          const cloudSize = cloudSizes[i] + Math.sin(time * 1.2 + i) * 4; // pulsing cloud size
          
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

        // 3. Detailed organic smoke puffs layered along the centerline
        const numPuffs = 6;
        for (let p = 0; p < numPuffs; p++) {
          const puffSeed = idx * 7.7 + p * 15.4;
          const puffTime = time * 0.8 + puffSeed;
          const baseDist = radius * (0.2 + (p / numPuffs) * 0.7);
          const puffDist = baseDist + Math.sin(puffTime * 1.3) * 6; // drift outward/inward
          const puffAngle = midAngle + Math.cos(puffTime * 0.9) * 0.035; // sway left/right
          
          const puffX = cx + shakeX + puffDist * Math.cos(puffAngle);
          const puffY = cy + shakeY + puffDist * Math.sin(puffAngle);
          const baseSize = radius * (0.08 + (p / numPuffs) * 0.14);
          const puffSize = baseSize + Math.sin(puffTime * 1.7) * 4;
          
          const puffGrad = ctx.createRadialGradient(puffX, puffY, 0, puffX, puffY, puffSize);
          puffGrad.addColorStop(0, 'rgba(243, 232, 255, 0.16)'); // soft white-grey smoke core
          puffGrad.addColorStop(0.3, 'rgba(216, 180, 254, 0.09)'); // light purple smoke
          puffGrad.addColorStop(0.7, 'rgba(147, 51, 234, 0.03)'); // faint violet edge
          puffGrad.addColorStop(1, 'rgba(12, 10, 22, 0)');
          
          ctx.fillStyle = puffGrad;
          ctx.beginPath();
          ctx.arc(puffX, puffY, puffSize, 0, 2 * Math.PI);
          ctx.fill();
        }

        // 4. Spooky glowing embers / will-o'-the-wisps floating inside the mist
        const numWisps = 3;
        for (let w = 0; w < numWisps; w++) {
          const wispSeed = idx * 5.5 + w * 12.3;
          const wispTime = time * 0.5 + wispSeed;
          const wispR = radius * (0.25 + (wispSeed % 0.55)) + Math.sin(wispTime * 1.5) * 12;
          const wispA = start + seg.angleSize * (0.15 + (wispSeed % 0.7)) + Math.cos(wispTime) * 0.03;
          const wispX = cx + shakeX + wispR * Math.cos(wispA);
          const wispY = cy + shakeY + wispR * Math.sin(wispA);
          const wispOpacity = 0.35 + Math.sin(wispTime * 3.2) * 0.25; // flickering glow
          
          const wispGrad = ctx.createRadialGradient(wispX, wispY, 0, wispX, wispY, 6);
          wispGrad.addColorStop(0, `rgba(168, 85, 247, ${wispOpacity})`); // Purple core
          wispGrad.addColorStop(0.3, `rgba(216, 180, 254, ${wispOpacity * 0.6})`);
          wispGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
          
          ctx.fillStyle = wispGrad;
          ctx.beginPath();
          ctx.arc(wispX, wispY, 6, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';

        // 5. Soft glowing wind arcs / swirling dust rings
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

        // 1. Semi-translucent base blue-ish/cyan tint (frosted tint)
        ctx.fillStyle = 'rgba(14, 165, 233, 0.18)'; 
        ctx.fill();

        // 2. Reflective glass radial gradient overlay
        const glassGrad = ctx.createRadialGradient(
          cx + shakeX, 
          cy + shakeY, 
          radius * 0.3, 
          cx + shakeX, 
          cy + shakeY, 
          radius
        );
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)'); // center reflection highlight
        glassGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.15)'); // sky blue glow
        glassGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.12)'); // cyan glow
        glassGrad.addColorStop(1, 'rgba(3, 105, 161, 0.4)'); // darker blue rim
        ctx.fillStyle = glassGrad;
        ctx.fill();

        // 3. Diagonal glassy reflection stripe (sheen) across the slice
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
        sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)'); // Bright white glare line
        sheenGrad.addColorStop(0.52, 'rgba(255, 255, 255, 0.25)');
        sheenGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
        sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sheenGrad;
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // 4. Glassy bevel highlight arcs (frosted edge glows)
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

        // 5. Break lines/cracks based on current/max shields ratio
        const ratio = seg.option.currentShields / seg.option.shields;
        if (ratio < 1.0) {
          ctx.strokeStyle = 'rgba(230, 248, 255, 0.9)'; // bright icy crack
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
        const maxShrouds = seg.option.shrouds || 0;
        const currentShrouds = seg.option.currentShrouds || 0;
        const maxShields = seg.option.shields || 0;
        const currentShields = seg.option.currentShields || 0;
        const maxLives = seg.option.lives;
        const currentLives = seg.option.currentLives;
        
        if (currentShrouds > 0) {
          // Shroud Indicators
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
          // Shield Indicators
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
          // Lives Indicators
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

        // Draw Option text label (showing "Hidden option" if shrouded)
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
          ctx.fillStyle = '#f3e8ff'; // Soft white-purple
          ctx.shadowColor = '#c084fc'; // Purple glow
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
      
      if (wheel.displayMode === 'race') {
        drawHorseRace(ctx, rect.width, rect.height);
      } else if (wheel.displayMode === 'lootbox' || wheel.isLootbox) {
        drawLootboxTicker(ctx, rect.width, rect.height);
      } else {
        drawWheel(ctx, rect.width, rect.height, angleRef.current);
      }
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
  }, [activeOptions, segments, windowWidth, wheel.isLootbox, wheel.displayMode]);

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

      if (wheel.displayMode === 'race') {
        raceTRef.current = t;

        // Play galloping hoofbeats at rhythmic intervals during active race
        const hoofInterval = 180;
        const lastHoof = Math.floor((elapsed - 16.7) / hoofInterval);
        const currentHoof = Math.floor(elapsed / hoofInterval);
        if (currentHoof > lastHoof && elapsed < duration * 0.92) {
          audio.playHoofbeat();
        }

        // Generate particle trails for rare horses running
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
                const prog = getHorseProgress(idx, t, isWinner);
                const hx = startX + (endX - startX) * prog;
                const hy = 20 + idx * laneHeight + laneHeight / 2;

                const px = hx - 18;
                const py = hy + 2;

                if (Math.random() < 0.35) {
                  let pColor = '#eab308'; // gold stardust
                  if (rarity === 'red') pColor = '#ef4444'; // fire sparks
                  if (rarity === 'purple') pColor = '#a855f7'; // purple magic

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

              const totalW = activeOptionsRef.current.reduce((sum, opt) => sum + opt.weight, 0);
              const odds = totalW > 0 ? winningOpt.weight / totalW : 0;
              const sortedAsc = [...activeOptionsRef.current].sort((a, b) => a.weight - b.weight);
              const thresholdWeight = sortedAsc.length >= 3 ? sortedAsc[2].weight : Infinity;
              const isLegendary = (odds < 0.05) && (winningOpt.weight <= thresholdWeight);

              if (isLegendary) {
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
      } else if (wheel.displayMode === 'lootbox' || wheel.isLootbox) {
        const canvas = canvasRef.current;
        const width = canvas ? canvas.getBoundingClientRect().width : 600;
        const cardWidth = 180;
        const cardGap = 16;
        const cardStep = cardWidth + cardGap;

        if (targetOffsetRef.current === null) {
          if (canvas) {
            const rectWidth = canvas.getBoundingClientRect().width;
            if (rectWidth > 0) {
              const randomOffsetInsideCard = (Math.random() * 0.6 - 0.3) * cardWidth;
              targetOffsetRef.current = 35 * cardStep + cardWidth / 2 - rectWidth / 2 + randomOffsetInsideCard;
            }
          }
          continueAnimation = true;
        } else {
          // Stop early if movement becomes imperceptible (quintic ease-out has a long flat tail)
          const remaining = targetOffsetRef.current !== null ? (targetOffsetRef.current - currentOffsetRef.current) : 0;
          const isStillMoving = elapsed < duration && remaining > 3;

          if (isStillMoving) {
            const easeVal = 1 - Math.pow(1 - t, 5); // quintic ease-out
            const nextOffset = startOffsetRef.current + (targetOffsetRef.current - startOffsetRef.current) * easeVal;
            
            currentOffsetRef.current = nextOffset;
            continueAnimation = true;

            const centeredIndex = Math.round((currentOffsetRef.current + width / 2 - cardWidth / 2) / cardStep);
            if (centeredIndex !== lastSegmentIndex.current && centeredIndex >= 0 && centeredIndex < 50) {
              audio.playTick();
              lastSegmentIndex.current = centeredIndex;
              pointerWobbleRef.current = 0.38;
              pointerWobbleVelRef.current = -0.05;
              screenShakeRef.current = 2.2;

              if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const cx = rect.width / 2;
                const cy = 10;
                const sparkCount = 8;
                for (let i = 0; i < sparkCount; i++) {
                  particlesRef.current.push({
                    x: cx + (Math.random() * 6 - 3),
                    y: cy,
                    vx: (Math.random() * 4 - 2),
                    vy: Math.random() * 3 + 1,
                    gravity: 0.15,
                    size: 1.5 + Math.random() * 2.0,
                    color: '#eab308',
                    alpha: 1.0,
                    decay: 0.02 + Math.random() * 0.03
                  });
                }
              }
            }
          } else {
            currentOffsetRef.current = targetOffsetRef.current;
            
            if (!isCrateOpeningRef.current) {
              isCrateOpeningRef.current = true;
              setIsCrateOpening(true);
              audio.playChestOpen();
              
              setTimeout(() => {
                setIsSpinning(false);
                isSpinningRef.current = false;
                setIsCrateOpening(false);
                isCrateOpeningRef.current = false;

                const winningOpt = lootboxWinnerRef.current;
                if (winningOpt) {
                  setWinner(winningOpt);
                  onSpinEndCalledRef.current = false;

                  const totalW = activeOptionsRef.current.reduce((sum, opt) => sum + opt.weight, 0);
                  const odds = totalW > 0 ? winningOpt.weight / totalW : 0;
                  const sortedAsc = [...activeOptionsRef.current].sort((a, b) => a.weight - b.weight);
                  const thresholdWeight = sortedAsc.length >= 3 ? sortedAsc[2].weight : Infinity;
                  const isLegendary = (odds < 0.05) && (winningOpt.weight <= thresholdWeight);

                  if (isLegendary) {
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
              }, 600);
            }

            continueAnimation = true;
          }
        }
      } else {
        // Standard wheel animation
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

            const totalW = activeOptionsRef.current.reduce((sum, opt) => sum + opt.weight, 0);
            const odds = totalW > 0 ? winningOpt.weight / totalW : 0;
            const sortedAsc = [...activeOptionsRef.current].sort((a, b) => a.weight - b.weight);
            const thresholdWeight = sortedAsc.length >= 3 ? sortedAsc[2].weight : Infinity;
            const isLegendary = (odds < 0.05) && (winningOpt.weight <= thresholdWeight);

            if (isLegendary) {
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
        if (wheel.displayMode === 'race') {
          audio.playHorseNeigh();
        } else if (wheel.displayMode === 'lootbox' || wheel.isLootbox) {
          audio.playCrateLatch();
        } else {
          audio.playGlassShatter();
        }

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
        if (wheel.displayMode === 'race') {
          // Horse race mode: silent or subtle sound
        } else if (wheel.displayMode === 'lootbox' || wheel.isLootbox) {
          audio.playCrateImpact();
        } else {
          audio.playThump();
        }

        const currentWinner = winnerRef.current;
        const hasSubOption = currentWinner && currentWinner.subOption;

        if (currentWinner && !onSpinEndCalledRef.current) {
          onSpinEnd(currentWinner);
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
        if (wheel.displayMode === 'race') {
          raceTRef.current = 0;
        }
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
      
      if (wheel.displayMode === 'race') {
        drawHorseRace(ctx, rect.width, rect.height);
      } else if (wheel.displayMode === 'lootbox' || wheel.isLootbox) {
        drawLootboxTicker(ctx, rect.width, rect.height);
      } else {
        drawWheel(ctx, rect.width, rect.height, angleRef.current);
      }
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

    if (wheel.displayMode === 'race') {
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

      // Initialize horse speed factors for non-winners and winners to stagger progress
      const speedFactors = activeOpts.map(() => ({
        speedOffset: 0.75 + Math.random() * 0.2, // between 0.75 and 0.95
        phase: Math.random() * Math.PI * 2
      }));
      horseSpeedFactorsRef.current = speedFactors;
    } else if (wheel.displayMode === 'lootbox' || wheel.isLootbox) {
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

      const items = [];
      for (let i = 0; i < 50; i++) {
        if (i === 35) {
          items.push(selectedWinner);
        } else {
          let rand = Math.random() * totalW;
          let opt = activeOpts[0];
          for (let j = 0; j < activeOpts.length; j++) {
            if (rand < activeOpts[j].weight) {
              opt = activeOpts[j];
              break;
            }
            rand -= activeOpts[j].weight;
          }
          items.push(opt);
        }
      }
      tickerItemsRef.current = items;
      lootboxWinnerRef.current = selectedWinner;



      startOffsetRef.current = 0;
      currentOffsetRef.current = 0;
      targetOffsetRef.current = null;
      lastSegmentIndex.current = -1;
    } else {
      startAngleRef.current = angleRef.current % (2 * Math.PI);
      angleRef.current = startAngleRef.current;

      const rotations = 6 + Math.random() * 3;
      targetAngleRef.current = startAngleRef.current + rotations * 2 * Math.PI + Math.random() * 2 * Math.PI;
      lastSegmentIndex.current = -1;
    }

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
    
    if (wheel.displayMode === 'race') {
      raceTRef.current = 0;
    }
    
    // Check if the option is a link to another wheel
    // If we are returning from a nested run (nestedResult is present), we DO NOT transition again!
    if (!nestedResult && winner && winner.linkedWheelId) {
      console.log('[WHEEL] Confirming linked wheel transition to:', winner.linkedWheelId);
      onTransitionToWheel(winner.linkedWheelId, winner);
      return;
    }

    // Clear nested result state in parent when returning
    if (nestedResult && onClearNestedResult) {
      onClearNestedResult();
    }

    const hasShrouds = winner && (winner.currentShrouds || 0) > 0;
    const hasShields = winner && (winner.currentShields || 0) > 0;
    if (winner && winner.lives > 0 && winner.currentLives === 1 && !hasShrouds && !hasShields) {
      const winningIndex = activeOptionsRef.current.findIndex(opt => opt.id === winner.id);
      if (winningIndex !== -1) {
        depletingOptionIdRef.current = winner.id;
        setDepletingOptionId(winner.id);
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

  if (wheel.displayMode === 'race') {
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
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Edit Wheel
            </button>
          </div>
        </div>

        {/* Race Screen content */}
        <div className="race-screen-container animate-fade-in" style={{ width: '100%', maxWidth: '980px', margin: '30px auto 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
          
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Championship Turf Track
            </span>
            <h2 style={{ fontSize: '2.3rem', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)', marginTop: '5px' }}>
              {wheel.name}
            </h2>
          </div>

          {/* Racetrack canvas container */}
          <div className="race-track-viewport" style={{
            width: '100%',
            height: `${Math.max(340, activeOptions.length * 75 + 40)}px`,
            background: '#0a160f',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.1)'
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
          <div className="race-contestants-section" style={{ width: '100%', padding: '0 10px', marginTop: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px', textAlign: 'center' }}>
              Contestant Horses ({activeOptions.length})
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
              gap: '16px',
              width: '100%'
            }}>
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
                    {/* Visual Horse Preview Box */}
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
                      
                      {/* Shrouded Fog Background overlay */}
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

                      {/* Shielded Frosted Glass Background overlay */}
                      {currentShields > 0 && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(6, 182, 212, 0.02) 100%)',
                          pointerEvents: 'none',
                          zIndex: 1
                        }} />
                      )}

                      {/* Top-Right Indicator Badges */}
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

                      {/* Horse graphical preview (Always rendered with high-DPI canvas to match track horses exactly) */}
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
                            
                            // Draw static horse centered and scaled down using unified drawing helper
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

                    {/* Title & Info */}
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
            setRevealingOptionId(null);
            setDepletingOptionId(null);
            bannerTextRef.current = null;
            celebrationTypeRef.current = null;
            raceTRef.current = 0;
            onResetWheel();
          }}
        />

      </div>
    );
  }

  if (wheel.isLootbox) {
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
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Edit Wheel
            </button>
          </div>
        </div>

        {isSpinning ? (
          /* Case Opening conveyor mode */
          <div className="lootbox-opening-container animate-fade-in" style={{ width: '100%', maxWidth: '950px', margin: '40px auto 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
            
            {/* Shaking container crate */}
            <div className="crate-shaking" style={{ width: '180px', height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {renderVectorCrate()}
            </div>

            {/* Conveyor belt ticker view */}
            <div className="lootbox-conveyor-belt" style={{
              width: '100%',
              height: '230px',
              background: '#0f0c1c',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(139, 92, 246, 0.1)'
            }}>
              <canvas 
                ref={canvasRef} 
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block'
                }}
              />
            </div>

            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.1em', animation: 'pulse-glow 1.5s infinite' }}>
              OPENING CONTAINER...
            </div>
          </div>
        ) : (
          /* Crate idle container screen */
          <div className="lootbox-container-screen animate-fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', marginTop: '20px' }}>
            
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Lootbox Container
              </span>
              <h2 style={{ fontSize: '2.5rem', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)', marginTop: '5px' }}>
                {wheel.name}
              </h2>
            </div>

            {/* Crate Box with breathing idle effect */}
            <div className="crate-idle" style={{ width: '220px', height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {renderVectorCrate()}
            </div>

            <button 
              onClick={handleSpin} 
              disabled={activeOptions.length === 0}
              className="btn btn-primary btn-sheen-container"
              style={{
                fontSize: '1.2rem',
                fontWeight: '800',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '18px 60px',
                borderRadius: '35px',
                minWidth: '240px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)',
                boxShadow: '0 0 35px rgba(234, 179, 8, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                animation: activeOptions.length > 0 ? 'pulse-glow 2.5s infinite' : 'none',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                cursor: activeOptions.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              OPEN CONTAINER
            </button>

            {/* Possible options container */}
            <div className="lootbox-items-section" style={{ width: '100%', maxWidth: '1000px', padding: '0 20px', marginTop: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px', textAlign: 'center' }}>
                Items that might be in this Container ({activeOptions.length})
              </h3>
              

              {/* Option cards grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                gap: '16px',
                width: '100%'
              }}>
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

                  const isRevealing = opt.id === revealingOptionId;
                  const isDepleting = opt.id === depletingOptionId;

                  return (
                    <div key={opt.id} className={`lootbox-item-card${isRevealing ? ' card-reveal-animate' : ''}${isDepleting ? ' card-deplete-animate' : ''}`} style={{
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
                      {/* Rectangular preview box */}
                      <div style={{
                        width: '100%',
                        height: '110px',
                        borderRadius: '8px',
                        background: currentShrouds > 0 
                          ? 'rgba(30, 20, 45, 0.95)' 
                          : currentShields > 0 
                          ? 'rgba(10, 25, 40, 0.6)' 
                          : `linear-gradient(to bottom, rgba(15, 15, 25, 0.9), ${getAlphaColor(opt.color, 0.09)})`,
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderBottom: `4px solid ${opt.color}`
                      }}>
                        {/* Shrouded fog preview */}
                        {currentShrouds > 0 && (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <div className="shroud-smoke" style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '200%',
                              height: '100%',
                              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 10%, transparent 60%)',
                              animation: 'crate-float 3s linear infinite'
                            }} />
                            <span style={{ fontSize: '1.25rem' }}>☁️</span>
                            <span style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', zIndex: 1 }}>Hidden Option</span>
                          </div>
                        )}

                        {/* Shielded glass pane preview */}
                        {currentShields > 0 && (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(6, 182, 212, 0.04) 100%)',
                              pointerEvents: 'none',
                              zIndex: 1
                            }} />
                            <span style={{ fontSize: '1.4rem', zIndex: 2 }}>🛡️</span>
                            <span style={{ fontSize: '0.65rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px', zIndex: 2 }}>Shielded</span>
                          </div>
                        )}

                        {/* Standard Option Badge */}
                        {currentShrouds === 0 && currentShields === 0 && (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: opt.color,
                            boxShadow: `0 0 15px ${opt.color}`,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            color: '#fff'
                          }}>
                            {opt.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Info & Text underneath */}
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
        )}

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
            setRevealingOptionId(null);
            setDepletingOptionId(null);
            bannerTextRef.current = null;
            celebrationTypeRef.current = null;
            raceTRef.current = 0;
            onResetWheel();
          }}
        />
      </div>
    );
  }

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
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Edit Wheel
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
        <div className="wheelspin-sidebar-col">
          {sortedOptions.map((opt) => {
            const chance = totalWeight > 0 ? ((opt.weight / totalWeight) * 100).toFixed(1) : '0.0';
            
            // Hearts/Shrouds/Shields representation
            const hearts = [];
            const maxShrouds = opt.shrouds || 0;
            const currentShrouds = opt.currentShrouds || 0;
            const maxShields = opt.shields || 0;
            const currentShields = opt.currentShields || 0;

            if (currentShrouds > 0) {
              // Shrouds
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
              // Shields
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
              // Lives
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
                      {currentShrouds > 0 ? 'Hidden option' : opt.name}
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
          setRevealingOptionId(null);
          setDepletingOptionId(null);
          bannerTextRef.current = null;
          celebrationTypeRef.current = null;
          raceTRef.current = 0;
          onResetWheel();
        }}
      />
    </div>
  );
}
