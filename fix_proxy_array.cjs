const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, 'src', 'lib');
const files = fs.readdirSync(libDir).filter(f => f.endsWith('Supabase.ts') && f !== 'supabase.ts');

for (const file of files) {
  let content = fs.readFileSync(path.join(libDir, file), 'utf8');
  if (content.includes('=> null')) {
     content = content.replace(/=> null/g, '=> []');
     fs.writeFileSync(path.join(libDir, file), content);
  }
}
console.log('Fixed proxy to return []');
