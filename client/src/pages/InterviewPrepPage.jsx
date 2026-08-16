import React, { useState, useEffect } from 'react';
import { Swords, Mic, BookOpen, ChevronRight, RefreshCw, Bot, Star, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import * as api from '../services/api';

const CATEGORIES = [
  { id: 'technical',   label: 'Technical',         icon: BookOpen, color: 'var(--accent)' },
  { id: 'behavioral',  label: 'Behavioral',         icon: Swords,   color: '#8b5cf6' },
  { id: 'system',      label: 'System Design',      icon: RefreshCw, color: 'var(--warning)' },
];

const SAMPLE_QUESTIONS = {
  technical: [
    { q: 'Explain the difference between supervised and unsupervised learning.', difficulty: 'Medium' },
    { q: 'What is gradient descent and how does it work?', difficulty: 'Medium' },
    { q: 'How would you handle class imbalance in a dataset?', difficulty: 'Hard' },
  ],
  behavioral: [
    { q: 'Tell me about a time you solved a complex technical problem under pressure.', difficulty: 'Medium' },
    { q: 'How do you prioritize tasks when working on multiple projects?', difficulty: 'Easy' },
    { q: 'Describe a situation where you had to learn a new technology quickly.', difficulty: 'Medium' },
  ],
  system: [
    { q: 'Design a recommendation system for a streaming platform.', difficulty: 'Hard' },
    { q: 'How would you build a real-time notification service?', difficulty: 'Hard' },
    { q: 'Design a URL shortener that handles 1 million requests per second.', difficulty: 'Hard' },
  ],
};

const difficultyColor = { Easy: 'var(--success)', Medium: 'var(--warning)', Hard: 'var(--danger)' };

export default function InterviewPrepPage() {
  const [category, setCategory] = useState('technical');
  const [activeQ, setActiveQ] = useState(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const questions = SAMPLE_QUESTIONS[category] || [];

  const evaluateAnswer = async () => {
    if (!answer.trim() || !activeQ) return;
    setEvaluating(true);
    try {
      const result = await api.careerChat(
        `You are an interviewer evaluating a candidate's answer. Question: "${activeQ.q}"\n\nCandidate's answer: "${answer}"\n\nProvide: 1) A score from 1-10, 2) What was good, 3) What could be improved, 4) A sample better answer. Be constructive and specific.`
      );
      setEvaluation(typeof result === 'string' ? result : result?.response || 'Evaluation received.');
    } catch {
      setEvaluation('Could not evaluate at this time. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Interview Preparation</h1>
        <p className="section-subtitle mt-1">Practice with AI-powered mock interviews tailored to your target role</p>
      </div>

      {/* Category selector */}
      <div className="flex gap-3 flex-wrap">
        {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => { setCategory(id); setActiveQ(null); setAnswer(''); setEvaluation(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: category === id ? 'var(--accent-subtle)' : 'var(--surface)',
              border: `1px solid ${category === id ? 'var(--accent-muted)' : 'var(--border)'}`,
              color: category === id ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Question list */}
        <div className="lg:col-span-2 space-y-2">
          {questions.map((q, i) => (
            <button
              key={i}
              onClick={() => { setActiveQ(q); setAnswer(''); setEvaluation(null); }}
              className="w-full text-left p-4 rounded-xl transition-all"
              style={{
                background: activeQ === q ? 'var(--accent-subtle)' : 'var(--surface)',
                border: `1px solid ${activeQ === q ? 'var(--accent-muted)' : 'var(--border)'}`,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Q{i + 1}
                </span>
                <span className="text-xs font-semibold" style={{ color: difficultyColor[q.difficulty] }}>
                  {q.difficulty}
                </span>
              </div>
              <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{q.q}</p>
            </button>
          ))}
        </div>

        {/* Answer area */}
        <div className="lg:col-span-3 space-y-4">
          {!activeQ ? (
            <Card className="p-12 text-center">
              <Swords className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Select a question to start</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Choose from the question bank on the left</p>
            </Card>
          ) : (
            <>
              <Card className="p-5">
                <div className="flex items-start gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{activeQ.q}</h3>
                </div>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here… Take your time to think it through."
                  rows={8}
                  className="input resize-none font-mono text-sm"
                  style={{ fontFamily: 'inherit' }}
                />
                <div className="flex gap-3 mt-4">
                  <Button variant="primary" icon={Bot} onClick={evaluateAnswer} disabled={!answer.trim() || evaluating}>
                    {evaluating ? 'Evaluating…' : 'Get AI Feedback'}
                  </Button>
                  <Button variant="secondary" onClick={() => { setAnswer(''); setEvaluation(null); }}>
                    Clear
                  </Button>
                </div>
              </Card>

              {evaluation && (
                <Card className="p-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--accent-muted)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>AI Evaluation</span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                    {evaluation}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
