/**
 * Helper to sanitize a single option object recursively, ensuring all
 * lives, shrouds, and shields fields exist as valid numbers.
 */
export const sanitizeOption = (opt) => {
  if (!opt) return null;
  const sanitized = { ...opt };

  // Ensure lives exist and are valid numbers
  if (sanitized.lives === undefined || sanitized.lives === null) {
    sanitized.lives = 3;
  } else {
    sanitized.lives = Number(sanitized.lives);
  }
  if (sanitized.currentLives === undefined || sanitized.currentLives === null) {
    sanitized.currentLives = sanitized.lives;
  } else {
    sanitized.currentLives = Number(sanitized.currentLives);
  }

  // Ensure shrouds exist and are valid numbers
  if (sanitized.shrouds === undefined || sanitized.shrouds === null) {
    sanitized.shrouds = 0;
  } else {
    sanitized.shrouds = Number(sanitized.shrouds);
  }
  if (sanitized.currentShrouds === undefined || sanitized.currentShrouds === null) {
    sanitized.currentShrouds = sanitized.shrouds;
  } else {
    sanitized.currentShrouds = Number(sanitized.currentShrouds);
  }

  // Ensure shields exist and are valid numbers
  if (sanitized.shields === undefined || sanitized.shields === null) {
    sanitized.shields = 0;
  } else {
    sanitized.shields = Number(sanitized.shields);
  }
  if (sanitized.currentShields === undefined || sanitized.currentShields === null) {
    sanitized.currentShields = sanitized.shields;
  } else {
    sanitized.currentShields = Number(sanitized.currentShields);
  }

  // Ensure weight is a number
  sanitized.weight = sanitized.weight !== undefined ? Number(sanitized.weight) : 25;

  // Recurse for subOption
  if (sanitized.subOption) {
    sanitized.subOption = sanitizeOption(sanitized.subOption);
  } else {
    sanitized.subOption = null;
  }

  return sanitized;
};

/**
 * Helper to sanitize a single wheel object, backfilling missing configurations.
 */
export const sanitizeWheel = (w) => {
  if (!w) return null;
  const sanitized = { ...w };

  // Sanitize originalOptions
  if (Array.isArray(sanitized.originalOptions)) {
    sanitized.originalOptions = sanitized.originalOptions.map(sanitizeOption).filter(Boolean);
  } else {
    sanitized.originalOptions = [];
  }

  // Sanitize activeOptions
  if (Array.isArray(sanitized.activeOptions)) {
    sanitized.activeOptions = sanitized.activeOptions.map(sanitizeOption).filter(Boolean);
  } else {
    sanitized.activeOptions = [];
  }

  sanitized.spinDuration = sanitized.spinDuration !== undefined ? Number(sanitized.spinDuration) : 10;
  sanitized.displayMode = sanitized.displayMode || (sanitized.isLootbox ? 'lootbox' : 'wheel');
  sanitized.isLootbox = sanitized.displayMode === 'lootbox';

  return sanitized;
};

/**
 * Sanitizes an array of wheels (e.g. loaded from localStorage or imported).
 */
export const sanitizeWheelsData = (wheelsArray) => {
  if (!Array.isArray(wheelsArray)) return [];
  return wheelsArray.map(sanitizeWheel).filter(Boolean);
};

/**
 * Sanitizes the history list by removing duplicates that occur within the same second
 * and have the exact same reward details (wheel name, option name, and event text).
 */
export const sanitizeHistory = (historyList) => {
  if (!Array.isArray(historyList)) return [];
  const seen = new Set();
  return historyList.filter(item => {
    if (!item) return false;
    const secondTimestamp = Math.floor(item.timestamp / 1000);
    // Build a unique key combining the timestamp (to the second) and the reward/event detail properties
    const key = `${secondTimestamp}|${item.wheelName || ''}|${item.optionName || ''}|${item.eventText || ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};
