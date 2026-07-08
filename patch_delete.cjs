const fs = require('fs');
let code = fs.readFileSync('src/lib/cvSupabase.ts', 'utf8');

code = code.replace(/\.eq\('userId', userId\)/g, ".eq('user_id', userId)");
code = code.replace(/userId,/g, "user_id: userId,"); // for metadataRow in uploadCVFile

fs.writeFileSync('src/lib/cvSupabase.ts', code);
