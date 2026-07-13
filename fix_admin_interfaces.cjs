const fs = require('fs');

let content = fs.readFileSync('src/lib/adminSupabase.ts', 'utf8');

content = content.replace('export interface SystemConfig {', 'export interface SystemConfig { groqSettings?: any;');
content = content.replace('export interface Testimonial {', 'export interface Testimonial { name?: string; role?: string; image_url?: string; comment?: string;');
content = content.replace('export interface Statistic {', 'export interface Statistic { labelEn?: string; color?: string;');

fs.writeFileSync('src/lib/adminSupabase.ts', content);
