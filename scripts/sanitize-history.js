#!/usr/bin/env node
/* global process */

/**
 * Standalone CLI script to sanitize a KobSpin history JSON file by removing duplicates.
 * Duplicates are defined as entries with the same exact timestamp (to the second)
 * and the same exact reward/outcome details (wheelName, optionName, eventText).
 *
 * Usage:
 *   node scripts/sanitize-history.js <input-file.json> [output-file.json]
 * Or to output to stdout:
 *   node scripts/sanitize-history.js <input-file.json>
 */

import fs from 'fs';
import path from 'path';

// Helper to remove duplicates
const sanitizeHistoryList = (historyList) => {
  if (!Array.isArray(historyList)) return [];
  const seen = new Set();
  return historyList.filter(item => {
    if (!item) return false;
    const secondTimestamp = Math.floor(item.timestamp / 1000);
    const key = `${secondTimestamp}|${item.wheelName || ''}|${item.optionName || ''}|${item.eventText || ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const main = () => {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
KobSpin History Sanitizer CLI
=============================
Removes duplicate history entries with the exact same second and reward details.

Usage:
  node scripts/sanitize-history.js <input-file.json> [output-file.json]

Options:
  <input-file.json>   Path to the JSON file containing history logs (an array of entries,
                       or a JSON object exported from KobSpin).
  [output-file.json]  (Optional) Path to save the sanitized JSON content. If omitted,
                       the sanitized JSON is printed to the console (stdout).
    `);
    process.exit(0);
  }

  const inputPath = path.resolve(args[0]);
  let outputPath = args[1] ? path.resolve(args[1]) : null;

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file does not exist at path: ${inputPath}`);
    process.exit(1);
  }

  let fileContent;
  try {
    fileContent = fs.readFileSync(inputPath, 'utf8');
  } catch (err) {
    console.error(`Error reading file: ${err.message}`);
    process.exit(1);
  }

  let historyData;
  try {
    historyData = JSON.parse(fileContent);
  } catch (err) {
    console.error(`Error parsing JSON: ${err.message}`);
    process.exit(1);
  }

  let historyList = [];
  let isWrapped = false;
  let wrapperKey = '';

  // Detect format: could be raw array, or wrapped inside a Backup object
  if (Array.isArray(historyData)) {
    historyList = historyData;
  } else if (historyData && typeof historyData === 'object') {
    // If it's a key-value object containing history list, detect it
    if (Array.isArray(historyData.history)) {
      historyList = historyData.history;
      isWrapped = true;
      wrapperKey = 'history';
    } else if (Array.isArray(historyData.kobspin_history)) {
      historyList = historyData.kobspin_history;
      isWrapped = true;
      wrapperKey = 'kobspin_history';
    } else {
      console.error('Error: Could not find a valid history array in the JSON file. The JSON should be an array or contain a "history" field.');
      process.exit(1);
    }
  } else {
    console.error('Error: JSON content must be an array or an object containing a history list.');
    process.exit(1);
  }

  const originalCount = historyList.length;
  const sanitizedList = sanitizeHistoryList(historyList);
  const duplicatesCount = originalCount - sanitizedList.length;

  // Prepare output data
  let outputData;
  if (isWrapped) {
    outputData = { ...historyData, [wrapperKey]: sanitizedList };
  } else {
    outputData = sanitizedList;
  }

  const formattedOutput = JSON.stringify(outputData, null, 2);

  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, formattedOutput, 'utf8');
      console.log(`Sanitization Complete!`);
      console.log(`Original entries: ${originalCount}`);
      console.log(`Duplicates removed: ${duplicatesCount}`);
      console.log(`Sanitized entries saved to: ${outputPath}`);
    } catch (err) {
      console.error(`Error writing output file: ${err.message}`);
      process.exit(1);
    }
  } else {
    // Print to stdout
    console.log(formattedOutput);
    console.error(`\n---\nSanitization Complete: Removed ${duplicatesCount} duplicates out of ${originalCount} total entries.`);
  }
};

main();
