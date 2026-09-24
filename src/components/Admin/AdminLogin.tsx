import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import type { User } from 'firebase/auth';
import { googleSignIn } from '../../services/firebaseAuth';

interface AdminLoginProps {
  onSuccess: () => void;
  user: User | null;
  onGoogleAuth: (user: User, token: string) => void;
  expectedPin: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  user,
  onGoogleAuth,
  expectedPin
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin.trim() === expectedPin.trim() || pin.trim() === 'admin123') {
      onSuccess();
    } else {
      setError('Incorrect administrator PIN. Default PIN is "admin123".');
    }
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onGoogleAuth(result.user, result.accessToken);
        onSuccess();
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200 dark:border-slate-800 p-8 text-center">
        
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          PrintCraft Admin cPanel
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Restricted access for print shop managers and operators
        </p>

        {/* Option 1: Google Workspace Login */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-semibold text-sm shadow-sm transition-all"
          >
            <div className="w-5 h-5">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
            </div>
            <span>{isSigningIn ? 'Authenticating...' : 'Sign in with Google Workspace'}</span>
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
                Or Sign In with Admin PIN
              </span>
            </div>
          </div>

          {/* Option 2: Admin PIN */}
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter Admin PIN"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all"
            >
              Authenticate & Access cPanel
            </button>
          </form>

          <div className="pt-2 text-xs text-slate-400 text-center">
            <span>Demo default PIN: </span>
            <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-indigo-600 dark:text-indigo-400">admin123</code>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

      </div>
    </div>
  );
};
