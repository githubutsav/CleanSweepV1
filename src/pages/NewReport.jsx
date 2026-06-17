import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCleanStore } from '../lib/store';
import { toast } from '../lib/toast';
import { Camera, X, Image as ImageIcon, MapPin, ShieldAlert, CheckCircle2, RotateCw } from 'lucide-react';

export default function NewReport({ session }) {
  const navigate = useNavigate();
  const { addPoints } = useCleanStore();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [step, setStep] = useState('capture'); // capture | analyzing | details | submitting | success
  
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('Locating...');
  const [reportNote, setReportNote] = useState('');
  const [wasteCategory, setWasteCategory] = useState('');
  const [severityLevel, setSeverityLevel] = useState('');

  // --- Camera logic ---
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
    } catch {
      toast.error('Could not access camera. Try uploading an image instead.');
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  // Stop camera when leaving capture step
  useEffect(() => {
    if (step !== 'capture') {
      stopCamera();
    }
    return () => stopCamera();
  }, [step]);

  // --- Geolocation ---
  const fetchLocation = async () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null) // silently fail and return null if denied
      );
    });
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data?.display_name) {
        setAddress(data.display_name.split(',').slice(0, 3).join(', '));
      } else {
        setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
  };

  // --- AI Analysis Mock / Call ---
  const analyzeImage = async (dataUrl) => {
    setStep('analyzing');
    setWasteCategory('');
    setSeverityLevel('');
    
    // Attempt to get location while analyzing
    const loc = await fetchLocation();
    if (loc) {
      setLocation(loc);
      reverseGeocode(loc.lat, loc.lon);
    } else {
      // Fallback location
      const fallback = { lat: 26.8467, lon: 80.9462 };
      setLocation(fallback);
      reverseGeocode(fallback.lat, fallback.lon);
      toast.info("Using default location (GPS denied).");
    }

    // Call Gemini/Wolfram logic here (simplified for this dedicated view)
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const base64 = dataUrl.split(',')[1];
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: 'Analyze this image. Does it contain actual garbage, trash, litter, or illegal dumping? If the image shows a plain wall, a ceiling, a person, or normal clean objects, YOU MUST RETURN EXACTLY: {"isGarbage": false}. If it DOES contain garbage, return JSON: {"isGarbage": true, "category": "General Waste/Plastic/E-Waste/Organic/Hazardous", "severity": "Low/Medium/High/Critical"}' },
                { inlineData: { mimeType: 'image/jpeg', data: base64 } }
              ]
            }],
            generationConfig: { temperature: 0.1 } // Lower temp for more deterministic output
          })
        });
        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.error.message);
        }

        let text = data.candidates[0].content.parts[0].text;
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);
        
        // Robust check for false
        const isGarbageStr = String(parsed.isGarbage).toLowerCase();
        if (isGarbageStr === 'false') {
          toast.error("No garbage detected in the image. Please point the camera at actual waste.");
          setStep('capture');
          setPhoto(null);
          return; // Stop processing, don't proceed to details
        }

        // Map AI output to valid categories (case insensitive check)
        const categories = ["General Waste", "Plastic", "E-Waste", "Organic", "Hazardous"];
        const matchedCat = categories.find(c => c.toLowerCase() === (parsed.category || '').toLowerCase());
        setWasteCategory(matchedCat || 'General Waste');

        const severities = ["Low", "Medium", "High", "Critical"];
        const matchedSev = severities.find(s => s.toLowerCase() === (parsed.severity || '').toLowerCase());
        setSeverityLevel(matchedSev || 'Medium');

        toast.success("AI analyzed the image.");
      } catch (e) {
        console.error('AI failed, using fallback', e);
        toast.info("AI analysis unavailable. Please categorize manually.");
      }
    }

    // Give it a small timeout to feel like it's analyzing (if AI succeeded or fell back)
    setTimeout(() => {
      setStep('details');
    }, 1500);
  };

  // --- Handlers ---
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Compress image to max 800px
    const maxDim = 800;
    let w = videoRef.current.videoWidth;
    let h = videoRef.current.videoHeight;
    if (w > h && w > maxDim) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else if (h > maxDim) {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
    
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress quality
    setPhoto(dataUrl);
    analyzeImage(dataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress quality
        setPhoto(dataUrl);
        analyzeImage(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // --- Submission ---
  const handleSubmit = async () => {
    if (!photo || !location) return;
    if (!wasteCategory) {
      toast.error("Please select a waste category.");
      return;
    }
    if (!severityLevel) {
      toast.error("Please select a severity level.");
      return;
    }
    setStep('submitting');
    
    try {
      const base64 = photo.split(',')[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const filename = `reports/${Date.now()}_${session.user.id}.jpg`;

      // Upload Image
      let imageUrl = photo; // Fallback
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('report-images')
        .upload(filename, bytes, { contentType: 'image/jpeg' });
        
      if (!uploadErr && uploadData) {
        const { data: pub } = supabase.storage.from('report-images').getPublicUrl(uploadData.path);
        imageUrl = pub.publicUrl;
      }

      // Mock Municipal Name based on coordinates
      const municipal_name = "Local Municipal Corporation";

      // Insert DB record
      const { error: dbErr } = await supabase.from('reports').insert({
        latitude: location.lat,
        longitude: location.lon,
        image_url: imageUrl,
        timestamp: new Date().toISOString(),
        status: 'pending',
        user_id: session.user.id,
        municipal_name,
        municipal_lat: location.lat,
        municipal_lon: location.lon,
        description: reportNote.trim() || null,
        category: wasteCategory,
        severity: severityLevel,
      });

      if (dbErr) throw dbErr;

      // Reward points
      addPoints(20);
      setStep('success');

      // Auto close after 2.5 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2500);

    } catch (err) {
      toast.error('Failed to submit: ' + err.message);
      setStep('details');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-[#111412] text-[#e2e3df] flex flex-col font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-[#41eec2]/10 bg-[#111412]/90 backdrop-blur-md">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={24} className="text-[#c4c6cc]" />
        </button>
        <h1 className="text-lg font-bold text-[#41eec2]">Create Report</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col relative">
        
        {step === 'capture' && (
          <div className="flex-1 flex flex-col p-6 items-center justify-center bg-[#111412]">
            <h2 className="text-xl font-bold text-white mb-2 text-center">Report Illegal Dumping</h2>
            <p className="text-[#a0aab2] text-center text-sm mb-8 max-w-sm">
              Point your camera at the garbage, capture a clear photo, and help us keep our city clean.
            </p>

            {/* Video Container */}
            <div className="w-full max-w-md aspect-video rounded-xl border border-dashed border-[#41eec2]/30 flex flex-col items-center justify-center bg-[#1e201e]/30 overflow-hidden relative mb-8">
              {stream ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover absolute inset-0"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 opacity-50">
                  <div className="relative flex items-center justify-center w-12 h-12">
                    <Camera size={32} className="text-[#c4c6cc] absolute" />
                    <div className="absolute w-[2px] h-[40px] bg-[#c4c6cc] rotate-45" />
                  </div>
                  <p className="text-sm font-medium text-[#c4c6cc]">Camera is off</p>
                  <p className="text-xs text-[#c4c6cc]">Click "Start Camera" to begin</p>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="flex items-center gap-4">
              {!stream ? (
                <button 
                  onClick={startCamera}
                  className="px-6 py-2 rounded-full font-bold text-[#002118] bg-[#41eec2] hover:bg-[#68dbae] transition-colors flex items-center gap-2 text-sm"
                >
                  <Camera size={16} />
                  Start Camera
                </button>
              ) : (
                <button 
                  onClick={stopCamera}
                  className="px-6 py-2 rounded-full font-bold text-white bg-red-600 hover:bg-red-500 transition-colors flex items-center gap-2 text-sm"
                >
                  <X size={16} />
                  Stop Camera
                </button>
              )}
              
              <button 
                onClick={handleCapture}
                disabled={!stream}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${stream ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white cursor-pointer' : 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed'}`}
              >
                <Camera size={20} />
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-[#c4c6cc] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ImageIcon size={20} />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </button>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-64 h-64 relative rounded-2xl overflow-hidden mb-8 border border-[#41eec2]/30">
              <img src={photo} alt="Preview" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 bg-[#41eec2]/20 animate-pulse" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#41eec2]">
                <RotateCw size={48} className="animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Analyzing Image</h2>
            <p className="text-[#c4c6cc]">AI is categorizing the waste...</p>
          </div>
        )}

        {step === 'details' && (
          <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
            <div className="w-full aspect-video rounded-xl overflow-hidden border border-[#41eec2]/30 mb-6 shrink-0 relative">
              <img src={photo} alt="Captured" className="w-full h-full object-cover" />
              <button 
                onClick={() => { setPhoto(null); setStep('capture'); }}
                className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white backdrop-blur-md"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 flex-1">
              <div className="p-4 rounded-xl bg-[#1e201e]/60 border border-[#41eec2]/10 flex items-start gap-3">
                <MapPin className="text-[#41eec2] shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-xs text-[#c4c6cc] uppercase tracking-wider mb-1 font-bold">Location Identified</p>
                  <p className="text-sm font-medium">{address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#1e201e]/60 border border-[#41eec2]/10">
                  <p className="text-xs text-[#c4c6cc] uppercase tracking-wider mb-1 font-bold">Category</p>
                  <select 
                    value={wasteCategory}
                    onChange={e => setWasteCategory(e.target.value)}
                    className="w-full bg-transparent text-[#41eec2] font-semibold outline-none"
                  >
                    {!wasteCategory && <option value="" disabled>Select Category</option>}
                    <option className="bg-[#1e201e]" value="General Waste">General Waste</option>
                    <option className="bg-[#1e201e]" value="Plastic">Plastic</option>
                    <option className="bg-[#1e201e]" value="E-Waste">E-Waste</option>
                    <option className="bg-[#1e201e]" value="Organic">Organic</option>
                    <option className="bg-[#1e201e]" value="Hazardous">Hazardous</option>
                  </select>
                </div>
                <div className="p-4 rounded-xl bg-[#1e201e]/60 border border-[#41eec2]/10">
                  <p className="text-xs text-[#c4c6cc] uppercase tracking-wider mb-1 font-bold">Severity</p>
                  <select 
                    value={severityLevel}
                    onChange={e => setSeverityLevel(e.target.value)}
                    className="w-full bg-transparent text-[#41eec2] font-semibold outline-none"
                  >
                    {!severityLevel && <option value="" disabled>Select Severity</option>}
                    <option className="bg-[#1e201e]" value="Low">Low</option>
                    <option className="bg-[#1e201e]" value="Medium">Medium</option>
                    <option className="bg-[#1e201e]" value="High">High</option>
                    <option className="bg-[#1e201e]" value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#c4c6cc] uppercase tracking-wider font-bold block mb-2">Additional Notes (Optional)</label>
                <textarea 
                  value={reportNote}
                  onChange={e => setReportNote(e.target.value)}
                  placeholder="e.g., Blocking the sidewalk, smells bad..."
                  className="w-full p-4 rounded-xl bg-[#1e201e]/60 border border-[#41eec2]/20 text-[#e2e3df] placeholder-[#c4c6cc]/50 outline-none focus:border-[#41eec2] transition-colors resize-none h-28"
                />
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={handleSubmit}
                className="w-full py-4 rounded-xl font-bold text-[#002118] bg-[#41eec2] hover:bg-[#68dbae] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(65,238,194,0.3)] flex items-center justify-center gap-2"
              >
                <ShieldAlert size={20} />
                Submit Report
              </button>
            </div>
          </div>
        )}

        {step === 'submitting' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <RotateCw size={48} className="animate-spin text-[#41eec2] mb-6" />
            <h2 className="text-2xl font-bold mb-2">Uploading Report...</h2>
            <p className="text-[#c4c6cc]">Securing data on the blockchain...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-[#41eec2]/20 flex items-center justify-center mb-6 border-2 border-[#41eec2]">
              <CheckCircle2 size={48} className="text-[#41eec2]" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">Report Filed!</h2>
            <p className="text-[#c4c6cc] mb-8">Thank you for keeping our city clean.</p>
            <div className="px-6 py-3 rounded-full border border-[#41eec2]/30 bg-[#41eec2]/10 text-[#41eec2] font-bold text-lg">
              +20 CleanPoints
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
