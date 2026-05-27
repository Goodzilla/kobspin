// Simple unique ID generator
export const generateId = () => {
  return 'opt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
};
