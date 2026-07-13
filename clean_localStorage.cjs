const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, 'src', 'lib');
const files = fs.readdirSync(libDir).filter(f => f.endsWith('Supabase.ts'));

for (const file of files) {
  let content = fs.readFileSync(path.join(libDir, file), 'utf8');

  // We want to replace the try-catch blocks that just log and fall through
  // and remove the localStorage code below them.
  // Actually, rewriting the AST or doing regex might be error prone.
  
  // A simpler way: we just make the `if (supabaseClient)` block return directly or throw, 
  // and we delete the localStorage fallback by removing everything after `catch (err) { console.error(err); throw err; } }` 
  // until the end of the method `},`.

  // Let's just remove everything containing localStorage.
  const lines = content.split('\n');
  let newLines = [];
  let skipMode = false;
  
  for (let i = 0; i < lines.length; i++) {
     if (lines[i].includes('localStorage.getItem') || lines[i].includes('localStorage.setItem') || lines[i].includes('localStorage.removeItem')) {
        // Just comment them out or delete them. We will just comment them for safety.
        newLines.push('    // ' + lines[i]);
     } else {
        // Also if we find `catch (err) { console.warn('... using local state... ')}` we should throw instead.
        if (lines[i].includes('console.warn(') && lines[i].includes('local state')) {
           newLines.push(lines[i]);
           newLines.push('        throw err;');
        } else {
           newLines.push(lines[i]);
        }
     }
  }
  
  fs.writeFileSync(path.join(libDir, file), newLines.join('\n'));
}
console.log('Done');
