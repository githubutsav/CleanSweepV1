import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { Cookie } from 'lucide-react';

export default function CookiePolicy({ session }) {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="bg-[#111412] text-[#e2e3df] font-sans min-h-screen relative overflow-hidden">
      {/* Global Background Shader/Glow Overlay */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-gradient-to-b from-[#0D1B2A]/20 via-[#111412] to-[#111412]" />

      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-[#111412]/60 backdrop-blur-xl border-b border-[#41eec2]/15 shadow-[0_0_20px_rgba(0,212,170,0.1)]">
        <nav className="flex justify-between items-center max-w-[1440px] mx-auto px-6 md:px-container-margin-desktop h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img alt="CleanSweep Logo" className="h-10 w-10 filter drop-shadow-[0_0_8px_rgba(5,255,163,0.5)]" src={logo} />
            <span className="text-2xl font-extrabold text-white tracking-tighter filter drop-shadow-[0_0_10px_rgba(65,238,194,0.2)]" style={{ fontFamily: 'Sora, sans-serif' }}>CleanSweep</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {session ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-on-secondary bg-[#41eec2] rounded-full px-6 py-2 shadow-[0_0_15px_rgba(0,212,170,0.4)] hover:scale-105 active:scale-95 transition-transform cursor-pointer font-semibold text-[#002118]"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="text-on-secondary bg-[#41eec2] rounded-full px-6 py-2 shadow-[0_0_15px_rgba(0,212,170,0.4)] hover:scale-105 active:scale-95 transition-transform cursor-pointer font-semibold text-[#002118]"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="pt-32 pb-20 px-6 max-w-[800px] mx-auto">
        <section className="mb-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#41eec2]/10 border border-[#41eec2]/35 flex items-center justify-center mb-6 mx-auto">
            <Cookie className="text-[#41eec2] w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            Cookie Policy
          </h1>
          <p className="text-slate-400 text-xs font-mono">Last Updated: June 15, 2026</p>
        </section>

        <section className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6 text-[#c4c6cc] text-sm leading-relaxed mb-16">
          <div>
            <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>1. What are Cookies & Local Storage?</h2>
            <p>
              Cookies are small fragments of data stored on your browser. CleanSweep uses standard cookies and local storage tokens to recognize authenticated sessions, keep you logged in, and cache local configurations (such as generated tree donation certificates).
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>2. Types of Cookies We Use</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong className="text-white">Strictly Necessary Cookies:</strong> Essential auth tokens parsed by Supabase to maintain your session credentials.</li>
              <li><strong className="text-white">Preference Storage:</strong> Local items containing tree sapling planting IDs, avoiding database fetches for locally redeemed certificates.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>3. How to Manage Cookies</h2>
            <p>
              Most browsers allow you to disable cookie storage via settings. Disabling auth cookies will prevent you from signing in to file dumpsite reports or checking points.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0a0d0b] border-t border-secondary/10 relative z-10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-container-margin-desktop py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

            {/* Brand Column */}
            <div className="md:col-span-5 space-y-5">
              <div className="flex items-center gap-3">
                <img alt="CleanSweep Logo" className="h-9 w-9 filter drop-shadow-[0_0_8px_rgba(5,255,163,0.4)]" src={logo} />
                <span className="text-xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>CleanSweep</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Empowering communities to report illegal dumping, track cleanups, and earn rewards — building cleaner cities together.
              </p>
            </div>

            {/* Resources */}
            <div className="md:col-span-2 md:col-start-7 space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider text-xs">Resources</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigate('/how-it-works')} className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">How It Works</button></li>
                <li><button onClick={() => navigate('/faqs')} className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">FAQs</button></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider text-xs">Legal</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigate('/privacy-policy')} className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms-of-service')} className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Terms of Service</button></li>
                <li><button onClick={() => navigate('/cookie-policy')} className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Cookie Policy</button></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider text-xs">Contact</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigate('/support')} className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer text-left">Support</button></li>
                <li><button onClick={() => navigate('/feedback')} className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer text-left">Feedback</button></li>
                <li><a href="https://github.com/githubutsav/CleanSweepV1.git" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-secondary text-sm transition-colors block text-left">Repository</a></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80">
          <div className="max-w-[1440px] mx-auto px-6 md:px-container-margin-desktop py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-slate-500 text-xs font-medium">© 2026 CleanSweep. All rights reserved.</span>
            <span className="text-slate-500 text-xs font-medium">
              Developed by Team <span className="text-[#41eec2] font-bold filter drop-shadow-[0_0_8px_rgba(65,238,194,0.6)]">Code Thrifters</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
