const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const libDir = path.join(__dirname, 'src', 'lib');
const files = fs.readdirSync(libDir).filter(f => f.endsWith('Supabase.ts') && f !== 'supabase.ts');

for (const file of files) {
  const filePath = path.join(libDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  
  let imports = [];
  let otherStatements = [];
  
  for (const stmt of sourceFile.statements) {
      if (ts.isImportDeclaration(stmt)) {
          imports.push(stmt.getText(sourceFile));
      } else if (ts.isVariableStatement(stmt) && stmt.modifiers && stmt.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
          // This is the exported DB object
      } else {
          // keep interfaces, types, etc
          otherStatements.push(stmt.getText(sourceFile));
      }
  }
  
  let result = imports.join('\n') + '\n\n' + otherStatements.join('\n') + '\n\n';
  
  function getSignatures(node) {
      if (ts.isVariableDeclaration(node) && node.name.text && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
          if (node.name.text.endsWith('Db') || node.name.text.endsWith('Supabase')) {
              result += `export const ${node.name.text} = {\n`;
              for (const prop of node.initializer.properties) {
                  if (ts.isPropertyAssignment(prop)) {
                      let sig = prop.name.getText(sourceFile);
                      // We just need the signature
                      if (ts.isArrowFunction(prop.initializer) || ts.isFunctionExpression(prop.initializer)) {
                          let typeSig = "";
                          if (prop.initializer.type) {
                              typeSig = ": " + prop.initializer.type.getText(sourceFile);
                          }
                          
                          let isAsync = "";
                          if (prop.initializer.modifiers && prop.initializer.modifiers.some(m => m.kind === ts.SyntaxKind.AsyncKeyword)) {
                              isAsync = "async ";
                          }
                          
                          let params = prop.initializer.parameters.map(p => p.getText(sourceFile)).join(", ");
                          
                          result += `  ${sig}: ${isAsync}(${params})${typeSig} => { return null as any; },\n`;
                      }
                  }
              }
              result += `};\n`;
          }
      }
      ts.forEachChild(node, getSignatures);
  }
  
  getSignatures(sourceFile);
  fs.writeFileSync(filePath, result);
}
console.log('Done foolproof rewrite');
