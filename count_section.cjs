const fs = require('fs');
const content = fs.readFileSync('src/components/WheelSpin.jsx', 'utf8');
const lines = content.split('\n');
let opens = 0;
let closes = 0;
for (let i = 1946; i < 2217; i++) { // line 1947 is index 1946, line 2217 is index 2216
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') opens++;
    if (line[j] === '}') closes++;
  }
}
console.log(`Lines 1947-2217: Opens: ${opens}, Closes: ${closes}, Difference: ${opens - closes}`);
