import React, { useEffect, useState } from 'react';
import { Plus, FolderGit2, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { useStudent } from '../context/StudentContext';
import {
  getProjects, getTechnologies, getProjectSkills, createProject, getAllSkills
} from '../services/api';
import SkillBadge from '../components/SkillBadge';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';

export default function ProjectsPage() {
  const { currentStudent } = useStudent();
  const [projects, setProjects] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [analysisMap, setAnalysisMap] = useState({});
  const [analysisLoading, setAnalysisLoading] = useState({});

  // Create project form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDiff, setFormDiff] = useState('Intermediate');
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getProjects(), getTechnologies()])
      .then(([p, t]) => { setProjects(p); setTechnologies(t); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (projId) => {
    if (expandedId === projId) { setExpandedId(null); return; }
    setExpandedId(projId);
    if (!analysisMap[projId]) {
      setAnalysisLoading((prev) => ({ ...prev, [projId]: true }));
      try {
        const analysis = await getProjectSkills(projId);
        setAnalysisMap((prev) => ({ ...prev, [projId]: analysis }));
      } catch (_) {}
      setAnalysisLoading((prev) => ({ ...prev, [projId]: false }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!currentStudent || !formName) return;
    setCreating(true);
    setCreateMsg(null);
    try {
      await createProject({
        personId: currentStudent.id,
        name: formName,
        description: formDesc,
        difficulty: formDiff,
        technologyIds: selectedTechs,
      });
      const p = await getProjects();
      setProjects(p);
      setShowForm(false);
      setFormName(''); setFormDesc(''); setSelectedTechs([]);
      setCreateMsg({ type: 'success', text: 'Project created!' });
    } catch (err) {
      setCreateMsg({ type: 'error', text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const toggleTech = (id) => {
    setSelectedTechs((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;

  const diffColors = { Beginner: 'badge-emerald', Intermediate: 'badge-amber', Advanced: 'badge-rose' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">
            Projects show which skills you've demonstrated. Click any to see skill inference.
          </p>
        </div>
        {currentStudent && (
          <button className="btn-primary text-sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="w-4 h-4" /> Add Project
          </button>
        )}
      </div>

      {createMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          createMsg.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' : 'bg-rose-900/30 text-rose-400 border border-rose-700/30'
        }`}>
          {createMsg.text}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="glass-card p-5 animate-slide-up">
          <h3 className="font-bold text-white mb-4">Add New Project</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="input-field"
                placeholder="Project name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
              <select className="select-field" value={formDiff} onChange={(e) => setFormDiff(e.target.value)}>
                {['Beginner', 'Intermediate', 'Advanced'].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <textarea
              className="input-field resize-none"
              placeholder="Short description (optional)"
              rows={2}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
            <div>
              <p className="text-sm text-slate-400 mb-2">Technologies used:</p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {technologies.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTech(t.id)}
                    className={`badge transition-all ${selectedTechs.includes(t.id) ? 'badge-brand ring-1 ring-brand-500' : 'badge-slate'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'Creating...' : 'Create Project'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Add a project to see which skills it demonstrates via the technology graph."
          icon={FolderGit2}
        />
      ) : (
        <div className="space-y-4">
          {projects.map((proj) => {
            const isExpanded = expandedId === proj.id;
            const analysis = analysisMap[proj.id];
            const isLoadingAnalysis = analysisLoading[proj.id];

            return (
              <div key={proj.id} className="glass-card overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-surface-700/30 transition-colors"
                  onClick={() => toggleExpand(proj.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white">{proj.name}</h3>
                        <span className={`badge text-xs ${diffColors[proj.difficulty] || 'badge-slate'}`}>
                          {proj.difficulty}
                        </span>
                      </div>
                      {proj.description && (
                        <p className="text-sm text-slate-400">{proj.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(proj.technologies || []).map((t) => (
                          <span key={t.id} className="badge-slate text-xs flex items-center gap-1">
                            <Cpu className="w-2.5 h-2.5" /> {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-slate-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Skill analysis */}
                {isExpanded && (
                  <div className="border-t border-surface-600 p-5 bg-surface-700/20 animate-slide-up">
                    <h4 className="text-sm font-semibold text-white mb-3">
                      Skill Analysis — Query H: Project → Technology → Skill
                    </h4>
                    {isLoadingAnalysis ? (
                      <div className="flex gap-2">
                        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-6 w-20 rounded-full" />)}
                      </div>
                    ) : analysis ? (
                      <div className="space-y-3">
                        {analysis.directSkills?.length > 0 && (
                          <div>
                            <p className="text-xs text-emerald-400 font-medium mb-1.5">Direct Skills Demonstrated</p>
                            <div className="flex flex-wrap gap-1.5">
                              {analysis.directSkills.map((s) => <SkillBadge key={s.id} skill={s} />)}
                            </div>
                          </div>
                        )}
                        {analysis.inferredSkills?.filter(s => !analysis.directSkills?.some(d => d.id === s.id)).length > 0 && (
                          <div>
                            <p className="text-xs text-brand-400 font-medium mb-1.5">Inferred from Technologies</p>
                            <div className="flex flex-wrap gap-1.5">
                              {analysis.inferredSkills
                                .filter((s) => !analysis.directSkills?.some((d) => d.id === s.id))
                                .map((s) => <SkillBadge key={s.id} skill={s} />)}
                            </div>
                          </div>
                        )}
                        {(!analysis.directSkills?.length && !analysis.inferredSkills?.length) && (
                          <p className="text-slate-500 text-sm">No skills linked to this project.</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">Analysis unavailable.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
