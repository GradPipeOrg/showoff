import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Award, User, Github } from 'lucide-react'

// Placeholder for a loading spinner
const LoadingSpinner = () => (
  <div className="min-h-screen bg-bg-primary flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent-primary"></div>
  </div>
)

export default function DashboardPage() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      // 1. Check for active session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // If no session, redirect to login
        navigate('/')
        return
      }
      setSession(session)

      // 2. Fetch the user's profile with their scores
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error || !data) {
        console.error('Error fetching profile:', error)
        // If error or no profile, send back to upload page
        navigate('/') 
        return
      }
      
      // If profile has no scores, send back to upload page
      if (data.resume_score === null) {
        navigate('/')
        return
      }

      setProfile(data)
      setLoading(false)
    }

    fetchData()
  }, [navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/') // Navigate will be triggered by the auth listener anyway, but this is fast
  }

  if (loading || !profile) {
    return <LoadingSpinner />
  }

  // Once loaded, show the dashboard
  return (
    <>
      <motion.button
        onClick={handleSignOut}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 
                   flex items-center gap-2 px-3 py-2 
                   rounded-lg text-sm font-medium 
                   text-text-muted bg-white/5 border border-white/10
                   hover:text-text-primary hover:bg-white/10
                   transition-colors"
      >
        <LogOut size={16} />
        Sign Out
      </motion.button>
    
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto p-6 sm:p-8 space-y-8
                   rounded-2xl border border-white/10 
                   bg-white/5 backdrop-blur-lg shadow-2xl"
      >
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
            Your Showoff Dashboard
          </h1>
          <p className="text-base sm:text-lg text-text-muted">
            Welcome, {session.user.email}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Score */}
          <div className="md:col-span-1 p-6 rounded-lg bg-white/5 border border-white/10 text-center">
            <Award className="h-12 w-12 text-accent-primary mx-auto mb-4" />
            <h3 className="text-text-muted text-lg">Show-off Score</h3>
            <p className="text-5xl font-bold text-text-primary">{profile.showoff_score}</p>
          </div>

          {/* Score Breakdown */}
          <div className="md:col-span-2 p-6 rounded-lg bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Score Breakdown</h3>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-text-muted"><User size={18} /> Resume Score</span>
              <span className="text-2xl font-bold text-text-primary">{profile.resume_score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-text-muted"><Github size={18} /> GitHub Score</span>
              <span className="text-2xl font-bold text-text-primary">{profile.github_score}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-text-muted">Your Rank</span>
              <span className="text-2xl font-bold text-accent-violet">#{profile.rank}</span>
            </div>
          </div>
        </div>

      </motion.div>
    </>
  )
}
