import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCleanStore } from '../lib/store';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Mail, 
  Award, 
  Leaf, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Edit2, 
  Check, 
  X
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { session, profile, addPoints, fetchProfile, updateProfileName } = useCleanStore();
  
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [certificates, setCertificates] = useState([]);
  
  // Profile editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Filter history
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | cleared_by_admin | done

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

  useEffect(() => {
    if (!session?.user) {
      navigate('/login');
      return;
    }
    setTimeout(() => {
      fetchProfile();
      fetchUserReports();
      loadCertificates();
    }, 0);
  }, [session, navigate, fetchProfile, fetchUserReports, loadCertificates]);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    const success = await updateProfileName(newName.trim());
    if (success) {
      setIsEditingName(false);
    } else {
      alert("Error saving name. Please try again.");
    }
    setSavingName(false);
  };

  // Citizen verification confirmation handler
  const handleConfirmClean = async (id) => {
    if (!confirm('Are you sure you want to verify that this location has been cleared of garbage?')) return;
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'done' })
        .eq('id', id);

      if (error) throw error;
      
      // Award 50 points for double verification!
      await addPoints(50);
      
      // Update local reports list status
      setMyReports(prev => 
        prev.map(r => r.id === id ? { ...r, status: 'done' } : r)
      );
      
      alert('Thank you for verifying! You have been awarded 50 points.');
      fetchProfile();
    } catch (err) {
      alert(`Error verifying: ${err.message}`);
    }
  };

  // Citizen rejection handler (cleanup was incomplete/bad)
  const handleRejectClean = async (id) => {
    const feedback = prompt('Please describe what garbage is still left at the site so crews can return:');
    if (feedback === null) return; // cancel
    if (!feedback.trim()) {
      alert('Feedback is required to reject cleanup.');
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'pending', user_feedback: `Rejected: ${feedback}` })
        .eq('id', id);

      if (error) throw error;

      // Reset local list status back to pending
      setMyReports(prev => 
        prev.map(r => r.id === id ? { ...r, status: 'pending', user_feedback: `Rejected: ${feedback}` } : r)
      );
      
      alert('Feedback submitted. Crews will review and re-clean the site.');
    } catch (err) {
      alert(`Error submitting rejection: ${err.message}`);
    }
  };

  // Filtered reports
  const filteredReports = myReports.filter(r => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return r.status === 'pending';
    if (statusFilter === 'cleared_by_admin') return r.status === 'cleared_by_admin';
    if (statusFilter === 'done') return r.status === 'done';
    return true;
  });

  // Level thresholds & progress
  const points = profile?.points || 0;
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

  // Badge unlock checks
  const isFirstReportUnlocked = myReports.length >= 1;
  const isForestGuardianUnlocked = certificates.length >= 1;
  const isCivicHeroUnlocked = points >= 250;
  const isCommunityVerifierUnlocked = myReports.some(r => r.status === 'done');

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

        <button 
          onClick={() => navigate('/')}
          className="bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-xl flex items-center gap-1.5 transition cursor-pointer text-xs active:scale-95"
        >
          <ArrowLeft size={14} /> <span className="hidden sm:inline">Back to Dashboard</span>
        </button>
      </header>

      {/* Main Grid Content */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Profile Details & Accomplishments */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* User Card */}
          <div className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur border border-slate-700/50 p-6 rounded-3xl shadow-xl flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-black text-2xl text-white shadow-lg border border-slate-750 shrink-0">
                {(profile?.full_name || 'CR').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={profile?.full_name || 'Your Name'}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm outline-none focus:border-emerald-500 text-white w-full"
                    />
                    <button 
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="bg-emerald-600 hover:bg-emerald-500 p-1.5 rounded-lg text-white transition disabled:opacity-50"
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={() => setIsEditingName(false)}
                      className="bg-slate-700 hover:bg-slate-650 p-1.5 rounded-lg text-slate-300 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <h3 className="font-extrabold text-lg text-white flex items-center gap-2 truncate">
                    {profile?.full_name || 'Civic Reporter'}
                    <button 
                      onClick={() => { setNewName(profile?.full_name || ''); setIsEditingName(true); }}
                      className="text-slate-500 hover:text-slate-300 p-1 transition"
                    >
                      <Edit2 size={12} />
                    </button>
                  </h3>
                )}
                
                <span className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5 font-medium">
                  <Mail size={12} className="text-slate-500" />
                  {session?.user?.email}
                </span>
              </div>
            </div>

            {/* Level progression bar */}
            <div className="border-t border-slate-750 pt-4 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-emerald-450 italic">{profile?.level || 'Bronze Eco-Warrior'}</span>
                <span className="text-amber-400">🌟 {points} pts</span>
              </div>

              {/* Progress Slider */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-850 p-0.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <span>{prevThreshold} pts</span>
                <span>Next level: {nextLevelName} ({levelThreshold} pts)</span>
              </div>
            </div>
          </div>

          {/* Eco Achievements Grid */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl shadow-xl space-y-4">
            <h4 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Award className="text-emerald-400" size={16} /> Eco Badges
            </h4>
            
            <div className="grid grid-cols-2 gap-3.5">
              {/* Badge 1: First Report */}
              <div className={`p-3.5 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition ${
                isFirstReportUnlocked 
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-white' 
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-600 opacity-50'
              }`}>
                <Award size={24} className={isFirstReportUnlocked ? 'text-emerald-400' : 'text-slate-600'} />
                <span className="font-bold text-[10px]">Civic Alert</span>
                <span className="text-[8px] text-slate-500">Filed first dump report</span>
              </div>

              {/* Badge 2: Forest Guardian */}
              <div className={`p-3.5 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition ${
                isForestGuardianUnlocked 
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-white' 
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-600 opacity-50'
              }`}>
                <Leaf size={24} className={isForestGuardianUnlocked ? 'text-emerald-400' : 'text-slate-600'} />
                <span className="font-bold text-[10px]">Forest Maker</span>
                <span className="text-[8px] text-slate-500">Planted first tree</span>
              </div>

              {/* Badge 3: Civic Hero */}
              <div className={`p-3.5 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition ${
                isCivicHeroUnlocked 
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-white' 
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-600 opacity-50'
              }`}>
                <ShieldCheck size={24} className={isCivicHeroUnlocked ? 'text-emerald-400' : 'text-slate-600'} />
                <span className="font-bold text-[10px]">Civic Hero</span>
                <span className="text-[8px] text-slate-500">Reached 250+ points</span>
              </div>

              {/* Badge 4: Community Verifier */}
              <div className={`p-3.5 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition ${
                isCommunityVerifierUnlocked 
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-white' 
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-600 opacity-50'
              }`}>
                <CheckCircle2 size={24} className={isCommunityVerifierUnlocked ? 'text-emerald-400' : 'text-slate-600'} />
                <span className="font-bold text-[10px]">Eco Verifier</span>
                <span className="text-[8px] text-slate-500">Verified first cleanup</span>
              </div>
            </div>
          </div>

          {/* Planted Trees Certificates */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl shadow-xl space-y-3.5">
            <h4 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Leaf className="text-emerald-400" size={16} /> My Tree Certificates
            </h4>

            {certificates.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-6">
                No tree certificates generated yet. Redeem points in the Marketplace to plant native trees!
              </p>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {certificates.map((cert) => (
                  <div key={cert.id} className="bg-slate-900/60 border border-slate-850 rounded-2xl p-3 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-2xl flex items-center justify-center">
                      <Leaf size={10} className="text-emerald-400" />
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 font-mono">
                      <span>ID: {cert.id}</span>
                      <span>{new Date(cert.timestamp).toLocaleDateString()}</span>
                    </div>
                    <h5 className="font-bold text-xs text-white mt-1">{cert.treeName}</h5>
                    <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-0.5 mt-0.5">
                      📍 Site: {cert.location}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - My Reports History List */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Submission history title & Filter */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-3xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-xl">
            <h4 className="font-extrabold text-xs uppercase text-slate-350 tracking-wider flex items-center gap-2 px-1">
              <Clock className="text-emerald-400" size={16} /> My Reports History ({myReports.length})
            </h4>

            <div className="flex bg-slate-950 border border-slate-850 p-0.5 rounded-xl items-center gap-0.5 shadow-inner">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                  statusFilter === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                  statusFilter === 'pending' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('cleared_by_admin')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                  statusFilter === 'cleared_by_admin' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Awaiting
              </button>
              <button
                onClick={() => setStatusFilter('done')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                  statusFilter === 'done' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* Submission list cards */}
          <div className="space-y-4 w-full">
            {loadingReports ? (
              <div className="text-center py-16 text-slate-500 animate-pulse text-sm">Loading submission logs...</div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-sm bg-slate-800/10 border border-slate-800 rounded-3xl">
                No dump reports matching the selected filter.
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report.id} className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 border border-slate-700/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4 hover:border-emerald-500/20 transition-all duration-300 animate-tab-transition">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                        ID: #{report.id}
                      </span>
                      <h4 className="font-extrabold text-xs text-white pt-1">
                        📍 {report.municipal_name || ' Lucknow'}
                      </h4>
                      <p className="text-[10px] text-slate-450 font-mono tracking-tight">
                        {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full capitalize block w-fit ml-auto mb-1 ${
                        report.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-550/20' : 
                        report.status === 'cleared_by_admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-550/20' :
                        report.status === 'done' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-550/20' : 
                        'bg-slate-750 text-slate-400'
                      }`}>
                        {report.status === 'pending' ? 'Pending Cleanup' : 
                         report.status === 'cleared_by_admin' ? 'Awaiting Confirm' : 
                         report.status === 'done' ? 'Confirmed Clean' : report.status}
                      </span>
                      <span className="text-[8px] text-slate-500 block font-mono">
                        {new Date(report.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {report.image_url && (
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-855 shadow-inner">
                      <img src={report.image_url} alt="Garbage Dump" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Feedback or reject logs */}
                  {report.user_feedback && (
                    <div className="bg-amber-955/15 border border-amber-500/10 rounded-xl p-3 text-[10px] text-amber-400/90 leading-relaxed flex items-start gap-2">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                      <span>
                        <b>Verification Feedback:</b> {report.user_feedback}
                      </span>
                    </div>
                  )}

                  {/* Interactive citizen confirmation actions */}
                  {report.status === 'cleared_by_admin' ? (
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                      <div className="text-center space-y-1">
                        <h5 className="font-extrabold text-xs text-white">Crews Report Cleaning Completed!</h5>
                        <p className="text-[9px] text-slate-400">
                          Please verify if this dumpsite has been fully cleared of garbage. Confirming awards you +50 points!
                        </p>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleRejectClean(report.id)}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer text-center"
                        >
                          Still Dirty / Reject
                        </button>
                        <button
                          onClick={() => handleConfirmClean(report.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer text-center shadow-lg shadow-emerald-950/40"
                        >
                          Verify & Confirm Cleaned
                        </button>
                      </div>
                    </div>
                  ) : report.status === 'done' ? (
                    <div className="bg-emerald-950/10 border border-emerald-500/10 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5 text-emerald-450">
                        <CheckCircle2 size={13} />
                        Double Verified Cleaned
                      </span>
                      <span className="text-amber-450 font-black">🌟 +70 Total Points</span>
                    </div>
                  ) : (
                    <div className="bg-slate-950/30 border border-slate-850 rounded-2xl p-3 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        Awaiting municipal crew cleanup...
                      </span>
                      <span className="text-emerald-450 font-bold">🌟 +20 Points pending</span>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
