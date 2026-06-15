import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import wolframLogo from '../assets/wolfram-logo.svg';
import { 
  Camera, 
  Brain, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  ArrowRight,
  Leaf,
  CheckCircle,
  Truck
} from 'lucide-react';

export default function HowItWorks({ session }) {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
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
      <main className="pt-32 pb-16">
        
        {/* Hero Section */}
        <section className="px-6 max-w-[1440px] mx-auto text-center mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
            How <span className="text-[#41eec2] filter drop-shadow-[0_0_12px_rgba(65,238,194,0.4)]">CleanSweep</span> Works
          </h1>
          <p className="text-[#c4c6cc] text-lg sm:text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            CleanSweep combines community crowdsourcing, advanced Wolfram AI processing, and municipal coordination to keep our cities clean and reward civic action.
          </p>
        </section>

        {/* Step-by-Step Flow */}
        <section className="px-6 max-w-[1200px] mx-auto mb-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="glass-panel p-8 rounded-2xl border border-[#41eec2]/15 flex flex-col items-center text-center relative group hover:border-[#41eec2]/40 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-[#41eec2]/10 border border-[#41eec2]/35 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Camera className="text-[#41eec2] w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>1. Snap & Report</h3>
              <p className="text-[#c4c6cc] text-sm leading-relaxed">
                Notice an illegal trash dump or overflowing bin? Open the CleanSweep app, take a photo, and file a report in seconds. Geolocation and timestamping are handled automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel p-8 rounded-2xl border border-[#41eec2]/15 flex flex-col items-center text-center relative group hover:border-[#41eec2]/40 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-[#41eec2]/10 border border-[#41eec2]/35 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="text-[#41eec2] w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>2. AI Analysis & Routing</h3>
              <p className="text-[#c4c6cc] text-sm leading-relaxed">
                Our neural networks classify the waste types and severity. The municipal dashboard groups reports and designs the most fuel-efficient route using routing calculations.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel p-8 rounded-2xl border border-[#41eec2]/15 flex flex-col items-center text-center relative group hover:border-[#41eec2]/40 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-[#41eec2]/10 border border-[#41eec2]/35 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="text-[#41eec2] w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>3. Verify & Earn</h3>
              <p className="text-[#c4c6cc] text-sm leading-relaxed">
                Once cleanups are completed by municipal crews or volunteer squads, reports are verified. Earn CleanPoints immediately in your profile to redeem for rewards.
              </p>
            </div>

          </div>
        </section>

        {/* Wolfram AI Feature Focus */}
        <section className="px-6 py-20 bg-[#111412]/60 border-y border-[#41eec2]/10 mb-28">
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#DD1100] bg-[#DD1100]/10 border border-[#DD1100]/30 px-4 py-1.5 rounded-full mb-6">
                <img src={wolframLogo} alt="Wolfram" className="w-3.5 h-3.5" />
                Advanced Wolfram Integration
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
                Algorithmic Route Optimization & AI Classification
              </h2>
              <p className="text-[#c4c6cc] text-sm sm:text-base leading-relaxed mb-6 font-medium">
                CleanSweep leverages state-of-the-art computational algorithms to optimize cleanup efforts.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-[#41eec2] w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Smart Image Analysis:</strong>
                    <p className="text-[#c4c6cc] text-xs mt-1">Identifies paper, plastic, organic, metal, or electronic waste, estimating degradability index dynamically.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Truck className="text-[#41eec2] w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Route Optimization:</strong>
                    <p className="text-[#c4c6cc] text-xs mt-1">Computes optimal routing solutions for waste collection services, cutting fuel usage and response times.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-[#41eec2]/20 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#DD1100]/5 rounded-full blur-2xl"></div>
              
              <div className="bg-[#111412] p-4 rounded-xl border border-white/5 font-mono text-xs text-emerald-400">
                <p className="text-slate-500">// Neural Network Classification</p>
                <p>image = Import["user_upload.jpg"];</p>
                <p>classification = ImageClassify[image, "WasteType"];</p>
                <p className="text-[#41eec2] mt-2">Output: {"{"}"type": "plastic", "hazard": 2{"}"}</p>
              </div>

              <div className="bg-[#111412] p-4 rounded-xl border border-white/5 font-mono text-xs text-blue-400">
                <p className="text-slate-500">// Garbage Truck Route Planner</p>
                <p>locations = {"{"}Coordinate1, Coordinate2, ...{"}"};</p>
                <p>optimalRoute = FindShortestTour[locations];</p>
                <p className="text-[#41eec2] mt-2">Output: {"{"}1.8km, {"{"}1, 3, 4, 2, 1{"}"}{"}"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CleanPoints & Rewards Section */}
        <section className="px-6 max-w-[1000px] mx-auto text-center mb-16">
          <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
            Earn CleanPoints, Plant Real Trees
          </h2>
          <p className="text-[#c4c6cc] max-w-2xl mx-auto mb-10">
            For every verified clean, you receive points in your wallet. CleanPoints have real ecological value. Head to the Marketplace to redeem points and fund tree planting projects, completely free!
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/marketplace')}
              className="bg-[#41eec2] hover:bg-[#41eec2]/90 text-[#002118] px-8 py-3.5 rounded-full font-bold btn-glow hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              Go to Marketplace <ArrowRight size={16} />
            </button>
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
