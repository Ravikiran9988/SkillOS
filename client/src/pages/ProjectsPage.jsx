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
  ExternalLink,
  Github,
  X,
  Search,
  Tag,
  Info,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const POPULAR_TECHS = [
  'Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js',
  'Express', 'FastAPI', 'Django', 'Flask', 'Go', 'Rust', 'PostgreSQL', 'MongoDB',
  'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'TensorFlow', 'PyTorch',
  'Scikit-learn', 'LangChain', 'LangGraph', 'Playwright', 'Arduino Mega', 'ESP32-CAM',
  'Vite', 'React Native', 'TailwindCSS', 'GraphQL', 'Kafka', 'Pandas', 'NumPy',
];

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
  const [problemStatement, setProblemStatement] = useState('');
  const [solution, setSolution] = useState('');
  const [role, setRole] = useState('Lead Full Stack Developer');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [customTechInput, setCustomTechInput] = useState('');
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

  const handleAddCustomTech = (e) => {
    e?.preventDefault();
    const trimmed = customTechInput.trim();
    if (!trimmed) return;
    if (!selectedTechs.includes(trimmed)) {
      setSelectedTechs((prev) => [...prev, trimmed]);
    }
    setCustomTechInput('');
  };

  const handleToggleTech = (techName) => {
    if (selectedTechs.includes(techName)) {
      setSelectedTechs((prev) => prev.filter((t) => t !== techName));
    } else {
      setSelectedTechs((prev) => [...prev, techName]);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setActionLoading(true);
    try {
      await api.createProject({
        name: name.trim(),
        description: description.trim() || problemStatement.trim() || 'Software project portfolio demonstration.',
        difficulty,
        githubUrl: githubUrl.trim(),
        demoUrl: demoUrl.trim(),
        role: role.trim(),
        technologies: selectedTechs,
      });
      setIsAdding(false);
      setName('');
      setDescription('');
      setProblemStatement('');
      setSolution('');
      setGithubUrl('');
      setDemoUrl('');
      setSelectedTechs([]);
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
            Real-world projects proving engineering competence through verified stacks and AI graph inference.
          </p>
        </div>

        <Button icon={Plus} onClick={() => setIsAdding(true)}>
          Add Project
        </Button>
      </div>

      {/* ─── Insight Banner ──────────────────────────────────────────────── */}
      <Card className="p-6 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30 space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          How Projects Strengthen Your Profile
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
          SkillOS traverses technology co-occurrence patterns in CognoDB to infer underlying architectural competencies. Adding verified stacks (e.g. PyTorch, React, Playwright, Arduino) unlocks higher verified match scores across industry job requisitions.
        </p>
      </Card>

      {/* ─── Add Project Modal with Arbitrary Tech System ─────────────────── */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 bg-slate-900 border-slate-800 my-8 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-indigo-400" /> Add Portfolio Project
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Support for any arbitrary technology stack, hardware, or framework.
                </p>
              </div>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Project Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Autonomous Robotic Navigation or AI Skin Disease Classifier"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Your Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Lead AI Engineer / Full-Stack Developer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Beginner">Beginner (Foundational)</option>
                    <option value="Intermediate">Intermediate (Production-Grade)</option>
                    <option value="Advanced">Advanced (High-Scale / Research)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Project Description / Summary</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the architectural problem, core technical approach, and outcomes..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">GitHub Repository URL</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Live Demo / Deployment URL</label>
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://my-app.vercel.app"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* ─── Arbitrary Technology Input & Tag Cloud ─────────────── */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300">
                  Technologies Used (Type any custom framework, hardware, or tool)
                </label>

                {/* Custom input bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTechInput}
                    onChange={(e) => setCustomTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTech();
                      }
                    }}
                    placeholder="Type custom tech (e.g. Arduino Mega, Playwright, LangGraph)..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={handleAddCustomTech}>
                    Add Tag
                  </Button>
                </div>

                {/* Selected Tags */}
                {selectedTechs.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-slate-950/80 border border-indigo-500/30">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Selected:</span>
                    {selectedTechs.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-sm"
                      >
                        <span>{tech}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTech(tech)}
                          className="hover:text-rose-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested popular technologies */}
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">Or select from popular technologies:</div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {POPULAR_TECHS.map((t) => {
                      const isSel = selectedTechs.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleToggleTech(t)}
                          className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-medium transition ${
                            isSel
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
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
            Add your first project to prove your hands-on competencies to recruiters and AI matchers.
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
                      {proj.role && (
                        <span className="text-xs text-slate-400">· Role: {proj.role}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1.5">{proj.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start">
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition"
                        title="GitHub Repo"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {proj.demoUrl && (
                      <a
                        href={proj.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition"
                        title="Live Demo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Sparkles}
                      onClick={() => toggleInference(proj.id)}
                    >
                      {inferenceData ? 'Hide Analysis' : 'Inspect Skill Inference'}
                    </Button>
                  </div>
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
                        AI Inferred Skills (CognoDB Query H)
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
                          "Your usage of {techList.map((t) => t.name || t).slice(0, 3).join(', ')} automatically indicates architectural competency in these related concepts."
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
