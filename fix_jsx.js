import fs from 'fs';
let content = fs.readFileSync('src/components/AiCareerRoadmap.tsx', 'utf-8');

content = content.replace(
  "{roadmap?.id !== h.id && (\n                                 <Button onClick={() => setRoadmap(h)} variant=\"outline\" size=\"sm\" className=\"text-xs py-1\">View</Button>\n                             <Button onClick={() => setCompareMode(compareMode?.id === h.id ? null : h)} variant=\"outline\" size=\"sm\" className=\"text-xs py-1 border-blue-500/30 text-blue-400\">Compare</Button>\n                             )}",
  "{roadmap?.id !== h.id && (\n                                 <>\n                                 <Button onClick={() => setRoadmap(h)} variant=\"outline\" size=\"sm\" className=\"text-xs py-1\">View</Button>\n                             <Button onClick={() => setCompareMode(compareMode?.id === h.id ? null : h)} variant=\"outline\" size=\"sm\" className=\"text-xs py-1 border-blue-500/30 text-blue-400\">Compare</Button>\n                                 </>\n                             )}"
);

fs.writeFileSync('src/components/AiCareerRoadmap.tsx', content);
