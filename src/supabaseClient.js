import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mhoqjhdnffcgsdjirkuy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ob3FqaGRuZmZjZ3Nkamlya3V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2Nzc2MjEsImV4cCI6MjA5NzI1MzYyMX0._KSi3wPuJJJv-USM07fzO04CJWhjYRBvpi2Uc1OR_sc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
