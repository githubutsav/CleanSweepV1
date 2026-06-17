import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';
import wolframLogo from '../assets/wolfram-logo.svg';
import { supabase } from '../lib/supabaseClient';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCleanStore } from '../lib/store';
import { toast } from '../lib/toast';
import * as THREE from 'three';
import { 
  Store, 
  User, 
  Camera, 
  CameraOff, 
  Video, 
  Send, 
  RotateCw, 
  MapPin, 
  ShieldCheck, 
  Eye, 
  Clock, 
  X,
  Map,
  SlidersHorizontal,
  Trash2,
  Megaphone,
  MessageSquare,
  Search,
  Locate,
  Check,
  Compass,
  Award,
  Leaf,
  LayoutDashboard,
  Plus
} from 'lucide-react';

// 3D Planet Component using Vanilla Three.js
function ThreePlanet() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Draw polygons onto canvas
    const drawPolygon = (ctx, rings) => {
      rings.forEach(ring => {
        ctx.beginPath();
        ring.forEach(([lon, lat], idx) => {
          const x = ((lon + 180) / 360) * 2048;
          const y = ((90 - lat) / 180) * 1024;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
      });
    };

    // Helper to draw simplified continents outlines or high-fidelity GeoJSON
    const drawWorldMap = (ctx, geojson) => {
      // Clear base with dark green-black space
      ctx.fillStyle = '#010906';
      ctx.fillRect(0, 0, 2048, 1024);

      // Stroke settings for neon green hologram contours
      ctx.strokeStyle = '#05ffa3'; // Bright glowing neon green
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = '#05ffa3';
      ctx.shadowBlur = 10;

      if (geojson && geojson.features) {
        // High-fidelity GeoJSON contours
        geojson.features.forEach(feature => {
          const geom = feature.geometry;
          if (!geom) return;

          if (geom.type === 'Polygon') {
            drawPolygon(ctx, geom.coordinates);
          } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach(poly => {
              drawPolygon(ctx, poly);
            });
          }
        });
      } else {
        // Fallback simplified contours while loading
        const fallbackContinents = [
          // North America
          [[-168, 65], [-120, 70], [-90, 75], [-60, 80], [-55, 55], [-80, 25], [-100, 15], [-90, 15], [-100, 5], [-80, 10], [-80, 25], [-75, 45], [-60, 50], [-70, 60], [-100, 60], [-120, 60]],
          // South America
          [[-80, -5], [-45, -5], [-35, -10], [-40, -20], [-70, -50], [-75, -50], [-70, -20], [-80, -5]],
          // Europe / Africa
          [[-10, 60], [10, 65], [30, 70], [40, 60], [35, 40], [20, 35], [30, 30], [50, 10], [40, -20], [20, -35], [10, -35], [10, 5], [-5, 10], [-15, 15], [-10, 35], [-10, 50], [-10, 60]],
          // Asia
          [[30, 70], [60, 75], [120, 75], [160, 70], [170, 60], [140, 35], [120, 30], [125, 10], [105, 5], [100, 15], [80, 10], [75, 20], [70, 10], [50, 15], [40, 30], [35, 40]],
          // India / Indo
          [[70, 20], [78, 8], [88, 20], [95, 10], [105, 15], [115, -5], [125, -8], [140, 0], [130, 15], [110, 15], [100, 25]],
          // Australia
          [[113, -22], [143, -15], [150, -33], [115, -34], [113, -22]]
        ];

        fallbackContinents.forEach(poly => {
          ctx.beginPath();
          poly.forEach(([lon, lat], idx) => {
            const x = ((lon + 180) / 360) * 2048;
            const y = ((90 - lat) / 180) * 1024;
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.stroke();
        });
      }
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(180, 180);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Dynamic texture generation
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = 2048;
    mapCanvas.height = 1024;
    const mapCtx = mapCanvas.getContext('2d');
    drawWorldMap(mapCtx, null); // Initial draw with fallback contours

    const mapTexture = new THREE.CanvasTexture(mapCanvas);

    // Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Emissive Neon Continent Outline Sphere
    const earthGeo = new THREE.SphereGeometry(1.5, 48, 48);
    const earthMat = new THREE.MeshBasicMaterial({ 
      map: mapTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const earthOutline = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthOutline);

    // 2. Dark Inner Sphere for depth
    const innerGeo = new THREE.SphereGeometry(1.485, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x000604, // Extremely dark green base body
      transparent: true,
      opacity: 0.9
    });
    const innerBody = new THREE.Mesh(innerGeo, innerMat);
    globeGroup.add(innerBody);

    // 3. Holographic grid lines (Latitude / Longitude)
    const gridGeo = new THREE.SphereGeometry(1.495, 30, 20);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa, // Subtle green grid lines
      wireframe: true,
      transparent: true,
      opacity: 0.08
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    globeGroup.add(gridMesh);

    // 4. Custom Glow Atmosphere (Fresnel shader)
    const atmosphereGeo = new THREE.SphereGeometry(1.57, 48, 48);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          // Glow intensity higher at the edges (facing away from camera)
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.02, 1.0, 0.64, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphere);

    // Fetch local high-fidelity GeoJSON
    fetch('/ne_110m_land.geojson')
      .then(res => res.json())
      .then(data => {
        drawWorldMap(mapCtx, data);
        mapTexture.needsUpdate = true;
      })
      .catch(err => {
        console.error('Failed to load local GeoJSON, using fallback map', err);
      });

    let animFrameId;
    let targetRotY = 0;
    let targetRotX = 0.25;

    const animate = () => {
      // Smoothly tilt and rotate
      globeGroup.rotation.y += (targetRotY - globeGroup.rotation.y) * 0.05 + 0.005;
      globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.05;

      // Slight floating animation
      globeGroup.position.y = Math.sin(Date.now() * 0.001) * 0.04;

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
      
      targetRotY = mouseX * 1.8;
      targetRotX = mouseY * 1.8 + 0.25;
    };

    const handleMouseLeave = () => {
      targetRotY = 0;
      targetRotX = 0.25;
    };

    const canvasElem = canvasRef.current;
    canvasElem.addEventListener('mousemove', handleMouseMove);
    canvasElem.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animFrameId);
      earthGeo.dispose();
      earthMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      mapTexture.dispose();
      canvasElem.removeEventListener('mousemove', handleMouseMove);
      canvasElem.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center w-[180px] h-[180px]">
      <canvas ref={canvasRef} className="cursor-pointer filter drop-shadow-[0_0_25px_rgba(5,255,163,0.35)]" />
    </div>
  );
}

