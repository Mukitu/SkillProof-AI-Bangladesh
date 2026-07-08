const fs = require('fs');
let code = fs.readFileSync('src/lib/cvSupabase.ts', 'utf8');

code = code.replace(/user_id: updatedCv\.user_id: userId,/g, "user_id: updatedCv.userId,");

fs.writeFileSync('src/lib/cvSupabase.ts', code);
