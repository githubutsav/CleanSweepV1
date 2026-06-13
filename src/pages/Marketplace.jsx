import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { 
  Star, 
  CheckCircle2, 
  Leaf, 
  Store, 
  ArrowLeft,
  Phone,
  MessageSquare,
  User
} from 'lucide-react';
import { useCleanStore } from '../lib/store';

// Collectors directory list
const collectors = [
  { name: 'GreenCycle Solutions', rating: 4.8, specialties: ['Plastic', 'Paper', 'Glass'], phone: '555-0101', image: 'https://placehold.co/100x100/166534/ffffff?text=GS' },
  { name: 'EcoSavers Inc.', rating: 4.5, specialties: ['E-Waste', 'Batteries'], phone: '555-0102', image: 'https://placehold.co/100x100/1d4ed8/ffffff?text=EI' },
  { name: 'City Recyclers', rating: 4.9, specialties: ['Scrap Metal', 'Cardboard'], phone: '555-0103', image: 'https://placehold.co/100x100/be123c/ffffff?text=CR' },
  { name: 'Urban Miners', rating: 4.6, specialties: ['All Recyclables'], phone: '555-0104', image: 'https://placehold.co/100x100/a16207/ffffff?text=UM' }
];

// Tree plantation catalog
const treeCatalog = [
  { id: 'neem', name: 'Neem Tree (Azadirachta indica)', points: 100, location: 'Lucknow Eco Park', description: 'Highly resilient air purifier, rich shade provider, and natural pest repellant.', image: 'https://images.unsplash.com/photo-1601574901249-16279c24e83f?auto=format&fit=crop&w=150&q=80' },
  { id: 'banyan', name: 'Banyan Tree (Ficus benghalensis)', points: 250, location: 'Hazratganj Green Belt', description: 'The national tree of India, forming massive canopies that support rich local biodiversity.', image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=150&q=80' },
  { id: 'peepal', name: 'Peepal Tree (Ficus religiosa)', points: 200, location: 'Kukrail Reserve Forest', description: 'Sacred fig tree famous for 24-hour oxygen release and high ecological significance.', image: 'https://images.unsplash.com/photo-1626202111162-835fb080db7d?auto=format&fit=crop&w=150&q=80' },
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
    <div className="relative flex items-center justify-center w-[110px] h-[110px]">
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

  // Sync profile data on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
    } else {
      alert("Error processing tree donation. Please try again.");
      setPlantingTree(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-3 sm:p-6 pt-6 relative font-sans flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full flex items-center justify-between mb-8 max-w-5xl bg-slate-800/40 backdrop-blur border border-slate-700/50 px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl shadow-xl relative z-50">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer select-none hover:opacity-90 active:scale-95 transition-all"
        >
          <img src="/favicon.svg" className="w-7 h-7 sm:w-8 sm:h-8 filter drop-shadow-[0_0_6px_rgba(5,255,163,0.45)]" alt="CleanSweep Logo" />
          <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">CleanSweep</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/profile')}
            className="bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-xl flex items-center gap-1.5 transition cursor-pointer text-xs active:scale-95"
          >
            <User size={14} /> <span>My Profile</span>
          </button>
          <button 
            onClick={() => navigate('/')}
            className="bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-xl flex items-center gap-1.5 transition cursor-pointer text-xs active:scale-95"
          >
            <ArrowLeft size={14} /> <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Points Tracker & Tree Plantation Drives) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Points Dash Header Card */}
          <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 p-6 rounded-3xl shadow-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider bg-slate-855 px-3 py-1 rounded-full border border-slate-800">
                Eco-Donations Dashboard
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Your CleanPoints Balance</h2>
              
              <div className="flex items-baseline gap-2 pt-1.5">
                <span className="text-3xl sm:text-4xl font-black text-amber-400">
                  🌟 {profile?.points || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">points</span>
              </div>
              <p className="text-slate-455 text-[10px] font-bold">
                Your rank: <span className="text-emerald-400 capitalize">{profile?.level || 'Bronze Eco-Warrior'}</span>
              </p>
            </div>

            {/* Interactive 3D Coin Element */}
            <ThreeCoin />
          </div>

          {/* Catalog Title */}
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Leaf className="text-emerald-400" size={16} /> Tree Plantation Drives
            </h3>
            <p className="text-[10px] text-slate-400">
              Clean Sweep partners with local municipal crews in Lucknow to plant native trees. Redeem your points to plant a tree on your behalf—absolutely free, with no monetary transactions involved.
            </p>
          </div>

          {/* Tree Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {treeCatalog.map((item) => (
              <div key={item.id} className="bg-gradient-to-b from-slate-800/30 to-slate-900/30 border border-slate-700/40 hover:border-emerald-500/25 rounded-2xl p-4 flex flex-col gap-3 shadow-lg hover:shadow-emerald-950/10 transition-all duration-300 group">
                <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm border border-slate-700 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                    🌟 {item.points} pts
                  </span>
                </div>

                <div className="space-y-1 flex-1">
                  <h3 className="font-extrabold text-xs text-white group-hover:text-emerald-400 transition">
                    {item.name}
                  </h3>
                  <p className="text-slate-455 text-[10px] leading-relaxed">
                    {item.description}
                  </p>
                  <span className="block text-[8px] font-black text-slate-500 uppercase pt-1">
                    📍 Plant Site: <span className="text-slate-300">{item.location}</span>
                  </span>
                </div>

                <button
                  onClick={() => setPlantingTree(item)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition duration-200 cursor-pointer text-center active:scale-95 shadow-lg shadow-emerald-950/40"
                >
                  Plant Tree on My Behalf
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (Trash Collectors Directory) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 p-5 rounded-3xl shadow-xl space-y-4">
            <div className="border-b border-slate-700/60 pb-3 flex items-center gap-2">
              <Store className="text-emerald-450" size={18} />
              <h2 className="font-extrabold text-sm text-white">Local Waste Collectors</h2>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Contact licensed local recyclers in Lucknow to pick up sorted plastic, metal, and glass recyclables directly from your location.
            </p>

            <div className="space-y-3">
              {collectors.map((c, idx) => (
                <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2.5 hover:border-slate-700 transition">
                  <div className="flex items-center gap-3">
                    <img src={c.image} alt={c.name} className="w-10 h-10 rounded-full border border-slate-700 object-cover" />
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
                      <span key={j} className="bg-slate-800 border border-slate-750 text-[9px] font-bold text-slate-300 px-1.5 py-0.5 rounded">
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

      </div>

      {/* Confirmation Modal */}
      {plantingTree && (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Leaf size={24} className="text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-sm sm:text-base text-white">Confirm Tree Donation</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Do you want to request planting a <b>{plantingTree.name}</b> in <b>{plantingTree.location}</b>?
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-750 p-3 rounded-xl flex justify-between text-xs font-bold">
              <span className="text-slate-400">Deduction Cost:</span>
              <span className="text-amber-400">🌟 {plantingTree.points} pts</span>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setPlantingTree(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-650 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePlantConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer"
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
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            {/* Top green ribbon overlay */}
            <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500"></div>

            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-sm sm:text-base text-white">Tree Planted on Your Behalf!</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Thank you! We have registered your tree planting contribution. A certified native <b>{successTree.name}</b> sapling will be planted in <b>{successTree.location}</b> during the next municipal planting drive.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-750 py-2.5 px-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5 tracking-wider">Plantation ID</span>
              <span className="text-xs font-black text-emerald-400 font-mono tracking-widest">{certificateId}</span>
            </div>

            <p className="text-[8px] text-slate-500">
              * Progress updates and coordinates of your sapling will be emailed once planting is completed.
            </p>

            <button
              onClick={() => {
                setSuccessTree(null);
                setCertificateId(null);
              }}
              className="w-full bg-slate-700 hover:bg-slate-650 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
