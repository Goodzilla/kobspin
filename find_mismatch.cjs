const fs = require('fs');
const content = fs.readFileSync('src/components/WheelSpin.jsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let newBalance = balance;
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') newBalance++;
    if (line[j] === '}') newBalance--;
  }
  // Print line number when brace level returns to 1 (top-level inside WheelSpin) or 0 (WheelSpin closed)
  if (balance > 1 && newBalance === 1) {
    console.log(`Block closed at line ${i + 1} (balance returns to 1): "${line.trim()}"`);
  }
  if (balance > 0 && newBalance === 0) {
    console.log(`WheelSpin closed at line ${i + 1} (balance returns to 0): "${line.trim()}"`);
  }
  balance = newBalance;
}
