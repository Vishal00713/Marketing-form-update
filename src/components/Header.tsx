import React, { useState } from 'react';
import { 
  Printer, 
  Search, 
  ShieldCheck, 
  Sun, 
  Moon, 
  LogOut, 
  FileSpreadsheet, 
  HardDrive,
  User as UserIcon,
  CheckCircle2,
  ExternalLink,
  Layers
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { googleSignIn, logout } from '../services/firebaseAuth';

interface HeaderProps {
  currentView: 'form' | 'admin' | 'confirmation';
  setCurrentView: (view: 'form' | 'admin' | 'confirmation') => void;
  openTracker: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  user: User | null;
  accessToken: string | null;
  onAuthChange: (user: User | null, token: string | null) => void;
  sheetConfigured: boolean;
  spreadsheetUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  openTracker,
  darkMode,
  setDarkMode,
  user,
  accessToken,
  onAuthChange,
  sheetConfigured,
  spreadsheetUrl
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthChange(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setAuthError(err.message || 'Google sign-in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onAuthChange(null, null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1a1625]/95 backdrop-blur-md transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand Logo & Form Title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('form')}
            className="flex items-center gap-2.5 text-left group focus:outline-none rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-[#673ab7] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Signage Tracker</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-[#673ab7] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Google Form
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Central Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => setCurrentView('form')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              currentView === 'form' || currentView === 'confirmation'
                ? 'bg-white dark:bg-slate-900 text-[#673ab7] dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Google Form View
          </button>
          
          <button
            onClick={openTracker}
            className="px-3 py-1 text-xs font-semibold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track Submission</span>
          </button>

          <button
            onClick={() => setCurrentView('admin')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              currentView === 'admin'
                ? 'bg-white dark:bg-slate-900 text-[#673ab7] dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#673ab7]" />
            <span>Backend Settings (/admin)</span>
          </button>
        </nav>

        {/* Action Controls: Google Sheets Link, Theme Toggle, Google Sign-in */}
        <div className="flex items-center gap-2">
          
          {/* Centralized Google Sheets Quick Status */}
          {sheetConfigured && spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
              title="Centralized Google Sheet Connected"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheet</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}

          {/* Dark / Light Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Google Sign-in button */}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-slate-400 leading-none mt-0.5">
                  {user.email}
                </span>
              </div>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-700 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/60 text-[#673ab7] flex items-center justify-center text-xs font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{isSigningIn ? 'Signing in...' : 'Sign in'}</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
