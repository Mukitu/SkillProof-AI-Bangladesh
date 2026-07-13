const fs = require('fs');

let content = fs.readFileSync('src/lib/adminSupabase.ts', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('if (storedAss)') || lines[i].includes('if (storedCv)') || lines[i].includes('if (storedJobs)') || lines[i].includes('if (storedInterviews)')) {
      lines[i] = '    // ' + lines[i];
   }
   if (lines[i].trim() === '}' && i > 0 && lines[i-1].includes('localStorage.setItem')) {
      lines[i] = '    // ' + lines[i];
   }
}

fs.writeFileSync('src/lib/adminSupabase.ts', lines.join('\n'));
