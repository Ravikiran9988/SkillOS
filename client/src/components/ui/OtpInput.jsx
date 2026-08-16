import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OtpInput({
  email,
  onComplete,
  onResend,
  loading = false,
  error = '',
  successMessage = '',
  resendCooldown = 60,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(resendCooldown);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleChange = (index, value) => {
    // Handle paste of full 6-digit code
    if (value.length > 1) {
      const clean = value.replace(/\D/g, '').slice(0, 6);
      if (clean.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = clean[i] || '';
        }
        setDigits(newDigits);
        const focusIndex = Math.min(clean.length, 5);
        inputRefs.current[focusIndex]?.focus();

        if (clean.length === 6 && onComplete) {
          onComplete(clean);
        }
      }
      return;
    }

    // Single digit input
    const cleanDigit = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    setDigits(newDigits);

    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && onComplete) {
      onComplete(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendClick = async () => {
    if (timeLeft > 0 || isResending || !onResend) return;
    setIsResending(true);
    try {
      await onResend();
      setTimeLeft(resendCooldown);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Failed to resend OTP:', err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 6-box input */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            disabled={loading}
            className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl transition-all focus:outline-none"
            style={{
              background: 'var(--surface)',
              border: `2px solid ${
                error
                  ? 'var(--danger)'
                  : digit
                  ? 'var(--accent)'
                  : 'var(--border)'
              }`,
              color: 'var(--text-primary)',
            }}
            aria-label={`Digit ${idx + 1}`}
          />
        ))}
      </div>

      {/* Status messages */}
      {error && (
        <div className="p-3 rounded-xl flex items-center gap-2 text-xs"
          style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && !error && (
        <div className="p-3 rounded-xl flex items-center gap-2 text-xs"
          style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Resend & Cooldown */}
      <div className="flex items-center justify-between text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
        <span>
          {timeLeft > 0 ? (
            `Resend code in ${timeLeft}s`
          ) : (
            'Didn\'t receive the code?'
          )}
        </span>

        <button
          type="button"
          onClick={handleResendClick}
          disabled={timeLeft > 0 || isResending || loading}
          className="font-semibold transition-all flex items-center gap-1"
          style={{
            color: timeLeft > 0 ? 'var(--text-muted)' : 'var(--accent)',
            cursor: timeLeft > 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {isResending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
          Resend Code
        </button>
      </div>
    </div>
  );
}
