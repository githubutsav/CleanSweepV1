import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import * as THREE from 'three';
import { 
  LayoutDashboard,
  Camera, 
  Map, 
  Megaphone, 
  Store, 
  User, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  Leaf, 
  X, 
  Search, 
  Plus, 
  Phone, 
  MessageSquare,
  Award,
  Info
} from 'lucide-react';
import { useCleanStore } from '../lib/store';
import { supabase } from '../lib/supabaseClient';

// Collectors directory list
const collectors = [
  { name: 'GreenCycle Solutions', rating: 4.8, specialties: ['Plastic', 'Paper', 'Glass'], phone: '555-0101', image: 'https://placehold.co/100x100/166534/ffffff?text=GS' },
  { name: 'EcoSavers Inc.', rating: 4.5, specialties: ['E-Waste', 'Batteries'], phone: '555-0102', image: 'https://placehold.co/100x100/1d4ed8/ffffff?text=EI' },
  { name: 'City Recyclers', rating: 4.9, specialties: ['Scrap Metal', 'Cardboard'], phone: '555-0103', image: 'https://placehold.co/100x100/be123c/ffffff?text=CR' },
  { name: 'Urban Miners', rating: 4.6, specialties: ['All Recyclables'], phone: '555-0104', image: 'https://placehold.co/100x100/a16207/ffffff?text=UM' }
];

