const fs = require('fs');
let content = fs.readFileSync('src/lib/interviewGroq.ts', 'utf8');

content = content.replace("const isRealGroq = true;\n}", "const isRealGroq = true;");
fs.writeFileSync('src/lib/interviewGroq.ts', content);
