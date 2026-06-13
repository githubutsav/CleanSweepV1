import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white flex-col gap-4">
        <div className="spinner" />
        <span className="text-slate-400 text-sm">Loading CleanSweep...</span>
      </div>
    );
  }

  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={<Landing session={session} />} />
        <Route
          path="/dashboard"
          element={session ? <Home session={session} isAdmin={isAdmin} /> : <Navigate to="/login" />}
        />
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
      </Routes>
    </Router>
  );
}

export default App;
