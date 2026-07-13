const fs = require('fs');
let content = fs.readFileSync('src/lib/cvGroq.ts', 'utf8');

// Remove groq-sdk
content = content.replace("import Groq from 'groq-sdk';\n", "");

// Remove groq client initialization
content = content.replace(/const groqApiKey =[\s\S]*?console\.warn\('.*?'\);\n}/, `// Backend proxy is used for AI.\nconst isRealGroq = true;`);

// In generateCvImprovement, remove Gemini
const geminiRegex = /\/\/ Preference: try Gemini Proxy first[\s\S]*?\/\/ Fallback to Groq Proxy if Gemini key is not configured yet/;
content = content.replace(geminiRegex, "");

const remainingGeminiCleanup = /let content = '';\n\s*if \(response\.ok\) \{[\s\S]*?\} else \{/;
content = content.replace(remainingGeminiCleanup, "let content = '';\n      {");

// Also remove `if (!groqResponse.ok) throw new Error('Both Gemini and Groq requests failed');`
content = content.replace(/if \(!groqResponse\.ok\) throw new Error\('Both Gemini and Groq requests failed'\);/, "if (!groqResponse.ok) throw new Error('Groq request failed');");

fs.writeFileSync('src/lib/cvGroq.ts', content);