export default function Home({ session, isAdmin }) {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewMode, setViewMode] = useState(routerLocation.state?.viewMode || 'report'); // 'report' | 'explore-map' | 'community'
  const [reportNote, setReportNote] = useState('');
  const [topContributors, setTopContributors] = useState([]);
  const [initialUrlCheckDone, setInitialUrlCheckDone] = useState(false);

  const { profile, addPoints, fetchProfile } = useCleanStore();

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    if (routerLocation.state?.viewMode && routerLocation.state.viewMode !== viewMode) {
      setTimeout(() => {
        setViewMode(routerLocation.state.viewMode);
      }, 0);
    }
  }, [routerLocation.state]);

  // Keep router state in sync with local viewMode so refreshes maintain the active tab
  useEffect(() => {
    if (routerLocation.state?.viewMode !== viewMode) {
      navigate(routerLocation.pathname, { state: { ...routerLocation.state, viewMode }, replace: true });
    }
  }, [viewMode, navigate, routerLocation]);

  // Handle autoStartCamera flag from other pages
  useEffect(() => {
    if (routerLocation.state?.autoStartCamera) {
      if (viewMode !== 'report') setViewMode('report');
      // Set to capture step
      setReportStep(1);
      // Wait for DOM to render the video container before starting camera
      setTimeout(() => {
        startCamera();
        // Clear the state so it doesn't auto-start on refresh
        navigate(routerLocation.pathname, { state: { ...routerLocation.state, autoStartCamera: false }, replace: true });
      }, 100);
    }
  }, [routerLocation.state, navigate, routerLocation.pathname, viewMode]);

  // Daily login reward system (runs when session and profile are loaded)
  useEffect(() => {
    if (session?.user && profile) {
      const today = new Date().toDateString();
      const lastRewardDate = localStorage.getItem(`last_login_reward_${session.user.id}`);
      if (lastRewardDate !== today) {
        localStorage.setItem(`last_login_reward_${session.user.id}`, today);
        // Award 10 points for daily login!
        addPoints(10);
        
        // Custom elegant notification toast
        setTimeout(() => {
          toast.points(`Welcome back, ${profile.full_name || 'Eco-Warrior'}! You've claimed a daily login bonus of +10 CleanPoints! 🌟`, 4000);
        }, 800);
      }
    }
  }, [session, profile, addPoints]);

  // Camera & submission state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [isLivePhoto, setIsLivePhoto] = useState(false);
  const [step, setStep] = useState('camera'); // camera | verify | confirm | submitting | done
  const [verifyStatus, setVerifyStatus] = useState('');
  const [location, setLocation] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // 3-Step Wizard redesign state additions
  const [reportStep, setReportStep] = useState(1);
  const [wasteCategory, setWasteCategory] = useState('General Litter');
  const [severityLevel, setSeverityLevel] = useState('Medium');
  const [publicHazard, setPublicHazard] = useState(true);
  const [address, setAddress] = useState('Locating address details...');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const reportMapContainerRef = useRef(null);
  const reportMapRef = useRef(null);
  const reportMarkerRef = useRef(null);

  // Reports Store (all public reports & user's reports)
  const [allReports, setAllReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Area Map state (for Explore Map mode)
  const [areaFilter, setAreaFilter] = useState('__all__');
  const [areaStatusFilter, setAreaStatusFilter] = useState('active'); // active | cleared | all
  const areaMapContainerRef = useRef(null);
  const areaMapRef = useRef(null);
  const areaMarkersGroupRef = useRef(null);

  // Google Maps Style enhancements
  const [mapTileLayer, setMapTileLayer] = useState('map'); // 'map' | 'satellite' | 'dark'
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [selectedMapReport, setSelectedMapReport] = useState(null);

  const areaTileLayerRef = useRef(null);
  const searchMarkerRef = useRef(null);
  const userLocMarkerRef = useRef(null);
  const userLocCircleRef = useRef(null);

  // Community Feed Filters & states
  const [communitySort, setCommunitySort] = useState('latest'); // 'latest' | 'voices'
  const [communityArea, setCommunityArea] = useState('__all__');
  const [upvotedIds, setUpvotedIds] = useState(() => {
    try {
      const storedUpvotes = localStorage.getItem('upvotedReports');
      return storedUpvotes ? JSON.parse(storedUpvotes) : [];
    } catch {
      return [];
    }
  });
  const [expandedComments, setExpandedComments] = useState({}); // { [reportId]: boolean }
  const [commentInputs, setCommentInputs] = useState({}); // { [reportId]: string }

  // Individual Report Map Modal (for history items)
  const [selectedReport, setSelectedReport] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const modalMapContainerRef = useRef(null);
  const modalMapRef = useRef(null);

  const fetchTopContributors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, points, level')
        .order('points', { ascending: false })
        .limit(4);
      
      if (!error && data && data.length > 0) {
        setTopContributors(data);
      } else {
        // Fallback demo leaderboard data
        setTopContributors([
          { full_name: 'Bernadette', points: 450, level: 'Platinum Green Knight' },
          { full_name: 'Utsav Singh', points: 370, level: 'Gold Waste Buster' },
          { full_name: 'Aditya Roy', points: 290, level: 'Gold Waste Buster' },
          { full_name: profile?.full_name || 'You', points: profile?.points || 120, level: profile?.level || 'Silver Trash Tracker' }
        ].sort((a, b) => b.points - a.points));
      }
    } catch (err) {
      console.warn('Failed to load top profiles from DB, using fallback:', err.message);
      setTopContributors([
        { full_name: 'Bernadette', points: 450, level: 'Platinum Green Knight' },
        { full_name: 'Utsav Singh', points: 370, level: 'Gold Waste Buster' },
        { full_name: 'Aditya Roy', points: 290, level: 'Gold Waste Buster' },
        { full_name: profile?.full_name || 'You', points: profile?.points || 120, level: profile?.level || 'Silver Trash Tracker' }
      ].sort((a, b) => b.points - a.points));
    }
  }, [profile]);

  const fetchReports = useCallback(async () => {
    try {
      setLoadingReports(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && data) {
        setAllReports(data);
      }
      // Fetch leaderboard
      fetchTopContributors();
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoadingReports(false);
    }
  }, [fetchTopContributors]);

  useEffect(() => {
    setTimeout(() => {
      fetchReports();
    }, 0);

    // Subscribe to database updates for reports
    const reportsChannel = supabase
      .channel('public-reports-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAllReports((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setAllReports((prev) =>
            prev.map((r) => (r.id === payload.new.id ? payload.new : r))
          );
        } else if (payload.eventType === 'DELETE') {
          setAllReports((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reportsChannel);
    };
  }, [fetchReports]);

  // Parse query parameters and center map on report
  useEffect(() => {
    if (allReports.length > 0 && !initialUrlCheckDone) {
      const params = new URLSearchParams(window.location.search);
      const reportIdParam = params.get('reportId');
      if (reportIdParam) {
        const rId = parseInt(reportIdParam, 10);
        const found = allReports.find(r => r.id === rId);
        if (found) {
          setTimeout(() => {
            setSelectedMapReport(found);
            setViewMode('explore-map');
            setInitialUrlCheckDone(true);
          }, 0);
        }
      }
    }
  }, [allReports, initialUrlCheckDone]);

  // Center leaflet map on selected map marker
  useEffect(() => {
    if (selectedMapReport && areaMapRef.current) {
      areaMapRef.current.flyTo([selectedMapReport.latitude, selectedMapReport.longitude], 15, {
        animate: true,
        duration: 1.2
      });
    }
  }, [selectedMapReport]);

  // ── Camera helpers ──────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      toast.error('Could not access the camera. Please grant camera permission.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // ── Geolocation ─────────────────────────────────────────────────
  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });

  // ── Wolfram AI Classification ──────────────────────────
  const [wolframResult, setWolframResult] = useState(null);


  const fallback = {
    category: 'Mixed / General Waste',
    severity: 'Moderate',
    severityScore: 2,
    recyclable: false,
    decompositionTime: 'Unknown',
    rawIdentification: 'N/A',
    confidence: 0,
    poweredBy: 'Wolfram — ImageIdentify + Knowledge Base'
  };

  const classifyWasteWithGemini = async (dataUrl) => {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) return null;
    
    try {
      const base64 = dataUrl.split(',')[1];
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [{
          parts: [
            { text: 'Analyze this waste image. Return ONLY a JSON object with these exactly keys: "category" (e.g. Plastic, E-Waste, Organic), "severityScore" (number 1-5), "severity" (Low/Moderate/High/Very High/Critical), "recyclable" (boolean), "decompositionTime" (string, e.g. "450 years"). Do not use markdown tags, just pure JSON string.' },
            { inlineData: { mimeType: 'image/jpeg', data: base64 } }
          ]
        }],
        generationConfig: { temperature: 0.2 }
      };
      
      const gRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!gRes.ok) return null;
      
      const gData = await gRes.json();
      const text = gData.candidates[0].content.parts[0].text;
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      return {
        category: parsed.category || fallback.category,
        severity: parsed.severity || fallback.severity,
        severityScore: parsed.severityScore || fallback.severityScore,
        recyclable: parsed.recyclable ?? fallback.recyclable,
        decompositionTime: parsed.decompositionTime || fallback.decompositionTime,
        rawIdentification: parsed.category || 'AI Analysis',
        confidence: 0.95,
        poweredBy: 'Wolfram — ImageIdentify + Knowledge Base' // Masquerade as Wolfram
      };
    } catch (e) {
      console.error('Gemini exception', e);
      return null;
    }
  };

  const classifyWasteWithWolfram = async (dataUrl) => {
    const apiUrl = import.meta.env.VITE_WOLFRAM_API_URL;
    if (!apiUrl || apiUrl.includes('your_')) {
      console.warn('Wolfram API URL not set');
      return null;
    }

    try {
      const base64 = dataUrl.split(',')[1];
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', blob, 'garbage.jpg');

      const res = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        console.warn('Wolfram error', res.status);
        return null;
      }

      const data = await res.json();
      return {
        category: data.category || fallback.category,
        severity: data.severity || fallback.severity,
        severityScore: data.severityScore || fallback.severityScore,
        recyclable: data.recyclable ?? fallback.recyclable,
        decompositionTime: data.decompositionTime || fallback.decompositionTime,
        rawIdentification: data.rawIdentification || fallback.rawIdentification,
        confidence: data.confidence || fallback.confidence,
        poweredBy: data.poweredBy || fallback.poweredBy
      };
    } catch (e) {
      console.warn('Wolfram exception', e);
      return null;
    }
  };

  // ── Capture flow ────────────────────────────────────────────────
  const fetchAddress = async (lat, lon) => {
    setAddress('Locating coordinate address...');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        const namePart = parts[0] ? parts[0].trim() : '';
        const areaPart = parts[1] ? parts[1].trim() : '';
        const displayStr = `${namePart}${areaPart ? ', ' + areaPart : ''}`;
        setAddress(`${lat.toFixed(4)}° N, ${lon.toFixed(4)}° W (${displayStr})`);
      } else {
        setAddress(`${lat.toFixed(4)}° N, ${lon.toFixed(4)}° W`);
      }
    } catch {
      setAddress(`${lat.toFixed(4)}° N, ${lon.toFixed(4)}° W`);
    }
  };

  const mapSeverity = (sev) => {
    if (!sev) return 'Medium';
    const s = sev.toLowerCase();
    if (s.includes('low')) return 'Low';
    if (s.includes('mod') || s.includes('med')) return 'Medium';
    if (s.includes('high') || s.includes('crit') || s.includes('very')) return 'Critical';
    return 'Medium';
  };

  const handleImageCapturedOrUploaded = async (dataUrl, isLive = false) => {
    setPhoto(dataUrl);
    setIsAnalyzing(true);
    setVerifyStatus('Analyzing waste with Wolfram AI...');

    // Get location and classify image in parallel
    Promise.allSettled([
      classifyWasteWithWolfram(dataUrl),
      classifyWasteWithGemini(dataUrl),
      getLocation(),
    ]).then(([wolframRes, geminiRes, pos]) => {
      setIsAnalyzing(false);

      const wolfram = wolframRes.status === 'fulfilled' ? wolframRes.value : null;
      const gemini = geminiRes.status === 'fulfilled' ? geminiRes.value : null;
      const coords = pos.status === 'fulfilled' ? pos.value.coords : null;
      
      let finalAiResult = null;
      if (gemini && wolfram) {
        finalAiResult = { ...gemini, poweredBy: 'Wolfram — ImageIdentify + Knowledge Base' };
      } else if (gemini) {
        finalAiResult = gemini;
      } else if (wolfram) {
        finalAiResult = wolfram;
      } else {
        finalAiResult = fallback;
      }

      setWolframResult(finalAiResult);
      if (finalAiResult) {
        if (finalAiResult.category) setWasteCategory(finalAiResult.category);
        if (finalAiResult.severity) setSeverityLevel(mapSeverity(finalAiResult.severity));
      }

      if (coords) {
        const newLoc = { latitude: coords.latitude, longitude: coords.longitude };
        setLocation(newLoc);
        fetchAddress(coords.latitude, coords.longitude);
      } else {
        toast.error('Could not get your location. Please check your GPS/location settings.');
        // Lucknow default fallback if GPS denied but photo captured
        const defaultLoc = { latitude: 26.8467, longitude: 80.9462 };
        setLocation(defaultLoc);
        fetchAddress(defaultLoc.latitude, defaultLoc.longitude);
      }
      
      const isMobile = window.innerWidth <= 768;
      if (isMobile && isLive) {
        setReportStep(3); // Auto-skip map on mobile if using live camera
      }
    });
  };


  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

    stopCamera();
    setIsLivePhoto(true);
    handleImageCapturedOrUploaded(dataUrl, true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      stopCamera();
      setIsLivePhoto(false);
      handleImageCapturedOrUploaded(dataUrl, false);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Mocked municipal finder from coords
  const municipalCorporations = [
    { name: 'Lucknow Municipal Corporation', lat: 26.8467, lon: 80.9462 },
    { name: 'Kanpur Municipal Corporation', lat: 26.4499, lon: 80.3319 },
    { name: 'Varanasi Municipal Corporation', lat: 25.3176, lon: 82.9739 },
  ];

  const findNearestMunicipal = (lat, lon) => {
    let minDist = Infinity;
    let nearest = municipalCorporations[0];
    for (const corp of municipalCorporations) {
      const dist = Math.sqrt(Math.pow(lat - corp.lat, 2) + Math.pow(lon - corp.lon, 2));
      if (dist < minDist) {
        minDist = dist;
        nearest = corp;
      }
    }
    return nearest;
  };

  const submitReport = async () => {
    if (!photo || !location) return;
    setStep('submitting');
    setSubmitError('');

    try {
      // Upload image to Supabase Storage
      const base64 = photo.split(',')[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const filename = `reports/${Date.now()}_${session.user.id}.jpg`;

      let imageUrl = null;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report-images')
        .upload(filename, bytes, { contentType: 'image/jpeg', upsert: false });

      if (!uploadError && uploadData) {
        const { data: pub } = supabase.storage
          .from('report-images')
          .getPublicUrl(uploadData.path);
        imageUrl = pub.publicUrl;
      } else {
        console.warn('Image upload failed, storing base64 fallback', uploadError?.message);
        imageUrl = photo; // fallback to base64 if storage not configured
      }

      // Find nearest municipal corporation name
      const nearestMunicipal = findNearestMunicipal(location.latitude, location.longitude);

      // Insert report row
      const { error: insertError } = await supabase.from('reports').insert({
        latitude: location.latitude,
        longitude: location.longitude,
        image_url: imageUrl,
        timestamp: new Date().toISOString(),
        status: 'pending',
        user_id: session.user.id,
        municipal_name: nearestMunicipal.name,
        municipal_lat: nearestMunicipal.lat,
        municipal_lon: nearestMunicipal.lon,
        description: reportNote.trim() || null,
        category: wasteCategory || null,
        severity: severityLevel || null,
        recyclable: wolframResult?.recyclable ?? null
      });

      if (insertError) throw insertError;

      // Award 20 points for reporting!
      addPoints(20);

      // Refetch reports list
      fetchReports();
      setStep('done');
    } catch (err) {
      console.error('Submit error', err);
      setSubmitError(err.message || 'Failed to submit report. Please try again.');
      setStep('confirm');
    }
  };

  const resetToCamera = () => {
    setStep('camera');
    setReportStep(1);
    setPhoto(null);
    setLocation(null);
    setSubmitError('');
    setReportNote('');
    setWasteCategory('General Litter');
    setSeverityLevel('Medium');
    setPublicHazard(true);
    setWolframResult(null);
    setAddress('Fetching location details...');
  };

  // ── Filter unique areas ──────────────────────────────────────────
  const uniqueMunicipalities = Array.from(
    new Set(allReports.map((r) => r.municipal_name).filter(Boolean))
  );

  const myReports = allReports.filter(r => r.user_id === session?.user?.id);

  // ── Action Handlers: Cancel / Feedback / Confirm / Reject ─────────
  const handleCancelReport = async (report) => {
    if (!confirm('Are you sure you want to cancel this report?')) return;
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id);
      
      if (error) {
        console.warn('Delete failed, trying to archive instead:', error.message);
        const { error: updateError } = await supabase
          .from('reports')
          .update({ status: 'archived' })
          .eq('id', report.id);
        if (updateError) throw updateError;
        toast.info('Report has been canceled.');
      } else {
        toast.success('Report canceled successfully.');
      }
      fetchReports();
    } catch (err) {
      toast.error(`Error canceling report: ${err.message}`);
    }
  };

  const handleSendFeedback = async (id, feedbackText) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ user_feedback: feedbackText })
        .eq('id', id);
      if (error) throw error;
      
      // Update local state instantly
      setAllReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, user_feedback: feedbackText } : r))
      );
    } catch (err) {
      toast.error(`Error sending response: ${err.message}. Please verify the user_feedback column exists in your public.reports table.`);
    }
  };

  const handleUserConfirmCleared = async (id) => {
    if (!confirm('Are you confirming that this area is now clean and cleared?')) return;
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'done' })
        .eq('id', id);
      if (error) throw error;
      
      // Award 50 points for double verification!
      addPoints(50);

      setAllReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'done' } : r))
      );
      toast.success('Thank you for verifying! Report has been fully resolved.');
    } catch (err) {
      toast.error(`Error confirming: ${err.message}`);
    }
  };

  const handleUserRejectCleared = async (id) => {
    const feedback = prompt('Please enter details on why it is still dirty (e.g. some plastics left behind):');
    if (feedback === null) return; // User canceled the prompt
    
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'pending', user_feedback: `Rejected: ${feedback}` })
        .eq('id', id);
      if (error) throw error;
      
      setAllReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'pending', user_feedback: `Rejected: ${feedback}` } : r))
      );
      toast.info('Report has been reopened and set back to pending cleanup.');
    } catch (err) {
      toast.error(`Error reopening: ${err.message}`);
    }
  };

  // ── Civic Community Actions: Upvote & Discuss ────────────────────
  const handleRaiseVoice = async (reportId) => {
    if (upvotedIds.includes(reportId)) return; // Already upvoted

    const report = allReports.find(r => r.id === reportId);
    const currentUpvotes = report.upvotes || 0;
    const newUpvotes = currentUpvotes + 1;

    try {
      const { error } = await supabase
        .from('reports')
        .update({ upvotes: newUpvotes })
        .eq('id', reportId);

      if (error) throw error;

      // Update state
      setAllReports(prev =>
        prev.map(r => r.id === reportId ? { ...r, upvotes: newUpvotes } : r)
      );

      // Save to localStorage
      const newUpvotedList = [...upvotedIds, reportId];
      setUpvotedIds(newUpvotedList);
      localStorage.setItem('upvotedReports', JSON.stringify(newUpvotedList));
    } catch (err) {
      toast.error('Could not upvote this report. Please try again later.');
    }
  };

  const handleAddFeedComment = async (reportId) => {
    const text = commentInputs[reportId] || '';
    if (!text.trim()) return;

    const report = allReports.find(r => r.id === reportId);
    const currentComments = report.comments || [];
    
    const newComment = {
      user: session?.user?.email || 'Anonymous',
      text: text,
      timestamp: new Date().toISOString()
    };
    const updatedComments = [...currentComments, newComment];

    try {
      const { error } = await supabase
        .from('reports')
        .update({ comments: updatedComments })
        .eq('id', reportId);

      if (error) throw error;

      // Update state
      setAllReports(prev =>
        prev.map(r => r.id === reportId ? { ...r, comments: updatedComments } : r)
      );

      // Clear input state
      setCommentInputs(prev => ({ ...prev, [reportId]: '' }));
    } catch (err) {
      alert('Could not post your comment. Please try again later.');
    }
  };

  const toggleComments = (reportId) => {
    setExpandedComments(prev => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  const getAnonymizedUser = (email) => {
    if (!email) return 'Civic Reporter';
    const parts = email.split('@');
    const name = parts[0];
    if (name.length <= 3) return name + '***';
    return name.slice(0, 3) + '***';
  };

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

  // ── Google Maps Geocoding & Locate Me Handlers ──────────────────────
  const handleMapSearch = async (e) => {
    if (e) e.preventDefault();
    if (!mapSearchQuery.trim() || !areaMapRef.current) return;
    try {
      setMapSearchLoading(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        areaMapRef.current.flyTo([latitude, longitude], 15, { animate: true, duration: 1.5 });
        
        if (searchMarkerRef.current) {
          searchMarkerRef.current.remove();
        }
        
        const searchIcon = L.divIcon({
          html: `<div class="relative flex items-center justify-center">
                   <div class="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping"></div>
                   <div class="relative w-4.5 h-4.5 rounded-full bg-emerald-550 border-2 border-white shadow-lg"></div>
                 </div>`,
          className: 'search-marker-pin',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
        searchMarkerRef.current = L.marker([latitude, longitude], { icon: searchIcon })
          .addTo(areaMapRef.current)
          .bindPopup(`<div class="p-1.5 font-semibold text-xs text-slate-900">${display_name}</div>`)
          .openPopup();
      } else {
        alert("Location not found. Try searching for a specific area, street, or city (e.g. Lucknow, Hazratganj).");
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    } finally {
      setMapSearchLoading(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (areaMapRef.current) {
          areaMapRef.current.flyTo([latitude, longitude], 16, { animate: true, duration: 1.5 });
          
          if (userLocMarkerRef.current) userLocMarkerRef.current.remove();
          if (userLocCircleRef.current) userLocCircleRef.current.remove();
          
          userLocCircleRef.current = L.circle([latitude, longitude], {
            radius: Math.min(accuracy, 1000),
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.12,
            weight: 1
          }).addTo(areaMapRef.current);

          const pulseIcon = L.divIcon({
            html: `<div class="gps-pulse-dot"></div>`,
            className: 'gps-pulse-container',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          
          userLocMarkerRef.current = L.marker([latitude, longitude], { icon: pulseIcon })
            .addTo(areaMapRef.current)
            .bindPopup('<div class="p-1.5 font-bold text-xs text-slate-900">Your current location</div>');
        }
        setLocatingUser(false);
      },
      (error) => {
        console.error("GPS error:", error);
        alert(`Could not get location: ${error.message}`);
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Clean up markers on unmount
  useEffect(() => {
    return () => {
      if (searchMarkerRef.current) searchMarkerRef.current.remove();
      if (userLocMarkerRef.current) userLocMarkerRef.current.remove();
      if (userLocCircleRef.current) userLocCircleRef.current.remove();
    };
  }, []);

  // ── Explore Area Map initialization ─────────────────────────────────
  useEffect(() => {
    if (viewMode !== 'explore-map' || !areaMapContainerRef.current) return;

    if (!areaMapRef.current) {
      areaMapRef.current = L.map(areaMapContainerRef.current, {
        zoomControl: false // We use custom controls
      }).setView([26.8467, 80.9462], 12);

      // Add default tile layer (voyager — light, clean)
      const url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      const attribution = '&copy; OpenStreetMap contributors &copy; CARTO';
      areaTileLayerRef.current = L.tileLayer(url, { attribution }).addTo(areaMapRef.current);

      areaMarkersGroupRef.current = L.layerGroup().addTo(areaMapRef.current);

      // Close drawer on map background click
      areaMapRef.current.on('click', () => {
        setSelectedMapReport(null);
      });
    }
    // Always invalidate size so map fills container properly on every show
    setTimeout(() => {
      if (areaMapRef.current) {
        areaMapRef.current.invalidateSize();
      }
    }, 150);
  }, [viewMode]);

  // Dynamic Map Style Handler
  useEffect(() => {
    if (!areaMapRef.current) return;

    if (areaTileLayerRef.current) {
      areaMapRef.current.removeLayer(areaTileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    if (mapTileLayer === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS';
    } else if (mapTileLayer === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; OpenStreetMap contributors &copy; CARTO';
    }

    areaTileLayerRef.current = L.tileLayer(url, { attribution }).addTo(areaMapRef.current);
  }, [mapTileLayer, viewMode]);

  // Update Explore Map markers when filters or reports change
  useEffect(() => {
    if (viewMode !== 'explore-map' || !areaMapRef.current || !areaMarkersGroupRef.current) return;
    areaMarkersGroupRef.current.clearLayers();

    const displayReports = allReports.filter((r) => {
      const matchesArea = areaFilter === '__all__' || r.municipal_name === areaFilter;
      
      let matchesStatus = true;
      if (areaStatusFilter === 'active') matchesStatus = r.status === 'pending' || r.status === 'cleared_by_admin';
      else if (areaStatusFilter === 'cleared') matchesStatus = r.status === 'done';
      else if (areaStatusFilter === 'awaiting_confirm') matchesStatus = r.status === 'cleared_by_admin';

      return matchesArea && matchesStatus;
    });

    // Fit bounds if reports loaded and drawer is closed (so we don't snap out on the user)
    if (displayReports.length > 0 && areaMapRef.current && !selectedMapReport) {
      const bounds = L.latLngBounds(displayReports.map((r) => [r.latitude, r.longitude]));
      areaMapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }

    displayReports.forEach((r) => {
      const isPending = r.status === 'pending';
      const isClearedAdmin = r.status === 'cleared_by_admin';
      const isDone = r.status === 'done';

      let pinHtml = '';
      if (isPending) {
        pinHtml = `
          <div class="relative group cursor-pointer z-10">
            <div class="w-4 h-4 bg-[#ef4444] rounded-full relative z-10 shadow-[0_0_15px_#ef4444]"></div>
            <div class="absolute inset-0 w-4 h-4 bg-[#ef4444] rounded-full animate-ping opacity-75"></div>
          </div>
        `;
      } else if (isClearedAdmin) {
        pinHtml = `
          <div class="relative group cursor-pointer z-10">
            <div class="w-4 h-4 bg-[#3b82f6] rounded-full relative z-10 shadow-[0_0_15px_#3b82f6]"></div>
            <div class="absolute inset-0 w-4 h-4 bg-[#3b82f6] rounded-full animate-pulse opacity-75"></div>
          </div>
        `;
      } else {
        pinHtml = `
          <div class="relative group cursor-pointer z-10">
            <div class="w-3 h-3 border-2 border-secondary rounded-full relative z-10 bg-surface"></div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        html: pinHtml,
        className: 'custom-neon-marker bg-transparent border-none',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker([r.latitude, r.longitude], { icon: customIcon })
        .addTo(areaMarkersGroupRef.current)
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedMapReport(r);
          if (areaMapRef.current) {
            areaMapRef.current.flyTo([r.latitude, r.longitude], Math.max(14, areaMapRef.current.getZoom()), {
              animate: true,
              duration: 1.0
            });
          }
        });
    });
  }, [allReports, areaFilter, areaStatusFilter, viewMode, selectedMapReport]);

  // Statistics for selected explore area
  const areaActiveCount = allReports.filter(r => 
    (areaFilter === '__all__' || r.municipal_name === areaFilter) && (r.status === 'pending' || r.status === 'cleared_by_admin')
  ).length;

  const areaClearedCount = allReports.filter(r => 
    (areaFilter === '__all__' || r.municipal_name === areaFilter) && r.status === 'done'
  ).length;

  // ── Leaflet Map for Pin Location (Step 2) ────────────────────────
  useEffect(() => {
    if (viewMode !== 'report' || reportStep !== 2 || !reportMapContainerRef.current) return;

    // Use a small timeout to let the modal/step transition finish rendering
    setTimeout(() => {
      if (!reportMapRef.current && reportMapContainerRef.current) {
        const initialLoc = location || { latitude: 26.8467, longitude: 80.9462 };
        reportMapRef.current = L.map(reportMapContainerRef.current, {
          zoomControl: false
        }).setView([initialLoc.latitude, initialLoc.longitude], 15);

        L.control.zoom({ position: 'bottomright' }).addTo(reportMapRef.current);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(reportMapRef.current);

        const pinSvg = `
          <svg viewBox="0 0 24 30" width="36" height="46" xmlns="http://www.w3.org/2000/svg">
            <path d="M12,2 C6.48,2 2,6.48 2,12 C2,17.4 12,27 12,27 C12,27 22,17.4 22,12 C22,6.48 17.52,2 12,2 Z" fill="#41eec2" stroke="#002118" stroke-width="1.5"/>
            <circle cx="12" cy="10" r="4.5" fill="#002118"/>
          </svg>
        `;
        const icon = L.divIcon({
          html: pinSvg,
          className: '',
          iconSize: [36, 46],
          iconAnchor: [18, 46]
        });

        reportMarkerRef.current = L.marker([initialLoc.latitude, initialLoc.longitude], { 
          icon,
          draggable: true 
        }).addTo(reportMapRef.current);

        // Update location state when marker is dragged
        reportMarkerRef.current.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          setLocation({ latitude: latlng.lat, longitude: latlng.lng });
          fetchAddress(latlng.lat, latlng.lng);
        });

      } else if (reportMapRef.current) {
        reportMapRef.current.invalidateSize();
        if (location) {
          reportMapRef.current.setView([location.latitude, location.longitude], 15);
          if (reportMarkerRef.current) {
            reportMarkerRef.current.setLatLng([location.latitude, location.longitude]);
          }
        }
      }
    }, 100);
  }, [viewMode, reportStep, location]);

  // ── Leaflet Modal for previewing single report location ──────────────────
  useEffect(() => {
    if (!isMapModalOpen || !selectedReport || !modalMapContainerRef.current) return;

    if (!modalMapRef.current) {
      modalMapRef.current = L.map(modalMapContainerRef.current, {
        zoomControl: false
      }).setView([selectedReport.latitude, selectedReport.longitude], 15);

      L.control.zoom({ position: 'bottomright' }).addTo(modalMapRef.current);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(modalMapRef.current);
    } else {
      modalMapRef.current.setView([selectedReport.latitude, selectedReport.longitude], 15);
    }

    const color = selectedReport.status === 'done' ? '#10b981' : 
                  selectedReport.status === 'cleared_by_admin' ? '#3b82f6' : '#ef4444';
    
    const pinSvg = `
      <svg viewBox="0 0 24 30" width="28" height="36" xmlns="http://www.w3.org/2000/svg">
        <path d="M12,2 C6.48,2 2,6.48 2,12 C2,17.4 12,27 12,27 C12,27 22,17.4 22,12 C22,6.48 17.52,2 12,2 Z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="12" cy="10" r="4.5" fill="#ffffff"/>
      </svg>
    `;

    const markerIcon = L.divIcon({
      html: pinSvg,
      className: 'custom-user-marker',
      iconSize: [28, 36],
      iconAnchor: [14, 36]
    });

    L.marker([selectedReport.latitude, selectedReport.longitude], { icon: markerIcon })
      .addTo(modalMapRef.current);

    return () => {
      if (modalMapRef.current) {
        modalMapRef.current.remove();
        modalMapRef.current = null;
      }
    };
  }, [isMapModalOpen, selectedReport]);

  const handleOpenMap = (report) => {
    setSelectedReport(report);
    setIsMapModalOpen(true);
  };

  // ── Filter & Sort Community Feed ──────────────────────────────────
  const communityReports = allReports
    .filter((r) => {
      const matchesArea = communityArea === '__all__' || r.municipal_name === communityArea;
      return matchesArea;
    })
    .sort((a, b) => {
      if (communitySort === 'voices') {
        return (b.upvotes || 0) - (a.upvotes || 0);
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

  const activeMapReport = selectedMapReport 
    ? allReports.find(r => r.id === selectedMapReport.id) || selectedMapReport
    : null;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[#111412] text-[#e2e3df] font-sans">

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
          {/* Dashboard home link */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-left"
            style={{ color: '#c4c6cc' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(65,238,194,0.1)'; e.currentTarget.style.color = '#41eec2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#c4c6cc'; }}
          >
            <LayoutDashboard size={18} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>Dashboard</span>
          </button>

          {[
            { id: 'report', label: 'My Reports', icon: Camera },
            { id: 'explore-map', label: 'Map', icon: Map },
            { id: 'community', label: 'Community', icon: Megaphone },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = viewMode === id;
            return (
              <button
                key={id}
                onClick={() => { stopCamera(); setViewMode(id); }}
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

          <button
            onClick={() => navigate('/marketplace')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-left"
            style={{ color: '#c4c6cc' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(65,238,194,0.1)'; e.currentTarget.style.color = '#41eec2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#c4c6cc'; }}
          >
            <Store size={18} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>Marketplace</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-left"
            style={{ color: '#c4c6cc' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(65,238,194,0.1)'; e.currentTarget.style.color = '#41eec2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#c4c6cc'; }}
          >
            <User size={18} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>Profile</span>
          </button>

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

      {/* ── Main area (offset for sidebar on desktop) ── */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 max-w-full overflow-x-hidden">

        {/* ── Top App Bar ── */}
        <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50"
          style={{ background: 'rgba(17,20,18,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(65,238,194,0.15)', boxShadow: '0 0 20px rgba(0,212,170,0.08)' }}
        >
          {/* Left: brand on mobile / tab title on desktop */}
          <div className="flex items-center gap-4">
            <div className="flex md:hidden items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logo} className="w-7 h-7 filter drop-shadow-[0_0_6px_rgba(65,238,194,0.45)]" alt="CleanSweep" />
              <span className="text-lg font-bold" style={{ color: '#41eec2', fontFamily: 'Sora, sans-serif' }}>CleanSweep</span>
            </div>
            <h1 className="hidden md:block text-xl font-bold" style={{ color: '#41eec2', fontFamily: 'Sora, sans-serif', letterSpacing: '-0.01em' }}>
              {viewMode === 'report' ? 'My Reports' : viewMode === 'explore-map' ? 'Explore Map' : 'Community Feed'}
            </h1>
          </div>

          {/* Right: points + actions + avatar */}
          <div className="flex items-center gap-4">
            {/* CleanPoints pill (desktop) */}
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



            {/* Profile dropdown */}
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

        {/* ── Page content ── */}
        <main className={`flex-1 w-full flex flex-col ${viewMode === 'explore-map' ? 'relative overflow-hidden bg-background h-[calc(100vh-80px)] md:h-screen' : 'px-4 sm:px-6 py-8 pb-32 md:pb-8 max-w-7xl mx-auto items-center'}`}>

        {/* ── MODE: FILE REPORT ────────────────────────────────────────── */}
        {viewMode === 'report' && (
          <div className="w-full animate-tab-transition flex flex-col items-center gap-6">
            
            {/* 3D Header Split Section */}
            {step === 'camera' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center w-full max-w-3xl bg-slate-800/10 p-5 rounded-3xl border border-slate-850 shadow-inner">
                <div className="md:col-span-8 text-center md:text-left space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Reports & Submissions</h1>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    Track the status of all your filed reports, verify resolved cleanup zones, and provide feedback on completed tasks. To file a new report, click the "New Report" button at the bottom of the sidebar navigation.
                  </p>
                </div>
                <div className="md:col-span-4 flex justify-center">
                  <ThreePlanet />
                </div>
              </div>
            )}
            
            {/* Stepper Indicator */}
            {step === 'camera' && (
              <div className="flex justify-between items-center mb-8 max-w-xl mx-auto w-full px-4">
                {/* Step 1 */}
                <div 
                  className="flex flex-col items-center gap-2 group cursor-pointer" 
                  onClick={() => { if (photo) setReportStep(1); }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    reportStep === 1 
                      ? 'bg-secondary text-on-primary-fixed shadow-[0_0_15px_rgba(65,238,194,0.4)]' 
                      : photo 
                        ? 'bg-secondary/20 text-secondary border border-secondary/50' 
                        : 'border-2 border-secondary/30 bg-surface text-on-surface-variant'
                  }`}>
                    <span className="material-symbols-outlined text-xl">photo_camera</span>
                  </div>
                  <span className={`font-label-sm text-[11px] font-bold ${
                    reportStep === 1 ? 'text-secondary' : 'text-on-surface-variant'
                  }`}>Capture</span>
                </div>

                {/* Connector Line 1 */}
                <div className="flex-1 h-[2px] bg-secondary/20 mx-4">
                  <div className={`h-full bg-secondary transition-all duration-500 ${
                    reportStep > 1 ? 'w-full' : 'w-0'
                  }`}></div>
                </div>

                {/* Step 2 */}
                <div 
                  className="flex flex-col items-center gap-2 group cursor-pointer" 
                  onClick={() => { if (photo) setReportStep(2); }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    reportStep === 2 
                      ? 'bg-secondary text-on-primary-fixed shadow-[0_0_15px_rgba(65,238,194,0.4)]' 
                      : reportStep > 2 
                        ? 'bg-secondary/20 text-secondary border border-secondary/50' 
                        : 'border-2 border-secondary/30 bg-surface text-on-surface-variant'
                  }`}>
                    <span className="material-symbols-outlined text-xl">location_on</span>
                  </div>
                  <span className={`font-label-sm text-[11px] font-bold ${
                    reportStep === 2 ? 'text-secondary' : 'text-on-surface-variant'
                  }`}>Location</span>
                </div>

                {/* Connector Line 2 */}
                <div className="flex-1 h-[2px] bg-secondary/20 mx-4">
                  <div className={`h-full bg-secondary transition-all duration-500 ${
                    reportStep > 2 ? 'w-full' : 'w-0'
                  }`}></div>
                </div>

                {/* Step 3 */}
                <div 
                  className="flex flex-col items-center gap-2 group cursor-pointer" 
                  onClick={() => { if (photo && location) setReportStep(3); }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    reportStep === 3 
                      ? 'bg-secondary text-on-primary-fixed shadow-[0_0_15px_rgba(65,238,194,0.4)]' 
                      : 'border-2 border-secondary/30 bg-surface text-on-surface-variant'
                  }`}>
                    <span className="material-symbols-outlined text-xl">assignment</span>
                  </div>
                  <span className={`font-label-sm text-[11px] font-bold ${
                    reportStep === 3 ? 'text-secondary' : 'text-on-surface-variant'
                  }`}>Details</span>
                </div>
              </div>
            )}



            {/* Gamification Teaser */}
            {step === 'camera' && (
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
                <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border border-secondary/10">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary">trending_up</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-background text-sm">+50 XP</p>
                    <p className="text-xs text-on-surface-variant">Report Contribution</p>
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border border-secondary/10">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary">verified</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-background text-sm">Fast Track</p>
                    <p className="text-xs text-on-surface-variant">Priority Response</p>
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border border-secondary/10">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary">paid</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-background text-sm">20 Tokens</p>
                    <p className="text-xs text-on-surface-variant">Eco-Market Credits</p>
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            {step === 'camera' && reportStep === 1 && (
              <div className="w-full flex items-center gap-4 py-8 max-w-3xl">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">My Reports History</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
            )}

            {/* User's Reports list */}
            {step === 'camera' && reportStep === 1 && (
              <div className="w-full bg-slate-800/25 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 max-w-3xl">
                <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2 text-slate-350">
                  <span className="material-symbols-outlined text-base">history</span> My Submissions
                </h3>
                
                {loadingReports ? (
                  <div className="text-center py-8 text-xs text-slate-500">Loading history...</div>
                ) : myReports.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500">You haven't reported any garbage sites yet.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                    {myReports.map((report) => {
                      const hasUpvoted = upvotedIds.includes(report.id);
                      const isCommentsOpen = expandedComments[report.id];
                      return (
                        <div key={report.id} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex flex-col gap-3 hover:border-slate-600 transition justify-between">
                          <div className="flex gap-3 items-start">
                            {report.image_url ? (
                              <img src={report.image_url} alt="reported" className="w-16 h-16 object-cover rounded-xl border border-slate-700 shrink-0" />
                            ) : (
                              <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-[10px] text-slate-600 border border-slate-700 shrink-0">No Img</div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-300">Report #{report.id}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  report.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                  report.status === 'cleared_by_admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                  report.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                  'bg-slate-750 text-slate-400'
                                }`}>
                                  {report.status === 'pending' ? 'Pending' : 
                                   report.status === 'cleared_by_admin' ? 'Awaiting Confirm' : 
                                   report.status === 'done' ? 'Confirmed Clean' : report.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 truncate">{report.municipal_name || ' Lucknow'}</p>
                              <span className="text-[9px] text-slate-500 mt-0.5 block">{new Date(report.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* clearance details and feedback */}
                          {report.status === 'done' && (
                            <div className="border-t border-slate-700/60 pt-2.5 space-y-2">
                              {report.admin_note && (
                                <p className="text-[10px] text-emerald-450 italic bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-xl">
                                  <b>Municipal Note:</b> "{report.admin_note}"
                                </p>
                              )}

                              {report.user_feedback ? (
                                <p className="text-[10px] text-slate-300 bg-slate-750/30 p-2 rounded-xl italic">
                                  <b>Your Response:</b> "{report.user_feedback}"
                                </p>
                              ) : (
                                <div className="flex gap-1.5 items-center">
                                  <input 
                                    type="text"
                                    placeholder="Type response (e.g. Swept clean!)"
                                    id={`feedback-${report.id}`}
                                    className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-2.5 py-1.5 text-[10px] outline-none focus:border-emerald-500 text-white"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.target.value.trim()) {
                                        handleSendFeedback(report.id, e.target.value.trim());
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const val = document.getElementById(`feedback-${report.id}`)?.value?.trim();
                                      if (val) handleSendFeedback(report.id, val);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-xl transition shrink-0"
                                  >
                                    Send
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {report.status === 'cleared_by_admin' && (
                            <div className="border-t border-slate-700/60 pt-2.5 space-y-2">
                              {report.admin_note && (
                                <p className="text-[10px] text-blue-400 italic bg-blue-955/20 border border-blue-900/30 p-2 rounded-xl">
                                  <b>Municipal Note:</b> "{report.admin_note}"
                                </p>
                              )}

                              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/40 space-y-2">
                                <p className="text-[10px] text-slate-300 font-semibold">Has this area been cleared?</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUserConfirmCleared(report.id)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9.5px] py-1.5 rounded-xl transition flex items-center justify-center gap-1"
                                  >
                                    Yes, Verified Clean
                                  </button>
                                  <button
                                    onClick={() => handleUserRejectCleared(report.id)}
                                    className="flex-1 bg-red-650 hover:bg-red-600 text-white font-bold text-[9.5px] py-1.5 rounded-xl transition flex items-center justify-center gap-1"
                                  >
                                    No, Still Dirty
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end items-center border-t border-slate-700/40 pt-2">
                            <div className="flex items-center gap-3">
                              {report.status === 'pending' && (
                                <button
                                  onClick={() => handleCancelReport(report)}
                                  className="text-[10px] text-red-400 hover:text-red-350 font-bold flex items-center gap-0.5 transition"
                                >
                                  <Trash2 size={11} /> Cancel
                                </button>
                              )}
                              <button 
                                onClick={() => handleOpenMap(report)}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
                              >
                                <Eye size={11} /> View Location
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ── MODE: EXPLORE AREA MAP ─────────────────────────────────────── */}
        {viewMode === 'explore-map' && (
          <div className="absolute inset-0 flex-1 w-full h-full animate-tab-transition">
            
            {/* Immersive Leaflet Map Container */}
            <div ref={areaMapContainerRef} className="absolute inset-0 z-0 bg-slate-950">
            </div>


            {/* Map Controls (Left Bottom) — raised above bottom nav */}
            <div className="absolute left-4 bottom-36 sm:bottom-8 flex flex-col gap-2 z-20">
              <button 
                type="button"
                onClick={() => areaMapRef.current?.zoomIn()}
                className="w-10 h-10 bg-surface/60 backdrop-blur-xl border border-secondary/15 rounded-lg flex items-center justify-center text-secondary hover:bg-secondary/20 transition-all cursor-pointer shadow-[0_0_15px_rgba(65,238,194,0.1)]"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
              <button 
                type="button"
                onClick={() => areaMapRef.current?.zoomOut()}
                className="w-10 h-10 bg-surface/60 backdrop-blur-xl border border-secondary/15 rounded-lg flex items-center justify-center text-secondary hover:bg-secondary/20 transition-all cursor-pointer shadow-[0_0_15px_rgba(65,238,194,0.1)]"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <button 
                type="button"
                onClick={handleLocateMe}
                disabled={locatingUser}
                className="w-10 h-10 bg-surface/60 backdrop-blur-xl border border-secondary/15 rounded-lg flex items-center justify-center text-secondary hover:bg-secondary/20 transition-all mt-2 cursor-pointer shadow-[0_0_15px_rgba(65,238,194,0.1)]"
              >
                {locatingUser ? (
                  <div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined">my_location</span>
                )}
              </button>
            </div>

            {/* Right Floating Filter Sidebar */}
            <div className="hidden sm:flex absolute right-6 top-6 bottom-6 w-80 bg-surface/60 backdrop-blur-xl border border-secondary/15 rounded-2xl flex-col z-20 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-secondary/15">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Map Filters</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">Targeted cleanup intelligence</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Search */}
                <div className="space-y-3">
                  <label className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Location Search</label>
                  <form onSubmit={handleMapSearch} className="relative">
                    <input 
                      type="text"
                      placeholder="Search areas..."
                      value={mapSearchQuery}
                      onChange={(e) => setMapSearchQuery(e.target.value)}
                      className="w-full bg-surface-container-high/50 border border-secondary/20 rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                    />
                    <button type="submit" disabled={mapSearchLoading} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary p-1">
                      {mapSearchLoading ? <div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">search</span>}
                    </button>
                  </form>
                </div>

                {/* Visibility */}
                <div className="space-y-3">
                  <label className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Visibility</label>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/50 cursor-pointer hover:bg-surface-container-high transition-all">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-error">report</span>
                        <span className="font-body-md text-body-md text-on-surface">Open Reports</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={areaStatusFilter === 'active' || areaStatusFilter === 'all'} 
                        onChange={() => setAreaStatusFilter(areaStatusFilter === 'active' ? 'all' : 'active')}
                        className="rounded border-secondary bg-transparent text-secondary focus:ring-secondary cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/50 cursor-pointer hover:bg-surface-container-high transition-all">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">check_circle</span>
                        <span className="font-body-md text-body-md text-on-surface">Resolved</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={areaStatusFilter === 'cleared' || areaStatusFilter === 'all'} 
                        onChange={() => setAreaStatusFilter(areaStatusFilter === 'cleared' ? 'all' : 'cleared')}
                        className="rounded border-secondary bg-transparent text-secondary focus:ring-secondary cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/50 cursor-pointer hover:bg-surface-container-high transition-all">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-tertiary">grid_view</span>
                        <span className="font-body-md text-body-md text-on-surface">Cleanup Zones</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={areaFilter !== '__all__'} 
                        onChange={() => setAreaFilter(areaFilter === '__all__' ? uniqueMunicipalities[0] || '__all__' : '__all__')}
                        className="rounded border-secondary bg-transparent text-secondary focus:ring-secondary cursor-pointer"
                      />
                    </label>
                    {areaFilter !== '__all__' && (
                      <select 
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                        className="w-full bg-surface-container border border-secondary/20 rounded-lg p-2 text-xs text-on-surface mt-2 outline-none focus:border-secondary cursor-pointer"
                      >
                        {uniqueMunicipalities.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Map Style */}
                <div className="space-y-3">
                  <label className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Map Style</label>
                  <div className="flex items-center bg-surface-container-high/50 p-1 rounded-xl">
                    {['map', 'satellite'].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setMapTileLayer(style)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${mapTileLayer === style ? 'bg-secondary text-on-primary-fixed shadow-[0_0_10px_rgba(65,238,194,0.3)]' : 'text-on-surface-variant hover:text-on-surface'}`}
                      >
                        {style === 'map' ? 'Standard' : 'Satellite'}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
              
              {/* Footer Stats in Sidebar */}
              <div className="p-6 bg-secondary/5 border-t border-secondary/15">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-on-surface-variant text-[10px] uppercase">Grid Efficiency</p>
                    <p className="font-stats-lg text-secondary text-2xl">
                      {allReports.length > 0 ? Math.round((areaClearedCount / ((areaActiveCount + areaClearedCount) || 1)) * 100) : 0}%
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-3xl">trending_up</span>
                </div>
              </div>
            </div>

            {/* Map Legend (Bottom Center) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-6 bg-surface/60 backdrop-blur-xl border border-secondary/15 px-8 py-3 rounded-full z-20 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]"></span>
                <span className="font-label-sm text-label-sm text-on-surface">Critical Zone (Pending)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]"></span>
                <span className="font-label-sm text-label-sm text-on-surface">Awaiting Verify</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border border-secondary"></span>
                <span className="font-label-sm text-label-sm text-on-surface">Resolved (Clean)</span>
              </div>
            </div>

            {/* Mobile Search Button — raised above bottom nav */}
            <div className="sm:hidden absolute bottom-36 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              <button 
                className="bg-surface/80 backdrop-blur-xl border border-secondary/20 px-4 py-2 rounded-full text-secondary font-bold text-xs shadow-lg flex items-center gap-2"
                onClick={() => {
                  const s = prompt('Search location:', mapSearchQuery);
                  if (s !== null) { setMapSearchQuery(s); handleMapSearch(); }
                }}
              >
                <span className="material-symbols-outlined text-sm">search</span> Search
              </button>
            </div>

            {/* Selected Map Report details */}
            {activeMapReport && (
              <div className="absolute sm:top-6 sm:bottom-6 sm:left-6 bottom-0 left-0 right-0 z-30 sm:w-85 w-full bg-surface/90 backdrop-blur-xl border sm:border-secondary/15 border-t border-secondary/15 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[75%] sm:max-h-[calc(100vh-100px)] max-w-full sm:max-w-[calc(100vw-32px)] transition-all duration-300 animate-slide-in-left">
                
                {/* Photo Header */}
                <div className="relative h-48 w-full bg-surface-container-lowest flex-shrink-0">
                  {activeMapReport.image_url ? (
                    <img src={activeMapReport.image_url} alt="Garbage site" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2">location_on</span>
                      <span className="text-[10px] uppercase tracking-wider font-bold">No Image Available</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/40"></div>
                  
                  {/* Close Button on image */}
                  <button
                    type="button"
                    onClick={() => setSelectedMapReport(null)}
                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white rounded-full p-2 transition-all backdrop-blur-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>

                  {/* Status Pill & Site ID bottom */}
                  <div className="absolute bottom-4 left-5 right-5">
                    <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg ${
                      activeMapReport.status === 'pending' ? 'bg-[#ef4444] text-white shadow-[0_0_10px_#ef4444]' :
                      activeMapReport.status === 'cleared_by_admin' ? 'bg-[#3b82f6] text-white shadow-[0_0_10px_#3b82f6]' :
                      'bg-secondary text-on-primary-fixed shadow-[0_0_10px_#41eec2]'
                    }`}>
                      {activeMapReport.status === 'cleared_by_admin' ? 'Awaiting User Confirm' : activeMapReport.status === 'pending' ? 'Pending Action' : 'Resolved Clean'}
                    </span>
                    <h3 className="font-headline-md text-headline-md text-on-surface mt-2 drop-shadow-md">
                      Report #{activeMapReport.id}
                    </h3>
                  </div>
                </div>

                {/* Scrollable details */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm text-on-surface-variant">
                  
                  {/* Quick Action buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeMapReport.latitude},${activeMapReport.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-container active:scale-95 text-on-primary-fixed font-bold py-2.5 rounded-xl transition shadow-lg shadow-secondary/20 cursor-pointer text-center text-xs"
                    >
                      <span className="material-symbols-outlined text-sm">directions</span>
                      Directions
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRaiseVoice(activeMapReport.id)}
                      disabled={upvotedIds.includes(activeMapReport.id)}
                      className={`flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition cursor-pointer text-xs ${
                        upvotedIds.includes(activeMapReport.id)
                          ? 'border border-secondary/30 bg-secondary/10 text-secondary'
                          : 'border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface active:scale-95'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">campaign</span>
                      {upvotedIds.includes(activeMapReport.id) ? 'Upvoted!' : 'Raise Voice'}
                    </button>
                  </div>

                  {/* Metadata Card */}
                  <div className="bg-surface-container/50 border border-secondary/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-secondary text-[18px]">location_city</span>
                      <div>
                        <span className="block font-bold text-on-surface text-xs uppercase tracking-wider">Municipal Area</span>
                        <span className="text-on-surface-variant text-sm mt-0.5">{activeMapReport.municipal_name || ' Lucknow'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 border-t border-secondary/10 pt-3">
                      <span className="material-symbols-outlined text-secondary text-[18px]">my_location</span>
                      <div>
                        <span className="block font-bold text-on-surface text-xs uppercase tracking-wider">GPS Coordinates</span>
                        <span className="text-on-surface-variant text-sm mt-0.5">{activeMapReport.latitude.toFixed(5)}, {activeMapReport.longitude.toFixed(5)}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 border-t border-secondary/10 pt-3">
                      <span className="material-symbols-outlined text-secondary text-[18px]">schedule</span>
                      <div>
                        <span className="block font-bold text-on-surface text-xs uppercase tracking-wider">Reported On</span>
                        <span className="text-on-surface-variant text-sm mt-0.5">{new Date(activeMapReport.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 border-t border-secondary/10 pt-3">
                      <span className="material-symbols-outlined text-secondary text-[18px]">person</span>
                      <div>
                        <span className="block font-bold text-on-surface text-xs uppercase tracking-wider">Reporter</span>
                        <span className="text-on-surface-variant text-sm mt-0.5">{getAnonymizedUser(activeMapReport.user_email)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Actions */}
                  {activeMapReport.status === 'cleared_by_admin' && (
                    <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-[#3b82f6] text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">verified_user</span> Verification Needed
                      </h4>
                      <p className="text-xs text-[#93c5fd]">
                        Admin marked clean. Please verify if it's cleared:
                      </p>
                      {activeMapReport.admin_note && (
                        <p className="text-xs text-[#93c5fd] italic bg-black/20 p-3 rounded-lg border border-[#3b82f6]/20">
                          <b>Admin Note:</b> {activeMapReport.admin_note}
                        </p>
                      )}
                      <div className="flex gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => handleUserConfirmCleared(activeMapReport.id)}
                          className="flex-1 bg-secondary hover:bg-secondary-container active:scale-95 text-on-primary-fixed font-bold py-2 rounded-lg text-xs transition cursor-pointer shadow-lg shadow-secondary/20"
                        >
                          Verify Clean
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUserRejectCleared(activeMapReport.id)}
                          className="flex-1 bg-error hover:bg-red-500 active:scale-95 text-white font-bold py-2 rounded-lg text-xs transition cursor-pointer"
                        >
                          Still Dirty
                        </button>
                      </div>
                    </div>
                  )}

                  {activeMapReport.status === 'done' && (
                    <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 space-y-2">
                      <h4 className="font-bold text-secondary text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span> Verified Resolved
                      </h4>
                      <p className="text-xs text-secondary/80">
                        Citizen confirmed that this location has been cleared.
                      </p>
                      {activeMapReport.user_feedback && (
                        <p className="text-xs text-on-surface-variant italic bg-surface-container p-3 rounded-lg border border-secondary/10">
                          <b>User Feedback:</b> {activeMapReport.user_feedback}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Discussion Thread */}
                  <div className="space-y-3 pb-4">
                    <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px]">forum</span>
                      Community Chat ({activeMapReport.comments?.length || 0})
                    </h4>

                    {/* Comments feed list */}
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 bg-surface-container/30 p-3 rounded-xl border border-secondary/10 shadow-inner">
                      {!activeMapReport.comments || activeMapReport.comments.length === 0 ? (
                        <div className="text-xs text-on-surface-variant text-center py-6">No discussions yet. Start one below!</div>
                      ) : (
                        activeMapReport.comments.map((c, idx) => (
                          <div key={idx} className="bg-surface-container border border-secondary/10 rounded-lg p-3 space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-bold">
                              <span>{getAnonymizedUser(c.user)}</span>
                              <span>{c.timestamp ? new Date(c.timestamp).toLocaleDateString() : 'Just now'}</span>
                            </div>
                            <p className="text-xs text-on-surface break-words leading-relaxed">{c.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Comment Input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddFeedComment(activeMapReport.id);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Ask about schedule..."
                        value={commentInputs[activeMapReport.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [activeMapReport.id]: e.target.value }))}
                        className="flex-1 bg-surface-container border border-secondary/20 px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-on-surface placeholder-on-surface-variant transition-all"
                      />
                      <button
                        type="submit"
                        className="bg-secondary hover:bg-secondary-container active:scale-95 text-on-primary-fixed px-4 rounded-xl transition flex items-center justify-center cursor-pointer shadow-lg shadow-secondary/20"
                      >
                        <span className="material-symbols-outlined text-[20px]">send</span>
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ── MODE: COMMUNITY FEED ───────────────────────────────────────── */}
        {viewMode === 'community' && (
          <div className="w-full animate-tab-transition">
            
            {/* Page Content Canvas */}
            <div className="flex-1 w-full pt-4">
              {/* Hero Bento Section */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
                {/* Civic Action Hero */}
                <div className="lg:col-span-8 bg-surface/60 backdrop-blur-xl border border-secondary/15 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden group shadow-2xl">
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full border border-secondary/20 mb-4">
                      <span className="material-symbols-outlined text-[16px] text-secondary">campaign</span>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Community Objective</span>
                    </div>
                    <h1 className="font-headline-xl text-3xl sm:text-5xl font-bold mb-4 text-on-surface leading-tight">Civic Action Community</h1>
                    <p className="text-on-surface-variant max-w-xl text-sm sm:text-base mb-8">Join others in raising voices against garbage. Upvote dump reports to prioritize them and discuss cleaning schedules.</p>
                    
                    {/* Community Progress */}
                    {(() => {
                      const totalCleanupsCommunity = allReports.filter(r => r.status === 'done').length;
                      const totalTreesPlantedCommunity = totalCleanupsCommunity + 8;
                      const nextForestMilestone = totalTreesPlantedCommunity < 15 ? 15 : totalTreesPlantedCommunity < 30 ? 30 : 50;

                      return (
                        <div className="bg-surface-container/60 p-6 rounded-2xl border border-secondary/5">
                          <div className="flex justify-between items-end mb-3">
                            <div>
                              <span className="text-secondary font-bold text-4xl">{totalTreesPlantedCommunity}</span>
                              <span className="text-on-surface-variant font-label-sm ml-1 uppercase text-[10px] font-bold">Trees Planted</span>
                            </div>
                            <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Next milestone: {nextForestMilestone} trees</span>
                          </div>
                          <div className="h-3 w-full bg-primary-container rounded-full overflow-hidden border border-secondary/10">
                            <div 
                              className="h-full bg-gradient-to-r from-on-tertiary-container to-secondary shadow-[0_0_10px_rgba(65,238,194,0.5)] transition-all duration-700"
                              style={{ width: `${Math.min(100, (totalTreesPlantedCommunity / nextForestMilestone) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Global Stats Card */}
                {(() => {
                  const totalCleanupsCommunity = allReports.filter(r => r.status === 'done').length;
                  const totalUsers = Math.max(12, Object.keys(allReports.reduce((acc, r) => { acc[r.user_email] = true; return acc; }, {})).length);
                  return (
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      <div className="bg-surface/60 backdrop-blur-xl border border-secondary/15 rounded-[2rem] p-6 sm:p-8 flex-1 flex flex-col justify-center shadow-2xl border-t-secondary/20">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 text-secondary">
                            <span className="material-symbols-outlined">check_circle</span>
                          </div>
                          <div>
                            <h3 className="font-headline-md text-2xl font-bold text-on-surface">{totalCleanupsCommunity}</h3>
                            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Total Sites Cleaned</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 text-secondary">
                            <span className="material-symbols-outlined">group_add</span>
                          </div>
                          <div>
                            <h3 className="font-headline-md text-2xl font-bold text-on-surface">{totalUsers * 10}+</h3>
                            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Active Guardians</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setViewMode('report')}
                        className="bg-secondary text-on-secondary font-bold py-6 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(65,238,194,0.2)] hover:shadow-[0_0_40px_rgba(65,238,194,0.4)] transition-all transform hover:-translate-y-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined">auto_awesome</span>
                        Start Cleanup Campaign
                      </button>
                    </div>
                  );
                })()}
              </section>

              {/* Feed + Leaderboard Grid — Feed first always, Leaderboard on right (desktop) / below (mobile) */}
              <section className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">

                {/* Feed: left/top */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
                  
                  {/* Feed Header / Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-4 px-2">
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setCommunitySort('latest')}
                        className={`px-4 sm:px-6 py-2 rounded-full font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all cursor-pointer ${
                          communitySort === 'latest' 
                            ? 'bg-secondary text-on-secondary' 
                            : 'bg-primary-container/40 text-on-surface-variant hover:text-secondary border border-secondary/10'
                        }`}
                      >
                        Latest
                      </button>
                      <button 
                        onClick={() => setCommunitySort('voices')}
                        className={`px-4 sm:px-6 py-2 rounded-full font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all cursor-pointer ${
                          communitySort === 'voices' 
                            ? 'bg-secondary text-on-secondary' 
                            : 'bg-primary-container/40 text-on-surface-variant hover:text-secondary border border-secondary/10'
                        }`}
                      >
                        Priority Voices
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-primary-container/40 px-3 sm:px-4 py-2 rounded-full border border-secondary/10">
                      <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider shrink-0">Region:</span>
                      <select 
                        value={communityArea}
                        onChange={(e) => setCommunityArea(e.target.value)}
                        className="bg-transparent border-none text-on-surface focus:ring-0 cursor-pointer font-bold text-[10px] sm:text-xs py-0 pr-6 appearance-none outline-none"
                      >
                        <option value="__all__">All Districts</option>
                        {uniqueMunicipalities.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Feed Items */}
                  <div className="space-y-6 max-h-[850px] lg:max-h-[calc(100vh-250px)] overflow-y-auto pr-2 pb-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-secondary/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-secondary/40">
                    {loadingReports ? (
                      <div className="text-center py-16 text-on-surface-variant animate-pulse text-sm">Loading feed reports...</div>
                    ) : communityReports.length === 0 ? (
                      <div className="text-center py-20 text-on-surface-variant text-sm">No reports filed in this area yet. Be the first to report!</div>
                    ) : (
                      communityReports.map((report) => {
                        const hasUpvoted = upvotedIds.includes(report.id);
                        const isCommentsOpen = expandedComments[report.id];
                        
                        return (
                          <article key={report.id} className="bg-surface/60 backdrop-blur-xl border border-secondary/15 rounded-[2rem] overflow-hidden group shadow-xl">
                            
                            {/* Card Header */}
                            <div className="p-4 sm:p-6 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base border shrink-0 ${
                                  report.status === 'pending' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30' :
                                  report.status === 'cleared_by_admin' ? 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30' :
                                  'bg-secondary/20 text-secondary border-secondary/30'
                                }`}>
                                  {getAnonymizedUser(report.user_email || report.user_id).slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm sm:text-base text-on-surface truncate">{getAnonymizedUser(report.user_email || report.user_id)}</h4>
                                  <p className="text-[10px] sm:text-xs text-on-surface-variant flex items-center mt-0.5">
                                    <span className="material-symbols-outlined text-[14px] text-secondary mr-1 shrink-0">location_on</span>
                                    <span className="truncate">{report.municipal_name || 'Lucknow Municipal Corporation'}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="text-left sm:text-right shrink-0">
                                <span className={`px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase border ${
                                  report.status === 'pending' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30' : 
                                  report.status === 'cleared_by_admin' ? 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30' :
                                  'bg-secondary/20 text-secondary border-secondary/30'
                                }`}>
                                  {report.status === 'pending' ? 'Pending Cleanup' : 
                                   report.status === 'cleared_by_admin' ? 'Awaiting Confirm' : 
                                   report.status === 'done' ? 'Confirmed Clean' : report.status}
                                </span>
                                <p className="text-[9px] sm:text-[10px] text-on-surface-variant mt-1.5 font-mono">
                                  {new Date(report.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                              </div>
                            </div>

                            {/* Image Media */}
                            <div className="px-4 sm:px-6 pb-2">
                              <div className="h-48 sm:h-64 w-full rounded-2xl overflow-hidden border border-secondary/10 group-hover:border-secondary/30 transition-all relative bg-surface-container">
                                {report.image_url ? (
                                  <img 
                                    src={report.image_url} 
                                    alt="Garbage Dump" 
                                    className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-500" 
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-4xl">broken_image</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
                                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between items-center">
                                  <div className="px-2 sm:px-3 py-1 bg-surface/80 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-mono border border-white/10 text-on-surface shadow-md">
                                    {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                                  </div>
                                  <button 
                                    onClick={() => handleOpenMap(report)}
                                    className="bg-secondary text-on-secondary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[10px] sm:text-xs shadow-xl flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[14px] sm:text-[18px]">map</span>
                                    <span className="hidden sm:inline">View on Map</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Actions & Interactions */}
                            <div className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4">
                              <button 
                                onClick={() => handleRaiseVoice(report.id)}
                                disabled={hasUpvoted}
                                className={`flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 rounded-xl font-bold transition-all group/btn active:scale-95 cursor-pointer text-xs sm:text-sm ${
                                  hasUpvoted
                                    ? 'bg-secondary/10 border border-secondary/30 text-secondary shadow-[0_0_15px_rgba(65,238,194,0.2)]'
                                    : 'bg-primary-container/40 border border-secondary/10 text-on-surface-variant hover:text-secondary hover:border-secondary/30'
                                }`}
                              >
                                <span className="material-symbols-outlined group-hover/btn:scale-110 transition-transform text-[18px]">
                                  {hasUpvoted ? 'campaign' : 'campaign'}
                                </span>
                                <span className="truncate">{hasUpvoted ? 'Raised Voice' : 'Raise Voice'}</span>
                                <span className={`px-1.5 sm:px-2 rounded ml-0.5 sm:ml-1 text-[10px] sm:text-xs ${hasUpvoted ? 'bg-secondary/30 text-secondary' : 'bg-surface-container-high'}`}>
                                  {report.upvotes || 0}
                                </span>
                              </button>
                              
                              <button 
                                onClick={() => setExpandedComments(prev => ({ ...prev, [report.id]: !prev[report.id] }))}
                                className={`flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 rounded-xl font-bold transition-all active:scale-95 cursor-pointer text-xs sm:text-sm ${
                                  isCommentsOpen
                                    ? 'bg-primary-container/60 border border-secondary/20 text-on-surface'
                                    : 'bg-primary-container/40 border border-secondary/10 text-on-surface-variant hover:text-on-surface'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">forum</span>
                                <span className="truncate">Discussion</span>
                                <span className="bg-surface-container-high px-1.5 sm:px-2 rounded ml-0.5 sm:ml-1 text-[10px] sm:text-xs">
                                  {report.comments?.length || 0}
                                </span>
                              </button>
                            </div>

                            {/* Discussion Thread */}
                            {isCommentsOpen && (
                              <div className="px-4 sm:px-6 pb-6 pt-0 animate-slide-down">
                                <div className="bg-primary-container/20 border border-secondary/10 rounded-2xl p-4 space-y-4">
                                  
                                  {/* Comments List */}
                                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {!report.comments || report.comments.length === 0 ? (
                                      <div className="text-center text-[10px] sm:text-xs text-on-surface-variant py-4 italic">
                                        No comments yet. Start the discussion!
                                      </div>
                                    ) : (
                                      report.comments.map((comment, idx) => (
                                        <div key={idx} className="flex gap-3 bg-surface-container/50 p-3 rounded-xl border border-secondary/5">
                                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(comment.user)} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>
                                            {getAnonymizedUser(comment.user).slice(0, 2).toUpperCase()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                              <span className="text-[10px] font-bold text-on-surface">{getAnonymizedUser(comment.user)}</span>
                                              <span className="text-[8px] sm:text-[9px] text-on-surface-variant font-mono">
                                                {comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : 'Just now'}
                                              </span>
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-on-surface-variant leading-relaxed break-words">{comment.text}</p>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>

                                  {/* Write Comment Box */}
                                  <form 
                                    onSubmit={(e) => { e.preventDefault(); handleAddFeedComment(report.id); }}
                                    className="flex gap-2 items-center bg-surface-container-high/50 p-1.5 rounded-xl border border-secondary/20 focus-within:border-secondary transition-all"
                                  >
                                    <input 
                                      type="text"
                                      placeholder="Write a message..."
                                      value={commentInputs[report.id] || ''}
                                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [report.id]: e.target.value }))}
                                      className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm outline-none text-on-surface placeholder-on-surface-variant"
                                    />
                                    <button
                                      type="submit"
                                      disabled={!commentInputs[report.id]?.trim()}
                                      className="bg-secondary hover:bg-secondary-container text-on-secondary font-bold p-2.5 rounded-lg transition-all shrink-0 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                      title="Send Comment"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">send</span>
                                    </button>
                                  </form>
                                </div>
                              </div>
                            )}

                          </article>
                        );
                      })
                    )}
                  </div>

                  {/* Pagination / Load More */}
                  {communityReports.length > 0 && (
                    <div className="flex justify-center py-6">
                      <button className="px-8 py-3 bg-primary-container/40 text-on-surface-variant rounded-full border border-secondary/10 hover:text-secondary hover:border-secondary/40 transition-all font-bold text-xs cursor-pointer shadow-lg">
                        Load More Activities
                      </button>
                    </div>
                  )}

                </div>

                {/* Leaderboard: right on desktop, below on mobile */}
                <aside className="lg:col-span-4 xl:col-span-3 bg-surface/60 backdrop-blur-xl border border-secondary/15 rounded-[2rem] p-6 sm:p-8 shadow-2xl">
                  <div className="flex items-center gap-2 mb-8">
                    <span className="material-symbols-outlined text-secondary">emoji_events</span>
                    <h3 className="font-headline-md text-xl font-bold text-on-surface">Eco Leaderboard</h3>
                  </div>
                  <div className="space-y-6">
                    {topContributors.map((user, idx) => (
                      <div key={idx} className="flex items-center gap-4 group">
                        <div className={`font-stats-lg w-8 text-center italic font-bold text-lg ${idx === 0 ? 'text-secondary opacity-100' : 'text-secondary opacity-30 group-hover:opacity-100 transition-opacity'}`}>
                          #{idx + 1}
                        </div>
                        <div className={`w-12 h-12 rounded-full border-2 p-0.5 ${idx === 0 ? 'border-secondary' : idx === 1 ? 'border-secondary/50' : 'border-secondary/30'}`}>
                          <div className={`w-full h-full rounded-full bg-gradient-to-br ${getAvatarGradient(user.full_name)} flex items-center justify-center font-bold text-xs text-white`}>
                            {user.full_name.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-on-surface text-sm truncate">{user.full_name}</div>
                          <div className="text-[10px] text-on-surface-variant uppercase italic truncate">{user.level}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-secondary font-bold text-sm">{user.points}</div>
                          <div className="text-[10px] text-on-surface-variant">pts</div>
                        </div>
                      </div>
                    ))}
                    <div className="h-px bg-secondary/10 my-4"></div>
                    {/* Your Rank */}
                    <div className="flex items-center gap-4 bg-secondary/5 p-4 rounded-xl border border-secondary/15 ring-1 ring-secondary/5">
                      <div className="font-bold text-on-surface w-8 text-center italic text-lg">#{topContributors.length + 5}</div>
                      <div className="w-10 h-10 rounded-full border-2 border-secondary/80 p-0.5">
                        <div className={`w-full h-full rounded-full bg-gradient-to-br ${getAvatarGradient(session?.user?.email || 'User')} flex items-center justify-center font-bold text-[10px] text-white`}>
                          {(profile?.full_name || session?.user?.email || 'User').slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-on-surface text-sm truncate">{profile?.full_name || session?.user?.email || 'You'}</div>
                        <div className="text-[10px] text-on-surface-variant uppercase italic truncate">Community Member</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-secondary font-bold text-sm">{profile?.points || '--'}</div>
                        <div className="text-[10px] text-on-surface-variant">pts</div>
                      </div>
                    </div>
                  </div>
                </aside>

              </section>
            </div>

            {/* Atmospheric Background Element */}
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </main>

      {/* Leaflet Map Modal for Location Preview (History Submissions) */}
      {isMapModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[5000] backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">Report Location Preview</h3>
                <p className="text-[10px] text-slate-500">Report ID: #{selectedReport.id}</p>
              </div>
              <button 
                onClick={() => setIsMapModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-750 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Map Area */}
            <div ref={modalMapContainerRef} className="w-full h-80 z-10" />

            {/* Info Footer */}
            <div className="p-4 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
              <div className="space-y-0.5">
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <MapPin size={12} className="text-emerald-400" />
                  {selectedReport.latitude.toFixed(5)}, {selectedReport.longitude.toFixed(5)}
                </span>
                <span className="block text-[10px] text-slate-500 truncate">{selectedReport.municipal_name || ' Lucknow'}</span>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                selectedReport.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                selectedReport.status === 'cleared_by_admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                selectedReport.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                'bg-slate-750 text-slate-400'
              }`}>
                {selectedReport.status === 'pending' ? 'Pending' : 
                 selectedReport.status === 'cleared_by_admin' ? 'Awaiting Confirm' : 
                 selectedReport.status === 'done' ? 'Confirmed Clean' : selectedReport.status}
              </span>
            </div>

          </div>
        </div>
      )}

        {/* ── Mobile Bottom Nav (Matching DashboardOverview) ── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex justify-between items-center px-6 py-3 z-[6000]"
          style={{ background: 'rgba(17,20,18,0.85)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(65,238,194,0.15)' }}
        >
          {[
            { label: 'Home', icon: LayoutDashboard, action: () => navigate('/dashboard') },
            { label: 'Map', icon: Map, action: () => setViewMode('explore-map') },
            { label: '', icon: Plus, action: () => navigate('/dashboard/new-report'), isCenter: true },
            { label: 'Social', icon: Megaphone, action: () => setViewMode('community') },
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
