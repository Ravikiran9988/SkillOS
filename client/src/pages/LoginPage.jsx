import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Sparkles, ArrowRight, Eye, EyeOff, Shield, CheckCircle2,
  Mail, Lock, User, Phone, GraduationCap, Building2, Calendar,
  AlertCircle,
} from 'lucide-react';

const IS_DEV = import.meta.env.DEV;

// ── Input Field Helper ────────────────────────────────────────────────────────
function Field({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-[var(--danger)] flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

function TextInput({ id, icon: Icon, type = 'text', ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />}
      <input
        id={id}
        type={type}
        className="input"
        style={Icon ? { paddingLeft: '2.25rem' } : {}}
        {...props}
      />
    </div>
  );
}

function PasswordInput({ id, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input"
        style={{ paddingLeft: '2.25rem', paddingRight: '2.75rem' }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, register: registerUser, loginAsStudent, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoStudents, setDemoStudents] = useState([]);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Register form
  const [reg, setReg] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', educationLevel: "Bachelor's", college: '', graduationYear: '',
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated]);

  // Load demo students only in development
  useEffect(() => {
    if (IS_DEV) {
      api.getDemoStudents().then((data) => setDemoStudents(data || [])).catch(() => {});
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    setError('');
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!reg.name || !reg.email || !reg.password) { setError('Name, email, and password are required.'); return; }
    if (reg.password !== reg.confirmPassword) { setError('Passwords do not match.'); return; }
    if (reg.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      await registerUser(reg);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (studentId) => {
    if (!IS_DEV) return;
    setLoading(true);
    setError('');
    try {
      await loginAsStudent(studentId);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const r = (field) => (e) => setReg((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: 'var(--shadow-accent)' }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            SkillOS
          </h1>
          <p className="mt-1.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Your Personal AI Career Copilot
          </p>
        </div>

        {/* Auth Card */}
        <div className="card p-6 sm:p-8" style={{ boxShadow: 'var(--shadow-md)' }}>
          {/* Tab switcher */}
          <div className="flex border-b mb-6" style={{ borderColor: 'var(--border)' }}>
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 pb-3 text-sm font-semibold transition-all ${
                  mode === m
                    ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
                style={{ marginBottom: '-1px' }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mb-5 p-3 rounded-xl text-sm flex items-start gap-2"
              style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Login Form ────────────────────────────────────────────────── */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <Field label="Email" id="login-email">
                <TextInput
                  id="login-email"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field label="Password" id="login-password">
                <PasswordInput
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
              </Field>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--accent)]"
                  />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Signing in…' : 'Continue to SkillOS'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

          ) : (
            /* ── Register Form ──────────────────────────────────────────────── */
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Full Name *" id="reg-name">
                  <TextInput id="reg-name" icon={User} value={reg.name} onChange={r('name')}
                    placeholder="e.g. Ravi Kiran" autoComplete="name" required />
                </Field>

                <Field label="Email *" id="reg-email">
                  <TextInput id="reg-email" icon={Mail} type="email" value={reg.email} onChange={r('email')}
                    placeholder="your@email.com" autoComplete="email" required />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Password *" id="reg-password">
                    <PasswordInput id="reg-password" value={reg.password} onChange={r('password')}
                      placeholder="8+ characters" autoComplete="new-password" />
                  </Field>
                  <Field label="Confirm Password *" id="reg-confirm">
                    <PasswordInput id="reg-confirm" value={reg.confirmPassword} onChange={r('confirmPassword')}
                      placeholder="Repeat password" autoComplete="new-password" />
                  </Field>
                </div>

                <Field label="Phone (optional)" id="reg-phone">
                  <TextInput id="reg-phone" icon={Phone} type="tel" value={reg.phone} onChange={r('phone')}
                    placeholder="+91 98765 43210" autoComplete="tel" />
                </Field>

                <Field label="Education Level" id="reg-edu">
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                    <select id="reg-edu" value={reg.educationLevel} onChange={r('educationLevel')}
                      className="input" style={{ paddingLeft: '2.25rem' }}>
                      <option value="Bachelor's">Bachelor's Degree</option>
                      <option value="Master's">Master's Degree</option>
                      <option value="PhD">Doctorate / PhD</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bootcamp">Coding Bootcamp</option>
                      <option value="Self-Taught">Self-Taught</option>
                    </select>
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="College/University" id="reg-college">
                    <TextInput id="reg-college" icon={Building2} value={reg.college} onChange={r('college')}
                      placeholder="e.g. IIT Bombay" />
                  </Field>
                  <Field label="Graduation Year" id="reg-grad">
                    <TextInput id="reg-grad" icon={Calendar} type="number" value={reg.graduationYear} onChange={r('graduationYear')}
                      placeholder="2025" min="2000" max="2035" />
                  </Field>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Creating account…' : 'Get Started'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* ── Demo Personas (DEV ONLY) ───────────────────────────────────── */}
          {IS_DEV && demoStudents.length > 0 && (
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Sparkles className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                Dev Mode — Quick Demo Login
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demoStudents.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleDemoLogin(s.id)}
                    disabled={loading}
                    className="p-2.5 rounded-xl text-left transition-all duration-150 group"
                    style={{
                      background: 'var(--surface-hover)',
                      border: '1px solid var(--border)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                    <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {s.targetCareer?.title || s.educationLevel}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="text-center mt-5 flex items-center justify-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          <Shield className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
          End-to-End Isolated Career Intelligence
        </div>
      </div>
    </div>
  );
}
