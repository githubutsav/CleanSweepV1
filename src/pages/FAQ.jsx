import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { 
  ChevronDown, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export default function FAQ({ session }) {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const faqItems = [
    {
      question: "What is CleanSweep?",
      answer: "CleanSweep is a civic infrastructure platform designed to optimize public waste management. It enables citizens to report trash dumps, helps municipal services calculate fuel-efficient clean-up routes using advanced math algorithms, and rewards active civic engagement with points redeemable for eco-friendly actions like tree sapling plantings."
    },
    {
      question: "How do I earn CleanPoints?",
      answer: "You earn CleanPoints by filing reports of litter, garbage piles, or overflowing dumpsites. Points are pending when reports are filed. Once the municipal cleanup squad resolves the report and verifies it, the points are fully added to your wallet (up to 70 CleanPoints per verified cleanup)."
    },
    {
      question: "How is Wolfram AI used in CleanSweep?",
      answer: "We integrate Wolfram algorithms on two fronts: First, Image Analysis uses convolutional neural networks to classify waste types and severity from user photos. Second, Route Optimization uses the FindShortestTour tour solver to determine the most fuel-efficient route for municipal trucks picking up multiple garbage spots."
    },
    {
      question: "Is planting a tree in the Marketplace completely free?",
      answer: "Yes! There are no monetary transactions or credit card details required. CleanPoints are earned strictly through civic actions (reporting dumpsites). Redeeming points funds municipal forestry initiatives to plant tree saplings in Lucknow."
    },
    {
      question: "How do local waste collectors partner with CleanSweep?",
      answer: "Licensed recycling centers and waste collectors in Lucknow are listed in our Marketplace directory. Citizens can contact them directly to schedule bulk pickups of sorted plastic, paper, or electronic waste, reducing pressure on municipal landfills."
    },
    {
      question: "Can I clean up dumpsites myself?",
      answer: "Absolutely! CleanSweep allows citizens to act as community cleanup squads. You can view reported garbage dumps on the map, coordinate with neighbors, clean the site, and submit a verification request via the app to claim points."
    }
  ];

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
      <main className="pt-32 pb-20 px-6">
        
        {/* Header Title */}
        <section className="max-w-[1440px] mx-auto text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-6 flex items-center justify-center gap-3" style={{ fontFamily: 'Sora, sans-serif' }}>
            <HelpCircle className="text-[#41eec2] w-10 h-10 sm:w-12 sm:h-12" /> Frequently Asked Questions
          </h1>
          <p className="text-[#c4c6cc] text-base sm:text-lg max-w-xl mx-auto font-medium">
            Find answers to common questions about reports, CleanPoints, Wolfram algorithms, and tree plantations.
          </p>
        </section>

        {/* Accordion Component */}
        <section className="max-w-[800px] mx-auto space-y-4 mb-24">
          {faqItems.map((item, idx) => {
            const isOpen = activeIndex === idx;
            return (
              <div 
                key={idx} 
                className={`glass-panel rounded-2xl border transition-all duration-300 ${
                  isOpen ? 'border-[#41eec2]/45 shadow-[0_0_20px_rgba(65,238,194,0.08)]' : 'border-white/5 hover:border-[#41eec2]/20'
                }`}
              >
                {/* Question Row */}
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-sm sm:text-base text-white transition cursor-pointer select-none"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  <span>{item.question}</span>
                  <ChevronDown 
                    className={`text-[#41eec2] transition-transform duration-300 w-5 h-5 shrink-0 ml-4 ${
                      isOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Answer Box */}
                <div 
                  className={`overflow-hidden transition-all duration-350 ease-in-out`}
                  style={{
                    maxHeight: isOpen ? '250px' : '0px',
                    opacity: isOpen ? 1 : 0
                  }}
                >
                  <div className="px-6 pb-6 pt-1 text-[#c4c6cc] text-xs sm:text-sm leading-relaxed border-t border-white/5">
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
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
