import fs from 'fs';

let content = fs.readFileSync('src/components/AiCareerRoadmap.tsx', 'utf-8');

const rightAreaStart = `<div className="lg:col-span-3">`;

const renderPhase = `
  const renderPhaseDetails = (data: RoadmapPhase | undefined, titlePrefix: string = '') => {
    if (!data) return null;
    return (
             <div className="space-y-6 animate-in fade-in duration-300" key={data.id + titlePrefix}>
                <Card className="bg-slate-900 border-white/5 p-6">
                   <div className="flex items-start justify-between mb-4">
                     <div>
                       <Badge variant="outline" className="border-blue-500/30 text-blue-400 mb-2">{data.difficultyLevel}</Badge>
                       <h2 className="text-xl font-bold text-white mb-2">{titlePrefix} {data.phaseName} Goal</h2>
                       <p className="text-slate-300 text-sm">{data.goal}</p>
                     </div>
                     <div className="text-right text-sm font-mono text-slate-400 shrink-0">
                       <Clock className="w-4 h-4 inline mr-1" /> {data.estimatedTime}
                     </div>
                   </div>
                   
                   <div className="mt-6 pt-6 border-t border-white/5">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2 text-sm"><Target className="w-4 h-4" /> Skills to Master</h3>
                          <div className="flex flex-wrap gap-2">
                             {data.skillsToLearn?.map(skill => (
                                <span key={skill} className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs text-slate-300">{skill}</span>
                             ))}
                          </div>
                        </div>
                        {data.technologies && data.technologies.length > 0 && (
                          <div className="flex-1">
                            <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2 text-sm"><Code2 className="w-4 h-4" /> Technologies</h3>
                            <div className="flex flex-wrap gap-2">
                               {data.technologies.map(tech => (
                                  <span key={tech} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs">{tech}</span>
                               ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {data.topics && data.topics.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-bold text-purple-400 mb-3 flex items-center gap-2 text-sm"><BookOpen className="w-4 h-4" /> Core Topics</h3>
                            <div className="flex flex-wrap gap-2">
                               {data.topics.map(topic => (
                                  <span key={topic} className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs">{topic}</span>
                               ))}
                            </div>
                        </div>
                      )}
                   </div>
                </Card>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   {/* Projects */}
                   <Card className="bg-slate-900 border-white/5 p-6">
                      <h3 className="font-bold text-amber-400 mb-4 flex items-center gap-2 text-sm"><Code2 className="w-4 h-4" /> Portfolio Project</h3>
                      {data.portfolioProject && (
                         <div className="p-4 bg-slate-950 rounded-xl border border-white/5 mb-6">
                            <h4 className="font-bold text-white mb-1 text-sm">{data.portfolioProject.projectName}</h4>
                            <p className="text-xs text-slate-400 mb-3">{data.portfolioProject.description}</p>
                            <div className="text-[10px] text-slate-500 mb-2">Outcome: {data.portfolioProject.expectedOutcome}</div>
                            <div className="flex flex-wrap gap-1">
                               {data.portfolioProject.requiredSkills.map(s => <span key={s} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] rounded font-mono">{s}</span>)}
                            </div>
                         </div>
                      )}
                      
                      <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4" /> Mini Projects</h3>
                      <div className="space-y-3">
                         {data.miniProjects.map((mp, idx) => (
                             <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-white/5">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-bold text-slate-200 text-sm">{mp.projectName}</h4>
                                  <span className="text-[9px] font-mono text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">{mp.difficulty}</span>
                                </div>
                                <p className="text-xs text-slate-400">{mp.description}</p>
                             </div>
                         ))}
                      </div>
                   </Card>
                   
                   {/* Learning & Prep */}
                   <div className="space-y-6">
                       <Card className="bg-slate-900 border-white/5 p-6">
                          <h3 className="font-bold text-emerald-400 mb-4 flex items-center gap-2 text-sm"><FileText className="w-4 h-4" /> Practice Tasks</h3>
                          <ul className="space-y-2 text-sm text-slate-300">
                             {data.practiceTasks.map((t, idx) => (
                                 <li key={idx} className="flex gap-2"><ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" /> <span className="text-xs">{t}</span></li>
                             ))}
                          </ul>
                          
                          <h3 className="font-bold text-purple-400 mb-4 mt-6 flex items-center gap-2 text-sm"><User className="w-4 h-4" /> Interview Prep</h3>
                          <ul className="space-y-2 text-sm text-slate-300">
                             {data.interviewPreparation.map((t, idx) => (
                                 <li key={idx} className="flex gap-2"><ChevronRight className="w-4 h-4 text-purple-500 shrink-0" /> <span className="text-xs">{t}</span></li>
                             ))}
                          </ul>
                       </Card>
                       
                       <Card className="bg-slate-900 border-white/5 p-6">
                          <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2 text-sm"><BookOpen className="w-4 h-4" /> Resources</h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                             {data.freeLearningResources.map((res, idx) => (
                                 <a key={idx} href={res.url || '#'} target="_blank" rel="noreferrer" className="block p-3 rounded-lg bg-slate-950 border border-white/5 hover:border-blue-500/30 transition-colors">
                                     <div className="font-bold text-sm text-blue-400 mb-1">{res.title}</div>
                                     <div className="text-[10px] text-slate-500 mb-1">{res.type}</div>
                                     <p className="text-[11px] text-slate-400">{res.reason}</p>
                                 </a>
                             ))}
                          </div>
                       </Card>
                   </div>
                </div>
             </div>
    );
  };
`;

const rightAreaReplace = `
        <div className="lg:col-span-3">
           {!compareMode ? (
              renderPhaseDetails(phaseData, '')
           ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 <div>
                    <h3 className="font-bold text-white mb-4 bg-emerald-500/10 text-emerald-400 p-2 rounded-lg text-center border border-emerald-500/20">Current: {roadmap?.targetCareer}</h3>
                    {renderPhaseDetails(phaseData, '')}
                 </div>
                 <div>
                    <h3 className="font-bold text-white mb-4 bg-blue-500/10 text-blue-400 p-2 rounded-lg text-center border border-blue-500/20">Compare: {compareMode.targetCareer}</h3>
                    {renderPhaseDetails(compareMode.phases.find(p => p.phaseName === activePhase) || compareMode.phases[0], '')}
                 </div>
              </div>
           )}
        </div>
`;

// we need to insert renderPhase before return ( and replace the rightArea
content = content.replace(
  "return (",
  renderPhase + "\n  return ("
);

// We need to replace everything from <div className="lg:col-span-3"> to the end of the file except the last 3 closing divs
const endMatch = content.match(/<div className="lg:col-span-3">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\);\s*};\s*$/);
if (endMatch) {
  content = content.replace(endMatch[0], rightAreaReplace + "\n      </div>\n    </div>\n  );\n};");
  fs.writeFileSync('src/components/AiCareerRoadmap.tsx', content);
  console.log("Done 4");
} else {
  console.log("Failed to match right area.");
}

