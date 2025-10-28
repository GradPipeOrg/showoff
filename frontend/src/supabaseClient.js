import { createClient } from '@supabase/supabase-js'

// --- IMPORTANT: PASTE YOUR SUPABASE KEYS HERE ---
const supabaseUrl = 'https://eggbpdkrujroiyjpqqwa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZ2JwZGtydWpyb2l5anBxcXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjA3NjQsImV4cCI6MjA3NzEzNjc2NH0.Qft2nrO9fgSqT4nOYf5whNZjBbxOGJKtEAJG-1qZJ7k'
// ----------------------------------------------

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error("Error: Supabase URL is not set. Please update supabaseClient.js")
}
if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error("Error: Supabase Anon Key is not set. Please update supabaseClient.js")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
