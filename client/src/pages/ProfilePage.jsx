import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, BookOpen, Target, Zap, Check } from 'lucide-react';
import { useStudent } from '../context/StudentContext';
import {
  getStudent, getAllSkills, getCareers,
  addStudentSkill, removeStudentSkill,
  setTargetCareer, createStudent,
} from '../services/api';
import SkillBadge from '../components/SkillBadge';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { PageSkeleton } from '../components/LoadingSkeleton';

const PROFICIENCY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function ProfilePage() {
  const { currentStudent, students, selectStudent, refreshStudents } = useStudent();

  const [profile, setProfile] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [allCareers, setAllCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add skill form
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('Beginner');
  const [addingSkill, setAddingSkill] = useState(false);
  const [skillMsg, setSkillMsg] = useState(null);

  // Create student form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLevel, setNewLevel] = useState('Bachelor');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!currentStudent) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      getStudent(currentStudent.id),
      getAllSkills(),
      getCareers(),
    ])
      .then(([p, s, c]) => {
        setProfile(p);
        setAllSkills(s);
        setAllCareers(c);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentStudent?.id]);

  const handleAddSkill = async () => {
    if (!selectedSkillId) return;
    setAddingSkill(true);
    setSkillMsg(null);
    try {
      await addStudentSkill(currentStudent.id, selectedSkillId, selectedProficiency);
      const p = await getStudent(currentStudent.id);
      setProfile(p);
      await refreshStudents();
      setSkillMsg({ type: 'success', text: 'Skill added successfully!' });
      setSelectedSkillId('');
    } catch (err) {
      setSkillMsg({ type: 'error', text: err.message });
    } finally {
      setAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await removeStudentSkill(currentStudent.id, skillId);
      const p = await getStudent(currentStudent.id);
      setProfile(p);
      await refreshStudents();
    } catch (err) {
      setSkillMsg({ type: 'error', text: err.message });
    }
  };

  const handleSetCareer = async (careerId) => {
    try {
      await setTargetCareer(currentStudent.id, careerId);
      const p = await getStudent(currentStudent.id);
      setProfile(p);
      setSkillMsg({ type: 'success', text: 'Target career updated!' });
    } catch (err) {
      setSkillMsg({ type: 'error', text: err.message });
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail) return;
    setCreating(true);
    try {
      const student = await createStudent({ name: newName, email: newEmail, educationLevel: newLevel });
      await refreshStudents();
      setShowCreate(false);
      setNewName(''); setNewEmail(''); setNewLevel('Bachelor');
    } catch (err) {
      setSkillMsg({ type: 'error', text: err.message });
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;

  const existingSkillIds = new Set((profile?.skills || []).map((s) => s.id));
  const availableSkills = allSkills.filter((s) => !existingSkillIds.has(s.id));

  const diffColors = {
    'Beginner': 'text-emerald-400',
    'Intermediate': 'text-amber-400',
    'Advanced': 'text-rose-400',
    'Expert': 'text-purple-400',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Student Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your skills, projects and target career.</p>
        </div>
        <button className="btn-secondary text-xs" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="w-3.5 h-3.5" /> New Student
        </button>
      </div>

      {/* Create student form */}
      {showCreate && (
        <div className="glass-card p-5 animate-slide-up">
          <h3 className="font-bold text-white mb-4">Create New Student</h3>
          <form onSubmit={handleCreateStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              className="input-field"
              placeholder="Full name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <input
              className="input-field"
              placeholder="Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            <select className="select-field" value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
              {['High School', 'Associate', 'Bachelor', 'Master', 'PhD'].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <div className="sm:col-span-3 flex gap-2">
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'Creating...' : 'Create Student'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {!currentStudent ? (
        <EmptyState title="No student selected" description="Select or create a student to view their profile." icon={User} />
      ) : (
        <>
          {/* Student info */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-2xl font-black text-white">
                {currentStudent.name[0]}
              </div>
              <div>
                <h2 className="font-bold text-white text-xl">{currentStudent.name}</h2>
                <p className="text-slate-400 text-sm">{currentStudent.email}</p>
                <span className="badge-slate mt-1">{currentStudent.educationLevel}</span>
              </div>
            </div>
          </div>

          {/* Target career */}
          <div className="glass-card p-5">
            <h3 className="section-title flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-accent-400" /> Target Career
            </h3>
            {profile?.targetCareer ? (
              <div className="flex items-center gap-3 p-3 bg-surface-700/50 rounded-xl">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">{profile.targetCareer.title}</p>
                  <p className="text-xs text-slate-400">{profile.targetCareer.description}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm mb-3">No target career selected.</p>
            )}
            <div className="mt-3">
              <select
                className="select-field text-sm"
                onChange={(e) => e.target.value && handleSetCareer(e.target.value)}
                defaultValue=""
              >
                <option value="">Change target career...</option>
                {allCareers.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card p-5">
            <h3 className="section-title flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-brand-400" /> Skills ({profile?.skills?.length || 0})
            </h3>

            {/* Feedback message */}
            {skillMsg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
                skillMsg.type === 'success'
                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30'
                  : 'bg-rose-900/30 text-rose-400 border border-rose-700/30'
              }`}>
                {skillMsg.text}
              </div>
            )}

            {/* Add skill */}
            <div className="flex flex-wrap gap-2 mb-4 p-4 bg-surface-700/30 rounded-xl">
              <select
                className="select-field text-sm flex-1 min-w-40"
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
              >
                <option value="">Select skill to add...</option>
                {availableSkills.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
              <select
                className="select-field text-sm w-36"
                value={selectedProficiency}
                onChange={(e) => setSelectedProficiency(e.target.value)}
              >
                {PROFICIENCY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <button
                className="btn-primary"
                onClick={handleAddSkill}
                disabled={!selectedSkillId || addingSkill}
              >
                <Plus className="w-4 h-4" />
                {addingSkill ? 'Adding...' : 'Add'}
              </button>
            </div>

            {/* Skill list */}
            {(!profile?.skills || profile.skills.length === 0) ? (
              <EmptyState
                title="No skills yet"
                description="Add your first skill to get started with career recommendations."
                icon={Zap}
              />
            ) : (
              <div className="space-y-2">
                {profile.skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-surface-700/40 rounded-xl group hover:bg-surface-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <SkillBadge skill={skill} />
                      <span className={`text-xs font-semibold ${diffColors[skill.proficiency] || 'text-slate-400'}`}>
                        {skill.proficiency || 'Beginner'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(skill.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects */}
          {profile?.projects && profile.projects.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="section-title flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-emerald-400" /> Projects
              </h3>
              <div className="space-y-3">
                {profile.projects.map((proj) => (
                  <div key={proj.id} className="p-4 bg-surface-700/40 rounded-xl">
                    <p className="font-semibold text-white text-sm">{proj.name}</p>
                    {proj.description && <p className="text-xs text-slate-400 mt-1">{proj.description}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(proj.technologies || []).map((t) => (
                        <span key={t.id} className="badge-slate text-xs">{t.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
