import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { supabase } from '../lib/supabaseClient';
import { useCleanStore } from '../lib/store';
import { 
  LayoutDashboard,
  Camera, 
  Map, 
  Megaphone, 
  Store, 
  User, 
  ShieldCheck, 
  Award, 
  Leaf, 
  CheckCircle2, 
  Clock, 
  X, 
  MapPin, 
  AlertTriangle, 
  Edit2, 
  Check, 
  ArrowRight, 
  Lock,
  Search,
  Plus
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { session, profile, fetchProfile, updateProfileName } = useCleanStore();
  
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Profile editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const fetchUserReports = useCallback(async () => {
    if (!session?.user) return;
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', session.user.id)
        .order('timestamp', { ascending: false });

      if (!error && data) {
        setMyReports(data);
      }
    } catch (err) {
      console.error('Failed to load user reports:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [session]);

  const loadCertificates = useCallback(() => {
    if (!session?.user) return;
    const key = `certificates_${session.user.id}`;
    const certData = JSON.parse(localStorage.getItem(key) || '[]');
    setCertificates(certData);
  }, [session]);

  const checkAdminRole = useCallback(async (userId) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      setIsAdmin(data?.role === 'admin');
    } catch (err) {
      console.error('Failed to check admin role:', err);
    }
  }, []);

  useEffect(() => {
    if (!session?.user) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchUserReports();
    loadCertificates();
    checkAdminRole(session.user.id);
  }, [session, navigate, fetchProfile, fetchUserReports, loadCertificates, checkAdminRole]);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    const success = await updateProfileName(newName.trim());
    if (success) {
      setIsEditingName(false);
      fetchProfile();
    } else {
      alert("Error saving name. Please try again.");
    }
    setSavingName(false);
  };

  // Stats Calculations
  const points = profile?.points || 0;
  const resolvedCount = myReports.filter(r => r.status === 'done').length;
  const awaitingCount = myReports.filter(r => r.status === 'cleared_by_admin').length;
  const pendingCount = myReports.filter(r => r.status === 'pending').length;

  // Waste collected in Kg (resolved count * 15kg + awaiting * 5kg)
  const wasteKg = resolvedCount * 15 + awaitingCount * 5;
  const wasteFormatted = wasteKg >= 1000 ? (wasteKg / 1000).toFixed(1) + 't' : wasteKg + 'kg';

  // Global Rank mock estimation
  const globalRank = `#${Math.max(1, 100 - Math.floor(points / 20))}`;

  // Level thresholds & progress
  let nextLevelName = 'Silver Trash Tracker';
  let levelThreshold = 100;
  let prevThreshold = 0;

  if (points >= 1000) {
    nextLevelName = 'Diamond Eco Legend';
    levelThreshold = 2000;
    prevThreshold = 1000;
  } else if (points >= 500) {
    nextLevelName = 'Diamond Earth Defender';
    levelThreshold = 1000;
    prevThreshold = 500;
  } else if (points >= 250) {
    nextLevelName = 'Platinum Green Knight';
    levelThreshold = 500;
    prevThreshold = 250;
  } else if (points >= 100) {
    nextLevelName = 'Gold Waste Buster';
    levelThreshold = 250;
    prevThreshold = 100;
  }

  const range = levelThreshold - prevThreshold;
  const progressPercent = Math.min(100, Math.max(0, ((points - prevThreshold) / range) * 100));
  const levelNum = points >= 1000 ? 5 : points >= 500 ? 4 : points >= 250 ? 3 : points >= 100 ? 2 : 1;

  // Badges unlock checks
  const achievements = [
    { id: 'earth_first', label: 'Earth First', sub: 'Founding Member', icon: 'eco', unlocked: true },
    { id: 'swift_cleaner', label: 'Swift Cleaner', sub: '3+ Resolved Reports', icon: 'bolt', unlocked: resolvedCount >= 3 },
    { id: 'city_hero', label: 'City Hero', sub: '250+ points earned', icon: 'diversity_3', unlocked: points >= 250 },
    { id: 'zero_waste', label: 'Zero Waste', sub: '50kg+ collected', icon: 'recycle', unlocked: wasteKg >= 50 },
    { id: 'planetary_guardian', label: 'Planetary Guardian', sub: 'Level 5 Locked', icon: 'lock', unlocked: points >= 1000, locked: points < 1000 },
    { id: 'ocean_saver', label: 'Ocean Saver', sub: 'Coastal Sapling Planted', icon: 'lock', unlocked: certificates.length >= 1, locked: certificates.length < 1 }
  ];

  // Grouping reports by zone for charts
  const zoneCounts = {};
  myReports.forEach(r => {
    const zone = r.municipal_name?.replace(' Municipal Corporation', '').toUpperCase() || 'LUCKNOW';
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
  });
  const sortedZones = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxZoneCount = sortedZones[0]?.[1] || 1;

  const getAvatarGradient = (username) => {
    const gradients = [
      'from-emerald-500 to-teal-600',
      'from-cyan-500 to-blue-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-purple-500 to-indigo-600',
      'from-lime-500 to-emerald-600',
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'report',    label: 'My Reports',icon: Camera,          path: '/dashboard/report', state: { viewMode: 'report' } },
    { id: 'map',       label: 'Map',       icon: Map,             path: '/dashboard/report', state: { viewMode: 'explore-map' } },
    { id: 'community', label: 'Community', icon: Megaphone,       path: '/dashboard/report', state: { viewMode: 'community' } },
    { id: 'marketplace', label: 'Marketplace', icon: Store,       path: '/marketplace' },
    { id: 'profile',   label: 'Profile',   icon: User,            path: '/profile' },
  ];

  return (
    <div className="flex min-h-screen bg-[#111412] text-[#e2e3df] font-sans">
      
      {/* ── Sidebar Navigation ── */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 py-6"
        style={{ background: 'rgba(17,20,18,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRight: '1px solid rgba(65,238,194,0.15)' }}
      >
        {/* Brand */}
        <div className="px-6 mb-10">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer select-none hover:opacity-90 transition-all"
          >
            <img src={logo} className="w-7 h-7 filter drop-shadow-[0_0_8px_rgba(65,238,194,0.5)]" alt="CleanSweep" />
            <span className="text-xl font-bold tracking-tight" style={{ color: '#41eec2', fontFamily: 'Sora, sans-serif' }}>CleanSweep</span>
          </div>
        </div>

        {/* User identity */}
        <div className="px-4 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center border shrink-0 overflow-hidden"
            style={{ background: 'rgba(65,238,194,0.1)', borderColor: 'rgba(65,238,194,0.3)' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <User size={18} style={{ color: '#41eec2' }} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: '#41eec2' }}>{profile?.full_name || 'Civic Reporter'}</p>
            <p className="text-[10px] uppercase tracking-widest truncate" style={{ color: '#c4c6cc' }}>{profile?.level || 'Bronze Eco-Warrior'}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-2">
          {navItems.map(({ id, label, icon: Icon, path, state }) => {
            const isActive = id === 'profile';
            return (
              <button
                key={id}
                onClick={() => navigate(path, { state })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-left"
                style={isActive ? {
                  background: '#41eec2',
                  color: '#002118',
                  boxShadow: '0 0 15px rgba(65,238,194,0.4)',
                } : {
                  color: '#c4c6cc',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(65,238,194,0.1)'; e.currentTarget.style.color = '#41eec2'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#c4c6cc'; }}}
              >
                <Icon size={18} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</span>
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-left"
              style={{ color: '#c4c6cc' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(65,238,194,0.1)'; e.currentTarget.style.color = '#41eec2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#c4c6cc'; }}
            >
              <ShieldCheck size={18} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>Admin</span>
            </button>
          )}
        </nav>

        {/* New Report CTA */}
        <div className="px-4 mt-auto">
          <button
            onClick={() => navigate('/dashboard/new-report')}
            className="w-full py-3 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95"
            style={{ background: '#41eec2', color: '#002118', boxShadow: '0 0 20px rgba(65,238,194,0.3)', fontFamily: 'Inter, sans-serif' }}
          >
            New Report
          </button>
        </div>
      </aside>

      {/* ── Main Canvas ── */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">

        {/* ── Top App Bar ── */}
        <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 z-55"
          style={{ background: 'rgba(17,20,18,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(65,238,194,0.15)', boxShadow: '0 0 20px rgba(0,212,170,0.08)' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex md:hidden items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logo} className="w-7 h-7 filter drop-shadow-[0_0_6px_rgba(65,238,194,0.45)]" alt="CleanSweep" />
              <span className="text-lg font-bold" style={{ color: '#41eec2', fontFamily: 'Sora, sans-serif' }}>CleanSweep</span>
            </div>
            <h1 className="hidden md:block text-xl font-bold" style={{ color: '#41eec2', fontFamily: 'Sora, sans-serif', letterSpacing: '-0.01em' }}>
              Profile Impact
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* CleanPoints pill */}
            {profile && (
              <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full border"
                style={{ background: 'rgba(30,32,30,0.4)', borderColor: 'rgba(65,238,194,0.2)' }}
              >
                <Award size={14} style={{ color: '#41eec2' }} />
                <span className="text-xs font-bold" style={{ color: '#41eec2', fontFamily: 'Inter, sans-serif' }}>
                  {points} CleanPoints
                </span>
              </div>
            )}



            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
                style={{ borderColor: 'rgba(65,238,194,0.3)', background: 'rgba(65,238,194,0.1)' }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={17} style={{ color: '#41eec2' }} />
                )}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl z-[200] py-2 border"
                  style={{ background: '#1a1c1a', borderColor: 'rgba(65,238,194,0.2)' }}>
                  <div className="px-4 py-2 text-[10px] truncate border-b pb-2 mb-1" style={{ borderColor: 'rgba(65,238,194,0.1)', color: '#c4c6cc' }}>
                    <span className="block font-bold text-white truncate">{profile?.full_name || 'Civic Reporter'}</span>
                    <span className="block text-[8px] truncate mt-0.5" style={{ color: '#8e9196' }}>{session?.user?.email}</span>
                    {profile && (
                      <div className="mt-1.5 flex flex-col gap-0.5">
                        <span className="text-[9px] font-extrabold" style={{ color: '#41eec2' }}>🌟 {points} CleanPoints</span>
                        <span className="text-[8px] italic" style={{ color: '#68dbae' }}>{profile.level || 'Bronze Eco-Warrior'}</span>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <button onClick={() => { setProfileOpen(false); navigate('/admin'); }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition"
                      style={{ color: '#41eec2' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,238,194,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <ShieldCheck size={14} /> Admin Dashboard
                    </button>
                  )}
                  <button onClick={() => { setProfileOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition"
                    style={{ color: '#c4c6cc' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,238,194,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <User size={14} /> My Profile
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate('/marketplace'); }}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition"
                    style={{ color: '#c4c6cc' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,238,194,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <Store size={14} /> Marketplace
                  </button>
                  <hr className="my-1" style={{ borderColor: 'rgba(65,238,194,0.1)' }} />
                  <button
                    onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
                    className="w-full text-left px-4 py-2 text-xs text-red-400 flex items-center gap-2 transition"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,238,194,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <X size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Profile Content Area ── */}
        <main className="flex-1 w-full px-4 sm:px-8 py-8 max-w-[1440px] mx-auto space-y-12 pb-24 md:pb-12">
          
          {/* Bento Grid Stats */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Profile Bento Card */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#41eec2]/5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-full border-4 border-[#41eec2]/35 p-1 overflow-hidden bg-slate-900/80 flex items-center justify-center text-white text-3xl font-black">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      (profile?.full_name || 'CR').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-[#41eec2] text-[#002118] px-3 py-1 rounded-full text-[10px] font-bold shadow-lg border border-surface">
                    Lvl {levelNum}
                  </div>
                </div>

                <div className="text-center sm:text-left flex-1 min-w-0">
                  
                  {isEditingName ? (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-2 w-full max-w-xs">
                      <input 
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={profile?.full_name || 'Your Name'}
                        className="glass-input w-full px-2.5 py-1 rounded-lg text-sm text-white placeholder-slate-500"
                        maxLength={25}
                      />
                      <button 
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="bg-emerald-600 hover:bg-emerald-500 p-1.5 rounded-lg text-white transition disabled:opacity-50 shrink-0 cursor-pointer"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => setIsEditingName(false)}
                        className="bg-slate-700 hover:bg-slate-650 p-1.5 rounded-lg text-slate-300 transition shrink-0 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center justify-center sm:justify-start gap-2.5">
                      <span className="truncate max-w-[200px]">{profile?.full_name || 'Civic Reporter'}</span>
                      <button 
                        onClick={() => { setNewName(profile?.full_name || ''); setIsEditingName(true); }}
                        className="text-slate-550 hover:text-[#41eec2] p-1 transition cursor-pointer"
                        title="Edit Name"
                      >
                        <Edit2 size={13} />
                      </button>
                    </h2>
                  )}

                  <p className="text-on-surface-variant font-body-md text-xs sm:text-sm mb-6 font-medium">
                    Eco-Guardian since {new Date(session?.user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  
                  <div className="flex flex-wrap gap-3.5 justify-center sm:justify-start">
                    <div className="bg-[#41eec2]/10 border border-[#41eec2]/20 px-4 py-2.5 rounded-xl text-center min-w-[90px]">
                      <p className="text-[9px] text-[#41eec2] font-black uppercase tracking-wider">Reports Fixed</p>
                      <p className="font-stats-lg text-2xl font-bold text-[#41eec2] mt-0.5">{resolvedCount}</p>
                    </div>
                    <div className="bg-[#41eec2]/10 border border-[#41eec2]/20 px-4 py-2.5 rounded-xl text-center min-w-[90px]">
                      <p className="text-[9px] text-[#41eec2] font-black uppercase tracking-wider">Waste Collected</p>
                      <p className="font-stats-lg text-2xl font-bold text-[#41eec2] mt-0.5">{wasteFormatted}</p>
                    </div>
                    <div className="bg-[#41eec2]/10 border border-[#41eec2]/20 px-4 py-2.5 rounded-xl text-center min-w-[90px]">
                      <p className="text-[9px] text-[#41eec2] font-black uppercase tracking-wider">Global Rank</p>
                      <p className="font-stats-lg text-2xl font-bold text-[#41eec2] mt-0.5">{globalRank}</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Next Tier Progress Bento Card */}
            <div className="lg:col-span-5 glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>Next Milestone</h3>
                  <span className="text-[#41eec2] font-bold text-xs bg-[#41eec2]/10 px-2.5 py-0.5 rounded-full border border-[#41eec2]/25">
                    {Math.round(progressPercent)}% Complete
                  </span>
                </div>

                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden mb-4 border border-[#41eec2]/15 p-0.5">
                  <div 
                    className="h-full rounded-full transition-all duration-700 btn-glow" 
                    style={{ 
                      width: `${progressPercent}%`, 
                      background: 'linear-gradient(90deg, #68dbae 0%, #41eec2 100%)',
                      boxShadow: '0 0 10px rgba(65, 238, 194, 0.4)'
                    }}
                  />
                </div>

                <p className="text-on-surface-variant text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                  Earn <span className="text-[#41eec2] font-black">{levelThreshold - points}</span> more points to reach <span className="text-[#41eec2] font-bold">{nextLevelName}</span>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#41eec2]" />
                  <span className="text-xs font-bold text-white">Verified Contributor</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-2">
                  <Leaf size={14} className="text-[#41eec2]" />
                  <span className="text-xs font-bold text-white">Active Planter</span>
                </div>
              </div>
            </div>

          </section>

          {/* Achievement Gallery */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Achievement Gallery</h3>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {achievements.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`glass-panel p-5 rounded-2xl text-center group transition-all duration-300 relative ${
                    item.unlocked 
                      ? 'border-[#41eec2]/25 hover:border-[#41eec2]/50' 
                      : 'opacity-40 grayscale border-white/5'
                  }`}
                >
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center border-2 transition-transform duration-300 ${
                    item.unlocked 
                      ? 'bg-[#41eec2]/10 border-[#41eec2]/35 group-hover:scale-110 group-hover:bg-[#41eec2]/20' 
                      : 'bg-slate-900 border-white/10'
                  }`}>
                    {item.unlocked ? (
                      <span className="text-[#41eec2] font-bold text-lg">
                        {item.id === 'earth_first' && '🌿'}
                        {item.id === 'swift_cleaner' && '⚡'}
                        {item.id === 'city_hero' && '🎖️'}
                        {item.id === 'zero_waste' && '📦'}
                        {item.id === 'planetary_guardian' && '👑'}
                        {item.id === 'ocean_saver' && '🌊'}
                      </span>
                    ) : (
                      <Lock size={18} className="text-on-surface-variant" />
                    )}
                  </div>
                  <p className="font-bold text-xs text-white truncate">{item.label}</p>
                  <p className="text-[8px] text-on-surface-variant font-bold uppercase tracking-wide mt-1 truncate">{item.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline & Maps */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Impact History Timeline */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-8" style={{ fontFamily: 'Sora, sans-serif' }}>Impact History</h3>
                
                {loadingReports ? (
                  <div className="text-center py-16 text-on-surface-variant text-xs animate-pulse">Loading impact history...</div>
                ) : myReports.length === 0 ? (
                  <div className="text-center py-20 text-on-surface-variant text-xs flex flex-col items-center justify-center gap-3">
                    <Clock size={32} className="opacity-30 mb-1" />
                    <span>No reports submitted yet. Submit a report to start your history log!</span>
                    <button 
                      onClick={() => navigate('/dashboard/report', { state: { viewMode: 'report' } })}
                      className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-[#41eec2]/10 text-[#41eec2] border border-[#41eec2]/25 hover:bg-[#41eec2]/20 transition cursor-pointer"
                    >
                      File Report
                    </button>
                  </div>
                ) : (
                  <div className="relative space-y-6 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-3.5 top-2.5 bottom-2.5 w-0.5 bg-slate-800"></div>

                    {myReports.map((report) => {
                      const isResolved = report.status === 'done';
                      const isAwaiting = report.status === 'cleared_by_admin';
                      return (
                        <div key={report.id} className="relative pl-9 group">
                          {/* Inner glowing dot */}
                          <div className={`absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-surface z-10 transition-transform group-hover:scale-125 ${
                            isResolved ? 'bg-[#41eec2] shadow-[0_0_8px_#41eec2]' :
                            isAwaiting ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' :
                            'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          }`} />

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                            <h4 className="font-bold text-xs sm:text-sm text-white">
                              📍 {report.municipal_name || ' Lucknow'}
                            </h4>
                            <span className="text-[10px] text-on-surface-variant font-mono">
                              {new Date(report.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>

                          <p className="text-on-surface-variant text-[11px] sm:text-xs leading-relaxed mb-3 pr-2">
                            {report.description || 'Report filed and image metadata processed for clean verification.'}
                          </p>

                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="bg-[#41eec2]/10 text-[#41eec2] text-[9px] font-bold px-2 py-0.5 rounded border border-[#41eec2]/20">
                              {isResolved ? '+70 Points' : '+20 Points pending'}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                              isResolved ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' :
                              isAwaiting ? 'bg-blue-950/20 text-blue-400 border-blue-500/20' :
                              'bg-amber-950/20 text-amber-400 border-amber-500/20'
                            }`}>
                              {isResolved ? 'Resolved' : isAwaiting ? 'Awaiting Confirm' : 'Pending'}
                            </span>
                          </div>

                          {report.image_url && (
                            <div className="mt-3 w-36 h-20 rounded-lg overflow-hidden border border-white/5 bg-slate-900">
                              <img src={report.image_url} alt="dump log" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button 
                onClick={() => alert("Downloading full impact PDF reports is ready. Your certificates are archived below.")}
                className="w-full mt-6 py-2.5 border border-[#41eec2]/20 rounded-xl text-[#41eec2] font-bold hover:bg-[#41eec2]/5 transition cursor-pointer text-xs"
              >
                Download Full Impact Report (PDF)
              </button>
            </div>

            {/* Right Column: Zone Influence & Certificates */}
            <div className="flex flex-col gap-6">
              
              {/* Zone Influence Card */}
              <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>Zone Influence</h3>
                  <div className="relative h-44 rounded-xl overflow-hidden border border-white/5 mb-6 bg-slate-950">
                    <img className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay" alt="smart city heatmap" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXt4VmmGf9_wkEQ5nghEeUlJIgb93j7goos25bEdMpAtniDVPSgsI2FJ21NWtynaSoLD2dY75gS4UNT9zD5mgArGt7TM9Et8qTwaQeXNLpXa22MtSnZgqKXfm16ByT9E4r373vQGCDiA4Dxc5xz-qZ44ehSWTFDjivyd6N0KfyyfyROlkiyq3gP0xkIlbxaIQ27QoqmG5ft8vTA8I1Y3pyUwCWhfZc1RdaS20C3pNJKnTXVsq1EP9Gr41eUqfC8BW4f5Wa4C6uwxbF" />
                    
                    <div className="absolute inset-0 p-4 flex flex-col justify-center gap-3">
                      {sortedZones.length === 0 ? (
                        <div className="text-center text-[10px] text-on-surface-variant italic">No zone metrics recorded.</div>
                      ) : (
                        sortedZones.map(([zone, count], index) => {
                          const wPct = (count / maxZoneCount) * 100;
                          return (
                            <div key={index} className="bg-surface/85 backdrop-blur-md p-2 rounded-lg border border-[#41eec2]/20">
                              <p className="text-[9px] text-[#41eec2] font-black tracking-wide mb-1">{zone}</p>
                              <div className="h-1.5 w-full bg-[#41eec2]/10 rounded-full">
                                <div className="h-full bg-[#41eec2] rounded-full" style={{ width: `${wPct}%` }}></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="relative w-8 h-8">
                        <div className="absolute inset-0 bg-[#41eec2] rounded-full animate-ping opacity-75"></div>
                        <div className="relative w-8 h-8 bg-[#41eec2] rounded-full border-4 border-surface shadow-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#002118] text-xs font-bold">📍</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-on-surface-variant italic font-medium leading-relaxed">
                  {sortedZones.length === 0 
                    ? "Start reporting clean zones to gain district influence." 
                    : `You are currently contributing active cleanup data across ${sortedZones.length} municipal sector${sortedZones.length > 1 ? 's' : ''}.`}
                </p>
              </div>

              {/* Planted Sapling Certificates */}
              <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                  <Leaf className="text-[#41eec2]" size={16} /> Tree Certificates ({certificates.length})
                </h3>

                {certificates.length === 0 ? (
                  <p className="text-[10px] text-on-surface-variant text-center py-6 leading-relaxed">
                    No tree certificates generated. Go to the Marketplace to redeem points for tree saplings!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="bg-slate-900/80 border border-white/5 rounded-xl p-3 flex flex-col gap-1 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-[#41eec2]/10 rounded-bl-xl flex items-center justify-center">
                          <Leaf size={10} className="text-[#41eec2]" />
                        </div>
                        <div className="flex justify-between items-center text-[8px] font-black text-on-surface-variant font-mono uppercase tracking-wider">
                          <span>ID: {cert.id}</span>
                          <span>{new Date(cert.timestamp).toLocaleDateString()}</span>
                        </div>
                        <h5 className="font-bold text-xs text-white mt-1">{cert.treeName}</h5>
                        <span className="text-[9px] text-on-surface-variant font-semibold flex items-center gap-0.5">
                          📍 Site: {cert.location}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </section>

        </main>

        {/* ── Mobile Bottom Navigation (Matching DashboardOverview/Home) ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-between items-center px-6 py-3 z-50"
          style={{ background: 'rgba(17,20,18,0.85)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(65,238,194,0.15)' }}
        >
          {[
            { label: 'Home', icon: LayoutDashboard, action: () => navigate('/dashboard') },
            { label: 'Map', icon: Map, action: () => navigate('/dashboard/report', { state: { viewMode: 'explore-map' } }) },
            { label: '', icon: Plus, action: () => navigate('/dashboard/new-report'), isCenter: true },
            { label: 'Social', icon: Megaphone, action: () => navigate('/dashboard/report', { state: { viewMode: 'community' } }) },
            { label: 'Profile', icon: User, action: () => {}, isActive: true },
          ].map(({ label, icon: Icon, action, isCenter, isActive }, i) => (
            <button
              key={i}
              onClick={action}
              className="flex flex-col items-center gap-1 transition-all"
              style={isCenter ? {
                width: 48, height: 48, borderRadius: '50%', background: '#41eec2',
                color: '#002118', boxShadow: '0 0 15px rgba(65,238,194,0.5)', marginTop: -20,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              } : { 
                color: isActive ? '#41eec2' : '#c4c6cc'
              }}
            >
              <Icon size={isCenter ? 22 : 20} />
              {label && <span className="text-[10px] font-bold">{label}</span>}
            </button>
          ))}
        </nav>

      </div>
    </div>
  );
}
