import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCleanStore } from '../lib/store';
import logo from '../assets/logo.svg';
import {
  Camera, Map, Megaphone, Store, User, ShieldCheck,
  TrendingUp, Award, Zap, CheckCircle2, Heart, LayoutDashboard,
  X, Bell, Search, Plus, ChevronRight, Activity, Clock
} from 'lucide-react';

// ── Shared sidebar component ──────────────────────────────────────────────────
function Sidebar({ profile, isAdmin, activePage }) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'report',    label: 'My Reports',icon: Camera,          path: '/dashboard/report' },
    { id: 'map',       label: 'Map',       icon: Map,             path: '/dashboard/report' },
    { id: 'community', label: 'Community', icon: Megaphone,       path: '/dashboard/report' },
    { id: 'marketplace', label: 'Marketplace', icon: Store,       path: '/marketplace' },
    { id: 'profile',   label: 'Profile',   icon: User,            path: '/profile' },
  ];

  return (
    <aside
      className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 py-6"
      style={{
        background: 'rgba(17,20,18,0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(65,238,194,0.15)',
      }}
    >
      {/* Brand */}
      <div className="px-6 mb-8">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer select-none hover:opacity-90 transition-all"
        >
          <img src={logo} className="w-7 h-7 filter drop-shadow-[0_0_8px_rgba(65,238,194,0.5)]" alt="CleanSweep" />
          <span className="text-xl font-bold tracking-tight" style={{ color: '#41eec2', fontFamily: 'Sora, sans-serif' }}>
            CleanSweep
          </span>
        </div>
      </div>

      {/* User identity */}
      <div className="px-4 mb-8 flex items-center gap-3">
        <div
          className="relative w-12 h-12 rounded-lg flex items-center justify-center border-2 shrink-0 overflow-hidden"
          style={{ background: 'rgba(65,238,194,0.1)', borderColor: 'rgba(65,238,194,0.25)' }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="profile" className="w-full h-full object-cover" />
          ) : (
            <User size={20} style={{ color: '#41eec2' }} />
          )}
          {/* Online indicator */}
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
            style={{ background: '#41eec2', borderColor: '#111412' }}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate text-white">{profile?.full_name || 'Civic Reporter'}</p>
          <p className="text-[10px] uppercase tracking-widest truncate" style={{ color: '#c4c6cc' }}>
            {profile?.level || 'Bronze Eco-Warrior'}
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map(({ id, label, icon: Icon, path }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => {
                if (id === 'map') navigate('/dashboard/report', { state: { viewMode: 'explore-map' } });
                else if (id === 'community') navigate('/dashboard/report', { state: { viewMode: 'community' } });
                else navigate(path);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-left"
              style={isActive ? {
                background: '#41eec2',
                color: '#002118',
                boxShadow: '0 0 15px rgba(65,238,194,0.4)',
              } : { color: '#c4c6cc' }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(65,238,194,0.1)'; e.currentTarget.style.color = '#41eec2'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#c4c6cc'; } }}
            >
              <Icon size={18} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                {label}
              </span>
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
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
              Admin
            </span>
          </button>
        )}
      </nav>

      {/* New Report CTA */}
      <div className="px-4 mt-auto">
        <button
          onClick={() => navigate('/dashboard/new-report')}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          style={{ background: '#41eec2', color: '#002118', boxShadow: '0 0 20px rgba(65,238,194,0.3)', fontFamily: 'Inter, sans-serif' }}
        >
          <Plus size={16} /> New Report
        </button>
      </div>
    </aside>
  );
}

