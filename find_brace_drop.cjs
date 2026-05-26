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
  const oldBalance = balance;
  balance += opens - closes;
  if (i + 1 >= 1937 && i + 1 <= 2364) {
    if (balance < oldBalance) {
      console.log(`Line ${i + 1} (${oldBalance} -> ${balance}): "${line.trim()}"`);
    }
  }
}
