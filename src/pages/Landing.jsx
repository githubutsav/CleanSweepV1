import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Globe from '../components/Globe';

// Animated count-up component that triggers when scrolled into view
function CountUp({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
    return num.toLocaleString();
  };

  return <span ref={ref}>{formatNumber(count)}{suffix}</span>;
}

export default function Landing({ session }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleExploreMap = () => {
    if (session) {
      navigate('/dashboard', { state: { viewMode: 'explore-map' } });
    } else {
      navigate('/login');
    }
  };

  const handleReport = () => {
    if (session) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleCommunity = () => {
    if (session) {
      navigate('/dashboard', { state: { viewMode: 'community' } });
    } else {
      navigate('/login');
    }
  };
  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden min-h-screen relative">
      {/* Global Background Shader/Glow Overlay */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-gradient-to-b from-[#0D1B2A]/20 via-[#111412] to-[#111412]" />

      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-xl border-b border-secondary/15 shadow-[0_0_20px_rgba(0,212,170,0.1)]">
        <nav className="flex justify-between items-center max-w-[1440px] mx-auto px-6 md:px-container-margin-desktop h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img alt="CleanSweep Logo" className="h-10 w-10 filter drop-shadow-[0_0_8px_rgba(5,255,163,0.5)]" src="/favicon.svg" />
            <span className="font-headline-md text-2xl font-extrabold text-on-surface tracking-tighter filter drop-shadow-[0_0_10px_rgba(65,238,194,0.2)]">CleanSweep</span>
          </div>

          <div className="hidden md:flex items-center gap-stack-md">
            {session && (
              <>
                <button onClick={handleReport} className="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md bg-transparent border-none cursor-pointer">Report</button>
                <button onClick={handleExploreMap} className="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md bg-transparent border-none cursor-pointer">Explore Map</button>
                <button onClick={handleCommunity} className="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md bg-transparent border-none cursor-pointer">Community</button>
              </>
            )}
            {session ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="ml-4 text-on-secondary bg-secondary rounded-full px-6 py-2 shadow-[0_0_15px_rgba(0,212,170,0.4)] hover:scale-105 active:scale-95 transition-transform cursor-pointer font-semibold"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="ml-4 text-on-secondary bg-secondary rounded-full px-6 py-2 shadow-[0_0_15px_rgba(0,212,170,0.4)] hover:scale-105 active:scale-95 transition-transform cursor-pointer font-semibold"
              >
                Sign In
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-secondary p-2 focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </nav>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-surface/95 backdrop-blur-xl border-b border-secondary/15 px-6 py-6 flex flex-col gap-4 animate-fade-in">
            {session && (
              <>
                <button onClick={() => { setIsMobileMenuOpen(false); handleReport(); }} className="text-left text-on-surface-variant hover:text-secondary py-2 font-body-md text-body-md bg-transparent border-none cursor-pointer">Report</button>
                <button onClick={() => { setIsMobileMenuOpen(false); handleExploreMap(); }} className="text-left text-on-surface-variant hover:text-secondary py-2 font-body-md text-body-md bg-transparent border-none cursor-pointer">Explore Map</button>
                <button onClick={() => { setIsMobileMenuOpen(false); handleCommunity(); }} className="text-left text-on-surface-variant hover:text-secondary py-2 font-body-md text-body-md bg-transparent border-none cursor-pointer">Community</button>
              </>
            )}
            {session ? (
              <button
                onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}
                className="w-full text-center text-on-secondary bg-secondary rounded-full py-3 shadow-[0_0_15px_rgba(0,212,170,0.4)] font-semibold cursor-pointer"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => { setIsMobileMenuOpen(false); handleSignIn(); }}
                className="w-full text-center text-on-secondary bg-secondary rounded-full py-3 shadow-[0_0_15px_rgba(0,212,170,0.4)] font-semibold cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20 px-6 md:px-container-margin-desktop max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg items-center w-full">
            <div className="reveal">
              <h1 className="font-headline-xl text-headline-xl sm:text-5xl md:text-6xl lg:text-7xl mb-stack-sm leading-tight text-white font-black tracking-tight">
                Clean Cities Start <br />
                <span className="text-secondary filter drop-shadow-[0_0_12px_rgba(65,238,194,0.4)]">With You</span>
              </h1>
              <p className="text-on-surface-variant/90 font-body-lg text-body-lg mb-stack-lg max-w-xl font-medium leading-relaxed">
                Report garbage, track cleanups, and earn rewards — all in one advanced civic infrastructure platform.
              </p>
              <div className="flex flex-wrap gap-stack-md">
                {session ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-secondary text-on-secondary px-8 md:px-12 py-4 rounded-full font-bold btn-glow hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="bg-secondary text-on-secondary px-8 md:px-12 py-4 rounded-full font-bold btn-glow hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Get Started
                  </button>
                )}
                <button
                  onClick={handleExploreMap}
                  className="border border-secondary text-secondary px-8 md:px-12 py-4 rounded-full font-bold hover:bg-secondary/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Explore Map
                </button>
              </div>
            </div>

            <div className="absolute top-[-10px] right-[-180px] z-20 flex w-[360px] sm:right-[-210px] sm:w-[460px] md:top-[-20px] md:right-[-240px] md:w-[560px] lg:right-[-220px] lg:w-[640px]">
              <Globe className="pointer-events-none h-[360px] w-[360px] sm:h-[460px] sm:w-[460px] md:pointer-events-auto md:h-[560px] md:w-[560px] md:cursor-grab md:active:cursor-grabbing lg:h-[640px] lg:w-[640px]" />
            </div>
          </div>
        </section>

        {/* Stats Banner */}
        <section className="py-20 md:py-24 bg-surface-dim border-y border-secondary/10 reveal">
          <div className="max-w-[1440px] mx-auto px-6 md:px-container-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-y-14 md:gap-stack-lg text-center">
            <div>
              <div className="text-5xl md:text-6xl font-black text-secondary mb-3 filter drop-shadow-[0_0_12px_rgba(65,238,194,0.3)] tracking-tight">
                <CountUp end={10000} suffix="+" duration={2200} />
              </div>
              <div className="text-on-surface-variant font-semibold text-sm uppercase tracking-[0.2em]">Reports Filed</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-black text-secondary mb-3 filter drop-shadow-[0_0_12px_rgba(65,238,194,0.3)] tracking-tight">
                <CountUp end={500} suffix="+" duration={1800} />
              </div>
              <div className="text-on-surface-variant font-semibold text-sm uppercase tracking-[0.2em]">Cities Covered</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-black text-secondary mb-3 filter drop-shadow-[0_0_12px_rgba(65,238,194,0.3)] tracking-tight">
                <CountUp end={1000000} suffix="+" duration={2500} />
              </div>
              <div className="text-on-surface-variant font-semibold text-sm uppercase tracking-[0.2em]">Points Redeemed</div>
            </div>
          </div>
        </section>

        {/* Features Section (Bento Grid) */}
        <section className="py-32 px-6 md:px-container-margin-desktop max-w-[1440px] mx-auto">
          <div className="text-center mb-20 reveal">
            <h2 className="font-headline-lg text-headline-lg sm:text-4xl md:text-5xl mb-stack-sm text-white font-extrabold tracking-tight">A Complete Civic Ecosystem</h2>
            <p className="text-on-surface-variant/95 max-w-2xl mx-auto font-medium text-lg">
              Smarter infrastructure management powered by community participation and real-time data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-stack-md auto-rows-fr reveal">
            {/* Large Card 1 - Report Garbage */}
            <div className="md:col-span-2 glass-card p-8 md:p-stack-lg rounded-xl glow-hover flex flex-col justify-between group cursor-pointer" onClick={handleSignIn}>
              <div>
                <span className="material-symbols-outlined text-secondary text-5xl mb-6 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_6px_rgba(65,238,194,0.3)]">report</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white font-bold tracking-tight">Report Garbage</h3>
                <p className="text-on-surface-variant/90 text-sm md:text-base font-medium">
                  Snap a photo of litter or overflowing bins and our AI will automatically geo-tag and categorize the report for city services.
                </p>
              </div>
            </div>

            {/* Small Card 1 - Explore Map */}
            <div className="glass-card p-6 md:p-stack-md rounded-xl glow-hover flex flex-col justify-between group cursor-pointer" onClick={handleExploreMap}>
              <div>
                <span className="material-symbols-outlined text-secondary text-4xl mb-4 group-hover:scale-115 transition-transform">map</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white font-bold tracking-tight">Explore Map</h3>
                <p className="text-on-surface-variant/90 text-sm font-medium">
                  Real-time heatmaps of city cleanliness and active cleanup zones.
                </p>
              </div>
            </div>

            {/* Small Card 2 - Community Feed */}
            <div className="glass-card p-6 md:p-stack-md rounded-xl glow-hover flex flex-col justify-between group cursor-pointer" onClick={handleSignIn}>
              <div>
                <span className="material-symbols-outlined text-secondary text-4xl mb-4 group-hover:scale-115 transition-transform">groups</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white font-bold tracking-tight">Community Feed</h3>
                <p className="text-on-surface-variant/90 text-sm font-medium">
                  Join local cleanup events and connect with eco-conscious neighbors.
                </p>
              </div>
            </div>

            {/* Small Card 3 - Leaderboard */}
            <div className="glass-card p-6 md:p-stack-md rounded-xl glow-hover flex flex-col justify-between group cursor-pointer" onClick={handleSignIn}>
              <div>
                <span className="material-symbols-outlined text-secondary text-4xl mb-4 group-hover:scale-115 transition-transform">leaderboard</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white font-bold tracking-tight">Leaderboard</h3>
                <p className="text-on-surface-variant/90 text-sm font-medium">
                  Climb the ranks of your city's top environmental guardians.
                </p>
              </div>
            </div>

            {/* Large Card 2 - Marketplace */}
            <div className="md:col-span-2 glass-card p-8 md:p-stack-lg rounded-xl glow-hover flex flex-col justify-between group cursor-pointer" onClick={handleExploreMap}>
              <div>
                <span className="material-symbols-outlined text-secondary text-5xl mb-6 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_6px_rgba(65,238,194,0.3)]">shopping_cart</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white font-bold tracking-tight">Marketplace</h3>
                <p className="text-on-surface-variant/90 text-sm md:text-base font-medium">
                  Redeem your CleanSweep points for eco-friendly products, local transport credits, and municipal tax discounts.
                </p>
              </div>
            </div>

            {/* Small Card 4 - Profile */}
            <div className="glass-card p-6 md:p-stack-md rounded-xl glow-hover flex flex-col justify-between group cursor-pointer" onClick={handleSignIn}>
              <div>
                <span className="material-symbols-outlined text-secondary text-4xl mb-4 group-hover:scale-115 transition-transform">person</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white font-bold tracking-tight">Profile</h3>
                <p className="text-on-surface-variant/90 text-sm font-medium">
                  Track your impact, badges, and personal cleanup history.
                </p>
              </div>
            </div>

            {/* Large Card 3 (Admin Dashboard - Full width in original grid bottom) */}
            <div className="md:col-span-4 glass-card p-6 md:p-stack-md rounded-xl glow-hover flex flex-col sm:flex-row items-start sm:items-center gap-6 group cursor-pointer" onClick={handleSignIn}>
              <div className="bg-secondary/10 p-4 rounded-full sm:shrink-0 transition-colors group-hover:bg-secondary/20">
                <span className="material-symbols-outlined text-secondary text-4xl filter drop-shadow-[0_0_4px_rgba(65,238,194,0.3)]">dashboard</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md text-white font-bold tracking-tight">Admin Dashboard</h3>
                <p className="text-on-surface-variant/90 text-sm font-medium">
                  Municipal tools for dispatching crews, analyzing data trends, and managing civic rewards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-32 px-6 md:px-container-margin-desktop max-w-[1440px] mx-auto overflow-hidden">
          <div className="text-center mb-20 reveal">
            <h2 className="font-headline-lg text-headline-lg sm:text-4xl md:text-5xl mb-stack-sm text-white font-extrabold tracking-tight">The Clean Cycle</h2>
            <p className="text-on-surface-variant font-medium text-lg">Join the movement in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-16 md:gap-stack-lg relative">
            <div className="text-center flex flex-col items-center reveal relative z-10">
              <div className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-2xl mb-6 shadow-[0_0_20px_rgba(65,238,194,0.5)]">1</div>
              <h3 className="font-headline-md text-headline-md mb-4 text-white font-bold">Snap &amp; Report</h3>
              <p className="text-on-surface-variant/90 text-sm md:text-base max-w-xs font-medium">
                See litter? Take a quick photo via the CleanSweep app. AI handles the rest.
              </p>
            </div>

            <div className="text-center flex flex-col items-center reveal relative z-10 md:mt-12">
              <div className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-2xl mb-6 shadow-[0_0_20px_rgba(65,238,194,0.5)]">2</div>
              <h3 className="font-headline-md text-headline-md mb-4 text-white font-bold">AI Verifies</h3>
              <p className="text-on-surface-variant/90 text-sm md:text-base max-w-xs font-medium">
                Our system validates the report and routes it to the nearest municipal cleaning crew.
              </p>
            </div>

            <div className="text-center flex flex-col items-center reveal relative z-10">
              <div className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-2xl mb-6 shadow-[0_0_20px_rgba(65,238,194,0.5)]">3</div>
              <h3 className="font-headline-md text-headline-md mb-4 text-white font-bold">Earn Rewards</h3>
              <p className="text-on-surface-variant/90 text-sm md:text-base max-w-xs font-medium">
                Once confirmed clean, points are dropped into your wallet. Impact made.
              </p>
            </div>

            {/* Decorative Connection Line */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-secondary/0 via-secondary/50 to-secondary/0 -z-0" />
          </div>
        </section>

        {/* Footer CTA Section */}
        <section className="relative py-40 px-6 md:px-container-margin-desktop overflow-hidden border-t border-secondary/10 bg-surface-dim">
          {/* Background Watermark Globe */}
          <div className="absolute inset-0 z-0 flex justify-center items-center opacity-[0.08] pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] text-secondary">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
              <path d="M12 2a10 10 0 0 1 4 7.5A10 10 0 0 1 12 17a10 10 0 0 1-4-7.5A10 10 0 0 1 12 2" />
              <path d="M4.93 4.93a10 10 0 0 0 14.14 14.14" />
              <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
            </svg>
          </div>

          <div className="relative z-10 text-center reveal max-w-4xl mx-auto">
            <h2 className="font-headline-xl text-headline-xl sm:text-5xl md:text-6xl text-white leading-tight font-black tracking-tight mb-0">
              Join the CleanSweep <br />
              <span className="text-secondary filter drop-shadow-[0_0_12px_rgba(65,238,194,0.4)]">Movement</span>
            </h2>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0a0d0b] border-t border-secondary/10">
        {/* Main Footer Content */}
        <div className="max-w-[1440px] mx-auto px-6 md:px-container-margin-desktop py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

            {/* Brand Column */}
            <div className="md:col-span-4 space-y-5">
              <div className="flex items-center gap-3">
                <img alt="CleanSweep Logo" className="h-9 w-9 filter drop-shadow-[0_0_8px_rgba(5,255,163,0.4)]" src="/favicon.svg" />
                <span className="text-xl font-extrabold text-white tracking-tight">CleanSweep</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Empowering communities to report illegal dumping, track cleanups, and earn rewards — building cleaner cities together.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-secondary/20 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-secondary transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-secondary/20 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-secondary transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-secondary/20 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-secondary transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-secondary/20 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-secondary transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">Platform</h4>
              <ul className="space-y-3">
                <li><button onClick={handleReport} className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Report Dumping</button></li>
                <li><button onClick={handleExploreMap} className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Explore Map</button></li>
                <li><button onClick={handleCommunity} className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Community</button></li>
                <li><button onClick={handleExploreMap} className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Marketplace</button></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3">
                <li><button className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">How It Works</button></li>
                <li><button className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Leaderboard</button></li>
                <li><button className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Blog</button></li>
                <li><button className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">FAQs</button></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3">
                <li><button className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Privacy Policy</button></li>
                <li><button className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Terms of Service</button></li>
                <li><button className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Cookie Policy</button></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3">
                <li><button className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Support</button></li>
                <li><button className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Partnerships</button></li>
                <li><button className="text-slate-400 hover:text-secondary text-sm transition-colors bg-transparent border-none cursor-pointer">Feedback</button></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80">
          <div className="max-w-[1440px] mx-auto px-6 md:px-container-margin-desktop py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-slate-500 text-xs font-medium">© 2026 CleanSweep. All rights reserved.</span>
            <span className="text-slate-500 text-xs font-medium">
              Developed by Team <span className="text-secondary font-bold filter drop-shadow-[0_0_8px_rgba(65,238,194,0.6)]">Code Thrifters</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
