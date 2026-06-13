import { create } from 'zustand';
import { supabase } from './supabaseClient';

export const useCleanStore = create((set, get) => ({
  session: null,
  profile: null,
  reports: [],
  loadingReports: false,
  cart: [],

  setSession: (session) => {
    set({ session });
    if (session?.user) {
      get().fetchProfile();
    } else {
      set({ profile: null });
    }
  },

  fetchProfile: async () => {
    const { session } = get();
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && data) {
        // Use database values
        set({ profile: data });
      } else {
        const localPoints = parseInt(localStorage.getItem(`points_${session.user.id}`) || '120', 10);
        const localName = localStorage.getItem(`name_${session.user.id}`) || session.user.user_metadata?.full_name || 'Civic Reporter';
        let localLevel = 'Bronze Eco-Warrior';
        if (localPoints >= 1000) localLevel = 'Diamond Earth Defender';
        else if (localPoints >= 500) localLevel = 'Platinum Green Knight';
        else if (localPoints >= 250) localLevel = 'Gold Waste Buster';
        else if (localPoints >= 100) localLevel = 'Silver Trash Tracker';

        set({
          profile: {
            id: session.user.id,
            full_name: localName,
            points: localPoints,
            level: localLevel,
            avatar_url: session.user.user_metadata?.avatar_url || null
          }
        });
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  },

  addPoints: async (amount) => {
    const { session, profile } = get();
    if (!session?.user || !profile) return;

    const updatedPoints = (profile.points || 0) + amount;
    
    // Determine level based on points
    let updatedLevel = 'Bronze Eco-Warrior';
    if (updatedPoints >= 1000) updatedLevel = 'Diamond Earth Defender';
    else if (updatedPoints >= 500) updatedLevel = 'Platinum Green Knight';
    else if (updatedPoints >= 250) updatedLevel = 'Gold Waste Buster';
    else if (updatedPoints >= 100) updatedLevel = 'Silver Trash Tracker';

    const updatedProfile = { ...profile, points: updatedPoints, level: updatedLevel };
    set({ profile: updatedProfile });

    try {
      // Check if DB column exists by doing a metadata query or update attempt
      const { error } = await supabase
        .from('profiles')
        .update({ points: updatedPoints, level: updatedLevel })
        .eq('id', session.user.id);
      
      if (error) {
        console.warn('Supabase profiles update failed, falling back to localStorage sync:', error.message);
        localStorage.setItem(`points_${session.user.id}`, String(updatedPoints));
      }
    } catch (err) {
      console.error('Add points exception:', err);
      localStorage.setItem(`points_${session.user.id}`, String(updatedPoints));
    }
  },

  redeemPoints: async (amount) => {
    const { session, profile } = get();
    if (!session?.user || !profile || (profile.points || 0) < amount) return false;

    const updatedPoints = (profile.points || 0) - amount;
    const updatedProfile = { ...profile, points: updatedPoints };
    set({ profile: updatedProfile });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ points: updatedPoints })
        .eq('id', session.user.id);

      if (error) {
        console.warn('Supabase profiles redeem failed, syncing local storage:', error.message);
        localStorage.setItem(`points_${session.user.id}`, String(updatedPoints));
      }
      return true;
    } catch (err) {
      console.error('Redeem points exception:', err);
      localStorage.setItem(`points_${session.user.id}`, String(updatedPoints));
      return true;
    }
  },

  fetchReports: async () => {
    set({ loadingReports: true });
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && data) {
        set({ reports: data });
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      set({ loadingReports: false });
    }
  },

  addToCart: (item) => {
    set((state) => {
      if (state.cart.some((cartItem) => cartItem.id === item.id)) {
        return state;
      }
      return { cart: [...state.cart, item] };
    });
  },

  removeFromCart: (itemId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== itemId)
    }));
  },

  clearCart: () => {
    set({ cart: [] });
  },

  updateProfileName: async (name) => {
    const { session, profile } = get();
    if (!session?.user || !profile) return false;

    const updatedProfile = { ...profile, full_name: name };
    set({ profile: updatedProfile });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', session.user.id);
      
      if (error) {
        console.warn('Supabase name update failed:', error.message);
        localStorage.setItem(`name_${session.user.id}`, name);
      }
      return true;
    } catch (err) {
      console.error('Update profile name exception:', err);
      localStorage.setItem(`name_${session.user.id}`, name);
      return true;
    }
  }
}));
