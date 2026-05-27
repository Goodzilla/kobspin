// Generates vibrant, distinct colors using golden ratio hue distribution
export const getVibrantColor = (index) => {
  const hue = Math.floor((index * 137.5) % 360);
  return `hsl(${hue}, 85%, 60%)`;
};

// Robust helper to generate a translucent color with a specific alpha value
export const getAlphaColor = (colorStr, alpha = 0.13) => {
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
