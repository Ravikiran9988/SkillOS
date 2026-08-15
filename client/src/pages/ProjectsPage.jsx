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
  HelpCircle,
  ArrowRight,
  Bot,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

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

  if (loading) return <LoadingSpinner message="Loading your projects and tech stacks..." />;
  if (error) return <ErrorState message={error} onRetry={loadProjects} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <FolderGit2 className="w-7 h-7 text-indigo-400" /> My Projects & Skill Inference
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            SkillOS automatically infers unlisted competency mastery (Query H) through shared project tech stacks.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {/* ─── Add Project Modal ───────────────────────────────────────────── */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name</label>
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
                  placeholder="Describe the architectural implementation and domain problem..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Beginner">Beginner (Classroom)</option>
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
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30"
                >
                  {actionLoading ? 'Saving...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Projects Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5">
        {projects.map((proj) => {
          const inferenceData = expandedInference[proj.id];
          const techList = proj.technologies || [];
          const directSkills = proj.demonstrates || [];

          return (
            <div
              key={proj.id}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/30 transition shadow-xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {proj.difficulty || 'Intermediate'} Project
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1.5">{proj.name}</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">{proj.description}</p>
                </div>

                <button
                  onClick={() => toggleInference(proj.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition flex items-center gap-1.5 self-start shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{inferenceData ? 'Hide Inference' : 'Inspect Skill Inference'}</span>
                </button>
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
                <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Inferred Skills (CognoDB Query H)
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Based on shared tech graph with other industry projects
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
                        "Your use of {techList.map((t) => t.name || t).slice(0, 3).join(', ')} graph-demonstrates mastery of these related engineering competencies."
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No additional inferred skills found for this stack.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
