const fs = require('fs');
let content = fs.readFileSync('src/lib/interviewGroq.ts', 'utf8');

// Remove groq-sdk
content = content.replace("import Groq from 'groq-sdk';\n", "");

// Remove groq client initialization
content = content.replace(/const groqApiKey =[\s\S]*?console\.warn\('.*?'\);\n}/, `// Backend proxy is used for AI.\nconst isRealGroq = true;`);

fs.writeFileSync('src/lib/interviewGroq.ts', content);
