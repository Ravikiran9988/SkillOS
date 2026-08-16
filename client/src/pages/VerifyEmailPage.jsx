import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifyEmail } from '../services/api';
import { Sparkles, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully! You can now sign in.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The link may have expired.');
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-6"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        <div className="card p-8" style={{ boxShadow: 'var(--shadow-md)' }}>
          {status === 'loading' && (
            <>
              <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" style={{ color: 'var(--accent)' }} />
              <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Verifying your email…</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--success)' }} />
              <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Email verified!</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{message}</p>
              <Link to="/login" className="btn-primary inline-flex">Sign in to SkillOS</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--danger)' }} />
              <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Verification failed</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{message}</p>
              <Link to="/login" className="btn-secondary inline-flex">Return to sign in</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
