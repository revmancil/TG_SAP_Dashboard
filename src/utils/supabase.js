import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://ofpwlnqsyddbhsvtnroo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHdsbnFzeWRkYmhzdnRucm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzQ0MzIsImV4cCI6MjA5MTMxMDQzMn0.kniLndyloVIRTG8LLfdB4oQMNZONjEKrDUnSeDpAuGk'
);
