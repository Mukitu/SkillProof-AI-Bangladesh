const fs = require('fs');
let code = fs.readFileSync('src/components/AiSmartCv.tsx', 'utf8');

// Replace CV IDs
code = code.replace(/const newId = 'cv_' \+ Math\.random\(\)\.toString\(36\)\.substr\(2, 9\);/g, "const newId = crypto.randomUUID();");
code = code.replace(/const generatedId = 'cv_' \+ Math\.random\(\)\.toString\(36\)\.substr\(2, 9\);/g, "const generatedId = crypto.randomUUID();");

// Replace history IDs
code = code.replace(/id: 'hist_' \+ Math\.random\(\)\.toString\(36\)\.substr\(2, 9\),/g, "id: crypto.randomUUID(),");

fs.writeFileSync('src/components/AiSmartCv.tsx', code);
