import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitCompare, Plus, X, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import * as api from '../services/api';

export default function CareerComparisonPage() {
  const navigate = useNavigate();
  const [careers, setCareers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCareers(), api.getMySkills().catch(() => [])])
      .then(([careersData, skillsData]) => {
        setCareers(Array.isArray(careersData) ? careersData : []);
        setMySkills(Array.isArray(skillsData) ? skillsData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const addCareer = (career) => {
    if (selected.length >= 3 || selected.find((s) => s.id === career.id)) return;
    setSelected((prev) => [...prev, career]);
  };

  const removeCareer = (id) => setSelected((prev) => prev.filter((s) => s.id !== id));

  const getMatchPct = (career) => {
    const required = career.skills || [];
    if (!required.length) return 0;
    const matched = required.filter((s) => mySkills.some((ms) => ms.id === s.id || ms.name === s.name));
    return Math.round((matched.length / required.length) * 100);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Compare Careers</h1>
          <p className="section-subtitle mt-1">Compare up to 3 career paths side by side</p>
        </div>
        <Badge variant="blue">{selected.length}/3 selected</Badge>
      </div>

      {/* Career picker */}
      {selected.length < 3 && (
        <Card className="p-5">
          <h2 className="section-title mb-4">Add a career to compare</h2>
          {loading ? (
            <div className="skeleton h-10 w-full" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {careers.filter((c) => !selected.find((s) => s.id === c.id)).slice(0, 12).map((career) => (
                <button key={career.id} onClick={() => addCareer(career)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {career.title}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Comparison table */}
      {selected.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', width: '30%' }}>
                  Criteria
                </th>
                {selected.map((career) => (
                  <th key={career.id} className="py-3 px-4 text-center" style={{ width: `${70 / selected.length}%` }}>
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{career.title}</span>
                      <button onClick={() => removeCareer(career.id)} className="p-1 rounded"
                        style={{ color: 'var(--text-muted)' }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {[
                { label: 'Your Match', fn: (c) => `${getMatchPct(c)}%` },
                { label: 'Required Skills', fn: (c) => c.skills?.length ?? 'N/A' },
                { label: 'Skills You Have', fn: (c) => {
                  const req = c.skills || [];
                  return req.filter((s) => mySkills.some((ms) => ms.name === s.name)).length;
                }},
                { label: 'Skill Gaps', fn: (c) => {
                  const req = c.skills || [];
                  const matched = req.filter((s) => mySkills.some((ms) => ms.name === s.name)).length;
                  return req.length - matched;
                }},
              ].map(({ label, fn }) => (
                <tr key={label} style={{ borderColor: 'var(--border)' }}>
                  <td className="py-4 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</td>
                  {selected.map((c) => (
                    <td key={c.id} className="py-4 px-4 text-center font-bold" style={{ color: 'var(--text-primary)' }}>
                      {fn(c)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr style={{ borderColor: 'var(--border)' }}>
                <td className="py-4 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Actions</td>
                {selected.map((c) => (
                  <td key={c.id} className="py-4 px-4 text-center">
                    <button
                      onClick={() => navigate(`/career/${c.id}`)}
                      className="text-xs font-medium hover:underline flex items-center gap-1 mx-auto"
                      style={{ color: 'var(--accent)' }}
                    >
                      View Details <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Select careers to compare</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add up to 3 careers using the picker above</p>
        </Card>
      )}
    </div>
  );
}
