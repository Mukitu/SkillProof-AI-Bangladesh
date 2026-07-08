import fs from 'fs';

let content = fs.readFileSync('src/components/AiCareerRoadmap.tsx', 'utf-8');

content = content.replace(
  "const [showHistory, setShowHistory] = useState(false);",
  "const [showHistory, setShowHistory] = useState(false);\n  const [needsUpdate, setNeedsUpdate] = useState(false);\n  const [compareMode, setCompareMode] = useState<CareerRoadmapData | null>(null);"
);

content = content.replace(
  "needsUpdate = true;\n         }",
  "needsUpdate = true;\n         }\n         setNeedsUpdate(needsUpdate);"
);

const headerBlock = `
      {/* Update Prompt */}
      <AnimatePresence>
        {needsUpdate && !generating && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
             <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                   <h4 className="font-bold text-blue-400 text-sm">New Data Available</h4>
                   <p className="text-slate-300 text-xs">Your Resume, Skill Passport, or Interview results have been updated. Regenerate your roadmap to reflect these changes.</p>
                </div>
             </div>
             <Button onClick={() => generateNewRoadmap(roadmap?.targetCareer)} variant="primary" size="sm" className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white">
                <RefreshCw className="w-4 h-4 mr-2" /> Regenerate Now
             </Button>
          </motion.div>
        )}
      </AnimatePresence>
`;

content = content.replace(
  /{showHistory && \(/,
  headerBlock + "\n      {showHistory && ("
);

// Add compare mode button in history
content = content.replace(
  /<Button onClick=\{\(\) => setRoadmap\(h\)\} variant="outline" size="sm" className="text-xs py-1">View<\/Button>/,
  "<Button onClick={() => setRoadmap(h)} variant=\"outline\" size=\"sm\" className=\"text-xs py-1\">View</Button>\n                             <Button onClick={() => setCompareMode(compareMode?.id === h.id ? null : h)} variant=\"outline\" size=\"sm\" className=\"text-xs py-1 border-blue-500/30 text-blue-400\">Compare</Button>"
);

fs.writeFileSync('src/components/AiCareerRoadmap.tsx', content);
console.log('Done 3');
