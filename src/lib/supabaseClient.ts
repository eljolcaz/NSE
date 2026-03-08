
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qljwvahuzodcgyicznjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsand2YWh1em9kY2d5aWN6bmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzQzNzQsImV4cCI6MjA4ODQxMDM3NH0.mXdhdjDVqGmusxxtlgMIAKuoPBKWntGKo6z4VAnwQso';

export const supabase = createClient(supabaseUrl, supabaseKey);