// Tree plantation catalog
const treeCatalog = [
  { id: 'neem', name: 'Neem Tree (Azadirachta indica)', points: 100, location: 'Lucknow Eco Park', description: 'Highly resilient air purifier, rich shade provider, and natural pest repellant.', image: '/neem tree.jpg' },
  { id: 'banyan', name: 'Banyan Tree (Ficus benghalensis)', points: 250, location: 'Hazratganj Green Belt', description: 'The national tree of India, forming massive canopies that support rich local biodiversity.', image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=150&q=80' },
  { id: 'peepal', name: 'Peepal Tree (Ficus religiosa)', points: 200, location: 'Kukrail Reserve Forest', description: 'Sacred fig tree famous for 24-hour oxygen release and high ecological significance.', image: '/peepal tree.jpg' },
  { id: 'mango', name: 'Mango Tree (Mangifera indica)', points: 150, location: 'Lohia Park Aliganj', description: 'Generates organic fruit for communities and offers broad-leaf shade filters.', image: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=150&q=80' },
  { id: 'amaltas', name: 'Amaltas Tree (Cassia fistula)', points: 120, location: 'Varanasi Bypass Road', description: 'A beautiful native tree that bursts into golden shower blossoms, enhancing urban green belts.', image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=150&q=80' },
  { id: 'gulmohar', name: 'Gulmohar Tree (Delonix regia)', points: 120, location: 'Kanpur Gomti Marg', description: 'Produces gorgeous fiery-red canopy covers, combating urban heat island impacts.', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=150&q=80' }
];

// Interactive 3D Coin Component using Vanilla Three.js on canvas
function ThreeCoin() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(110, 110);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create 3D Coin geometry
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32);
    
    // Green metallic material
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xfbbf24, // Amber/Gold color
      metalness: 0.9, 
      roughness: 0.1,
      flatShading: false
    });
    const coin = new THREE.Mesh(geometry, material);
    coin.rotation.x = 0.6; // tilted
    scene.add(coin);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 1.5);
    dirLight2.position.set(-5, -3, 2);
    scene.add(dirLight2);

    let animationFrameId;
    let rotationSpeed = 0.015;

    const animate = () => {
      coin.rotation.y += rotationSpeed;
      coin.position.y = Math.sin(Date.now() * 0.002) * 0.08;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = () => {
      rotationSpeed = 0.055;
    };
    const handleMouseLeave = () => {
      rotationSpeed = 0.015;
    };

    const canvasElement = canvasRef.current;
    canvasElement.addEventListener('mousemove', handleMouseMove);
    canvasElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      canvasElement.removeEventListener('mousemove', handleMouseMove);
      canvasElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center w-[110px] h-[110px] shrink-0">
      <canvas ref={canvasRef} className="cursor-pointer" />
    </div>
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { session, profile, redeemPoints, fetchProfile } = useCleanStore();
  
  const [plantingTree, setPlantingTree] = useState(null); // Selected tree for confirm dialog
  const [successTree, setSuccessTree] = useState(null); // Tree that was successfully planted
  const [certificateId, setCertificateId] = useState(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Sync profile data on mount
  useEffect(() => {
    fetchProfile();
    if (session?.user) {
      const checkAdminRole = async () => {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        setIsAdmin(data?.role === 'admin');
      };
      checkAdminRole();
    }
  }, [session, fetchProfile]);

  const handlePlantConfirm = async () => {
    if (!plantingTree) return;
    const currentPoints = profile?.points || 0;
    if (currentPoints < plantingTree.points) {
      alert("Insufficient points! Earn more points by reporting garbage dumpsites and verifying cleans.");
      setPlantingTree(null);
      return;
    }

    const success = await redeemPoints(plantingTree.points);
    if (success) {
      const dummyId = 'TREE-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      // Save certificate persistently to localStorage for profile list
      const newCert = {
        id: dummyId,
        treeName: plantingTree.name,
        location: plantingTree.location,
        timestamp: new Date().toISOString()
      };
      const key = `certificates_${session?.user?.id || 'guest'}`;
      const existingCerts = JSON.parse(localStorage.getItem(key) || '[]');
      existingCerts.push(newCert);
      localStorage.setItem(key, JSON.stringify(existingCerts));

      setCertificateId(dummyId);
      setSuccessTree(plantingTree);
      setPlantingTree(null);
      fetchProfile();
    } else {
      alert("Error processing tree donation. Please try again.");
      setPlantingTree(null);
    }
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
            const isActive = id === 'marketplace';
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
              Marketplace
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
                  {profile.points || 0} CleanPoints
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
                        <span className="text-[9px] font-extrabold" style={{ color: '#41eec2' }}>🌟 {profile.points || 0} CleanPoints</span>
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
                  <button onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition"
                    style={{ color: '#c4c6cc' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,238,194,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <User size={14} /> My Profile
                  </button>
                  <button onClick={() => { setProfileOpen(false); }}
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

        {/* ── Marketplace Content Canvas ── */}
        <main className="flex-1 w-full px-4 sm:px-8 py-8 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 md:pb-12">
          
          {/* Left Column (Points Tracker & Tree Plantation Drives) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Points Dash Header Card */}
            <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>

              <div className="space-y-2.5">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider bg-slate-900 px-3 py-1 rounded-full border border-white/5">
                  Eco-Donations Dashboard
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Your CleanPoints Balance</h2>
                
                <div className="flex items-baseline gap-2 pt-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-amber-400" style={{ textShadow: '0 0 10px rgba(245,158,11,0.3)' }}>
                    🌟 {profile?.points || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">points</span>
                </div>
                <p className="text-slate-400 text-xs font-semibold">
                  Your rank: <span className="text-[#41eec2] capitalize font-bold">{profile?.level || 'Bronze Eco-Warrior'}</span>
                </p>
              </div>

              {/* Interactive 3D Coin Element */}
              <ThreeCoin />
            </div>

            {/* Catalog Title */}
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                <Leaf className="text-[#41eec2]" size={16} /> Tree Plantation Drives
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Clean Sweep partners with local municipal crews in Lucknow to plant native trees. Redeem your points to plant a tree on your behalf—absolutely free, with no monetary transactions involved.
              </p>
              <p className="text-[10px] text-emerald-400/80 italic mt-1 font-semibold">
                * All marketplace rewards and plantation drives are funded through municipal partnerships, local business sponsorships, and CSR initiatives.
              </p>
            </div>

            {/* Tree Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {treeCatalog.map((item) => (
                <div key={item.id} className="glass-panel glass-hover bg-gradient-to-b from-slate-900/30 to-slate-900/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all duration-300 group">
                  <div>
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-950 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      <span className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-sm border border-slate-700/60 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                        🌟 {item.points} pts
                      </span>
                    </div>

                    <div className="space-y-1 mt-3">
                      <h3 className="font-extrabold text-xs text-white group-hover:text-[#41eec2] transition">
                        {item.name}
                      </h3>
                      <p className="text-on-surface-variant text-[11px] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4 pt-3 border-t border-slate-800">
                    <span className="block text-[8px] font-black text-slate-500 uppercase">
                      📍 Plant Site: <span className="text-slate-300 tracking-wide">{item.location}</span>
                    </span>
                    <button
                      onClick={() => setPlantingTree(item)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition duration-200 cursor-pointer text-center active:scale-95 shadow-lg shadow-emerald-950/40"
                    >
                      Plant Tree on My Behalf
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (Trash Collectors Directory) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                <Store className="text-[#41eec2]" size={18} />
                <h2 className="font-extrabold text-sm text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Local Waste Collectors</h2>
              </div>
              
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Contact licensed local recyclers in Lucknow to pick up sorted plastic, metal, and glass recyclables directly from your location.
              </p>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-450 text-[10.5px] font-semibold leading-normal">
                <Info size={13} className="shrink-0 text-amber-450" />
                <span>Note: The call and message features will work on mobiles only.</span>
              </div>

              <div className="space-y-3">
                {collectors.map((c, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5 hover:border-slate-800 transition">
                    <div className="flex items-center gap-3">
                      <img src={c.image} alt={c.name} className="w-10 h-10 rounded-full border border-slate-800 object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[11px] text-white truncate">{c.name}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={10} className="text-yellow-400 fill-current" />
                          <span className="text-[10px] text-slate-400 font-semibold">{c.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {c.specialties.map((s, j) => (
                        <span key={j} className="bg-slate-800 border border-slate-750 text-[9px] font-bold text-slate-350 px-1.5 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 border-t border-slate-850 pt-2.5">
                      <a
                        href={`tel:${c.phone}`}
                        className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg py-1.5 flex items-center justify-center gap-1 text-[9px] font-bold text-white transition text-center cursor-pointer"
                      >
                        <Phone size={10} /> Call
                      </a>
                      <button
                        onClick={() => alert(`Contacting ${c.name} via MessageBoard. Connection complete.`)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-lg py-1.5 flex items-center justify-center gap-1 text-[9px] font-bold text-white transition cursor-pointer"
                      >
                        <MessageSquare size={10} /> Msg
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
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
            { label: 'Profile', icon: User, action: () => navigate('/profile'), isActive: false },
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

      {/* Confirmation Modal */}
      {plantingTree && (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Leaf size={24} className="text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-sm sm:text-base text-white">Confirm Tree Donation</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                Do you want to request planting a <b>{plantingTree.name}</b> in <b>{plantingTree.location}</b>?
              </p>
            </div>

            <div className="bg-slate-950 border border-white/5 p-3 rounded-xl flex justify-between text-xs font-bold">
              <span className="text-slate-400">Deduction Cost:</span>
              <span className="text-amber-400">🌟 {plantingTree.points} pts</span>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setPlantingTree(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePlantConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Certificate Modal */}
      {successTree && (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            {/* Top green ribbon overlay */}
            <div className="absolute top-0 inset-x-0 h-1 bg-[#41eec2]"></div>

            <div className="w-14 h-14 rounded-full bg-[#41eec2]/10 text-[#41eec2] flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-sm sm:text-base text-white">Tree Planted on Your Behalf!</h3>
              <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                Thank you! We have registered your tree planting contribution. A certified native <b>{successTree.name}</b> sapling will be planted in <b>{successTree.location}</b> during the next municipal planting drive.
              </p>
            </div>

            <div className="bg-slate-950 border border-white/5 py-2.5 px-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5 tracking-wider">Plantation ID</span>
              <span className="text-xs font-black text-[#41eec2] font-mono tracking-widest">{certificateId}</span>
            </div>

            <p className="text-[8px] text-slate-500 font-semibold">
              * Progress updates and coordinates of your sapling will be emailed once planting is completed.
            </p>

            <button
              onClick={() => {
                setSuccessTree(null);
                setCertificateId(null);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
