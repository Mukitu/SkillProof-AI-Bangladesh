import fs from 'fs';

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// replace AiCareerGrowth for roadmap with AiCareerRoadmap
content = content.replace("import { AiCareerGrowth } from './AiCareerGrowth';", "import { AiCareerGrowth } from './AiCareerGrowth';\nimport { AiCareerRoadmap } from './AiCareerRoadmap';");

const oldRoadmap = `{activeTab === 'roadmap' && (
                <AiCareerGrowth 
                  onNavigateToTab={(tabId) => setActiveTab(tabId)} 
                  initialFocusSection="roadmap"
                />
              )}`;

const newRoadmap = `{activeTab === 'roadmap' && (
                <AiCareerRoadmap 
                  onNavigateToTab={(tabId) => setActiveTab(tabId)} 
                />
              )}`;
              
content = content.replace(oldRoadmap, newRoadmap);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Dashboard updated with AiCareerRoadmap.');
