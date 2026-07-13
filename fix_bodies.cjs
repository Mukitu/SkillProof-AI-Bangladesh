const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const libDir = path.join(__dirname, 'src', 'lib');
const files = fs.readdirSync(libDir).filter(f => f.endsWith('Supabase.ts') && f !== 'supabase.ts');

for (const file of files) {
  const filePath = path.join(libDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  
  let newContent = content;
  let offset = 0;
  
  function visit(node) {
    if (ts.isPropertyAssignment(node) && node.name && ts.isIdentifier(node.name) && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
       const body = node.initializer.body;
       if (ts.isBlock(body)) {
          let hasSupabaseIf = false;
          let endOfIf = -1;
          
          for (const stmt of body.statements) {
             if (ts.isIfStatement(stmt)) {
                 // assume it's the if (supabaseClient) or if (true) block
                 endOfIf = stmt.getEnd();
                 hasSupabaseIf = true;
                 break;
             }
          }
          
          if (hasSupabaseIf && endOfIf !== -1) {
             const startRemove = endOfIf;
             const endRemove = body.getEnd() - 1; // before the closing }
             
             if (startRemove < endRemove) {
                 const replacement = "\n    return null as any;\n  ";
                 newContent = newContent.slice(0, startRemove + offset) + replacement + newContent.slice(endRemove + offset);
                 offset += replacement.length - (endRemove - startRemove);
             }
          }
       }
    }
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  fs.writeFileSync(filePath, newContent);
}
console.log('Fixed bodies');
