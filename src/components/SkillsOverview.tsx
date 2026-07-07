/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { PassportSkill } from '../types/passport';
import { Card } from './UI';
import { Sparkles, TrendingUp } from 'lucide-react';

interface SkillsOverviewProps {
  skills: PassportSkill[];
}

export const SkillsOverview: React.FC<SkillsOverviewProps> = ({ skills }) => {
  const { isBn } = useLanguage();

  if (skills.length === 0) return null;

  // Prepare data for the radar chart (Top 6 skills or all if less)
  const radarData = skills.slice(0, 6).map(skill => ({
    subject: skill.skillName,
    A: skill.score,
    fullMark: 100,
  }));

  // Prepare data for the bar chart
  const barData = [...skills].sort((a, b) => b.score - a.score).slice(0, 8);

  const COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-8">
      {/* 1. Skill Distribution Radar */}
      <Card className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl overflow-hidden relative group">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
        
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h3 className="font-display font-bold text-lg text-white">
            {isBn ? 'দক্ষতা বিন্যাস (এআই অ্যানালাইসিস)' : 'Skill Distribution (AI Analysis)'}
          </h3>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#ffffff10" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Proficiency"
                dataKey="A"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0c0c0c', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff'
                }}
                itemStyle={{ color: '#10b981' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 2. Proficiency Ranking Bar Chart */}
      <Card className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl overflow-hidden relative group">
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-all" />

        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="font-display font-bold text-lg text-white">
            {isBn ? 'টপ পারফর্মিং স্কিল র্যাঙ্কিং' : 'Top Performing Skill Ranking'}
          </h3>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={barData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff05" />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis 
                dataKey="skillName" 
                type="category" 
                width={100}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ 
                  backgroundColor: '#0c0c0c', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
