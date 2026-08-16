import React, { useState } from 'react';
import { FileText, Download, Eye, Layout, Layers, Minimize2, ClipboardList } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const TEMPLATES = [
  { id: 'modern',       name: 'Modern',       desc: 'Clean, contemporary layout with sidebar',     icon: Layout },
  { id: 'professional', name: 'Professional', desc: 'Traditional format preferred by recruiters',  icon: Layers },
  { id: 'minimal',      name: 'Minimal',      desc: 'Simple single-column, highly readable',       icon: Minimize2 },
  { id: 'ats',          name: 'ATS-Friendly', desc: 'Optimized for applicant tracking systems',    icon: ClipboardList },
];

const SECTIONS = [
  { id: 'summary',        label: 'Professional Summary', enabled: true },
  { id: 'skills',         label: 'Technical Skills',     enabled: true },
  { id: 'experience',     label: 'Work Experience',      enabled: true },
  { id: 'projects',       label: 'Projects',             enabled: true },
  { id: 'education',      label: 'Education',            enabled: true },
  { id: 'certifications', label: 'Certifications',       enabled: false },
  { id: 'achievements',   label: 'Achievements',         enabled: false },
];

export default function ResumeBuilderPage() {
  const [template, setTemplate] = useState('modern');
  const [sections, setSections] = useState(SECTIONS);
  const [generating, setGenerating] = useState(false);

  const toggleSection = (id) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleExport = async () => {
    setGenerating(true);
    // In production: call PDF generation API or use jsPDF
    await new Promise((r) => setTimeout(r, 1500));
    setGenerating(false);
    alert('PDF export coming soon! Your resume data is ready — integrate jsPDF or a server-side PDF API.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Resume Builder</h1>
          <p className="section-subtitle mt-1">Generate a polished resume from your SkillOS profile</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Eye}>Preview</Button>
          <Button variant="primary" icon={Download} onClick={handleExport} disabled={generating}>
            {generating ? 'Generating…' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Options */}
        <div className="space-y-5">
          {/* Template picker */}
          <Card className="p-5">
            <h2 className="section-title mb-4">Template</h2>
            <div className="space-y-2">
              {TEMPLATES.map(({ id, name, desc, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTemplate(id)}
                  className="w-full p-3 rounded-xl text-left transition-all flex items-start gap-3"
                  style={{
                    background: template === id ? 'var(--accent-subtle)' : 'var(--surface-hover)',
                    border: `1px solid ${template === id ? 'var(--accent-muted)' : 'var(--border)'}`,
                  }}
                >
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: template === id ? 'var(--accent)' : 'var(--text-muted)' }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                  {template === id && <Badge variant="blue" className="ml-auto">Selected</Badge>}
                </button>
              ))}
            </div>
          </Card>

          {/* Section toggles */}
          <Card className="p-5">
            <h2 className="section-title mb-4">Sections</h2>
            <div className="space-y-2">
              {sections.map(({ id, label, enabled }) => (
                <label key={id} className="flex items-center gap-3 cursor-pointer py-1.5">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleSection(id)}
                    className="w-4 h-4 rounded accent-[var(--accent)]"
                  />
                  <span className="text-sm font-medium" style={{ color: enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Preview area */}
        <div className="lg:col-span-2">
          <Card className="p-6 min-h-[600px] flex items-center justify-center"
            style={{ background: 'var(--surface-elevated)' }}>
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {TEMPLATES.find((t) => t.id === template)?.name} Template
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Resume preview will render here. Your profile data from SkillOS will be automatically populated.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" icon={Eye}>Live Preview</Button>
                <Button variant="primary" icon={Download} onClick={handleExport} disabled={generating}>
                  {generating ? 'Generating…' : 'Export PDF'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
