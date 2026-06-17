-- ============================================================
-- CleanSweep - Complete Supabase Database Schema
-- Run this in your NEW Supabase project's SQL Editor
-- ============================================================

-- 1. Create Profiles Table (extends the default Supabase Auth User)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Bronze Eco-Warrior',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create User Roles Table (Admin vs User)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT DEFAULT 'user'
);

-- 3. Create Reports Table (Includes all Wolfram AI data)
CREATE TABLE IF NOT EXISTS public.reports (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES auth.users(id),
  location_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  status TEXT DEFAULT 'pending',
  image_url TEXT,
  category TEXT,
  severity TEXT,
  "severityScore" INTEGER,
  recyclable BOOLEAN,
  "decompositionTime" TEXT,
  "rawIdentification" TEXT,
  confidence NUMERIC,
  "poweredBy" TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  municipal_name TEXT,
  municipal_lat NUMERIC,
  municipal_lon NUMERIC,
  address TEXT,
  upvotes INTEGER DEFAULT 0,
  description TEXT,
  user_feedback TEXT,
  user_email TEXT,
  comments JSONB DEFAULT '[]'::jsonb,
  admin_note TEXT
);

-- 4. Create Dustbin Status Table (For the Admin map)
CREATE TABLE IF NOT EXISTS public.dustbin_status (
  id BIGSERIAL PRIMARY KEY,
  latitude NUMERIC,
  longitude NUMERIC,
  level INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  location_name TEXT
);

-- 5. Helper Function to Upgrade User Level Based on Points
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

-- 6. Enable Row Level Security (RLS) but allow public access for the prototype
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dustbin_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow public read/write" ON public.user_roles FOR ALL USING (true);
CREATE POLICY "Allow public read/write" ON public.reports FOR ALL USING (true);
CREATE POLICY "Allow public read/write" ON public.dustbin_status FOR ALL USING (true);
