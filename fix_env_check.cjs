const fs = require('fs');

const filesToFix = ['src/lib/interviewGroq.ts', 'src/lib/cvGroq.ts'];

for (const file of filesToFix) {
   let content = fs.readFileSync(file, 'utf8');
   content = content.replace(/const groqApiKey = import\.meta\.env\.VITE_GROQ_API_KEY \|\| '';\n/g, '');
   fs.writeFileSync(file, content);
}
