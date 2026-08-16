import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Bot, Send, Sparkles, ArrowRight, RefreshCw, Trash2,
  Copy, Check, RotateCcw, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import Badge from '../components/ui/Badge';

const SUGGESTED_PROMPTS = [
  'What should I learn next?',
  'Am I ready for an AI Engineer role?',
  'Analyze my top 3 skill gaps',
  'Create a 30-day learning plan',
  'What project should I build next?',
  'How do I improve my career match score?',
];

const STORAGE_KEY = 'skillos_copilot_history';

export default function CareerCopilotPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    api.getAiStatus().then(setAiStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.state?.initialPrompt) {
      sendMessage(location.state.initialPrompt);
      window.history.replaceState({}, '');
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  // Persist conversation in session storage
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))); } catch {}
  }, [messages]);

  const sendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Pass recent history window for conversational memory
      const historyPayload = updatedMessages
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await api.careerChat(text, historyPayload);
      const content =
        typeof response === 'string'
          ? response
          : response?.answer || response?.reply || response?.message || response?.content || 'I have analyzed your career graph.';

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content,
          facts: response?.facts || [],
          recommendations: response?.recommendations || [],
          actions: response?.actions || response?.actionLinks || [],
          model: response?.model,
          provider: response?.provider,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      const isRateLimit = err.message?.includes('rate_limited') || err.response?.status === 429;
      const isTimeout = err.response?.status === 504;

      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: 'assistant',
          content: isRateLimit
            ? 'You have reached the AI request limit. Please wait a moment before asking again.'
            : isTimeout
            ? 'The AI copilot timed out while reasoning. Please retry your question.'
            : 'SkillOS is currently having trouble connecting to the AI reasoning layer. Your graph data is safe — click Retry below.',
          isError: true,
          failedPrompt: text,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const clearHistory = () => {
    setMessages([]);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-accent)' }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>AI Career Copilot</h1>
              <Badge variant="blue" icon={Sparkles}>
                {aiStatus?.provider === 'groq' ? 'Groq AI Active' : 'AI Active'}
              </Badge>
            </div>
            <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-muted)' }}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Grounded in CognoDB career graph for {user?.name?.split(' ')[0] || 'you'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              title="Clear conversation"
              aria-label="Clear conversation history"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.length === 0 ? (
          /* Empty state with suggestions */
          <div className="h-full flex flex-col justify-center items-center text-center max-w-lg mx-auto px-4 py-8 space-y-6">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), #1d4ed8)', boxShadow: 'var(--shadow-accent)' }}>
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Hi {user?.name?.split(' ')[0] || 'there'} 👋
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                I'm your SkillOS Career Copilot. Powered by Groq and strictly grounded in your verified CognoDB graph, I provide strategic advice tailored to your exact skills and goals.
              </p>
            </div>

            <div className="w-full">
              <p className="text-xs font-bold uppercase tracking-wider mb-3 text-left" style={{ color: 'var(--text-muted)' }}>
                Suggested questions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="p-3 rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between group"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <span className="truncate flex-1">"{prompt}"</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const actions = msg.actions || [];

              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5"
                      style={{ background: msg.isError ? 'var(--danger)' : 'var(--accent)', boxShadow: 'var(--shadow-accent)' }}>
                      {msg.isError ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                  )}

                  <div
                    className="max-w-2xl rounded-2xl p-4 text-sm leading-relaxed relative"
                    style={isUser ? {
                      background: 'var(--accent)',
                      color: 'white',
                      borderRadius: '1rem 1rem 0.25rem 1rem',
                      boxShadow: 'var(--shadow-accent)',
                    } : {
                      background: msg.isError ? 'var(--danger-bg)' : 'var(--surface)',
                      border: `1px solid ${msg.isError ? 'var(--danger-border)' : 'var(--border)'}`,
                      color: msg.isError ? 'var(--danger)' : 'var(--text-secondary)',
                      borderRadius: '0.25rem 1rem 1rem 1rem',
                    }}
                  >
                    {/* Copy button on assistant bubbles */}
                    {!isUser && !msg.isError && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)' }}
                        title="Copy response"
                        aria-label="Copy response text"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Action buttons */}
                    {!isUser && !msg.isError && (
                      <div className="mt-3 pt-3 flex items-center gap-2 flex-wrap text-xs" style={{ borderTop: '1px solid var(--border)' }}>
                        {actions.length > 0 ? (
                          actions.map((act) => {
                            const target = act.route || act.path || '/roadmap';
                            return (
                              <button
                                key={act.label}
                                onClick={() => navigate(target)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-subtle)'; e.currentTarget.style.color = 'var(--accent)'; }}
                              >
                                {act.label} <ArrowRight className="w-3 h-3" />
                              </button>
                            );
                          })
                        ) : (
                          [
                            { label: 'View Skill Gap', path: '/skill-gap' },
                            { label: 'Open Roadmap', path: '/roadmap' },
                            { label: 'Find Jobs', path: '/jobs' },
                          ].map(({ label, path }) => (
                            <button key={path} onClick={() => navigate(path)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-subtle)'; e.currentTarget.style.color = 'var(--accent)'; }}
                            >
                              {label}
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {/* Retry button on error */}
                    {msg.isError && msg.failedPrompt && (
                      <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--danger-border)' }}>
                        <button
                          onClick={() => sendMessage(msg.failedPrompt)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                          style={{ background: 'var(--danger)', color: 'white' }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Retry Request
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                      {userInitial}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent)' }}>
                  <Bot className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="p-3.5 rounded-2xl text-sm flex items-center gap-2"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '0.25rem 1rem 1rem 1rem' }}>
                  <Sparkles className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />
                  <span>Synthesizing response from CognoDB knowledge graph via Groq…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your skills, roadmap, career path, or interview readiness…"
            disabled={loading}
            maxLength={2000}
            className="flex-1 input rounded-2xl py-3"
            aria-label="Message to AI Career Copilot"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 rounded-2xl transition-all shrink-0 flex items-center justify-center"
            style={{
              background: !input.trim() || loading ? 'var(--surface-hover)' : 'var(--accent)',
              color: !input.trim() || loading ? 'var(--text-muted)' : 'white',
              boxShadow: !input.trim() || loading ? 'none' : 'var(--shadow-accent)',
            }}
            aria-label="Send message"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          Responses are strictly grounded in your CognoDB career graph. Press Enter to send.
        </p>
      </div>
    </div>
  );
}
