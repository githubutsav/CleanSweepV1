-- ============================================================
-- CleanSweep - Supabase Points & Gamification Upgrade Script
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. ADD GAMIFICATION COLUMNS TO PROFILES TABLE
-- ============================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Bronze Eco-Warrior';

-- 2. ENSURE ALL EXISTENT PROFILES HAVE DEFAULT VALS
-- ============================================================
UPDATE public.profiles
SET points = 0
WHERE points IS NULL;

UPDATE public.profiles
SET level = 'Bronze Eco-Warrior'
WHERE level IS NULL;

-- 3. HELPER FUNCTION TO UPGRADE USER LEVEL BASED ON POINTS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_level_by_points(pts INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF pts >= 1000 THEN
    RETURN 'Diamond Earth Defender';
  ELSIF pts >= 500 THEN
    RETURN 'Platinum Green Knight';
  ELSIF pts >= 250 THEN
    RETURN 'Gold Waste Buster';
  ELSIF pts >= 100 THEN
    RETURN 'Silver Trash Tracker';
  ELSE
    RETURN 'Bronze Eco-Warrior';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
