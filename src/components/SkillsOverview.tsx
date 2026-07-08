import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Card, Badge } from './UI';
import { useLanguage } from '../contexts/LanguageContext';
import { PassportSkill } from '../types/passport';
import { Award, TrendingUp, Zap, Target } from 'lucide-react';

interface SkillsOverviewProps {
  skills: PassportSkill[];
}

export const SkillsOverview: React.FC<SkillsOverviewProps> = ({ skills }) => {
  const { isBn } = useLanguage();

  if (skills.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
        <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 text-sm">
          {isBn ? 'এখনো কোনো স্কিল ভেরিফাই করা হয়নি।' : 'No skills verified yet.'}
        </p>
      </div>
    );
  }

  // ১. বার চার্ট ডাটা (Top 5 skills)
  const barData = skills
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => ({
      name: s.skillName,
      score: s.score,
      level: s.level
    }));

  // ২. রাডার চার্ট ডাটা (Skills distribution)
  const radarData = skills.slice(0, 6).map(s => ({
    subject: s.skillName,
    A: s.score,
    fullMark: 100,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Skill Proficiency Bar Chart */}
      <Card className="p-6 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isBn ? 'স্কিল প্রফিসিয়েন্সি' : 'Skill Proficiency'}
            </h3>
          </div>
          <Badge variant="brand">{isBn ? 'শীর্ষ ৫' : 'Top 5'}</Badge>
        </div>
        
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#33415510" />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
              />
              <Tooltip 
                cursor={{ fill: '#10b98110' }}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: 'none', 
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#fff'
                }}
              />
              <Bar 
                dataKey="score" 
                fill="#10b981" 
                radius={[0, 8, 8, 0]} 
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Skill Distribution Radar Chart */}
      <Card className="p-6 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isBn ? 'দক্ষতার বিন্যাস' : 'Skill Distribution'}
            </h3>
          </div>
          <Award className="w-5 h-5 text-amber-500" />
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#33415520" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Proficiency"
                dataKey="A"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Skills Progress List */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        {skills.slice(0, 3).map((skill, idx) => (
          <div key={idx} className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{skill.skillName}</span>
              <span className="text-[10px] font-bold text-emerald-500">{skill.score}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${skill.score}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[9px] text-slate-400 font-bold uppercase">{skill.level}</span>
              <span className="text-[9px] text-slate-400">
                {new Date(skill.lastAssessmentDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
