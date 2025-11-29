import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import mixpanel from 'mixpanel-browser'

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
  const navigate = useNavigate()
  const location = useLocation()

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
      console.log('[App] Auth state change:', _event, session ? 'Session exists' : 'No session')
      setSession(session)
      setProfile(null) // Reset profile on any auth change

      if (session && _event === 'SIGNED_IN') {
        // New sign in, create/upsert profile record
        // Identify user in Mixpanel
        mixpanel.identify(session.user.id)
        mixpanel.people.set({
          '$name': session.user.email?.split('@')[0] || 'User',
          '$email': session.user.email,
        })
        // Track Sign In event
        mixpanel.track('Sign In', {
          user_id: session.user.id,
          login_method: 'google',
          success: true,
        })
        handleNewUser(session.user).then(() => {
          // After upsert, fetch the new profile data
          getProfile(session.user)
          // Track Sign Up event (first time user)
          mixpanel.track('Sign Up', {
            user_id: session.user.id,
            email: session.user.email,
            signup_method: 'google',
          })
        })
      } else if (!session) {
        console.log('[App] User signed out, clearing state')
        // User signed out, stop loading
        mixpanel.reset() // Reset Mixpanel on sign out
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

  useEffect(() => {
    if (!loading && session && location.pathname === '/') {
      // Check if user has a score (existing user)
      if (profile?.showoff_score) {
        navigate('/profile', { replace: true })
      } else {
        // New user or no score yet -> Upload page
        navigate('/upload', { replace: true })
      }
    }
  }, [session, loading, location.pathname, navigate, profile])

  // Global logout handler to ensure state is cleared
  const handleLogout = async () => {
    console.log('[App] Global logout triggered')
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('[App] SignOut error:', error)
    }

    // Force clear state
    setSession(null)
    setProfile(null)
    mixpanel.reset()
    navigate('/', { replace: true })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return <Outlet context={{ session, profile, handleLogout }} />
}

export default App
