import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import { Sparkles, Mail, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import OtpInput from '../components/ui/OtpInput';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmailOtp, isAuthenticated } = useAuth();

  const initialEmail = location.state?.email || searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    initialEmail ? 'We\'ve sent a 6-digit verification code to your email.' : ''
  );
  const [cooldown, setCooldown] = useState(60);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated]);

  // Legacy link token verification support
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setLoading(true);
      api
        .verifyEmail(token)
        .then((res) => {
          setSuccessMessage('Email verified successfully! Redirecting…');
          setTimeout(() => navigate('/login'), 2000);
        })
        .catch((err) => {
          setError(err.message || 'Verification link is invalid or has expired.');
        })
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  const handleVerifyOtp = async (code) => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyEmailOtp({ email: email.trim(), otp: code });
      setSuccessMessage('Email verified successfully! Welcome to SkillOS.');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err) {
      setError(
        err.message ||
        (err.data?.error === 'expired'
          ? 'Verification code has expired. Please click Resend Code below.'
          : err.data?.error === 'max_attempts_exceeded'
          ? 'Maximum attempts exceeded. Please click Resend Code to receive a new code.'
          : 'Invalid verification code. Please check your email and try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    setError('');
    setSuccessMessage('');
    try {
      const res = await api.resendVerification(email.trim());
      setSuccessMessage(res.message || 'A new verification code has been sent to your email.');
      if (res.retryAfter) setCooldown(res.retryAfter);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code. Please wait before retrying.');
      throw err;
    }
  };

  // Masked email representation
  const maskedEmail = email
    ? email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => `${first}${'*'.repeat(Math.min(middle.length, 5))}${domain}`)
    : 'your email';

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)' }}
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
            Verify your email
          </h1>
          <p className="mt-1.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* Verification Card */}
        <div className="card p-6 sm:p-8" style={{ boxShadow: 'var(--shadow-md)' }}>
          {/* Email Info / Edit */}
          <div className="text-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            {!isEditingEmail ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Verification Code Sent To
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {email}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(true)}
                    className="text-xs font-medium hover:underline ml-1"
                    style={{ color: 'var(--accent)' }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="label text-left text-xs">Verify Email Address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input py-2 text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (email && email.includes('@')) {
                        setIsEditingEmail(false);
                        handleResend();
                      }
                    }}
                    className="btn-primary py-2 px-3 text-xs"
                  >
                    Send Code
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* OTP Input Component */}
          <OtpInput
            email={email}
            onComplete={handleVerifyOtp}
            onResend={handleResend}
            loading={loading}
            error={error}
            successMessage={successMessage}
            resendCooldown={cooldown}
          />
        </div>

        {/* Footer Navigation */}
        <div className="text-center mt-6 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>

          <span className="flex items-center gap-1 text-emerald-500">
            <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit TLS Secured
          </span>
        </div>
      </div>
    </div>
  );
}
