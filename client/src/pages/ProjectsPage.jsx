import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  FolderGit2,
  Plus,
  Sparkles,
  Layers,
  Code,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Shield,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedInference, setExpandedInference] = useState({});

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [selectedTechIds, setSelectedTechIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projList, techList] = await Promise.all([
        api.getProjects(),
        api.getTechnologies().catch(() => []),
      ]);
      setProjects(projList || []);
      setTechnologies(techList || []);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const toggleInference = async (projectId) => {
    if (expandedInference[projectId]) {
      setExpandedInference((prev) => ({ ...prev, [projectId]: null }));
      return;
    }

    try {
      const data = await api.getProjectSkills(projectId);
      setExpandedInference((prev) => ({ ...prev, [projectId]: data }));
    } catch (err) {
      alert('Failed to fetch skill inference for this project');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setActionLoading(true);
    try {
      await api.createProject({
        name: name.trim(),
        description: description.trim(),
        difficulty,
        technologies: selectedTechIds,
      });
      setIsAdding(false);
      setName('');
      setDescription('');
      setSelectedTechIds([]);
      await loadProjects();
    } catch (err) {
      alert(err.message || 'Failed to create project');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your portfolio projects and tech graph..." />;
  if (error) return <ErrorState message={error} onRetry={loadProjects} />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <FolderGit2 className="w-7 h-7 text-indigo-400" /> My Projects & Evidence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-world projects that prove your engineering mastery through demonstrated and inferred skills.
          </p>
        </div>

        <Button icon={Plus} onClick={() => setIsAdding(true)}>
          Add Project
        </Button>
      </div>

      {/* ─── Insight Banner: How Projects Strengthen Your Profile ────────── */}
      <Card className="p-6 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30 space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          How Your Projects Strengthen Your Career Profile
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
          SkillOS traverses technology co-occurrence patterns in CognoDB to infer underlying architectural skills. Building with modern stacks (e.g. PyTorch, React, Docker) unlocks higher verified match scores across industry job openings.
        </p>
      </Card>

      {/* ─── Add Project Modal ───────────────────────────────────────────── */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="p-6 max-w-lg w-full shadow-2xl space-y-4 bg-slate-900 border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-indigo-400" /> Add Portfolio Project
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AI-Powered Skin Lesion Classifier"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the problem, architecture, and outcomes..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Beginner">Beginner (Foundational)</option>
                  <option value="Intermediate">Intermediate (Full Stack)</option>
                  <option value="Advanced">Advanced (Production-Ready)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Technologies Used
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {technologies.map((t) => {
                    const isSelected = selectedTechIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setSelectedTechIds((prev) =>
                            isSelected ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                          )
                        }
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={actionLoading}>
                  Create Project
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── Projects List ───────────────────────────────────────────────── */}
      {projects.length === 0 ? (
        <Card className="text-center py-16 px-4">
          <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No projects yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add your first project to show employers and AI matchers what you can build.
          </p>
          <Button icon={Plus} onClick={() => setIsAdding(true)} className="mt-4">
            Add Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {projects.map((proj) => {
            const inferenceData = expandedInference[proj.id];
            const techList = proj.technologies || [];
            const directSkills = proj.demonstrates || [];

            return (
              <Card key={proj.id} className="p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="brand" size="sm">
                        {proj.difficulty || 'Intermediate'} Project
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1.5">{proj.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    icon={Sparkles}
                    onClick={() => toggleInference(proj.id)}
                    className="self-start shrink-0"
                  >
                    {inferenceData ? 'Hide Inference' : 'Inspect Skill Inference'}
                  </Button>
                </div>

                {/* Technologies Stack */}
                {techList.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-400">Tech Stack:</span>
                    {techList.map((t) => (
                      <span
                        key={t.id || t}
                        className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-medium"
                      >
                        {t.name || t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Direct Skills Demonstrated */}
                {directSkills.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Directly Demonstrated:
                    </span>
                    {directSkills.map((s) => (
                      <span
                        key={s.id || s}
                        className="px-2.5 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 font-semibold"
                      >
                        {s.name || s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Inferred Skills Expanded View (Query H) */}
                {inferenceData && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        Inferred Skills (CognoDB Query H)
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Derived from shared technology graph
                      </span>
                    </div>

                    {inferenceData.inferredSkills?.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {inferenceData.inferredSkills.slice(0, 8).map((is) => (
                            <span
                              key={is.id}
                              className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs font-medium"
                            >
                              ⚡ {is.name}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 italic">
                          "Your use of {techList.map((t) => t.name || t).slice(0, 3).join(', ')} automatically indicates competency in these related concepts."
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No additional inferred skills found for this stack.</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
