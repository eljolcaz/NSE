
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string, fallback: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://qljwvahuzodcgyicznjn.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsand2YWh1em9kY2d5aWN6bmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzQzNzQsImV4cCI6MjA4ODQxMDM3NH0.mXdhdjDVqGmusxxtlgMIAKuoPBKWntGKo6z4VAnwQso');

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);
