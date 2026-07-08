import fs from 'fs';

let content = fs.readFileSync('src/components/AiCareerRoadmap.tsx', 'utf-8');

const goalsBlock = `
               <div>
                 <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 mt-4">Weekly Goal</h4>
                 <div className="space-y-2">
                   {roadmap?.dailyTasks.weeklyGoal?.map(task => (
                     <div key={task.id} className="flex items-start gap-2">
                       <button onClick={() => handleTaskToggle('weeklyGoal', task.id)} className={\`mt-0.5 shrink-0 w-4 h-4 rounded border \${task.completed ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-600'}\`}>
                         {task.completed && <CheckCircle2 className="w-3 h-3 mx-auto" />}
                       </button>
                       <span className={\`text-xs \${task.completed ? 'text-slate-500 line-through' : 'text-slate-300'}\`}>{task.text}</span>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div>
                 <h4 className="text-xs font-bold text-purple-400 uppercase mb-2 mt-4">Monthly Goal</h4>
                 <div className="space-y-2">
                   {roadmap?.dailyTasks.monthlyGoal?.map(task => (
                     <div key={task.id} className="flex items-start gap-2">
                       <button onClick={() => handleTaskToggle('monthlyGoal', task.id)} className={\`mt-0.5 shrink-0 w-4 h-4 rounded border \${task.completed ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-600'}\`}>
                         {task.completed && <CheckCircle2 className="w-3 h-3 mx-auto" />}
                       </button>
                       <span className={\`text-xs \${task.completed ? 'text-slate-500 line-through' : 'text-slate-300'}\`}>{task.text}</span>
                     </div>
                   ))}
                 </div>
               </div>
`;

content = content.replace(
  /<\/div>\s*<\/div>\s*<\/Card>/,
  "</div>\n" + goalsBlock + "             </div>\n          </Card>"
);

fs.writeFileSync('src/components/AiCareerRoadmap.tsx', content);
console.log('Done 2');
