// Generates vibrant, distinct colors using golden ratio hue distribution
export const getVibrantColor = (index) => {
  const hue = Math.floor((index * 137.5) % 360);
  return `hsl(${hue}, 85%, 60%)`;
};

// Simple unique ID generator
export const generateId = () => {
  return 'opt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
};
