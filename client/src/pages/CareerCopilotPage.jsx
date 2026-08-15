import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Brain,
  Target,
  Map,
  Briefcase,
  Layers,
  ArrowRight,
  Shield,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const SUGGESTED_PROMPTS = [
  'What should I learn next?',
  'Am I ready for an AI Engineer job?',
  'Why is my career match only 57%?',
  'Review my skills and top gaps',
  'What project should I build next?',
  'Create a 30-day learning plan',
];

export default function CareerCopilotPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (location.state?.initialPrompt) {
      sendMessage(location.state.initialPrompt);
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading || !user?.id) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.askCareerCopilot(user.id, text);
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply || response.answer || response.content || 'I have analyzed your graph.',
        context: response.context,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an issue connecting to the CognoDB intelligence engine. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto animate-fade-in space-y-4">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-indigo-400" /> Your AI Career Copilot
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time career advisory grounded in your live CognoDB student graph.
          </p>
        </div>

        <Badge variant="ai" icon={Sparkles}>
          Graph-Grounded
        </Badge>
      </div>

      {/* ─── Messages Container ──────────────────────────────────────────── */}
      <Card className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-900/90 border-slate-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center max-w-lg mx-auto space-y-5 py-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25">
              <Bot className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white">Hi {user?.name || 'there'} 👋</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                I'm your SkillOS Career Copilot. I have full live context on your verified skills, projects, target career, skill gaps, roadmap, and matched jobs.
              </p>
            </div>

            <div className="w-full pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-left">
                Suggested questions:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-indigo-900/40 border border-slate-800 hover:border-indigo-500/40 text-xs text-left text-slate-200 hover:text-white transition flex items-center justify-between group"
                  >
                    <span className="truncate">"{prompt}"</span>
                    <ArrowRight className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950/90 border border-slate-800 text-slate-100 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {!isUser && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-[11px]">
                        <button
                          onClick={() => navigate('/skill-gap')}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 font-semibold transition"
                        >
                          View Skill Gap
                        </button>
                        <button
                          onClick={() => navigate('/roadmap')}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 font-semibold transition"
                        >
                          Open Roadmap
                        </button>
                        <button
                          onClick={() => navigate('/jobs')}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 font-semibold transition"
                        >
                          Find Jobs
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-sm bg-slate-950/90 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Synthesizing response from CognoDB knowledge graph...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </Card>

      {/* ─── Input Bar ───────────────────────────────────────────────────── */}
      <div className="shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="relative flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your skills, roadmap, career path..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-lg transition"
          />

          <Button
            type="submit"
            disabled={!input.trim() || loading}
            loading={loading}
            icon={Send}
            className="rounded-2xl px-5 py-3"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
