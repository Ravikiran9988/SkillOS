import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Sparkles, ArrowRight, Eye, EyeOff, Shield, CheckCircle2,
  Mail, Lock, User, Phone, GraduationCap, Building2, Calendar,
  AlertCircle, KeyRound, Key, RefreshCw,
} from 'lucide-react';
import OtpInput from '../components/ui/OtpInput';

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
  const { login, loginWithOtp, register: registerUser, loginAsStudent, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoStudents, setDemoStudents] = useState([]);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // OTP Login state
  const [otpSent, setOtpSent] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(60);

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
      const res = await login({ email, password });
      if (res?.requiresVerification) {
        navigate('/verify-email', { state: { email: email.trim() } });
        return;
      }
      navigate('/');
    } catch (err) {
      if (err.data?.requiresVerification) {
        navigate('/verify-email', { state: { email: email.trim() } });
        return;
      }
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('A valid email address is required.');
      return;
    }
    setLoading(true);
    setError('');
    setOtpSuccess('');
    try {
      const res = await api.sendOtp(email, 'login');
      setOtpSent(true);
      setOtpSuccess(res.message || 'Verification code sent to your email.');
      if (res.retryAfter) setOtpCooldown(res.retryAfter);
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code) => {
    setLoading(true);
    setError('');
    try {
      await loginWithOtp({ email, otp: code });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
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
      const res = await registerUser(reg);
      if (res?.requiresVerification) {
        navigate('/verify-email', { state: { email: reg.email.trim() } });
      } else {
        navigate('/');
      }
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
                onClick={() => { setMode(m); setError(''); setOtpSent(false); }}
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
            <div className="space-y-4">
              {/* Method Switcher: Password vs OTP */}
              <div className="flex p-1 rounded-xl mb-4" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('password'); setError(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    authMethod === 'password'
                      ? 'shadow-sm text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  style={authMethod === 'password' ? { background: 'var(--accent)' } : {}}
                >
                  <Lock className="w-3.5 h-3.5" /> Password
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('otp'); setError(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    authMethod === 'otp'
                      ? 'shadow-sm text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  style={authMethod === 'otp' ? { background: 'var(--accent)' } : {}}
                >
                  <KeyRound className="w-3.5 h-3.5" /> Email OTP
                </button>
              </div>

              {authMethod === 'password' ? (
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in…
                      </span>
                    ) : (
                      <>Sign In <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              ) : (
                /* OTP Login Form */
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
                      <Field label="Email Address" id="otp-email">
                        <TextInput
                          id="otp-email"
                          icon={Mail}
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          autoComplete="email"
                          required
                        />
                      </Field>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        We will send a 6-digit verification code to your email via Zoho SMTP.
                      </p>
                      <button
                        type="submit"
                        disabled={loading || !email}
                        className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending Code…
                          </span>
                        ) : (
                          <>Send Verification Code <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div className="text-center">
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Enter the 6-digit code sent to <strong className="text-[var(--text-primary)]">{email}</strong>
                        </p>
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setError(''); }}
                          className="text-xs font-semibold mt-1 hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          Change Email
                        </button>
                      </div>

                      <OtpInput
                        email={email}
                        onComplete={handleVerifyOtp}
                        onResend={() => handleSendOtp()}
                        loading={loading}
                        error={error}
                        successMessage={otpSuccess}
                        resendCooldown={otpCooldown}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── Register Form ────────────────────────────────────────────── */
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <Field label="Full Name *" id="reg-name">
                <TextInput id="reg-name" icon={User} value={reg.name} onChange={r('name')} placeholder="Aarav Sharma" required />
              </Field>

              <Field label="Email Address *" id="reg-email">
                <TextInput id="reg-email" icon={Mail} type="email" value={reg.email} onChange={r('email')} placeholder="aarav@example.com" required />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Password *" id="reg-password">
                  <PasswordInput id="reg-password" value={reg.password} onChange={r('password')} placeholder="8+ characters" autoComplete="new-password" />
                </Field>
                <Field label="Confirm Password *" id="reg-confirm">
                  <PasswordInput id="reg-confirm" value={reg.confirmPassword} onChange={r('confirmPassword')} placeholder="Repeat password" autoComplete="new-password" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Education Level" id="reg-edu">
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                    <select id="reg-edu" value={reg.educationLevel} onChange={r('educationLevel')} className="input" style={{ paddingLeft: '2.25rem' }}>
                      <option>Bachelor's</option>
                      <option>Master's</option>
                      <option>PhD</option>
                      <option>High School</option>
                      <option>Other</option>
                    </select>
                  </div>
                </Field>

                <Field label="Graduation Year" id="reg-grad">
                  <TextInput id="reg-grad" icon={Calendar} type="number" value={reg.graduationYear} onChange={r('graduationYear')} placeholder="2026" min="2000" max="2035" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="College / University" id="reg-college">
                  <TextInput id="reg-college" icon={Building2} value={reg.college} onChange={r('college')} placeholder="IIT Delhi" />
                </Field>
                <Field label="Phone Number" id="reg-phone">
                  <TextInput id="reg-phone" icon={Phone} type="tel" value={reg.phone} onChange={r('phone')} placeholder="+91 98765 43210" />
                </Field>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          {/* ── Demo Quick Login (Development Only) ────────────────────────── */}
          {IS_DEV && demoStudents.length > 0 && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2.5 text-center" style={{ color: 'var(--text-muted)' }}>
                ⚡ Dev Quick-Login (Select Student)
              </p>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                {demoStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleDemoLogin(s.id)}
                    disabled={loading}
                    className="p-2 rounded-xl text-left text-xs font-medium transition-all"
                    style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <div className="font-semibold truncate">{s.name}</div>
                    <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{s.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security badge */}
        <p className="text-xs text-center mt-6 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          Secured with 256-bit encryption & Zoho SMTP delivery
        </p>
      </div>
    </div>
  );
}
