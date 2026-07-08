import fs from 'fs';
let content = fs.readFileSync('src/components/AiCareerRoadmap.tsx', 'utf-8');

content = content.replace(
  "export const AiCareerRoadmap: React.FC<AiCareerRoadmapProps> = ({ onNavigateToTab }) => {",
  "export const AiCareerRoadmap: React.FC<AiCareerRoadmapProps> = ({ onNavigateToTab }) => {\n  // ক্যারিয়ার রোডম্যাপ হাব মূল কম্পোনেন্ট (Career Roadmap Main Component)"
);

content = content.replace(
  "const loadData = async () => {",
  "// ডাটাবেজ থেকে রোডম্যাপ লোড করা এবং নতুন আপডেট আছে কিনা তা চেক করা\n  const loadData = async () => {"
);

content = content.replace(
  "const generateNewRoadmap = async (customTarget: string = '') => {",
  "// ইউজারের ডেটাবেস ও গ্রক এআই ব্যবহার করে নতুন রোডম্যাপ জেনারেট করা\n  const generateNewRoadmap = async (customTarget: string = '') => {"
);

content = content.replace(
  "const handleTaskToggle = async",
  "// টাস্ক সম্পন্ন মার্ক করা এবং ডাটাবেজে সংরক্ষণ করা\n  const handleTaskToggle = async"
);

fs.writeFileSync('src/components/AiCareerRoadmap.tsx', content);
console.log('Added Bangla comments.');
