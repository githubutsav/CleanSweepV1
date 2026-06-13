import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Leaf
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
    if (routerLocation.state?.viewMode) {
      setTimeout(() => {
        setViewMode(routerLocation.state.viewMode);
      }, 0);
    }
  }, [routerLocation.state]);

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
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [step, setStep] = useState('camera'); // camera | verify | confirm | submitting | done
  const [verifyStatus, setVerifyStatus] = useState('');
  const [location, setLocation] = useState(null);
  const [submitError, setSubmitError] = useState('');

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

  // ── Geolocation ─────────────────────────────────────────────────
  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });

  // ── Gemini verification ─────────────────────────────────────────
  const verifyImageWithGemini = async (dataUrl) => {
    const base64 = dataUrl.split(',')[1];
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your-')) {
      console.warn('Gemini API key not set – skipping verification.');
      return true;
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [
          { text: "Is this an image of garbage, trash, or illegally dumped waste? Answer with only 'yes' or 'no'." },
          { inlineData: { mimeType: 'image/jpeg', data: base64 } },
        ],
      }],
    };
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { console.error('Gemini error', res.status); return true; }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
      console.log('Gemini:', text);
      return text?.includes('yes');
    } catch (e) {
      console.error('Gemini exception', e);
      return true;
    }
  };

  // ── Capture flow ────────────────────────────────────────────────
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

    stopCamera();
    setPhoto(dataUrl);
    setStep('verify');

    // Run Gemini verification and geolocation in parallel
    setVerifyStatus('Checking image with AI...');
    const [isGarbage, pos] = await Promise.allSettled([
      verifyImageWithGemini(dataUrl),
      getLocation(),
    ]);

    const garbage = isGarbage.status === 'fulfilled' ? isGarbage.value : true;
    const coords = pos.status === 'fulfilled' ? pos.value.coords : null;

    if (!garbage) {
      toast.error('Image rejected by AI. Please take a clear photo of garbage.');
      setStep('camera');
      setPhoto(null);
      setLocation(null);
      startCamera();
      return;
    }

    if (!coords) {
      toast.error('Could not get your location. Please enable GPS/location services and try again.');
      setStep('camera');
      setPhoto(null);
      startCamera();
      return;
    }

    setLocation({ latitude: coords.latitude, longitude: coords.longitude });
    setStep('confirm');
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

  // ── Submit report to Supabase ────────────────────────────────────
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
        description: reportNote.trim() || null
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
    setPhoto(null);
    setLocation(null);
    setSubmitError('');
    setReportNote('');
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
      toast.error(`Error raising voice: ${err.message}. Make sure you run the SQL migration to add upvotes column.`);
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
      alert(`Error adding comment: ${err.message}. Make sure you run the SQL migration to add comments column.`);
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
        zoomControl: false
      }).setView([26.8467, 80.9462], 12);

      L.control.zoom({ position: 'bottomright' }).addTo(areaMapRef.current);

      // Add default tile layer
      const url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      const attribution = '&copy; OpenStreetMap contributors &copy; CARTO';
      areaTileLayerRef.current = L.tileLayer(url, { attribution }).addTo(areaMapRef.current);

      areaMarkersGroupRef.current = L.layerGroup().addTo(areaMapRef.current);

      // Close drawer on map background click
      areaMapRef.current.on('click', () => {
        setSelectedMapReport(null);
      });
    } else {
      setTimeout(() => {
        if (areaMapRef.current) {
          areaMapRef.current.invalidateSize();
        }
      }, 100);
    }
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
      const color = r.status === 'pending' ? '#ef4444' : 
                    r.status === 'cleared_by_admin' ? '#3b82f6' : '#10b981';
      
      const pinSvg = `
        <svg viewBox="0 0 24 30" width="28" height="36" xmlns="http://www.w3.org/2000/svg">
          <path d="M12,2 C6.48,2 2,6.48 2,12 C2,17.4 12,27 12,27 C12,27 22,17.4 22,12 C22,6.48 17.52,2 12,2 Z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="12" cy="10" r="4.5" fill="#ffffff"/>
        </svg>
      `;

      const customIcon = L.divIcon({
        html: pinSvg,
        className: 'custom-area-marker',
        iconSize: [28, 36],
        iconAnchor: [14, 36]
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
    <div className="flex flex-col min-h-screen items-center text-white bg-slate-900 p-3 sm:p-6 font-sans">
      
      {/* Header */}
      <header className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 max-w-4xl bg-slate-800/40 backdrop-blur border border-slate-700/50 px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl shadow-xl relative z-50">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer select-none hover:opacity-90 active:scale-95 transition-all"
          >
            <img src="/favicon.svg" className="w-7 h-7 sm:w-8 sm:h-8 filter drop-shadow-[0_0_6px_rgba(5,255,163,0.45)]" alt="CleanSweep Logo" />
            <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">CleanSweep</span>
          </div>
          
          {/* Mobile Profile & Marketplace Access (hidden on desktop) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => navigate('/marketplace')}
              className="bg-slate-750 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center text-slate-300 transition border border-slate-700/50 cursor-pointer"
              title="Marketplace"
            >
              <Store size={14} />
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="bg-emerald-850/80 hover:bg-emerald-800 w-8 h-8 rounded-full flex items-center justify-center text-white transition border border-emerald-600/50 cursor-pointer"
                title="Admin Dashboard"
              >
                <ShieldCheck size={14} />
              </button>
            )}
            
            {/* User Profile Menu on Mobile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 border-2 border-slate-500 transition shadow cursor-pointer text-white"
              >
                <User size={15} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 py-2">
                  <div className="px-4 py-2 text-slate-400 text-[10px] truncate border-b border-slate-700/60 pb-2 mb-1">
                    <span className="block font-bold text-white truncate">{profile?.full_name || 'Civic Reporter'}</span>
                    <span className="block text-slate-550 text-[8px] truncate mt-0.5">{session?.user?.email}</span>
                    {profile && (
                      <div className="mt-1.5 flex flex-col gap-0.5">
                        <span className="text-[9px] text-amber-400 font-extrabold">🌟 {profile.points || 0} Points</span>
                        <span className="text-[8px] text-emerald-400 italic">{profile.level || 'Bronze Eco-Warrior'}</span>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => { setProfileOpen(false); navigate('/admin'); }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-xs text-emerald-450 flex items-center gap-2"
                    >
                      <ShieldCheck size={14} /> Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-xs flex items-center gap-2"
                  >
                    <User size={14} /> My Profile
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/marketplace'); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-xs flex items-center gap-2"
                  >
                    <Store size={14} /> Marketplace
                  </button>
                  <hr className="border-slate-700 my-1" />
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-xs text-red-400 flex items-center gap-2"
                  >
                    <User size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab controls & desktop profile container */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* Segmented Controls for Tabs */}
          <div className="flex bg-slate-900 border border-slate-750 p-1 rounded-full items-center gap-1 shadow-inner w-full md:w-auto justify-around sm:justify-start">
            <button
              onClick={() => { setStep('camera'); setViewMode('report'); }}
              className={`flex-1 sm:flex-initial flex justify-center px-3.5 py-1.5 rounded-full items-center gap-1.5 font-bold transition text-[10px] sm:text-xs ${
                viewMode === 'report' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera size={13} /> <span>Report</span>
            </button>
            <button
              onClick={() => { stopCamera(); setViewMode('explore-map'); }}
              className={`flex-1 sm:flex-initial flex justify-center px-3.5 py-1.5 rounded-full items-center gap-1.5 font-bold transition text-[10px] sm:text-xs ${
                viewMode === 'explore-map' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Map size={13} /> <span>Explore Map</span>
            </button>
            <button
              onClick={() => { stopCamera(); setViewMode('community'); }}
              className={`flex-1 sm:flex-initial flex justify-center px-3.5 py-1.5 rounded-full items-center gap-1.5 font-bold transition text-[10px] sm:text-xs ${
                viewMode === 'community' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Megaphone size={13} /> <span>Community</span>
            </button>
          </div>

          {/* Desktop Marketplace & Admin & Profile Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate('/marketplace')}
              className="bg-slate-750 hover:bg-slate-700 px-4 py-2 rounded-full flex items-center gap-2 font-semibold transition text-xs border border-slate-700/60 cursor-pointer"
            >
              <Store size={14} /> Marketplace
            </button>

            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="bg-emerald-700 hover:bg-emerald-650 px-4 py-2 rounded-full flex items-center gap-1.5 font-bold transition text-xs border border-emerald-650 cursor-pointer"
              >
                <ShieldCheck size={14} /> Admin
              </button>
            )}

            {/* Desktop User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 border-2 border-slate-500 transition shadow cursor-pointer text-white"
              >
                <User size={20} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 py-2">
                  <div className="px-4 py-2 text-slate-400 text-[10px] truncate border-b border-slate-700/60 pb-2 mb-1">
                    <span className="block font-bold text-white truncate">{profile?.full_name || 'Civic Reporter'}</span>
                    <span className="block text-slate-550 text-[8px] truncate mt-0.5">{session?.user?.email}</span>
                    {profile && (
                      <div className="mt-1.5 flex flex-col gap-0.5">
                        <span className="text-[9px] text-amber-400 font-extrabold">🌟 {profile.points || 0} Points</span>
                        <span className="text-[8px] text-emerald-400 italic">{profile.level || 'Bronze Eco-Warrior'}</span>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => { setProfileOpen(false); navigate('/admin'); }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-xs text-emerald-450 flex items-center gap-2"
                    >
                      <ShieldCheck size={14} /> Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-xs flex items-center gap-2"
                  >
                    <User size={14} /> My Profile
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/marketplace'); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-xs flex items-center gap-2"
                  >
                    <Store size={14} /> Marketplace
                  </button>
                  <hr className="border-slate-700 my-1" />
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-xs text-red-400 flex items-center gap-2"
                  >
                    <User size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full max-w-3xl flex flex-col items-center px-2">

        {/* ── MODE: FILE REPORT ────────────────────────────────────────── */}
        {viewMode === 'report' && (
          <div className="w-full animate-tab-transition">
            
            {/* Step: Camera */}
            {step === 'camera' && (
              <div className="w-full flex flex-col items-center space-y-6 animate-tab-transition">
                {/* 3D Header Split Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center w-full max-w-3xl bg-slate-800/10 p-5 rounded-3xl border border-slate-850 shadow-inner">
                  <div className="md:col-span-8 text-center md:text-left space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Report Illegal Dumping</h1>
                    <p className="text-slate-405 text-xs sm:text-sm leading-relaxed">
                      Snap a picture of dumping spots or overflowing garbage. Our AI checks report validity, municipal crews clean up, and we plant trees on your behalf!
                    </p>
                  </div>
                  <div className="md:col-span-4 flex justify-center">
                    <ThreePlanet />
                  </div>
                </div>

                <div className="camera-container w-full aspect-video rounded-3xl flex items-center justify-center overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${!stream ? 'hidden' : ''}`}
                  />
                  {!stream && (
                    <div className="text-center text-gray-500">
                      <CameraOff className="w-16 h-16 mx-auto mb-2 text-slate-600 animate-pulse" />
                      <p className="text-xs">Camera is offline</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {!stream ? (
                    <button
                      onClick={startCamera}
                      className="bg-emerald-600 hover:bg-emerald-500 py-3.5 px-8 rounded-full flex items-center gap-2 font-bold shadow-lg shadow-emerald-955/30 hover:scale-105 transition duration-200"
                    >
                      <Video size={18} /> Start Camera feed
                    </button>
                  ) : (
                    <button
                      onClick={capturePhoto}
                      className="capture-button bg-red-650 hover:bg-red-600 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-4 border-white transition transform active:scale-95"
                    >
                      <Camera size={32} />
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="w-full flex items-center gap-4 py-4">
                  <div className="flex-1 h-px bg-slate-850" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">My Reports History</span>
                  <div className="flex-1 h-px bg-slate-850" />
                </div>

                {/* User's Reports list */}
                <div className="w-full bg-slate-800/25 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
                  <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2 text-slate-300">
                    <Clock size={16} className="text-slate-400" /> My Submissions
                  </h3>
                  
                  {loadingReports ? (
                    <div className="text-center py-8 text-xs text-slate-500">Loading history...</div>
                  ) : myReports.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">You haven't reported any garbage sites yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                      {myReports.map((report) => (
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
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Step: Verify */}
            {step === 'verify' && (
              <div className="flex flex-col items-center space-y-4 py-12 animate-tab-transition">
                <div className="spinner" />
                <p className="text-lg font-semibold">{verifyStatus}</p>
                <p className="text-sm text-slate-400">Also fetching your location</p>
              </div>
            )}

            {/* Step: Confirm */}
            {step === 'confirm' && (
              <div className="w-full flex flex-col items-center space-y-4 animate-tab-transition">
                <h1 className="text-2xl font-bold">Confirm Your Report</h1>

                <div className="w-full aspect-video rounded-3xl overflow-hidden bg-gray-800 border border-slate-750/70 shadow-2xl">
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                </div>

                {location && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-950/40 border border-emerald-900/40 px-5 py-2.5 rounded-full">
                    <MapPin size={14} className="animate-bounce" />
                    <span>GPS Location: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
                  </div>
                )}

                <div className="w-full space-y-1.5 px-2 max-w-lg">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-405 block">
                    Add a description or note (optional)
                  </label>
                  <textarea 
                    rows={2}
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    placeholder="e.g. Pile of plastics and broken glass near the park gate..."
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500 resize-none font-medium"
                  />
                </div>

                {submitError && (
                  <p className="text-red-400 text-sm text-center">{submitError}</p>
                )}

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={submitReport}
                    className="bg-emerald-600 hover:bg-emerald-500 py-3.5 px-8 rounded-full flex items-center gap-2 font-bold shadow-lg transition duration-200"
                  >
                    <Send size={18} /> Submit Report
                  </button>
                  <button
                    onClick={() => { resetToCamera(); startCamera(); }}
                    className="bg-slate-700 hover:bg-slate-655 py-3.5 px-6 rounded-full flex items-center gap-2 font-bold transition duration-205"
                  >
                    <RotateCw size={18} /> Retake Photo
                  </button>
                </div>
              </div>
            )}

            {/* Step: Submitting */}
            {step === 'submitting' && (
              <div className="flex flex-col items-center space-y-4 py-12 animate-tab-transition">
                <div className="spinner" />
                <p className="text-lg font-semibold animate-pulse">Submitting your report...</p>
              </div>
            )}

            {/* Step: Done */}
            {step === 'done' && (
              <div className="flex flex-col items-center space-y-6 py-12 text-center animate-tab-transition">
                <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-4xl shadow-lg animate-bounce">✓</div>
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-400">Report Submitted!</h1>
                  <p className="text-slate-400 text-sm max-w-sm animate-pulse">
                    Thank you! Your garbage report has been saved. The municipal team will clear it shortly.
                  </p>
                </div>

                {/* Gamified Points Award Alert Card */}
                <div className="bg-emerald-950/20 border border-emerald-500/20 p-4.5 rounded-3xl max-w-xs w-full flex flex-col items-center gap-1.5 shadow-inner mt-2 animate-tab-transition">
                  <span className="text-2xl">🌟</span>
                  <h4 className="font-extrabold text-white text-xs">CleanPoints Earned!</h4>
                  <p className="text-emerald-400 font-black text-xl">+20 Points</p>
                  <p className="text-[9px] text-slate-450 font-medium leading-relaxed">
                    Check your profile or plant trees inside the Marketplace dashboard!
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={resetToCamera}
                    className="bg-slate-755 hover:bg-slate-700 py-3 px-6 rounded-full flex items-center gap-2 font-bold transition shadow"
                  >
                    <Camera size={18} /> Report Another Site
                  </button>
                  <button
                    onClick={() => {
                      resetToCamera();
                      setViewMode('report');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 py-3 px-6 rounded-full flex items-center gap-2 font-bold transition shadow border border-emerald-500/30"
                  >
                    Back to Home Dashboard
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── MODE: EXPLORE AREA MAP ─────────────────────────────────────── */}
        {viewMode === 'explore-map' && (
          <div className="w-full space-y-4 animate-tab-transition flex flex-col">
            <div className="text-center max-w-md mx-auto space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-250 flex items-center justify-center gap-2">
                <Map className="text-emerald-400" size={24} /> Explore Area Map
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                Real-time garbage reports and cleaning progress across municipal areas.
              </p>
            </div>

            {/* Immersive Google Maps Container */}
            <div className="relative w-full h-[690px] sm:h-[750px] border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl bg-slate-950 flex flex-col z-10">
              
              {/* Leaflet Map Canvas */}
              <div ref={areaMapContainerRef} className="w-full h-full z-0" />

              {/* Floating Top Bar (Search + Geocoding) */}
              <form 
                onSubmit={handleMapSearch}
                className="absolute top-4 left-4 z-20 w-80 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl flex items-center px-3.5 py-2 transition-all focus-within:border-emerald-500"
              >
                <Search className="text-slate-400 flex-shrink-0" size={16} />
                <input 
                  type="text"
                  placeholder="Search Lucknow areas, roads..."
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-white placeholder-slate-500 focus:outline-none flex-1 py-1 px-2.5"
                />
                {mapSearchQuery && (
                  <button 
                    type="button"
                    onClick={() => { setMapSearchQuery(''); if (searchMarkerRef.current) searchMarkerRef.current.remove(); }}
                    className="text-slate-450 hover:text-slate-200 p-1 flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
                <button 
                  type="submit"
                  disabled={mapSearchLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ml-1 flex-shrink-0 flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  {mapSearchLoading ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : 'Search'}
                </button>
              </form>

              {/* Floating Filter Pills / chips (top-center/left) */}
              <div className="absolute top-18 sm:top-4 left-4 sm:left-[350px] z-20 flex flex-wrap items-center gap-1.5 max-w-[calc(100vw-40px)]">
                {/* Region select pill */}
                <div className="relative bg-slate-900/90 backdrop-blur-sm border border-slate-750 rounded-xl px-3 py-1.5 flex items-center gap-1 shadow-lg text-[10px] font-bold text-slate-200">
                  <SlidersHorizontal size={11} className="text-slate-400" />
                  <select 
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="bg-transparent text-slate-200 border-none outline-none focus:ring-0 cursor-pointer pr-1 py-0"
                  >
                    <option value="__all__" className="bg-slate-900 text-white">All Regions</option>
                    {uniqueMunicipalities.map((name) => (
                      <option key={name} value={name} className="bg-slate-900 text-white">{name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Chips */}
                <button
                  type="button"
                  onClick={() => setAreaStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-lg border flex items-center gap-1 cursor-pointer ${
                    areaStatusFilter === 'active'
                      ? 'bg-red-500/10 text-red-400 border-red-500/35 font-extrabold scale-102'
                      : 'bg-slate-900/90 border-slate-750 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Active Dumps
                </button>

                <button
                  type="button"
                  onClick={() => setAreaStatusFilter('awaiting_confirm')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-lg border flex items-center gap-1 cursor-pointer ${
                    areaStatusFilter === 'awaiting_confirm'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/35 font-extrabold scale-102'
                      : 'bg-slate-900/90 border-slate-750 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Awaiting Confirm
                </button>

                <button
                  type="button"
                  onClick={() => setAreaStatusFilter('cleared')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-lg border flex items-center gap-1 cursor-pointer ${
                    areaStatusFilter === 'cleared'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 font-extrabold scale-102'
                      : 'bg-slate-900/90 border-slate-750 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Cleared
                </button>

                <button
                  type="button"
                  onClick={() => setAreaStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-lg border flex items-center gap-1 cursor-pointer ${
                    areaStatusFilter === 'all'
                      ? 'bg-slate-105 text-slate-900 border-white font-extrabold scale-102'
                      : 'bg-slate-900/90 border-slate-750 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  All Statuses
                </button>
              </div>

              {/* Floating Layer Styles Switcher (top-right) */}
              <div className="absolute top-4 right-4 z-20 flex items-center bg-slate-900/90 backdrop-blur-sm border border-slate-750 p-1 rounded-xl shadow-lg">
                <button
                  type="button"
                  onClick={() => setMapTileLayer('map')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer ${
                    mapTileLayer === 'map' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapTileLayer('satellite')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer ${
                    mapTileLayer === 'satellite' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapTileLayer('dark')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer ${
                    mapTileLayer === 'dark' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dark
                </button>
              </div>

              {/* Floating "Locate Me" Button (above zoom, bottom-right) */}
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={locatingUser}
                className="absolute bottom-18 right-4 z-20 w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-center shadow-2xl border border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Zoom to my location"
              >
                {locatingUser ? (
                  <div className="w-4.5 h-4.5 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <Locate size={18} className="text-blue-600" />
                )}
              </button>

              {/* Floating Bottom Stats Banner */}
              <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-sm border border-slate-750 rounded-2xl px-4 py-2 flex items-center gap-4 text-[10px] font-extrabold shadow-lg">
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Active: <span className="text-white ml-0.5">{areaActiveCount}</span>
                </span>
                <span className="w-px h-3 bg-slate-755"></span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Resolved: <span className="text-white ml-0.5">{areaClearedCount}</span>
                </span>
              </div>

              {/* Google Maps style Side Details Drawer */}
              {activeMapReport && (
                <div className="absolute sm:top-4 sm:bottom-4 sm:left-4 bottom-0 left-0 right-0 z-30 sm:w-85 w-full bg-slate-900/95 backdrop-blur-md border sm:border-slate-700/80 border-t border-slate-700/80 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[75%] sm:max-h-[calc(100vh-250px)] max-w-full sm:max-w-[calc(100vw-32px)] transition-all duration-300 animate-slide-in-left">
                  
                  {/* Photo Header */}
                  <div className="relative h-40 w-full bg-slate-950 flex-shrink-0">
                    {activeMapReport.image_url ? (
                      <img src={activeMapReport.image_url} alt="Garbage site" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500">
                        <MapPin size={36} className="text-slate-600 mb-1" />
                        <span className="text-[9px] uppercase tracking-wider font-bold">No Image Available</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30"></div>
                    
                    {/* Close Button on image */}
                    <button
                      type="button"
                      onClick={() => setSelectedMapReport(null)}
                      className="absolute top-3 right-3 bg-black/60 hover:bg-black/90 text-white rounded-full p-1.5 transition-all backdrop-blur-sm cursor-pointer"
                    >
                      <X size={14} />
                    </button>

                    {/* Status Pill & Site ID bottom */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        activeMapReport.status === 'pending' ? 'bg-red-500 text-white shadow' :
                        activeMapReport.status === 'cleared_by_admin' ? 'bg-blue-500 text-white shadow' :
                        'bg-emerald-500 text-white shadow'
                      }`}>
                        {activeMapReport.status === 'cleared_by_admin' ? 'Awaiting User Confirm' : activeMapReport.status === 'pending' ? 'Pending Action' : 'Resolved Clean'}
                      </span>
                      <h3 className="font-extrabold text-sm sm:text-base text-white mt-1 drop-shadow-md">
                        Report Site #{activeMapReport.id}
                      </h3>
                    </div>
                  </div>

                  {/* Scrollable details */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-300">
                    
                    {/* Quick Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${activeMapReport.latitude},${activeMapReport.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold py-2 rounded-xl transition shadow-md cursor-pointer text-center"
                      >
                        <Compass size={14} />
                        Directions
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRaiseVoice(activeMapReport.id)}
                        disabled={upvotedIds.includes(activeMapReport.id)}
                        className={`flex items-center justify-center gap-1.5 border font-extrabold py-2 rounded-xl transition cursor-pointer ${
                          upvotedIds.includes(activeMapReport.id)
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-white active:scale-95'
                        }`}
                      >
                        <Megaphone size={14} />
                        {upvotedIds.includes(activeMapReport.id) ? 'Upvoted!' : 'Raise Voice'}
                      </button>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="text-slate-400 flex-shrink-0 mt-0.5" size={14} />
                        <div>
                          <span className="block font-bold text-slate-200">Municipal Area</span>
                          <span className="text-slate-400 text-[10px]">{activeMapReport.municipal_name || ' Lucknow'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 border-t border-slate-850 pt-2.5">
                        <Compass className="text-slate-400 flex-shrink-0 mt-0.5" size={14} />
                        <div>
                          <span className="block font-bold text-slate-200">GPS Coordinates</span>
                          <span className="text-slate-400 text-[10px]">{activeMapReport.latitude.toFixed(5)}, {activeMapReport.longitude.toFixed(5)}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 border-t border-slate-850 pt-2.5">
                        <Clock className="text-slate-400 flex-shrink-0 mt-0.5" size={14} />
                        <div>
                          <span className="block font-bold text-slate-200">Reported On</span>
                          <span className="text-slate-400 text-[10px]">{new Date(activeMapReport.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 border-t border-slate-850 pt-2.5">
                        <User className="text-slate-400 flex-shrink-0 mt-0.5" size={14} />
                        <div>
                          <span className="block font-bold text-slate-200">Reporter</span>
                          <span className="text-slate-400 text-[10px]">{getAnonymizedUser(activeMapReport.user_email)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Actions */}
                    {activeMapReport.status === 'cleared_by_admin' && (
                      <div className="bg-blue-955/45 border border-blue-800/40 rounded-xl p-3 space-y-2.5">
                        <h4 className="font-extrabold text-blue-300 text-xs flex items-center gap-1.5">
                          <ShieldCheck size={14} /> Verification Feedback
                        </h4>
                        <p className="text-[10px] text-blue-200">
                          Admin marked clean. Please verify if it's cleared:
                        </p>
                        {activeMapReport.admin_note && (
                          <p className="text-[10px] text-slate-400 italic bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                            <b>Admin Note:</b> {activeMapReport.admin_note}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUserConfirmCleared(activeMapReport.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                          >
                            Verify Clean
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUserRejectCleared(activeMapReport.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                          >
                            Still Dirty
                          </button>
                        </div>
                      </div>
                    )}

                    {activeMapReport.status === 'done' && (
                      <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-3 space-y-1.5">
                        <h4 className="font-extrabold text-emerald-400 text-xs flex items-center gap-1.5">
                          <Check size={14} /> Verified Resolved
                        </h4>
                        <p className="text-[10px] text-emerald-300">
                          Citizen confirmed that this location has been cleared.
                        </p>
                        {activeMapReport.user_feedback && (
                          <p className="text-[10px] text-slate-400 italic bg-slate-955/60 p-2 rounded-lg border border-slate-850">
                            <b>User Feedback:</b> {activeMapReport.user_feedback}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Discussion Thread */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-emerald-450" />
                        Community Chat ({activeMapReport.comments?.length || 0})
                      </h4>

                      {/* Comments feed list */}
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 bg-slate-955/40 p-2 rounded-xl border border-slate-900 shadow-inner">
                        {!activeMapReport.comments || activeMapReport.comments.length === 0 ? (
                          <div className="text-[9px] text-slate-500 text-center py-4">No discussions yet. Start one below!</div>
                        ) : (
                          activeMapReport.comments.map((c, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-850 rounded-lg p-2 space-y-0.5">
                              <div className="flex justify-between items-center text-[8px] text-slate-450 font-semibold">
                                <span>{getAnonymizedUser(c.user)}</span>
                                <span>{c.timestamp ? new Date(c.timestamp).toLocaleDateString() : 'Just now'}</span>
                              </div>
                              <p className="text-[10px] text-slate-200 break-words leading-relaxed">{c.text}</p>
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
                        className="flex gap-1.5"
                      >
                        <input
                          type="text"
                          placeholder="Ask about schedule..."
                          value={commentInputs[activeMapReport.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [activeMapReport.id]: e.target.value }))}
                          className="flex-1 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-semibold focus:outline-none focus:border-emerald-500 text-white placeholder-slate-550"
                        />
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 rounded-lg text-[10px] transition flex items-center justify-center cursor-pointer"
                        >
                          <Send size={11} />
                        </button>
                      </form>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── MODE: COMMUNITY FEED ───────────────────────────────────────── */}
        {viewMode === 'community' && (
          <div className="w-full space-y-6 animate-tab-transition">
            <div className="text-center max-w-md mx-auto space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
                <Megaphone className="text-emerald-400 animate-pulse" size={24} /> Civic Action Community
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                Join others in raising voices against garbage. Upvote dump reports to prioritize them, and discuss cleaning schedules.
              </p>
            </div>

            {/* Community Stats & Leaderboard Grid */}
            {(() => {
              const totalCleanupsCommunity = allReports.filter(r => r.status === 'done').length;
              const totalTreesPlantedCommunity = totalCleanupsCommunity + 8;
              const nextForestMilestone = totalTreesPlantedCommunity < 15 ? 15 : totalTreesPlantedCommunity < 30 ? 30 : 50;

              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full">
                  
                  {/* Leaderboard Card */}
                  <div className="md:col-span-5 bg-slate-800/40 backdrop-blur border border-slate-700/50 p-5 rounded-3xl shadow-xl flex flex-col gap-3.5">
                    <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <Award className="text-amber-400" size={15} /> Eco Leaderboard
                    </h4>
                    
                    <div className="space-y-2.5">
                      {topContributors.map((user, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-900/60 border border-slate-850/60 p-2.5 rounded-2xl">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`font-black text-xs w-4 text-center shrink-0 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                              #{idx + 1}
                            </span>
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarGradient(user.full_name)} flex items-center justify-center font-bold text-[10px] text-white shrink-0 border border-slate-750`}>
                              {user.full_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs block text-slate-200 truncate">{user.full_name}</span>
                              <span className="text-[8px] text-slate-450 italic block truncate">{user.level}</span>
                            </div>
                          </div>
                          <span className="font-black text-xs text-emerald-450 shrink-0">🌟 {user.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestones Card */}
                  <div className="md:col-span-7 bg-slate-800/40 backdrop-blur border border-slate-700/50 p-5 rounded-3xl shadow-xl flex flex-col justify-between gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                    
                    <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <Leaf className="text-emerald-400 animate-pulse" size={15} /> Community Eco Impact
                    </h4>

                    <div className="grid grid-cols-2 gap-4 h-full items-center">
                      <div className="bg-slate-900/60 border border-slate-850/60 p-4 rounded-2xl flex flex-col justify-center items-center text-center gap-1.5 h-full">
                        <span className="text-2xl font-black text-white">🌳 {totalTreesPlantedCommunity}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Trees Planted</span>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-850/60 p-4 rounded-2xl flex flex-col justify-center items-center text-center gap-1.5 h-full">
                        <span className="text-2xl font-black text-emerald-400">✓ {totalCleanupsCommunity}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sites Cleaned</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-450">
                        <span>Next community forest milestone:</span>
                        <span className="text-emerald-450 font-black">{totalTreesPlantedCommunity}/{nextForestMilestone} trees</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-850 overflow-hidden p-0.5">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700" 
                          style={{ width: `${Math.min(100, (totalTreesPlantedCommunity / nextForestMilestone) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* Sorting & Area Filter Controls */}
            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 p-4 sm:p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Sort:</span>
                <button
                  onClick={() => setCommunitySort('latest')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                    communitySort === 'latest' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setCommunitySort('voices')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                    communitySort === 'voices' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Megaphone size={12} /> Priority Voices
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 shrink-0">Region:</span>
                <select 
                  value={communityArea}
                  onChange={(e) => setCommunityArea(e.target.value)}
                  className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-white w-full sm:w-44 cursor-pointer"
                >
                  <option value="__all__">All Regions</option>
                  {uniqueMunicipalities.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Community Feed List */}
            <div className="space-y-6 w-full">
              {loadingReports ? (
                <div className="text-center py-16 text-slate-500 animate-pulse text-sm">Loading feed reports...</div>
              ) : communityReports.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-sm">No reports filed in this area yet. Be the first to report!</div>
              ) : (
                communityReports.map((report) => {
                  const hasUpvoted = upvotedIds.includes(report.id);
                  const isCommentsOpen = expandedComments[report.id];
                  
                  return (
                    <div key={report.id} className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-md border border-slate-700/40 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 hover:border-emerald-500/20 transition-all duration-300 animate-tab-transition">
                      
                      {/* Card Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Colorful avatar based on user hash */}
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(getAnonymizedUser(report.user_email || report.user_id))} flex items-center justify-center font-black text-xs text-white shadow-md border border-slate-700/50 shrink-0`}>
                            {getAnonymizedUser(report.user_email || report.user_id).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-extrabold text-slate-200 block truncate">
                              {getAnonymizedUser(report.user_email || report.user_id)}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate font-medium">
                              📍 {report.municipal_name || ' Lucknow'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize block w-fit ml-auto mb-1 ${
                            report.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-550/20' : 
                            report.status === 'cleared_by_admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-550/20' :
                            report.status === 'done' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-550/20' : 
                            'bg-slate-750 text-slate-400'
                          }`}>
                            {report.status === 'pending' ? 'Pending Cleanup' : 
                             report.status === 'cleared_by_admin' ? 'Awaiting Confirm' : 
                             report.status === 'done' ? 'Confirmed Clean' : report.status}
                          </span>
                          <span className="text-[9px] text-slate-500 block font-mono">
                            {new Date(report.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>

                      {/* Image Media */}
                      {report.image_url && (
                        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-855 shadow-inner group">
                          <img src={report.image_url} alt="Garbage Dump" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      )}

                      {/* Reporter's Note */}
                      {report.description && (
                        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl text-xs text-slate-200 leading-relaxed italic relative pl-9 pr-6 shadow-inner">
                          <span className="absolute left-3 top-3 text-emerald-450 text-xl font-bold not-italic">“</span>
                          {report.description}
                          <span className="absolute right-3 bottom-0.5 text-emerald-450 text-xl font-bold not-italic">”</span>
                        </div>
                      )}

                      {/* Location details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 bg-slate-955/40 p-3 rounded-2xl border border-slate-855">
                        <div className="flex items-center gap-2 font-medium">
                          <MapPin size={13} className="text-emerald-400 shrink-0" />
                          <span className="text-[10px] sm:text-[11px] font-mono tracking-tight text-slate-300">
                            {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                          </span>
                        </div>
                        
                        <button 
                          onClick={() => handleOpenMap(report)}
                          className="w-full sm:w-auto text-emerald-400 hover:text-emerald-300 font-bold flex items-center justify-center gap-1.5 py-1 px-3 bg-emerald-955/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg transition duration-200 text-[11px] cursor-pointer"
                        >
                          <Eye size={12} /> View on Map
                        </button>
                      </div>

                      {/* Bottom Social Action Bar */}
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={() => handleRaiseVoice(report.id)}
                          disabled={hasUpvoted}
                          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                            hasUpvoted 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 cursor-not-allowed shadow-inner' 
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-md hover:border-slate-600'
                          }`}
                        >
                          <Megaphone size={14} className={hasUpvoted ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} />
                          <span>{hasUpvoted ? 'Voice Raised' : 'Raise Voice'}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${hasUpvoted ? 'bg-emerald-500/20 text-emerald-355' : 'bg-slate-800 text-slate-400'}`}>
                            {report.upvotes || 0}
                          </span>
                        </button>

                        <button
                          onClick={() => toggleComments(report.id)}
                          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition duration-200 cursor-pointer ${
                            isCommentsOpen
                              ? 'bg-slate-800 text-white border-slate-600'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <MessageSquare size={14} className={isCommentsOpen ? 'text-emerald-400' : 'text-slate-400'} />
                          <span>Discussion</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${isCommentsOpen ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {report.comments?.length || 0}
                          </span>
                        </button>
                      </div>

                      {/* Collapsible Discussion threads */}
                      {isCommentsOpen && (
                        <div className="border-t border-slate-755 pt-4 space-y-4 animate-slide-down">
                          <div className="max-h-56 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                            {(!report.comments || report.comments.length === 0) ? (
                              <div className="flex flex-col items-center justify-center py-6 text-slate-550 space-y-1">
                                <MessageSquare size={18} className="text-slate-600 animate-pulse" />
                                <p className="text-[10px] font-medium">No comments yet. Start the conversation!</p>
                              </div>
                            ) : (
                              report.comments.map((comment, index) => (
                                <div key={index} className="bg-slate-900/40 p-3 rounded-2xl border border-slate-850 flex gap-3 items-start hover:bg-slate-900/60 transition-all">
                                  {/* Minimal avatar for comment */}
                                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarGradient(getAnonymizedUser(comment.user))} flex items-center justify-center font-black text-[9px] text-white shrink-0 shadow-sm border border-slate-800`}>
                                    {getAnonymizedUser(comment.user).slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex-1 space-y-0.5">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-[10px] text-slate-300">{getAnonymizedUser(comment.user)}</span>
                                      <span className="text-[8px] text-slate-500 font-mono">{new Date(comment.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-200 leading-relaxed">{comment.text}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Write Comment Box */}
                          <div className="flex gap-2 items-center bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 focus-within:border-emerald-500/50 transition duration-200">
                            <input 
                              type="text"
                              placeholder="Write a message..."
                              value={commentInputs[report.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [report.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddFeedComment(report.id);
                              }}
                              className="flex-1 bg-transparent px-3 py-2 text-xs outline-none text-white placeholder-slate-500"
                            />
                            <button
                              onClick={() => handleAddFeedComment(report.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs p-2.5 rounded-lg transition shrink-0 cursor-pointer shadow flex items-center justify-center"
                              title="Send Comment"
                            >
                              <Send size={12} />
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>

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

    </div>
  );
}
