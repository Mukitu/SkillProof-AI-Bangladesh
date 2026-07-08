import fs from 'fs';
const content = fs.readFileSync('src/components/AiCareerGrowth.tsx', 'utf-8');
console.log(content.match(/const loadData = async[\s\S]*?generateNewProgress\(\);[\s\S]*?\}\n  \};\n/)[0]);
