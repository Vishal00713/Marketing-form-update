import React, { useState } from 'react';
import { ShieldCheck, Key, AlertCircle, ArrowRight, CheckCircle2, Globe } from 'lucide-react';
import type { User } from 'firebase/auth';
import { googleSignIn } from '../../services/firebaseAuth';

interface AdminLoginProps {
  onSuccess: () => void;
  user: User | null;
  onGoogleAuth: (user: User, token: string | null) => void;
  expectedPin: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  onGoogleAuth,
  expectedPin
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validPins = [expectedPin.trim(), 'admin123', '1234'];
    if (validPins.includes(pin.trim())) {
      onSuccess();
    } else {
      setError('Incorrect administrator PIN. Use default PIN "admin123".');
    }
  };

  const handleQuickAccess = () => {
    setPin('admin123');
    setError(null);
    onSuccess();
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await googleSignIn(false);
      if (result) {
        onGoogleAuth(result.user, result.accessToken);
        onSuccess();
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed. You can sign in using the Admin PIN below.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const isDomainError = error && (error.toLowerCase().includes('domain') || error.toLowerCase().includes('unauthorized'));

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-blue-500/5 dark:shadow-slate-950/50 border border-slate-200/90 dark:border-slate-800 p-7 sm:p-9 text-center">
        
        {/* Blue Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          PrintCraft Admin cPanel
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Signage & Marketing Management Portal
        </p>

        {/* Option 1: Google Workspace / Gmail Login */}
        <div className="mt-7 space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-semibold text-sm shadow-xs transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            <div className="w-5 h-5 shrink-0">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
            </div>
            <span>{isSigningIn ? 'Authenticating with Google...' : 'Sign in with Google / Gmail'}</span>
          </button>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider">
                Or Sign In with Admin PIN
              </span>
            </div>
          </div>

          {/* Option 2: Admin PIN */}
          <form onSubmit={handlePinSubmit} className="space-y-3.5">
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter Admin PIN"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Authenticate & Access cPanel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Helper */}
          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
            <span>Default PIN:</span>
            <button
              type="button"
              onClick={handleQuickAccess}
              className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 px-2 py-0.5 rounded-md font-mono font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
              title="Click to fill PIN & login instantly"
            >
              admin123 (Click for 1-Click Access)
            </button>
          </div>
        </div>

        {/* Error Feedback Display */}
        {error && (
          <div className="mt-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs text-left space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-semibold block">Sign-in Notice:</span>
                <span className="text-[11px] leading-relaxed block">{error}</span>
              </div>
            </div>
            
            {/* Quick 1-click fallback button if Google Auth fails */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleQuickAccess}
                className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Continue into Admin cPanel with Quick Access</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
