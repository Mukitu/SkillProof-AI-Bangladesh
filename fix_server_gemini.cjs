const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace('const { GoogleGenAI } = require("@google/genai");\n', '');

const geminiRouteRegex = /\/\/ Gemini Proxy[\s\S]*?app\.post\("\/api\/ai\/gemini"[\s\S]*?res\.status\(500\)\.json\(\{ error: "Gemini Proxy request failed", details: error\.message \}\);\n    \}\n  \}\);\n/g;

content = content.replace(geminiRouteRegex, '');

// Also remove `app.post('/api/ai/gemini', ...)` block at the end (from a previous fix)
const geminiRouteRegex2 = /app\.post\('\/api\/ai\/gemini'[\s\S]*?res\.status\(500\)\.json\(\{ error: e\.message \}\);\n    \}\n  \}\);/g;
content = content.replace(geminiRouteRegex2, '');

fs.writeFileSync('server.ts', content);
