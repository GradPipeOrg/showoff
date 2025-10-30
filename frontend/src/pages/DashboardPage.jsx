import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Check, X } from 'lucide-react'

// Re-usable loading spinner
const LoadingSpinner = () => (
  <div className="min-h-screen bg-bg-primary flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent-primary"></div>
  </div>
)

// Re-usable Doughnut Chart Component
const DoughnutChart = ({ score, title, size = 100, strokeWidth = 10, color = 'var(--accent-primary)' }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute" width={size} height={size}>
        <circle
          stroke="#404040" // Background stroke color
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-xl font-bold text-text-primary">{score}</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [totalDevelopers, setTotalDevelopers] = useState(0) // New state for total devs
  const [loading, setLoading] = useState(true)
  const [b2bOptIn, setB2bOptIn] = useState(false) // State for B2B opt-in
  const [isUpdatingOptIn, setIsUpdatingOptIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      // 1. Auth Protection
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/')
        return
      }
      setSession(session)

      // 2. Fetch User Profile
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        // If profile not found, maybe redirect to upload to ensure it's created/scored
        navigate('/upload') 
        return
      }

      // Check if scores are null (meaning user hasn't uploaded yet)
      if (profileData.showoff_score === null) {
        navigate('/upload')
        return
      }

      setProfile(profileData)
      setB2bOptIn(profileData.b2b_opt_in || false) // Set initial state for toggle

      // 3. Fetch Total Developers and User's Rank
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('user_id, showoff_score')
        .order('showoff_score', { ascending: false })

      if (allProfilesError) {
        console.error('Error fetching all profiles:', allProfilesError)
        setTotalDevelopers(0) // Default to 0 if error
      } else {
        setTotalDevelopers(allProfiles.length)
        // Manually calculate rank based on fetched and sorted data
        const userRank = allProfiles.findIndex(p => p.user_id === session.user.id) + 1;
        setProfile(prev => ({ ...prev, rank: userRank })); // Update profile with correct rank
      }

      setLoading(false)
    }

    fetchData()
  }, [navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleB2bOptInToggle = async () => {
    if (!profile) return

    setIsUpdatingOptIn(true)
    const newOptInStatus = !b2bOptIn

    const { error } = await supabase
      .from('profiles')
      .update({ b2b_opt_in: newOptInStatus })
      .eq('user_id', profile.user_id)

    if (error) {
      console.error('Error updating B2B opt-in:', error)
      alert('Failed to update opt-in status. Please try again.')
    } else {
      setB2bOptIn(newOptInStatus)
    }

    setIsUpdatingOptIn(false)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  // Fallback if profile somehow isn't loaded (should be caught by navigate('/upload'))
  if (!profile) {
    return <LoadingSpinner /> 
  }

  const userName = session?.user?.email?.split('@')[0] || 'User'

  return (
    <>
      {/* Sign Out Button */}
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
        {/* --- Header --- */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} 
              alt="User Avatar" 
              className="w-12 h-12 rounded-full ring-2 ring-accent-primary"
            />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Welcome back, {userName}</h1>
              <p className="text-sm text-text-muted">Ready to show off your skills?</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-text-primary">
              #{profile.rank}
            </span>
            <p className="text-sm text-text-muted">of {totalDevelopers} developers</p>
          </div>
        </div>

        {/* --- Overall Show-off Score --- */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">Overall Show-off Score</h2>
          <div className="flex justify-center">
            <DoughnutChart 
              score={profile.showoff_score} 
              title="Overall" 
              size={180} 
              strokeWidth={15} 
              color='var(--accent-primary)' 
            />
          </div>
          <p className="text-lg text-text-muted">{profile.showoff_score} / 100</p>
        </div>

        {/* --- Individual Score Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Resume Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center space-y-3"
          >
            <h3 className="text-lg font-semibold text-text-primary">Resume Score</h3>
            <DoughnutChart 
              score={profile.resume_score} 
              title="Resume" 
              size={120} 
              strokeWidth={12} 
              color='var(--accent-orange)' 
            />
            <p className="text-md text-text-muted">{profile.resume_score} / 100</p>
          </motion.div>

          {/* GitHub Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center space-y-3"
          >
            <h3 className="text-lg font-semibold text-text-primary">GitHub Score</h3>
            <DoughnutChart 
              score={profile.github_score} 
              title="GitHub" 
              size={120} 
              strokeWidth={12} 
              color='var(--accent-green)' 
            />
            <p className="text-md text-text-muted">{profile.github_score} / 100</p>
          </motion.div>

          {/* Coding Platform Score (Placeholder) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center space-y-3"
          >
            <h3 className="text-lg font-semibold text-text-primary">Coding Platform Score</h3>
            {/* Placeholder value for now */}
            <DoughnutChart 
              score={75} // Static 75 for now as we don't have this
              title="Platform" 
              size={120} 
              strokeWidth={12} 
              color='var(--accent-blue)' 
            />
            <p className="text-md text-text-muted">75 / 100</p>
          </motion.div>
        </div>

        {/* --- View Full Leaderboard Button --- */}
        <motion.button
          onClick={() => navigate('/leaderboard')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-4 rounded-lg shadow-sm text-lg font-medium 
                     text-white bg-accent-primary hover:bg-accent-hover
                     focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-offset-bg-primary focus:ring-accent-focus
                     transition-all"
        >
          View Full Leaderboard
        </motion.button>

        {/* --- B2B Opt-in Toggle --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
        >
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Join the Talent Pool</h3>
            <p className="text-sm text-text-muted">
              Allow companies to discover your profile for job opportunities.
            </p>
          </div>
          <button
            onClick={handleB2bOptInToggle}
            disabled={isUpdatingOptIn}
            className={`relative inline-flex flex-shrink-0 h-7 w-14 border-2 rounded-full cursor-pointer 
                        transition-colors ease-in-out duration-200 focus:outline-none 
                        ${b2bOptIn ? 'bg-accent-green border-accent-green' : 'bg-gray-700 border-gray-600'}`}
          >
            <span className="sr-only">Toggle B2B Opt-in</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow 
                          transform ring-0 transition ease-in-out duration-200 
                          ${b2bOptIn ? 'translate-x-7' : 'translate-x-0'}`}
            />
          </button>
        </motion.div>

      </motion.div>
    </>
  )
}