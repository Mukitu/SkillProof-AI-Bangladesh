const fs = require('fs');
let content = fs.readFileSync('src/lib/adminSupabase.ts', 'utf8');

content = content.replace(/content: string;/g, 'content?: string;');
content = content.replace(/createdAt: string;/g, 'createdAt?: string;');
content = content.replace(/active: boolean;/g, 'active?: boolean;');

fs.writeFileSync('src/lib/adminSupabase.ts', content);
