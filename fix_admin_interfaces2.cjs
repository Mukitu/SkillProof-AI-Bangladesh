const fs = require('fs');
let content = fs.readFileSync('src/lib/adminSupabase.ts', 'utf8');

content = content.replace('userName: string;', 'userName?: string;');
content = content.replace('userRole: string;', 'userRole?: string;');
content = content.replace('content: string;', 'content?: string;');
content = content.replace('active: boolean;', 'active?: boolean;');
content = content.replace('createdAt: string;', 'createdAt?: string;');

content = content.replace('icon: string;', 'icon?: string;');
content = content.replace('order: number;', 'order?: number;');
content = content.replace('active: boolean;', 'active?: boolean;'); // wait, already replaced maybe?

fs.writeFileSync('src/lib/adminSupabase.ts', content);
