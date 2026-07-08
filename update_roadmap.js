import fs from 'fs';

// Update types
const typesFile = 'src/types/roadmap.ts';
let typesContent = fs.readFileSync(typesFile, 'utf-8');

typesContent = typesContent.replace(
  "skillsToLearn: string[];",
  "topics: string[];\n    skillsToLearn: string[];\n    technologies: string[];\n    completionPercentage: number;"
);
fs.writeFileSync(typesFile, typesContent);

// Update Groq schema
const groqFile = 'src/lib/roadmapGroq.ts';
let groqContent = fs.readFileSync(groqFile, 'utf-8');

groqContent = groqContent.replace(
  '"skillsToLearn": [string],',
  '"topics": [string],\n      "skillsToLearn": [string],\n      "technologies": [string],\n      "completionPercentage": number (default 0),'
);
fs.writeFileSync(groqFile, groqContent);

console.log("Types and Groq updated.");
