import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  User, 
  LogOut, 
  ArrowLeft,
  Trash2, 
  MapPin, 
  CheckCircle, 
  Archive, 
  RotateCcw, 
  FileSpreadsheet, 
  Bell, 
  X, 
  SlidersHorizontal,
  Search,
  Locate,
  Check,
  Compass,
  Clock,
  Megaphone
} from 'lucide-react';

const createToastContainer = () => {
  const el = document.createElement('div');
  el.id = 'admin-toast-container';
  el.className = 'fixed bottom-6 right-6 flex flex-col gap-3 z-[9999]';
  document.body.appendChild(el);
  return el;
};

const showNotificationAlert = (title, body) => {
  if ("Notification" in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') new Notification(title, { body });
      });
    }
  }
  
  // Fallback UI toast
  const container = document.getElementById('admin-toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'bg-emerald-600 border border-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl flex flex-col gap-1 transition-all duration-300 transform translate-y-2 opacity-0 font-medium text-sm max-w-sm';
  toast.innerHTML = `
    <div class="font-bold flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
      ${title}
    </div>
    <div class="text-xs text-emerald-100">${body}</div>
  `;
  container.appendChild(toast);
  
  // Trigger transition
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
};

export default function Admin({ session }) {
  const navigate = useNavigate();

  // State variables
  const [reports, setReports] = useState([]);
  const [dustbinLevel, setDustbinLevel] = useState(null);
  const [dustbinTime, setDustbinTime] = useState(null);
  const [municipalFilter, setMunicipalFilter] = useState('__all__');
  const [statusFilter, setStatusFilter] = useState('active'); // active | cleared | all
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local Notifications state
  const [notifyEmail, setNotifyEmail] = useState(() => {
    const storedNotify = localStorage.getItem('notificationConfig');
    if (storedNotify) {
      try {
        const parsed = JSON.parse(storedNotify);
        return parsed.email || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [notifyPhone, setNotifyPhone] = useState(() => {
    const storedNotify = localStorage.getItem('notificationConfig');
    if (storedNotify) {
      try {
        const parsed = JSON.parse(storedNotify);
        return parsed.phone || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [notifyStatus, setNotifyStatus] = useState('');

  // Profile Modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Clearance Modal state
  const [clearingReportId, setClearingReportId] = useState(null);
  const [clearNote, setClearNote] = useState('');
  const [isClearingModalOpen, setIsClearingModalOpen] = useState(false);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Google Maps Style enhancements for Admin
  const [mapTileLayer, setMapTileLayer] = useState('map'); // 'map' | 'satellite' | 'dark'
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [selectedMapReport, setSelectedMapReport] = useState(null);

  const tileLayerRef = useRef(null);
  const searchMarkerRef = useRef(null);
  const userLocMarkerRef = useRef(null);
  const userLocCircleRef = useRef(null);

  // Load configuration and data on mount
  useEffect(() => {
    // Load user profile details
    if (session?.user) {
      setTimeout(() => {
        setProfileEmail(session.user.email);
      }, 0);
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) setProfileName(data.full_name);
        });
    }

    // Load initial reports
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('timestamp', { ascending: false });
      if (!error && data) {
        setReports(data);
      }
    };

    // Load smart dustbin level
    const fetchDustbin = async () => {
      const { data, error } = await supabase
        .from('dustbin_status')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        setDustbinLevel(data[0].level);
        setDustbinTime(new Date(data[0].timestamp).toLocaleString());
      }
    };

    fetchReports();
    fetchDustbin();

    // Subscribe to reports real-time changes
    const reportsChannel = supabase
      .channel('admin-reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setReports((prev) => [payload.new, ...prev]);
          showNotificationAlert('New Garbage Report', `Location: ${payload.new.latitude.toFixed(4)}, ${payload.new.longitude.toFixed(4)}`);
        } else if (payload.eventType === 'UPDATE') {
          setReports((prev) =>
            prev.map((r) => (r.id === payload.new.id ? payload.new : r))
          );
        } else if (payload.eventType === 'DELETE') {
          setReports((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      })
      .subscribe();

    // Subscribe to dustbin status real-time changes
    const dustbinChannel = supabase
      .channel('admin-dustbin-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dustbin_status' }, (payload) => {
        const level = payload.new.level;
        setDustbinLevel(level);
        setDustbinTime(new Date(payload.new.timestamp).toLocaleString());
        if (level >= 80) {
          showNotificationAlert('🚨 Smart Dustbin Alert', `Smart dustbin is currently ${level}% full!`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(dustbinChannel);
    };
  }, [session]);



  // ── Google Maps Geocoding & Locate Me Handlers (Admin) ──────────────
  const handleMapSearch = async (e) => {
    if (e) e.preventDefault();
    if (!mapSearchQuery.trim() || !mapRef.current) return;
    try {
      setMapSearchLoading(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        mapRef.current.flyTo([latitude, longitude], 15, { animate: true, duration: 1.5 });
        
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
          .addTo(mapRef.current)
          .bindPopup(`<div class="p-1.5 font-semibold text-xs text-slate-900">${display_name}</div>`)
          .openPopup();
      } else {
        alert("Location not found.");
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
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 16, { animate: true, duration: 1.5 });
          
          if (userLocMarkerRef.current) userLocMarkerRef.current.remove();
          if (userLocCircleRef.current) userLocCircleRef.current.remove();
          
          userLocCircleRef.current = L.circle([latitude, longitude], {
            radius: Math.min(accuracy, 1000),
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.12,
            weight: 1
          }).addTo(mapRef.current);

          const pulseIcon = L.divIcon({
            html: `<div class="gps-pulse-dot"></div>`,
            className: 'gps-pulse-container',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          
          userLocMarkerRef.current = L.marker([latitude, longitude], { icon: pulseIcon })
            .addTo(mapRef.current)
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

  // ── Map Initialization ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false
      }).setView([26.8467, 80.9462], 12);
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      const url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      const attribution = '&copy; OpenStreetMap contributors &copy; CARTO';
      tileLayerRef.current = L.tileLayer(url, { attribution }).addTo(mapRef.current);

      markersGroupRef.current = L.layerGroup().addTo(mapRef.current);

      mapRef.current.on('click', () => {
        setSelectedMapReport(null);
      });
    } else {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
    }
  }, []);

  // Dynamic Map Style Handler for Admin
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
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

    tileLayerRef.current = L.tileLayer(url, { attribution }).addTo(mapRef.current);
  }, [mapTileLayer]);

  // Update map markers based on reports and status filter
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();

    const displayReports = reports.filter((r) => {
      const matchesMunicipal = municipalFilter === '__all__' || r.municipal_name === municipalFilter;
      const matchesSearch = searchQuery === '' || 
        r.municipal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.id).includes(searchQuery);
      
      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = r.status === 'pending' || r.status === 'cleared_by_admin';
      else if (statusFilter === 'cleared') matchesStatus = r.status === 'done';

      return matchesMunicipal && matchesSearch && matchesStatus;
    });

    if (displayReports.length > 0 && mapRef.current && !selectedMapReport) {
      const bounds = L.latLngBounds(displayReports.map((r) => [r.latitude, r.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }

    displayReports.forEach((r) => {
      const color = r.status === 'pending' ? '#ef4444' : 
                    r.status === 'cleared_by_admin' ? '#3b82f6' : '#10b981';
      
      const pinSvg = `
        <svg viewBox="0 0 24 30" width="30" height="38" xmlns="http://www.w3.org/2000/svg">
          <path d="M12,2 C6.48,2 2,6.48 2,12 C2,17.4 12,27 12,27 C12,27 22,17.4 22,12 C22,6.48 17.52,2 12,2 Z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="12" cy="10" r="4.5" fill="#ffffff"/>
        </svg>
      `;

      const customIcon = L.divIcon({
        html: pinSvg,
        className: 'custom-marker',
        iconSize: [30, 38],
        iconAnchor: [15, 38]
      });

      L.marker([r.latitude, r.longitude], { icon: customIcon })
        .addTo(markersGroupRef.current)
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedMapReport(r);
          if (mapRef.current) {
            mapRef.current.flyTo([r.latitude, r.longitude], Math.max(13, mapRef.current.getZoom()), {
              animate: true,
              duration: 1.0
            });
          }
        });
    });
  }, [reports, municipalFilter, statusFilter, searchQuery, selectedMapReport]);

  // Actions handlers
  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state instantly
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      alert(`Error updating report: ${err.message}`);
    }
  };

  const handleClearConfirm = async (e) => {
    e.preventDefault();
    if (!clearingReportId) return;
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'done', admin_note: clearNote })
        .eq('id', clearingReportId);
      
      if (error) throw error;
      
      setReports((prev) =>
        prev.map((r) => (r.id === clearingReportId ? { ...r, status: 'done', admin_note: clearNote } : r))
      );
      setIsClearingModalOpen(false);
      setClearingReportId(null);
      setClearNote('');
    } catch (err) {
      console.warn('Mark cleared failed, trying standard status update:', err.message);
      const { error: updateError } = await supabase
        .from('reports')
        .update({ status: 'done' })
        .eq('id', clearingReportId);
      if (updateError) {
        alert(`Error updating report: ${updateError.message}`);
      } else {
        setReports((prev) =>
          prev.map((r) => (r.id === clearingReportId ? { ...r, status: 'done' } : r))
        );
        setIsClearingModalOpen(false);
        setClearingReportId(null);
        setClearNote('');
        alert('Cleared successfully. Run SQL migration to add admin_note column.');
      }
    }
  };

  const handleSaveNotify = (e) => {
    e.preventDefault();
    localStorage.setItem('notificationConfig', JSON.stringify({ email: notifyEmail, phone: notifyPhone }));
    setNotifyStatus('Alert preferences saved successfully!');
    setTimeout(() => setNotifyStatus(''), 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: profileName,
          updated_at: new Date().toISOString()
        }, { onConflict: ['id'] });

      if (error) throw error;
      setProfileMsg('✅ Profile updated successfully!');
      setTimeout(() => {
        setIsProfileOpen(false);
        setProfileMsg('');
      }, 1500);
    } catch (err) {
      setProfileMsg(`❌ Error saving profile: ${err.message}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCsvExport = () => {
    const filteredData = reports.filter((r) => {
      const matchesMunicipal = municipalFilter === '__all__' || r.municipal_name === municipalFilter;
      const matchesSearch = searchQuery === '' || 
        r.municipal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.id).includes(searchQuery);
      return matchesMunicipal && matchesSearch;
    });

    const headers = ['Report ID', 'Latitude', 'Longitude', 'Status', 'Timestamp', 'Municipal Region', 'Image URL'];
    const rows = filteredData.map((r) => [
      r.id,
      r.latitude,
      r.longitude,
      r.status,
      r.timestamp,
      r.municipal_name || ' Lucknow',
      r.image_url || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cleansweep_reports_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters computed
  const uniqueMunicipalities = Array.from(
    new Set(reports.map((r) => r.municipal_name).filter(Boolean))
  );

  const activeReports = reports.filter((r) => {
    const matchesMunicipal = municipalFilter === '__all__' || r.municipal_name === municipalFilter;
    const matchesSearch = searchQuery === '' || 
      r.municipal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.id).includes(searchQuery);
    return (r.status === 'pending' || r.status === 'cleared_by_admin') && matchesMunicipal && matchesSearch;
  });

  const historyReports = reports.filter((r) => {
    const matchesMunicipal = municipalFilter === '__all__' || r.municipal_name === municipalFilter;
    const matchesSearch = searchQuery === '' || 
      r.municipal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.id).includes(searchQuery);
    return (r.status === 'done' || r.status === 'archived') && matchesMunicipal && matchesSearch;
  });

  const activeMapReport = selectedMapReport 
    ? reports.find(r => r.id === selectedMapReport.id) || selectedMapReport
    : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center max-w-7xl mx-auto mb-8 bg-slate-800/40 backdrop-blur border border-slate-700/50 px-6 py-4 rounded-2xl shadow-xl relative z-50">
        <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer select-none hover:opacity-90 active:scale-95 transition-all">
          <img src="/favicon.svg" className="w-8 h-8 filter drop-shadow-[0_0_6px_rgba(5,255,163,0.45)]" alt="CleanSweep Logo" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              CleanSweep <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">Admin</span>
            </h1>
            <p className="text-slate-400 text-[10px] sm:text-xs"> लखनऊ Municipal Control Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-slate-750 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition border border-slate-700/60 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 bg-slate-705 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition border border-slate-700/60 cursor-pointer"
            >
              <User size={16} />
              <span className="hidden sm:inline">{profileName || session?.user?.email}</span>
            </button>
            
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-[3000]">
                <div className="px-4 py-2 text-slate-400 text-xs truncate border-b border-slate-700/60 pb-2 mb-1">
                  {session?.user?.email}
                </div>
                <button 
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-sm flex items-center gap-2 transition"
                >
                  <User size={14} /> My Profile
                </button>
                <button 
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setIsProfileOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-sm flex items-center gap-2 transition"
                >
                  <User size={14} /> Edit Profile Name
                </button>
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-sm text-red-400 flex items-center gap-2 transition"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Stats & Map) */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          
          {/* Top Panel: Smart Dustbin & Quick Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Smart Dustbin Level */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-5 rounded-2xl shadow-lg flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Smart Dustbin Sensor</h3>
                <div className="text-xl font-extrabold text-white flex items-baseline gap-1">
                  {dustbinLevel !== null ? (
                    <>
                      <span className={dustbinLevel >= 80 ? 'text-red-400' : 'text-emerald-400'}>
                        {dustbinLevel}%
                      </span>
                      <span className="text-xs font-normal text-slate-500">fill capacity</span>
                    </>
                  ) : 'No sensor data'}
                </div>
                <p className="text-[10px] text-slate-500 truncate">{dustbinTime ? `Updated: ${dustbinTime}` : 'Check hardware link'}</p>
              </div>

              {/* Graphical Circular Indicator */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-slate-700" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="28" 
                    className={dustbinLevel >= 80 ? 'stroke-red-500' : 'stroke-emerald-500'} 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - (dustbinLevel || 0) / 100)}
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-slate-300">IoT</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-5 rounded-2xl shadow-lg flex items-center gap-5 justify-between">
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Current Reports</h3>
                <div className="flex gap-4 mt-2">
                  <div>
                    <span className="text-2xl font-black text-amber-500">{activeReports.length}</span>
                    <p className="text-[10px] text-slate-500">Active</p>
                  </div>
                  <div className="border-r border-slate-700" />
                  <div>
                    <span className="text-2xl font-black text-emerald-500">{historyReports.length}</span>
                    <p className="text-[10px] text-slate-500">Resolved</p>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-slate-700/30 rounded-xl flex items-center justify-center text-slate-400 border border-slate-700">
                <Trash2 size={22} />
              </div>
            </div>

          </div>

          {/* Interactive Map Section */}
          <div className="relative w-full h-[480px] border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl bg-slate-950 flex flex-col z-10">
            
            {/* Leaflet Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating Top Bar (Search + Geocoding) */}
            <form 
              onSubmit={handleMapSearch}
              className="absolute top-4 left-4 z-20 w-64 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl flex items-center px-3 py-1.5 focus-within:border-emerald-500"
            >
              <Search className="text-slate-400 flex-shrink-0" size={14} />
              <input 
                type="text"
                placeholder="Search areas..."
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                className="bg-transparent text-[11px] font-semibold text-white placeholder-slate-500 focus:outline-none flex-1 py-0.5 px-2"
              />
              {mapSearchQuery && (
                <button 
                  type="button"
                  onClick={() => { setMapSearchQuery(''); if (searchMarkerRef.current) searchMarkerRef.current.remove(); }}
                  className="text-slate-450 hover:text-slate-200 p-0.5 flex-shrink-0"
                >
                  <X size={12} />
                </button>
              )}
              <button 
                type="submit"
                disabled={mapSearchLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold px-2 py-1 rounded-md transition-all ml-1 flex-shrink-0 active:scale-95 cursor-pointer"
              >
                {mapSearchLoading ? '...' : 'Go'}
              </button>
            </form>

            {/* Floating Filter Pill (top-left, next to search) */}
            <div className="absolute top-4 left-[285px] z-20 hidden sm:flex bg-slate-900/90 backdrop-blur-sm border border-slate-750 p-1.5 rounded-xl shadow-lg items-center gap-1.5 text-[10px] font-bold text-slate-300">
              <SlidersHorizontal size={11} className="text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-200 border-none outline-none focus:ring-0 cursor-pointer pr-1 py-0"
              >
                <option value="active" className="bg-slate-900">Active Only</option>
                <option value="cleared" className="bg-slate-900">Cleared Only</option>
                <option value="all" className="bg-slate-900">Show All</option>
              </select>
            </div>

            {/* Floating Map Layers Control (top-right) */}
            <div className="absolute top-4 right-4 z-20 flex items-center bg-slate-900/90 backdrop-blur-sm border border-slate-750 p-1 rounded-lg shadow-lg">
              <button
                type="button"
                onClick={() => setMapTileLayer('map')}
                className={`px-2 py-0.5 rounded text-[8px] font-extrabold transition-all cursor-pointer ${
                  mapTileLayer === 'map' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => setMapTileLayer('satellite')}
                className={`px-2 py-0.5 rounded text-[8px] font-extrabold transition-all cursor-pointer ${
                  mapTileLayer === 'satellite' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sat
              </button>
              <button
                type="button"
                onClick={() => setMapTileLayer('dark')}
                className={`px-2 py-0.5 rounded text-[8px] font-extrabold transition-all cursor-pointer ${
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
              className="absolute bottom-18 right-4 z-20 w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-center shadow-2xl border border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Zoom to my location"
            >
              {locatingUser ? (
                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
              ) : (
                <Locate size={16} className="text-blue-600" />
              )}
            </button>

            {/* Google Maps style Side Details Drawer for Admin */}
            {activeMapReport && (
              <div className="absolute sm:top-4 sm:bottom-4 sm:left-4 bottom-0 left-0 right-0 z-30 sm:w-72 w-full bg-slate-900/95 backdrop-blur-md border sm:border-slate-700/80 border-t border-slate-700/80 sm:rounded-xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden max-h-[75%] sm:max-h-[calc(100vh-250px)] max-w-full sm:max-w-[calc(100vw-32px)] transition-all duration-300 animate-slide-in-left">
                
                {/* Photo Header */}
                <div className="relative h-32 w-full bg-slate-950 flex-shrink-0">
                  {activeMapReport.image_url ? (
                    <img src={activeMapReport.image_url} alt="Garbage site" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500">
                      <MapPin size={28} className="text-slate-600 mb-0.5" />
                      <span className="text-[8px] uppercase tracking-wider font-bold">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30"></div>
                  
                  {/* Close Button on image */}
                  <button
                    type="button"
                    onClick={() => setSelectedMapReport(null)}
                    className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full p-1 transition-all backdrop-blur-sm cursor-pointer"
                  >
                    <X size={12} />
                  </button>

                  {/* Status Pill & Site ID bottom */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                      activeMapReport.status === 'pending' ? 'bg-red-500 text-white shadow' :
                      activeMapReport.status === 'cleared_by_admin' ? 'bg-blue-500 text-white shadow' :
                      'bg-emerald-500 text-white shadow'
                    }`}>
                      {activeMapReport.status === 'cleared_by_admin' ? 'Cleared (Pending User)' : activeMapReport.status === 'pending' ? 'Pending Cleanup' : 'Resolved Clean'}
                    </span>
                    <h3 className="font-extrabold text-xs text-white mt-1 drop-shadow-md">
                      Report #{activeMapReport.id}
                    </h3>
                  </div>
                </div>

                {/* Scrollable details */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-[11px] text-slate-300">
                  
                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeMapReport.latitude},${activeMapReport.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-1.5 rounded-lg transition shadow cursor-pointer text-center text-[10px]"
                    >
                      <Compass size={12} />
                      Directions
                    </a>

                    {activeMapReport.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setClearingReportId(activeMapReport.id);
                          setIsClearingModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-1.5 rounded-lg transition shadow cursor-pointer text-[10px] flex items-center justify-center gap-1"
                      >
                        <Check size={12} />
                        Mark Cleared
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="bg-slate-800 text-slate-505 font-bold py-1.5 rounded-lg text-[10px] cursor-not-allowed text-center"
                      >
                        Verified Clean
                      </button>
                    )}
                  </div>

                  {/* Metadata List */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="text-slate-400 mt-0.5" size={12} />
                      <div>
                        <span className="block font-bold text-slate-200 text-[10px]">Municipal Region</span>
                        <span className="text-slate-450 text-[9px]">{activeMapReport.municipal_name || ' Lucknow'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 border-t border-slate-850 pt-2">
                      <Compass className="text-slate-400 mt-0.5" size={12} />
                      <div>
                        <span className="block font-bold text-slate-200 text-[10px]">Coordinates</span>
                        <span className="text-slate-450 text-[9px]">{activeMapReport.latitude.toFixed(5)}, {activeMapReport.longitude.toFixed(5)}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 border-t border-slate-850 pt-2">
                      <Clock className="text-slate-400 mt-0.5" size={12} />
                      <div>
                        <span className="block font-bold text-slate-200 text-[10px]">Reported On</span>
                        <span className="text-slate-450 text-[9px]">{new Date(activeMapReport.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Upvotes priority */}
                  <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] font-bold text-slate-400">
                    <span>Upvotes / priority count:</span>
                    <span className="text-amber-400 flex items-center gap-0.5 text-[10px]">
                      <Megaphone size={11} /> {activeMapReport.upvotes || 0} voices
                    </span>
                  </div>

                  {/* Feedback display */}
                  {activeMapReport.user_feedback && (
                    <div className="bg-slate-900 border border-slate-850 p-2 rounded-lg">
                      <span className="block font-extrabold text-slate-300 text-[10px] mb-0.5">User Feedback:</span>
                      <p className="text-[9px] text-slate-400 italic break-words">{activeMapReport.user_feedback}</p>
                    </div>
                  )}

                  {activeMapReport.admin_note && (
                    <div className="bg-slate-900 border border-slate-850 p-2 rounded-lg">
                      <span className="block font-extrabold text-slate-300 text-[10px] mb-0.5">Admin Dispatch Note:</span>
                      <p className="text-[9px] text-slate-400 italic break-words">{activeMapReport.admin_note}</p>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right Column (Controls & Lists) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">

          {/* Dashboard Control Filters */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-5 rounded-2xl shadow-lg space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 text-slate-300 border-b border-slate-700/50 pb-2">
              <SlidersHorizontal size={14} /> Control Panel
            </h3>

            {/* Region Dropdown Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Municipal Region</label>
              <select 
                value={municipalFilter}
                onChange={(e) => setMunicipalFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="__all__"> Lucknow (All Regions)</option>
                {uniqueMunicipalities.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Search filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Search by ID or Location</label>
              <input 
                type="text" 
                placeholder="Search report ID, region name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* CSV export and Actions */}
            <button 
              onClick={handleCsvExport}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-600 transition"
            >
              <FileSpreadsheet size={15} /> Export Reports Data to CSV
            </button>
          </div>

          {/* Local Alerts Settings Panel */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-5 rounded-2xl shadow-lg">
            <h3 className="font-bold text-sm flex items-center gap-2 text-slate-300 border-b border-slate-700/50 pb-2 mb-3">
              <Bell size={15} /> Quick Notification Alerts
            </h3>
            
            <form onSubmit={handleSaveNotify} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Alert Email</label>
                <input 
                  type="email" 
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="admin@lucknow.gov.in"
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">SMS Alert Phone</label>
                <input 
                  type="tel" 
                  value={notifyPhone}
                  onChange={(e) => setNotifyPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-xl text-xs transition"
              >
                Save Preferences
              </button>

              {notifyStatus && (
                <p className="text-[10px] text-emerald-400 text-center font-semibold mt-2">{notifyStatus}</p>
              )}
            </form>
          </div>

        </div>

      </main>

      {/* Reports Listing Section (Full width split layouts) */}
      <section className="max-w-7xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Active Reports List */}
        <div className="bg-slate-800/30 border border-slate-700/40 p-5 rounded-2xl shadow-lg flex flex-col max-h-[500px]">
          <h2 className="font-extrabold text-base flex items-center justify-between mb-4">
            <span>Active Reports Pending Action</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
              {activeReports.length} Active
            </span>
          </h2>

          <div className="overflow-y-auto flex-1 pr-1 space-y-3">
            {activeReports.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-12">No reports currently pending resolution.</p>
            ) : (
              activeReports.map((report) => (
                <div key={report.id} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex gap-4 hover:border-slate-600 transition">
                  {report.image_url ? (
                    <img src={report.image_url} alt="dump" className="w-20 h-20 object-cover rounded-lg bg-slate-900 border border-slate-700/60 shrink-0" />
                  ) : (
                    <div className="w-20 h-20 bg-slate-900 rounded-lg flex items-center justify-center text-slate-600 border border-slate-700/60 shrink-0">No Img</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Report ID: #{report.id}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        report.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        report.status === 'cleared_by_admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                        'bg-slate-750 text-slate-400'
                      }`}>
                        {report.status === 'pending' ? 'Pending Cleanup' : report.status === 'cleared_by_admin' ? 'Awaiting User Confirm' : report.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate"><b>Region:</b> {report.municipal_name || ' Lucknow'}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</p>
                    
                    <div className="flex items-center gap-2 mt-3">
                      {report.status !== 'cleared_by_admin' && (
                        <button 
                          onClick={() => {
                            setClearingReportId(report.id);
                            setClearNote('');
                            setIsClearingModalOpen(true);
                          }}
                          className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                        >
                          <CheckCircle size={10} /> Mark Cleared
                        </button>
                      )}
                      <button 
                        onClick={() => handleStatusChange(report.id, 'archived')}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition border border-slate-600/50"
                      >
                        <Archive size={10} /> Archive
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resolved/Archived History List */}
        <div className="bg-slate-800/30 border border-slate-700/40 p-5 rounded-2xl shadow-lg flex flex-col max-h-[500px]">
          <h2 className="font-extrabold text-base flex items-center justify-between mb-4">
            <span>Historical Logs</span>
            <span className="text-xs bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600/30">
              {historyReports.length} Saved
            </span>
          </h2>

          <div className="overflow-y-auto flex-1 pr-1 space-y-3">
            {historyReports.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-12">No reports archived or cleared yet.</p>
            ) : (
              historyReports.map((report) => (
                <div key={report.id} className="bg-slate-800/30 border border-slate-700/30 p-4 rounded-xl flex gap-4 opacity-75 hover:opacity-100 transition">
                  {report.image_url ? (
                    <img src={report.image_url} alt="dump" className="w-16 h-16 object-cover rounded-lg bg-slate-900 border border-slate-700/60 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-slate-600 border border-slate-700/60 shrink-0">No Img</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Report ID: #{report.id}</span>
                      <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 capitalize border border-slate-700/60">{report.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate">{report.municipal_name || ' Lucknow'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p>
                    
                    {report.admin_note && (
                      <p className="text-[10px] text-emerald-450 mt-1 italic">
                        <b>Municipal Note:</b> "{report.admin_note}"
                      </p>
                    )}
                    {report.user_feedback && (
                      <p className="text-[10px] text-emerald-300 mt-0.5 italic">
                        <b>User Response:</b> "{report.user_feedback}"
                      </p>
                    )}
                    
                    <button 
                      onClick={() => handleStatusChange(report.id, 'pending')}
                      className="mt-2 text-amber-400 hover:text-amber-300 font-bold text-[10px] flex items-center gap-1 transition"
                    >
                      <RotateCcw size={10} /> Reopen Report
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </section>

      {/* Admin Profile Edit Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[5000] backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <User className="text-emerald-400" size={20} /> Edit Admin Profile
            </h2>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Admin Name</label>
                <input 
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:border-emerald-500"
                  placeholder="Your Name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Admin Email (Readonly)</label>
                <input 
                  type="email"
                  disabled
                  value={profileEmail}
                  className="w-full bg-slate-900/40 border border-slate-700/60 px-3 py-2.5 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <button 
                type="submit"
                disabled={profileLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-full mt-2 transition disabled:opacity-50"
              >
                {profileLoading ? 'Saving changes...' : 'Save Changes'}
              </button>

              {profileMsg && (
                <p className="text-xs text-center font-semibold mt-2">{profileMsg}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Admin Clearance Note Modal */}
      {isClearingModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[5000] backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => {
                setIsClearingModalOpen(false);
                setClearingReportId(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle className="text-emerald-400" size={20} /> Mark Report as Cleared
            </h2>

            <form onSubmit={handleClearConfirm} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-350 uppercase">Clearing Notes (Optional)</label>
                <textarea
                  value={clearNote}
                  onChange={(e) => setClearNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:border-emerald-500 h-24 resize-none"
                  placeholder="Type details, crew information, or sweeps time..."
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-full mt-2 transition"
              >
                Confirm & Mark Cleared
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
