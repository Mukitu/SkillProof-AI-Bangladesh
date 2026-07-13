const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, 'src', 'lib');
const files = fs.readdirSync(libDir).filter(f => f.endsWith('Supabase.ts') && f !== 'supabase.ts');

for (const file of files) {
  let content = fs.readFileSync(path.join(libDir, file), 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('stored ?') || lines[i].includes('if (stored)') || lines[i].includes('JSON.parse(stored') || lines[i].includes('storedProfiles')) {
        if (!lines[i].trim().startsWith('//')) {
            lines[i] = '    // ' + lines[i];
        }
    }
  }
  
  fs.writeFileSync(path.join(libDir, file), lines.join('\n'));
}
