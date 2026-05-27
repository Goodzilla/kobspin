

/**
 * Renders the vector container crate (yellow/gold steel case) used in CS:GO Lootbox mode.
 * @param {Object} props
 * @param {boolean} props.isCrateOpening - Whether the crate lid is currently opening
 */
export default function VectorCrate({ isCrateOpening }) {
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
}
