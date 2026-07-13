const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const libDir = path.join(__dirname, 'src', 'lib');
const files = fs.readdirSync(libDir).filter(f => f.endsWith('Supabase.ts') && f !== 'supabase.ts');

for (const file of files) {
  const filePath = path.join(libDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Create a new source file to manipulate
  let newContent = '';
  
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  
  let inExport = false;
  let exportName = '';
  let methods = [];
  
  // Just rewrite everything using regex to wipe out bodies.
  // Actually, wait, replacing the initializer is easier if we just stringify the AST node.
  // But let's just use string replacement with a simple bracket matcher.
  
  let finalContent = content;
  
  function getBraceEnd(str, startIndex) {
      let count = 0;
      for (let i = startIndex; i < str.length; i++) {
          if (str[i] === '{') count++;
          if (str[i] === '}') {
              count--;
              if (count === 0) return i;
          }
      }
      return -1;
  }

  // Find all matches of `name: async (args) => {` or `name: (args) => {` or `name: async function(args) {`
  const regex = /([a-zA-Z0-9_]+)\s*:\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*(?::\s*[^={]+)?\s*=>\s*\{/g;
  
  let match;
  let matches = [];
  while ((match = regex.exec(content)) !== null) {
      matches.push({
          start: match.index,
          braceStart: match.index + match[0].length - 1,
          text: match[0]
      });
  }
  
  // Sort reverse to avoid offset issues
  matches.reverse();
  
  for (const m of matches) {
      const end = getBraceEnd(finalContent, m.braceStart);
      if (end !== -1) {
          finalContent = finalContent.slice(0, m.braceStart + 1) + '\n    return null as any;\n  ' + finalContent.slice(end);
      }
  }
  
  fs.writeFileSync(filePath, finalContent);
}
console.log('Done rewriting bodies');
