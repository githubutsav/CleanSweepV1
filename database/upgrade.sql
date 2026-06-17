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

-- ============================================================
-- 4. AUTO-CREATE PROFILE ROW ON SIGNUP (including Google OAuth)
--    Run this once to set up the trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, points, level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    0,
    'Bronze Eco-Warrior'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. BACKFILL EMAIL FOR EXISTING USERS WHO HAVE EMPTY EMAIL
--    Run this once to fix existing accounts
-- ============================================================
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

