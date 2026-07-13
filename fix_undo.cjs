const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, 'src', 'lib');
const files = fs.readdirSync(libDir).filter(f => f.endsWith('Supabase.ts') && f !== 'supabase.ts');

for (const file of files) {
  let content = fs.readFileSync(path.join(libDir, file), 'utf8');
  let lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
     if (lines[i].includes('// TS-FIX ')) {
        lines[i] = lines[i].replace('// TS-FIX ', '');
     }
     
     // I added `    // ` or `    // // `
     if (lines[i].startsWith('    // // ')) {
        lines[i] = lines[i].replace('    // // ', '');
     } else if (lines[i].startsWith('    // ')) {
        // Only uncomment if it contains something that looks like code (e.g. let list, if (, }, return)
        if (lines[i].includes('const ') || lines[i].includes('let ') || lines[i].includes('if (') || lines[i].includes('} else') || lines[i].includes('return ') || lines[i].includes('list = ') || lines[i].includes('list.push') || lines[i].trim() === '}' || lines[i].trim() === '    //') {
            lines[i] = lines[i].replace('    // ', '    ');
        }
     }
  }
  
  content = lines.join('\n');
  
  // Now replace localStorage.getItem(...) with null
  content = content.replace(/localStorage\.getItem\([^)]*\)/g, 'null');
  
  // Replace localStorage.setItem(...) with nothing (or undefined)
  content = content.replace(/localStorage\.setItem\([^)]*\);?/g, '');
  
  // Replace URL.createObjectURL(file) with "mock-url"
  content = content.replace(/URL\.createObjectURL\([^)]*\)/g, '"mock-url"');

  fs.writeFileSync(path.join(libDir, file), content);
}
console.log('Undid comments and nullified localStorage');
