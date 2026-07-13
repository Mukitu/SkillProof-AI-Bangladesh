const fs = require('fs');
let content = fs.readFileSync('src/lib/cvGroq.ts', 'utf8');

// Find where "let content = '';\n      {" is
content = content.replace("let content = '';\n      {", "let content = '';");

// Also remove the closing "}" for that block
content = content.replace("content = data.choices[0]?.message?.content || '';\n      }", "content = data.choices[0]?.message?.content || '';");

fs.writeFileSync('src/lib/cvGroq.ts', content);
