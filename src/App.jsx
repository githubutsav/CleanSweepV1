import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login';
import Home from './pages/Home';
import NewReport from './pages/NewReport';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
import DashboardOverview from './pages/DashboardOverview';
import HowItWorks from './pages/HowItWorks';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';
import { useCleanStore } from './lib/store';
import ToastContainer from './components/ToastContainer';

function App() {
  const { session, setSession } = useCleanStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = async (userId) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    setIsAdmin(data?.role === 'admin');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkAdminRole(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111412] text-white flex-col gap-4 relative overflow-hidden">
        <div className="glass-orb-1" />
        <div className="glass-orb-2" />
        <div className="glass-orb-3" />
        <div className="glass-panel rounded-2xl px-10 py-8 flex flex-col items-center gap-4 relative z-10">
          <div className="spinner" />
          <span className="text-slate-400 text-sm">Loading CleanSweep...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {/* Global ambient glass orbs — render on every page */}
      <div className="glass-orb-1" />
      <div className="glass-orb-2" />
      <div className="glass-orb-3" />
      <ToastContainer />
      <Routes>
        {/* Auth */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />

        {/* Landing */}
        <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Landing session={session} />} />

        {/* Dashboard overview — first page after login */}
        <Route
          path="/dashboard"
          element={session ? <DashboardOverview session={session} isAdmin={isAdmin} /> : <Navigate to="/login" />}
        />

        {/* Report / Map / Community page */}
        <Route
          path="/dashboard/report"
          element={session ? <Home session={session} isAdmin={isAdmin} /> : <Navigate to="/login" />}
        />
        {/* Dedicated Report page */}
        <Route
          path="/dashboard/new-report"
          element={session ? <NewReport session={session} isAdmin={isAdmin} /> : <Navigate to="/login" />}
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            !session ? <Navigate to="/login" /> :
            isAdmin ? <Admin session={session} /> :
            <Navigate to="/dashboard" />
          }
        />

        <Route path="/marketplace" element={<Marketplace session={session} />} />
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/how-it-works" element={<HowItWorks session={session} />} />
        <Route path="/faqs" element={<FAQ session={session} />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy session={session} />} />
        <Route path="/terms-of-service" element={<TermsOfService session={session} />} />
        <Route path="/cookie-policy" element={<CookiePolicy session={session} />} />
      </Routes>
    </Router>
  );
}

export default App;
