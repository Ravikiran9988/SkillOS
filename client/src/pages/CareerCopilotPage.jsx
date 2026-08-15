import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Bot,
  Send,
  Sparkles,
  User,
  ArrowRight,
  RefreshCw,
  Target,
  Brain,
  Zap,
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'What should I learn next?',
  'Am I ready for my target career?',
  'Why is my career match score what it is?',
  'Which projects should I build for my resume?',
  'Review my current skill portfolio.',
  'How can I become job-ready in 3 months?',
];

export default function CareerCopilotPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'copilot',
      text: `Hello ${user?.name || 'there'}! I am your **SkillOS AI Career Copilot**.

I have loaded your personal CognoDB career graph. I can analyze your verified skills, evaluate your target goal readiness, diagnose skill gaps, and suggest tailored projects.

What would you like to explore today?`,
      actionLinks: [
        { label: 'View Roadmap', path: '/roadmap' },
        { label: 'Inspect Skill Gaps', path: '/skill-gap' },
        { label: 'Explore Job Matches', path: '/jobs' },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // If navigated with initialPrompt from another page
  useEffect(() => {
    if (location.state?.initialPrompt) {
      handleSend(location.state.initialPrompt);
    }
  }, [location.state?.initialPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.careerChat(text);
      const copilotMsg = {
        id: `copilot-${Date.now()}`,
        sender: 'copilot',
        text: response.message,
        actionLinks: response.actionLinks || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'copilot',
        text: `I had trouble connecting to the graph reasoning service (${err.message}). Your CognoDB career analysis is still accessible directly via the navigation tabs.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              AI Career Copilot
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CognoDB Connected
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Personalized career guidance grounded in your live portfolio
            </p>
          </div>
        </div>
      </div>

      {/* ─── Chat Messages Scrollable Window ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-2xl rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              {/* Message Text with simple formatting */}
              <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed space-y-2">
                {msg.text}
              </div>

              {/* Action Buttons if provided */}
              {msg.actionLinks && msg.actionLinks.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                  {msg.actionLinks.map((link) => (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}

              <div
                className={`text-[10px] ${
                  msg.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Analyzing your CognoDB career graph & formulating strategy...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Suggested Prompt Chips ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-indigo-400" /> Suggestions:
        </span>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-3 py-1 rounded-full bg-slate-900/80 hover:bg-indigo-900/40 border border-slate-800 hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-white transition whitespace-nowrap disabled:opacity-50 shrink-0"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* ─── Input Bar ───────────────────────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-xl shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask anything about your ${user?.targetCareer?.title || 'career'} preparation...`}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition disabled:opacity-40 shadow-lg shadow-indigo-600/30 shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
