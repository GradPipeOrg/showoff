import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import LandingPage from './pages/LandingPage' // Import the new LandingPage

// Re-usable loading spinner
const LoadingSpinner = () => (
  <div className="min-h-screen bg-bg-primary flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent-primary"></div>
  </div>
)

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        // If session exists, fetch the user's profile
        getProfile(session.user)
      } else {
        setLoading(false) // No session, stop loading
      }
    })

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setProfile(null) // Reset profile on any auth change
      
      if (session && _event === 'SIGNED_IN') {
        // New sign in, create/upsert profile record
        handleNewUser(session.user).then(() => {
          // After upsert, fetch the new profile data
          getProfile(session.user)
        })
      } else if (!session) {
        // User signed out, stop loading
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetches the user's profile from Supabase
  const getProfile = async (user) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  // Creates/Updates the initial profile record
  const handleNewUser = async (user) => {
    console.log("Upserting new user profile:", user.email);
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { 
          user_id: user.id, 
          email: user.email 
        }, 
        { 
          onConflict: 'user_id',
        }
      )
    if (error) console.error('Error creating user profile:', error)
  }

  // --- Render Logic ---

  if (loading) {
    return <LoadingSpinner />
  }

  // We are no longer a "bouncer". We are a "hub".
  // We ALWAYS render the LandingPage, but we pass it the state.
  // The LandingPage itself will decide what to show.
  return (
    <LandingPage session={session} profile={profile} />
  )
}

export default App
