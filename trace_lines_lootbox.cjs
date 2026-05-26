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
  if (i + 1 >= 2030 && i + 1 <= 2145) {
    console.log(`${String(i + 1).padStart(4)} [${oldBalance} -> ${balance}]: ${line.trim()}`);
  }
}
