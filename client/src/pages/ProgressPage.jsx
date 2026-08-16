import React, { useState, useEffect } from 'react';
import { TrendingUp, Brain, Map, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../components/ui/Card';
import * as api from '../services/api';

// Mock progress data — real data would come from /api/me/progress
const MOCK_PROGRESS = [
  { month: 'Mar', match: 42, readiness: 38, skills: 6 },
  { month: 'Apr', match: 51, readiness: 47, skills: 8 },
  { month: 'May', match: 58, readiness: 54, skills: 10 },
  { month: 'Jun', match: 64, readiness: 60, skills: 11 },
  { month: 'Jul', match: 69, readiness: 65, skills: 11 },
  { month: 'Aug', match: 72, readiness: 68, skills: 12 },
];

export default function ProgressPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyProfile().then(setProfile).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const latestMatch = MOCK_PROGRESS[MOCK_PROGRESS.length - 1];
  const firstMatch = MOCK_PROGRESS[0];
  const matchGain = latestMatch.match - firstMatch.match;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="card px-3 py-2 text-xs" style={{ boxShadow: 'var(--shadow-md)' }}>
        <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.value}{p.dataKey !== 'skills' ? '%' : ''}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Your Progress</h1>
        <p className="section-subtitle mt-1">Track your career readiness over time</p>
      </div>

      {/* Highlight stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Career Match', value: `${latestMatch.match}%`, delta: `+${matchGain}%`, icon: Target, color: 'var(--success)' },
          { label: 'Job Readiness', value: `${latestMatch.readiness}%`, delta: '+30%', icon: TrendingUp, color: 'var(--accent)' },
          { label: 'Verified Skills', value: latestMatch.skills, delta: `+${latestMatch.skills - firstMatch.skills}`, icon: Brain, color: '#8b5cf6' },
          { label: 'Period', value: '6 months', delta: 'tracked', icon: Map, color: 'var(--warning)' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div className="text-3xl font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs mt-1 font-medium" style={{ color: 'var(--success)' }}>{stat.delta} since start</div>
            </Card>
          );
        })}
      </div>

      {/* Career Readiness Chart */}
      <Card className="p-6">
        <h2 className="section-title mb-1">Career Readiness Over Time</h2>
        <p className="section-subtitle mb-6">Your match and readiness scores over the past 6 months</p>

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={MOCK_PROGRESS} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="match" name="Career Match" stroke="var(--success)" strokeWidth={2.5}
              dot={{ fill: 'var(--success)', r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="readiness" name="Job Readiness" stroke="var(--accent)" strokeWidth={2.5}
              dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Skills Progress */}
      <Card className="p-6">
        <h2 className="section-title mb-4">Skill Growth</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {MOCK_PROGRESS.map((d) => (
            <div key={d.month} className="p-4 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
              <div className="text-2xl font-extrabold" style={{ color: 'var(--accent)' }}>{d.skills}</div>
              <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{d.month}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
