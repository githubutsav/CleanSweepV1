import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, CheckCircle2, XCircle } from 'lucide-react';

// ── Animated toast notification card ──────────────────────────────────────────
function NotificationCard({ message, isError, onDone }) {
  const [phase, setPhase] = useState('enter'); // enter | show | exit

  useEffect(() => {
    // After the slide-in (300ms), hold for 2 s, then exit
    const holdTimer  = setTimeout(() => setPhase('exit'), 2300);
    const doneTimer  = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  const base = [
    'login-toast',
    isError ? 'login-toast--error' : 'login-toast--success',
    phase === 'exit' ? 'login-toast--exit' : 'login-toast--enter',
  ].join(' ');

  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div className={base} role="alert">
      <div className="login-toast__icon-wrap">
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <p className="login-toast__text">{message}</p>
      <div className="login-toast__progress" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, isError }
  const navigate = useNavigate();

  const showMsg = (text, error = false) => {
    if (!text) return;
    setToast({ message: text, isError: error });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    showMsg('');

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { full_name: name },
            emailRedirectTo: window.location.origin + '/dashboard'
          },
        });
        if (error) throw error;
        showMsg('✅ Account created! Check your email to confirm, then log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Surface friendly messages for common errors
      let msg = error.message;
      if (msg.includes('Invalid login credentials')) msg = 'Wrong email or password. Please try again.';
      if (msg.includes('Email not confirmed')) msg = 'Please confirm your email first — check your inbox.';
      if (msg.includes('User already registered')) msg = 'An account with this email already exists. Try logging in.';
      showMsg(msg, true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    showMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' },
      });
      if (error) throw error;
      // Browser will redirect — no need to navigate manually
    } catch (error) {
      console.error('Google OAuth error:', error);
      showMsg(error.message || 'Google sign-in failed. Make sure Google provider is enabled in Supabase.', true);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/favicon.svg" className="w-9 h-9 filter drop-shadow-[0_0_8px_rgba(5,255,163,0.5)]" alt="CleanSweep Logo" />
            <span className="text-3xl font-extrabold tracking-tight">CleanSweep</span>
          </div>
          <p className="text-slate-400 text-sm">Report illegal dumping in your city</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-800/60 backdrop-blur p-7 shadow-2xl space-y-5">
          <h1 className="text-xl font-bold tracking-tight">
            {isRegistering ? 'Create an account' : 'Welcome back'}
          </h1>

          {/* Email / Password form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-lg text-sm outline-none transition"
                    placeholder="Your Name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-lg text-sm outline-none transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-lg text-sm outline-none transition"
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-full flex justify-center items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : isRegistering ? 'Create Account' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-[11px] uppercase tracking-wide text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-12 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border flex items-center justify-center gap-3 font-semibold transition disabled:opacity-50"
          >
            <svg viewBox="0 0 48 48" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Toast notification */}
          {toast && (
            <NotificationCard
              key={toast.message + toast.isError}
              message={toast.message}
              isError={toast.isError}
              onDone={() => setToast(null)}
            />
          )}

          {/* Toggle */}
          <div className="text-center text-xs text-slate-400">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsRegistering(!isRegistering); showMsg(''); }}
              className="text-emerald-400 hover:underline font-medium"
            >
              {isRegistering ? 'Login' : 'Register'}
            </button>
          </div>
        </div>

        {/* Supabase config hint */}
        <p className="text-center text-xs text-slate-600">
          New project? Make sure to run the database SQL setup and enable Email auth in Supabase.
        </p>
      </div>
    </div>
  );
}
