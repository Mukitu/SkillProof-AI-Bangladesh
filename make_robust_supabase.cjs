const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, 'src', 'lib');
const files = fs.readdirSync(libDir).filter(f => f.endsWith('Supabase.ts') && f !== 'supabase.ts');

for (const file of files) {
  let content = fs.readFileSync(path.join(libDir, file), 'utf8');

  // We want to delete localStorage variables.
  // Actually, wait, let's just use regex to remove everything from `// স্যান্ডবক্স ফলব্যাক` or similar up to the next `},`
  // and remove `if (supabaseClient) {` and its closing brace if we can...
  // That's too complex. Let's just find and comment out `const list: ` and `return list` and `localStorage...`
  const lines = content.split('\n');
  const cleanLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('localStorage.getItem') || line.includes('localStorage.setItem') || line.includes('localStorage.removeItem') || line.includes('URL.createObjectURL')) {
       cleanLines.push('    // ' + line.trim());
       continue;
    }
    
    // Check if we are outside supabaseClient try/catch block and there is a `return list` or similar
    if (line.trim().startsWith('const list: ') || line.trim().startsWith('const list ') || line.trim().startsWith('return list') || line.trim().startsWith('const metaList') || line.trim().startsWith('const idx') || line.trim().startsWith('metaList.push') || line.trim().startsWith('list.push') || line.trim().startsWith('list[idx]') || line.trim().startsWith('const stored')) {
       if (line.includes('? JSON.parse') || line.includes('return list') || line.includes('push') || line.includes('idx =') || line.includes('const idx') || line.includes('const list =')) {
          cleanLines.push('    // ' + line.trim());
          continue;
       }
    }
    
    if (line.includes('return list.find') || line.includes('return list.filter') || line.includes('return metaList') || line.includes('return filtered')) {
        cleanLines.push('    // ' + line.trim());
        continue;
    }

    if (line.trim().startsWith('return {') && i + 1 < lines.length && lines[i+1].includes('success: true') && lines[i+2] && lines[i+2].includes('url: mockUrl')) {
        // Mock url block
        cleanLines.push('    // mock return');
        i += 6; // skip the return object
        continue;
    }
    
    cleanLines.push(line);
  }
  
  fs.writeFileSync(path.join(libDir, file), cleanLines.join('\n'));
}
console.log('Cleaned up variables');