// ── Glowing line chart (SVG) ─────────────────────────────────────────────────
function CleanlinessChart({ reports }) {
  // Build last-7-days data from reports
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const counts = Array(7).fill(0);

  reports.forEach(r => {
    const d = new Date(r.timestamp);
    const diff = Math.round((today - d) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) {
      const dayIdx = (today.getDay() + 7 - diff) % 7;
      counts[dayIdx]++;
    }
  });

  // Normalize to chart height (max → bottom = 30, 0 → 270)
  const maxCount = Math.max(...counts, 1);
  const chartH = 260;
  const pts = counts.map((c, i) => {
    const x = (i / 6) * 760 + 20;
    const y = chartH - ((c / maxCount) * (chartH - 40)) - 20;
    return `${x},${y}`;
  });

  const pathD = `M${pts.join(' L')}`;
  const areaD = `M${pts[0]} L${pts.slice(1).join(' L')} L780,${chartH} L20,${chartH} Z`;

  return (
    <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#41eec2" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#41eec2" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={areaD} fill="url(#chartGradient)" />
      <path d={pathD} fill="none" stroke="#41eec2" strokeWidth="3.5" filter="url(#glow)" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((pt, i) => {
        const [x, y] = pt.split(',');
        return <circle key={i} cx={x} cy={y} r="5" fill="#41eec2" className="animate-pulse" />;
      })}
    </svg>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardOverview({ session, isAdmin }) {
  const navigate = useNavigate();
  const { profile, fetchProfile, addPoints } = useCleanStore();

  const [reports, setReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);

  // Fetch profile & reports
  useEffect(() => {
    if (session?.user) fetchProfile();
  }, [session, fetchProfile]);

  // Daily login bonus
  useEffect(() => {
    if (session?.user && profile) {
      const today = new Date().toDateString();
      const key = `last_login_reward_${session.user.id}`;
      if (localStorage.getItem(key) !== today) {
        localStorage.setItem(key, today);
        addPoints(10);
      }
    }
  }, [session, profile, addPoints]);

  const fetchReports = useCallback(async () => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('timestamp', { ascending: false });
    if (data) {
      setReports(data);
      setMyReports(data.filter(r => r.user_id === session?.user?.id));
    }
  }, [session]);

  useEffect(() => {
    fetchReports();
    const channel = supabase
      .channel('dash-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchReports)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchReports]);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const activeReports = reports.filter(r => r.status === 'pending' || r.status === 'cleared_by_admin').length;
  const clearedReports = reports.filter(r => r.status === 'done').length;
  const myActiveReports = myReports.filter(r => r.status === 'pending' || r.status === 'cleared_by_admin').length;

  // Impact score: points × 1.5 (capped display at 9999)
  const impactScore = Math.min(Math.round((profile?.points || 0) * 1.5 + myReports.length * 10), 9999);

  // Next reward threshold
  const REWARD_TIERS = [100, 250, 500, 1000, 2500];
  const pts = profile?.points || 0;
  const nextTier = REWARD_TIERS.find(t => t > pts) || 2500;
  const prevTier = REWARD_TIERS.filter(t => t <= pts).slice(-1)[0] || 0;
  const rewardProgress = prevTier === nextTier ? 100 : Math.round(((pts - prevTier) / (nextTier - prevTier)) * 100);

  // Streak from localStorage
  const loginStreak = parseInt(localStorage.getItem(`streak_${session?.user?.id}`) || '1', 10);
  const streakMultiplier = loginStreak >= 30 ? 2.0 : loginStreak >= 14 ? 1.5 : loginStreak >= 7 ? 1.25 : 1.0;
  const nextMultiplier = streakMultiplier >= 2.0 ? 2.0 : streakMultiplier >= 1.5 ? 2.0 : 1.5;
  const streakPct = loginStreak >= 30 ? 100 : Math.round((loginStreak % 14) / 14 * 100);

  // Yesterday active reports delta
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const yesterdayReports = reports.filter(r => new Date(r.timestamp).toDateString() === yesterday).length;
  const todayReports = reports.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString()).length;
  const reportDelta = todayReports - yesterdayReports;

  // Recent activity items from my reports
  const recentActivity = myReports.slice(0, 4).map((r, i) => {
    const icons = [CheckCircle2, Heart, Camera, Award];
    const colors = ['#41eec2', '#68dbae', '#41eec2', '#bac8dc'];
    const labels = {
      done: 'Cleanup Verified',
      cleared_by_admin: 'Awaiting Your Confirm',
      pending: 'Report Pending',
    };
    return {
      id: r.id,
      icon: icons[i % 4],
      color: colors[i % 4],
      title: labels[r.status] || 'Report Filed',
      subtitle: r.category ? `${r.category}${r.municipal_name ? ' · ' + r.municipal_name.replace(' Municipal Corporation', '') : ''}` : (r.municipal_name || 'Unknown area'),
      time: formatRelativeTime(r.timestamp),
      report: r,
    };
  });

  function formatRelativeTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
    if (d === 1) return 'Yesterday';
    return `${d} days ago`;
  }

  // Active zone - pick municipal area with most active reports
  const areaCounts = {};
  reports.filter(r => r.status === 'pending').forEach(r => {
    const area = r.municipal_name?.replace(' Municipal Corporation', '') || 'Unknown';
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });
  const topArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Lucknow';

  return (
    <div className="flex min-h-screen bg-[#111412] text-[#e2e3df] font-sans overflow-x-hidden relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-gradient-to-b from-[#0D1B2A]/20 via-[#111412] to-[#111412]" />

      {/* Sidebar */}
      <Sidebar profile={profile} isAdmin={isAdmin} activePage="dashboard" />

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">

        {/* Top Bar */}
        <header
          className="flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50"
          style={{
            background: 'rgba(17,20,18,0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(65,238,194,0.15)',
            boxShadow: '0 0 20px rgba(0,212,170,0.08)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Mobile brand */}
            <div className="flex md:hidden items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logo} className="w-7 h-7 filter drop-shadow-[0_0_6px_rgba(65,238,194,0.45)]" alt="CleanSweep" />
              <span className="text-lg font-bold" style={{ color: '#41eec2', fontFamily: 'Sora, sans-serif' }}>CleanSweep</span>
            </div>
            <h1 className="hidden md:block text-xl font-bold" style={{ color: '#41eec2', fontFamily: 'Sora, sans-serif', letterSpacing: '-0.01em' }}>
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Points pill */}
            {profile && (
              <div
                className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full border"
                style={{ background: 'rgba(30,32,30,0.4)', borderColor: 'rgba(65,238,194,0.2)' }}
              >
                <span style={{ color: '#41eec2' }}>🌿</span>
                <span className="text-sm font-bold" style={{ color: '#41eec2', fontFamily: 'Inter, sans-serif' }}>
                  {profile.points || 0} CleanPoints
                </span>
              </div>
            )}



            {/* Profile avatar */}
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
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl z-[200] py-2 border"
                  style={{ background: '#1a1c1a', borderColor: 'rgba(65,238,194,0.2)' }}
                >
                  <div className="px-4 py-2 text-[10px] border-b pb-2 mb-1" style={{ borderColor: 'rgba(65,238,194,0.1)', color: '#c4c6cc' }}>
                    <span className="block font-bold text-white truncate">{profile?.full_name || 'Civic Reporter'}</span>
                    <span className="block text-[8px] truncate mt-0.5" style={{ color: '#8e9196' }}>{session?.user?.email}</span>
                    <span className="text-[9px] font-bold mt-1 block" style={{ color: '#41eec2' }}>🌟 {pts} CleanPoints</span>
                  </div>
                  {isAdmin && (
                    <button onClick={() => navigate('/admin')}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2"
                      style={{ color: '#41eec2' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,238,194,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    ><ShieldCheck size={13} /> Admin Dashboard</button>
                  )}
                  <button onClick={() => navigate('/profile')}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2"
                    style={{ color: '#c4c6cc' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,238,194,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  ><User size={13} /> My Profile</button>
                  <button onClick={() => navigate('/marketplace')}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2"
                    style={{ color: '#c4c6cc' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,238,194,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  ><Store size={13} /> Marketplace</button>
                  <hr className="my-1" style={{ borderColor: 'rgba(65,238,194,0.1)' }} />
                  <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
                    className="w-full text-left px-4 py-2 text-xs text-red-400 flex items-center gap-2"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,238,194,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  ><X size={13} /> Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 p-6 md:p-10 max-w-[1440px] mx-auto w-full space-y-10 pb-24 md:pb-10">

          {/* ── At a Glance ── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.01em' }}>
                At a Glance
              </h2>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#41eec2' }}>
                Live System Data
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Reports */}
              <div
                className="p-6 rounded-xl relative overflow-hidden group cursor-pointer transition-all duration-300"
                style={{ background: 'rgba(17,20,18,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(65,238,194,0.15)' }}
                onClick={() => navigate('/dashboard/report', { state: { viewMode: 'explore-map' } })}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(65,238,194,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(65,238,194,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(65,238,194,0.15)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity size={64} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#c4c6cc', fontFamily: 'Inter, sans-serif' }}>
                    Active Reports
                  </span>
                  <span className="text-5xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#e2e3df', textShadow: '0 0 10px rgba(65,238,194,0.5)' }}>
                    {activeReports}
                  </span>
                  <div className="mt-4 flex items-center gap-1.5" style={{ color: '#41eec2' }}>
                    <TrendingUp size={16} />
                    <span className="text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {reportDelta >= 0 ? `+${reportDelta}` : reportDelta} from yesterday
                    </span>
                  </div>
                </div>
              </div>

              {/* Impact Score */}
              <div
                className="p-6 rounded-xl relative overflow-hidden group cursor-pointer transition-all duration-300"
                style={{ background: 'rgba(17,20,18,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(65,238,194,0.15)' }}
                onClick={() => navigate('/profile')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(65,238,194,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(65,238,194,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(65,238,194,0.15)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Award size={64} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#c4c6cc', fontFamily: 'Inter, sans-serif' }}>
                    Impact Score
                  </span>
                  <span className="text-5xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#e2e3df', textShadow: '0 0 10px rgba(65,238,194,0.5)' }}>
                    {impactScore}
                  </span>
                  <div className="mt-4 flex items-center gap-1.5" style={{ color: '#41eec2' }}>
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {clearedReports} areas cleaned
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Reward */}
              <div
                className="p-6 rounded-xl relative overflow-hidden group cursor-pointer transition-all duration-300"
                style={{ background: 'rgba(17,20,18,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(65,238,194,0.15)' }}
                onClick={() => navigate('/marketplace')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(65,238,194,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(65,238,194,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(65,238,194,0.15)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Award size={64} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#c4c6cc', fontFamily: 'Inter, sans-serif' }}>
                    Next Reward
                  </span>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#e2e3df' }}>
                      {pts}
                    </span>
                    <span className="text-sm mb-2" style={{ color: '#c4c6cc' }}>/ {nextTier} pts</span>
                  </div>
                  <div className="mt-4 w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(51,53,51,0.8)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${rewardProgress}%`, background: 'linear-gradient(to right, #68dbae, #41eec2)', boxShadow: '0 0 10px rgba(65,238,194,0.5)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Chart + Recent Activity ── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cleanliness Chart */}
            <div
              className="lg:col-span-2 p-8 rounded-2xl flex flex-col"
              style={{ background: 'rgba(17,20,18,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(65,238,194,0.15)' }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-semibold" style={{ fontFamily: 'Sora, sans-serif', color: '#e2e3df' }}>
                    City Cleanliness Index
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#c4c6cc', fontFamily: 'Inter, sans-serif' }}>
                    Reports filed per day in your area
                  </p>
                </div>

              </div>
              <div className="flex-1 w-full min-h-[280px] relative">
                <CleanlinessChart reports={reports} />
                <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs px-2" style={{ color: '#c4c6cc', opacity: 0.6 }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className="p-6 rounded-2xl flex flex-col"
              style={{ background: 'rgba(17,20,18,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(65,238,194,0.15)' }}
            >
              <h3 className="text-xl font-semibold mb-6" style={{ fontFamily: 'Sora, sans-serif', color: '#e2e3df' }}>
                Recent Activity
              </h3>
              <div className="space-y-5 flex-1 overflow-y-auto pr-1" style={{ maxHeight: '320px' }}>
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10" style={{ color: '#c4c6cc' }}>
                    <Clock size={28} className="mb-3 opacity-40" />
                    <p className="text-sm text-center opacity-60">No activity yet. File your first report!</p>
                    <button
                      onClick={() => navigate('/dashboard/report')}
                      className="mt-4 text-xs font-bold px-4 py-2 rounded-lg transition-all"
                      style={{ background: 'rgba(65,238,194,0.1)', color: '#41eec2', border: '1px solid rgba(65,238,194,0.2)' }}
                    >
                      File a Report →
                    </button>
                  </div>
                ) : (
                  recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 items-start group cursor-pointer"
                      onClick={() => navigate('/dashboard/report')}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200"
                        style={{ background: `${item.color}15`, borderColor: `${item.color}25`, color: item.color }}
                      >
                        <item.icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold transition-colors" style={{ color: '#e2e3df', fontFamily: 'Inter, sans-serif' }}>
                          {item.title}
                        </p>
                        <p className="text-xs mt-0.5 truncate max-w-[160px]" style={{ color: '#c4c6cc' }}>{item.subtitle}</p>
                        <span className="text-xs mt-1 block" style={{ color: 'rgba(65,238,194,0.6)' }}>{item.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => navigate('/dashboard/report')}
                className="w-full mt-6 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ color: '#41eec2', border: '1px solid rgba(65,238,194,0.2)', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,238,194,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                View All History
              </button>
            </div>
          </section>

          {/* ── Bottom Row ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Zone Card */}
            <div
              className="rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300"
              style={{ background: 'rgba(17,20,18,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(65,238,194,0.15)' }}
              onClick={() => navigate('/dashboard/report', { state: { viewMode: 'explore-map' } })}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(65,238,194,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(65,238,194,0.15)'; }}
            >
              {/* Map visual placeholder with gradient overlay */}
              <div className="h-48 relative overflow-hidden">
                <div
                  className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                  style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #0a2e20 40%, #041a10 100%)' }}
                >
                  {/* Simulated map grid */}
                  <svg className="w-full h-full opacity-30" viewBox="0 0 400 200">
                    {Array.from({ length: 10 }, (_, i) => (
                      <line key={`h${i}`} x1="0" y1={i * 22} x2="400" y2={i * 22} stroke="#41eec2" strokeWidth="0.5" />
                    ))}
                    {Array.from({ length: 20 }, (_, i) => (
                      <line key={`v${i}`} x1={i * 22} y1="0" x2={i * 22} y2="200" stroke="#41eec2" strokeWidth="0.5" />
                    ))}
                    {/* Map pins */}
                    {reports.slice(0, 6).map((_, i) => (
                      <g key={i}>
                        <circle cx={60 + i * 55} cy={80 + (i % 3) * 30} r="8" fill="rgba(65,238,194,0.2)" className="animate-pulse" />
                        <circle cx={60 + i * 55} cy={80 + (i % 3) * 30} r="4" fill="#41eec2" />
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #111412, transparent)' }} />
                <div className="absolute bottom-4 left-6">
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block"
                    style={{ background: '#41eec2', color: '#002118' }}
                  >LIVE FEED</span>
                  <h4 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                    Active CleanZone: {topArea}
                  </h4>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm mb-6" style={{ color: '#c4c6cc', fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}>
                  {activeReports} active reports across your area. {clearedReports} zones confirmed clean by citizens.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(3, activeReports))].map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                        style={{ background: `hsl(${160 + i * 30}, 60%, 30%)`, borderColor: '#111412', color: '#41eec2' }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                    {activeReports > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                        style={{ background: '#282b28', borderColor: '#111412', color: '#c4c6cc' }}>
                        +{activeReports - 3}
                      </div>
                    )}
                  </div>
                  <button
                    className="flex items-center gap-2 text-sm font-semibold transition-all"
                    style={{ color: '#41eec2', fontFamily: 'Inter, sans-serif' }}
                  >
                    View Map <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Carbon Offset / Streak Card */}
            <div
              className="p-8 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-300"
              style={{ background: 'rgba(17,20,18,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(65,238,194,0.15)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(65,238,194,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(65,238,194,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(65,238,194,0.15)'; e.currentTarget.style.boxShadow = ''; }}
            >
              <div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
                  style={{ background: 'rgba(65,238,194,0.15)', boxShadow: '0 0 20px rgba(65,238,194,0.2)' }}
                >
                  <Zap size={22} style={{ color: '#41eec2' }} />
                </div>
                <h4 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Sora, sans-serif', color: '#e2e3df' }}>
                  Carbon Offset Multiplier
                </h4>
                <p className="text-sm" style={{ color: '#c4c6cc', fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}>
                  {loginStreak >= 7
                    ? `Your ${loginStreak}-day streak has activated a ${streakMultiplier}x CleanPoints multiplier for all verified reports.`
                    : `Keep logging in daily! Your current streak is ${loginStreak} day${loginStreak !== 1 ? 's' : ''}. Reach 7 days for a 1.25x bonus.`
                  }
                </p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-2" style={{ color: '#c4c6cc', fontFamily: 'Inter, sans-serif' }}>
                    <span>Streak Progress</span>
                    <span>{streakPct}% to {nextMultiplier}x</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#282b28' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${streakPct}%`, background: '#41eec2', boxShadow: '0 0 10px rgba(65,238,194,0.5)' }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dashboard/report')}
                  className="p-3 rounded-xl transition-all"
                  style={{ background: 'rgba(17,20,18,0.8)', border: '1px solid rgba(65,238,194,0.2)', color: '#41eec2' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,238,194,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(17,20,18,0.8)'}
                >
                  <TrendingUp size={18} />
                </button>
              </div>
            </div>
          </section>

        </div>{/* end content */}

        {/* ── Mobile Bottom Nav ── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex justify-between items-center px-6 py-3 z-50"
          style={{ background: 'rgba(17,20,18,0.85)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(65,238,194,0.15)' }}
        >
          {[
            { label: 'Home', icon: LayoutDashboard, action: () => navigate('/dashboard') },
            { label: 'Map', icon: Map, action: () => navigate('/dashboard/report', { state: { viewMode: 'explore-map' } }) },
            { label: '', icon: Plus, action: () => navigate('/dashboard/new-report'), isCenter: true },
            { label: 'Social', icon: Megaphone, action: () => navigate('/dashboard/report', { state: { viewMode: 'community' } }) },
            { label: 'Profile', icon: User, action: () => navigate('/profile'), isActive: false },
          ].map(({ label, icon: Icon, action, isCenter }, i) => (
            <button
              key={i}
              onClick={action}
              className="flex flex-col items-center gap-1 transition-all"
              style={isCenter ? {
                width: 48, height: 48, borderRadius: '50%', background: '#41eec2',
                color: '#002118', boxShadow: '0 0 15px rgba(65,238,194,0.5)', marginTop: -20,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              } : { color: '#c4c6cc' }}
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
