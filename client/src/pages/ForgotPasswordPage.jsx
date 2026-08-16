import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: 'var(--shadow-accent)' }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Reset Password</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            We'll send you a secure reset link
          </p>
        </div>

        <div className="card p-6 sm:p-8" style={{ boxShadow: 'var(--shadow-md)' }}>
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--success)' }} />
              <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Check your email</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                If an account exists with <strong>{email}</strong>, we've sent a password reset link. Check your spam folder if it doesn't arrive within a few minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                  <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com" required className="input" style={{ paddingLeft: '2.25rem' }} />
                </div>
              </div>

              {error && (
                <p className="text-sm p-3 rounded-xl" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>{error}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-5">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: 'var(--accent)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
