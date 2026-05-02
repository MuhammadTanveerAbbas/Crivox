-- ============================================================
-- Migration 002: Add User Memory Columns
-- Adds AI memory fields to profiles for personalization
-- ============================================================

-- Add memory columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS profession TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS use_case TEXT,
  ADD COLUMN IF NOT EXISTS has_onboarded BOOLEAN DEFAULT false;