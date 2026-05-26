const fs = require('fs');
const content = fs.readFileSync('src/components/WheelSpin.jsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let opens = 0;
  let closes = 0;
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') opens++;
    if (line[j] === '}') closes++;
  }
  balance += opens - closes;
  if (balance < 0) {
    console.log(`Negative brace balance (${balance}) at line ${i + 1}: "${line.trim()}"`);
    process.exit(1);
  }
}
console.log(`Final brace balance: ${balance}`);
