const fs = require('fs');
let content = fs.readFileSync('src/lib/interviewGroq.ts', 'utf8');

const regex = /let groqClient: Groq \| null = null;[\s\S]*?\}\n/m;
content = content.replace(regex, `// Backend proxy is used for AI.\nconst isRealGroq = true;\n`);

fs.writeFileSync('src/lib/interviewGroq.ts', content);
