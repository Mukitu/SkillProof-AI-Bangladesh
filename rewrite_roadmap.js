import fs from 'fs';

let content = fs.readFileSync('src/components/AiCareerRoadmap.tsx', 'utf-8');

// Replace the Skills to Master block to also include Topics and Technologies, and completion percentage.
const replacePhaseDetails = `
                   <div className="mt-6 pt-6 border-t border-white/5">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Skills to Master</h3>
                          <div className="flex flex-wrap gap-2">
                             {phaseData.skillsToLearn?.map(skill => (
                                <span key={skill} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-sm text-slate-300">{skill}</span>
                             ))}
                          </div>
                        </div>
                        {phaseData.technologies && phaseData.technologies.length > 0 && (
                          <div className="flex-1">
                            <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2"><Code2 className="w-4 h-4" /> Technologies</h3>
                            <div className="flex flex-wrap gap-2">
                               {phaseData.technologies.map(tech => (
                                  <span key={tech} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-sm">{tech}</span>
                               ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {phaseData.topics && phaseData.topics.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-bold text-purple-400 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Core Topics</h3>
                            <div className="flex flex-wrap gap-2">
                               {phaseData.topics.map(topic => (
                                  <span key={topic} className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-sm">{topic}</span>
                               ))}
                            </div>
                        </div>
                      )}
                   </div>
`;

content = content.replace(
  /<div className="mt-6 pt-6 border-t border-white\/5">[\s\S]*?<\/div>\s*<\/div>\s*<\/Card>/,
  replacePhaseDetails + "\n                </Card>"
);

fs.writeFileSync('src/components/AiCareerRoadmap.tsx', content);
console.log('Done 1');
