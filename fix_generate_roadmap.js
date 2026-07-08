import fs from 'fs';
let content = fs.readFileSync('src/components/AiCareerRoadmap.tsx', 'utf-8');

content = content.replace(
  "setActivePhase('7 Days');",
  "setActivePhase('7 Days');\n      setNeedsUpdate(false);\n      setCompareMode(null);"
);

fs.writeFileSync('src/components/AiCareerRoadmap.tsx', content);
