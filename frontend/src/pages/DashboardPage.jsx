//DashboardPage.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Check, X, Clock, Award, User, Github, Briefcase } from 'lucide-react'

// --- 1. Re-usable Loading Spinner ---
const LoadingSpinner = () => (
  <div className="min-h-screen bg-bg-primary flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent-primary"></div>
  </div>
)

// --- 2. "Processing" State Component ---
const ProcessingState = ({ userName }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6
               rounded-2xl border border-white/10 
               bg-white/5 backdrop-blur-lg shadow-2xl mt-16 sm:mt-0"
  >
    <div className="text-center">
      <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-accent-primary mx-auto mb-4 animate-pulse" />
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary mb-2">
        Analyzing Your Profile, {userName}
      </h1>
      <p className="text-sm sm:text-base text-text-muted">
        This may take 1-2 minutes. Our AI is performing a deep analysis of your
        resume and GitHub.
      </p>
      <p className="text-xs sm:text-sm text-text-subtle mt-4">
        This page will update automatically when complete.
      </p>
    </div>
  </motion.div>
)

// --- 3. Re-usable Doughnut Chart Component ---
const DoughnutChart = ({ score, title, size = 100, strokeWidth = 10, color = '#3b82f6' }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute" width={size} height={size}>
        <circle
          stroke="#374151"
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
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset: circumference - (score / 100) * circumference 
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-lg font-bold text-text-primary">{score}</span>
      </div>
    </div>
  )
}

// --- 4. Main Dashboard Component (COMPLETELY REWRITTEN) ---
export default function DashboardPage() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [totalDevelopers, setTotalDevelopers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [b2bOptIn, setB2bOptIn] = useState(false)
  const [isUpdatingOptIn, setIsUpdatingOptIn] = useState(false)
  
  // CRITICAL FIX: Single source of truth for processing state
  const [isProcessing, setIsProcessing] = useState(false)
  
  const navigate = useNavigate()
  
  // Refs to prevent race conditions
  const processingRef = useRef(false)
  const realtimeSubscribedRef = useRef(false)
  const pollIntervalRef = useRef(null)
  const initialProfileLoadedRef = useRef(false)
  const hasExistingScoresRef = useRef(false)

  // === FIXED: Smart processing logic that understands re-analysis ===
  const shouldBeProcessing = (currentProfile = profile) => {
    const flag = localStorage.getItem('analysis_in_progress') === 'true'
    
    // No flag, no processing
    if (!flag) return false
    
    // No profile yet, assume processing
    if (!currentProfile) return true
    
    // No scores at all, definitely processing (new user case)
    if (currentProfile.showoff_score === null) return true
    
    // CRITICAL FIX: For existing users with scores, we need to check if this is a RE-ANALYSIS
    const startTime = parseInt(localStorage.getItem('analysis_start_time') || '0', 10)
    const profileUpdateTime = currentProfile.updated_at ? new Date(currentProfile.updated_at).getTime() : 0
    
    // If profile was updated AFTER we started analysis, then worker finished!
    if (profileUpdateTime > startTime) {
      console.log(`[Processing Logic] Worker finished! Profile updated at ${profileUpdateTime} after start ${startTime}`)
      return false
    }
    
    // If we have scores but they're OLDER than our start time, we're still processing
    console.log(`[Processing Logic] Still processing - profile data is from ${profileUpdateTime}, analysis started at ${startTime}`)
    return true
  }

  // === SIMPLIFIED Profile Fetch ===
  const fetchProfileData = async (session, source = 'initial') => {
    console.log(`[${source}] Fetching profile data...`)
    
    if (!session) {
      navigate('/')
      return
    }
    
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error) throw error

      // Mark that we've loaded the initial profile
      if (!initialProfileLoadedRef.current) {
        initialProfileLoadedRef.current = true
        // Track if user has existing scores (for polling cooldown)
        hasExistingScoresRef.current = profileData.showoff_score !== null
      }

      // CRITICAL: Update state in correct order
      setProfile(profileData)
      setB2bOptIn(profileData.b2b_opt_in || false)

      // FIXED: Use the smart processing logic
      const processing = shouldBeProcessing(profileData)
      setIsProcessing(processing)
      processingRef.current = processing

      // If we're NOT processing and we have scores, fetch leaderboard
      if (!processing && profileData.showoff_score !== null) {
        await fetchLeaderboardStats(session)
      }

      // CRITICAL: Clear flags only when we're definitely done
      if (!processing) {
        localStorage.removeItem('analysis_in_progress')
        localStorage.removeItem('analysis_start_time')
        console.log(`[${source}] Analysis complete, flags cleared`)
      }

    } catch (error) {
      console.error('Error fetching profile:', error)
      // Don't navigate on error - just show loading state
    } finally {
      setLoading(false)
    }
  }

  // === Leaderboard Stats ===
  const fetchLeaderboardStats = async (session) => {
    try {
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('user_id, showoff_score')
        .not('showoff_score', 'is', null)
        .order('showoff_score', { ascending: false })

      if (error) throw error

      if (allProfiles) {
        setTotalDevelopers(allProfiles.length)
        const userRank = allProfiles.findIndex(p => p.user_id === session.user.id) + 1
        setProfile(prev => ({ ...prev, rank: userRank || 0 }))
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  // === ROBUST Real-time Listener ===
  const setupRealtimeListener = (session) => {
    if (realtimeSubscribedRef.current) return
    
    console.log('[Realtime] Setting up listener...')
    
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('[Realtime] Profile updated:', payload.new)
          
          // CRITICAL: Check if this update contains scores AND is fresh
          if (payload.new.showoff_score !== null) {
            const startTime = parseInt(localStorage.getItem('analysis_start_time') || '0', 10)
            const payloadUpdateTime = payload.new.updated_at ? new Date(payload.new.updated_at).getTime() : 0
            
            // Only accept updates that happened AFTER we started analysis
            if (payloadUpdateTime > startTime) {
              console.log('[Realtime] Fresh scores detected, updating dashboard...')
              
              // Clear flags first
              localStorage.removeItem('analysis_in_progress')
              localStorage.removeItem('analysis_start_time')
              
              // Update state
              setIsProcessing(false)
              processingRef.current = false
              setProfile(prev => ({ ...prev, ...payload.new }))
              
              if (payload.new.b2b_opt_in !== undefined) {
                setB2bOptIn(payload.new.b2b_opt_in)
              }
              
              // Stop polling if it's running
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              
              // Fetch updated leaderboard
              fetchLeaderboardStats(session)
            } else {
              console.log('[Realtime] Ignoring stale update (re-analysis in progress)')
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status)
        
        if (status === 'SUBSCRIBED') {
          realtimeSubscribedRef.current = true
          console.log('[Realtime] Successfully subscribed')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Realtime] Connection failed, starting polling fallback')
          startPolling(session)
        }
      })

    return channel
  }

  // === IMPROVED Polling with Cooldown Period ===
  const startPolling = (session) => {
    if (pollIntervalRef.current) return
    
    console.log('[Polling] Starting polling fallback...')
    
    // CRITICAL: Don't start polling immediately for existing users
    // Skip first 2 polls (10 seconds) for existing users to avoid catching stale data
    let pollCount = 0
    const cooldownPolls = 2 // 2 polls * 5 seconds = 10 second cooldown
    
    pollIntervalRef.current = setInterval(async () => {
      pollCount++
      
      // Skip first few polls for existing users to avoid stale data
      if (hasExistingScoresRef.current && pollCount <= cooldownPolls) {
        console.log(`[Polling] Skipping poll ${pollCount}/${cooldownPolls} due to cooldown for existing user`)
        return
      }
      
      // Only poll if we're actually processing
      if (!processingRef.current) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        return
      }
      
      console.log('[Polling] Checking for score updates...')
      
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('showoff_score, updated_at, resume_score, github_score')
          .eq('user_id', session.user.id)
          .single()
          
        if (error) throw error
        
        if (profileData && profileData.showoff_score !== null) {
          const startTime = parseInt(localStorage.getItem('analysis_start_time') || '0', 10)
          const profileUpdateTime = profileData.updated_at ? new Date(profileData.updated_at).getTime() : 0
          
          // CRITICAL: Only accept scores that are FRESH (after start time)
          if (profileUpdateTime > startTime) {
            console.log('[Polling] Fresh scores found, updating dashboard...')
            
            // Stop polling first
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            
            // Refresh full profile data
            await fetchProfileData(session, 'polling')
          } else {
            console.log('[Polling] Found scores but they are stale (re-analysis in progress)')
          }
        } else {
          console.log('[Polling] No scores yet, still processing...')
        }
      } catch (error) {
        console.error('[Polling] Error:', error)
      }
    }, 5000) // Poll every 5 seconds
  }

  // === SIMPLIFIED Main Effect ===
  useEffect(() => {
    let realtimeChannel = null

    const initializeDashboard = async () => {
      // 1. Get session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/')
        return
      }
      
      setSession(session)
      
      // 2. Set initial processing state
      const initialProcessing = localStorage.getItem('analysis_in_progress') === 'true'
      setIsProcessing(initialProcessing)
      processingRef.current = initialProcessing
      
      // 3. Fetch initial data
      await fetchProfileData(session, 'mount')
      
      // 4. Setup realtime listener if still processing
      if (processingRef.current) {
        realtimeChannel = setupRealtimeListener(session)
        
        // Start polling - it will check for existing scores internally
        // The startPolling function has its own logic to delay for existing users
        startPolling(session)
      }
    }

    initializeDashboard()

    // Cleanup
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        realtimeSubscribedRef.current = false
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [navigate])

  // === Handler Functions ===
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

  // === SIMPLIFIED Render Logic ===
  if (loading) {
    return <LoadingSpinner />
  }

  if (!session || !profile) {
    return <LoadingSpinner />
  }

  const userName = session?.user?.email?.split('@')[0] || 'User'

  // CRITICAL: Simple, reliable condition for showing processing
  if (isProcessing) {
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
        <ProcessingState userName={userName} />
      </>
    )
  }

  // Safety check - don't render dashboard without scores
  if (!profile.showoff_score) {
    return <LoadingSpinner />
  }

  // === DASHBOARD RENDER (unchanged from your working version) ===
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
        className="w-full max-w-xs sm:max-w-md md:max-w-3xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6
                   rounded-2xl border border-white/10 
                   bg-white/5 backdrop-blur-lg shadow-2xl mt-16 sm:mt-0"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 pb-3 sm:pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} 
              alt="User Avatar" 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-2 ring-accent-primary"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-text-primary">Welcome back, {userName}</h1>
              <p className="text-xs sm:text-sm text-text-muted">Ready to show off your skills?</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xl sm:text-2xl font-bold text-text-primary">
              #{profile.rank || 0}
            </span>
            <p className="text-xs sm:text-sm text-text-muted">of {totalDevelopers} developers</p>
          </div>
        </div>

        {/* Overall Show-off Score */}
        <div className="text-center space-y-2 sm:space-y-3">
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary">Overall Show-off Score</h2>
          <div className="flex justify-center">
            <DoughnutChart 
              score={profile.showoff_score} 
              title="Overall" 
              size={120} 
              strokeWidth={10} 
              color='#3b82f6' 
            />
          </div>
          <p className="text-sm sm:text-base text-text-muted">{profile.showoff_score} / 100</p>
        </div>

        {/* Individual Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Resume Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center space-y-1 sm:space-y-2"
          >
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">Resume Score</h3>
            <DoughnutChart 
              score={profile.resume_score} 
              title="Resume" 
              size={80} 
              strokeWidth={8} 
              color='#f59e0b' 
            />
            <p className="text-xs sm:text-sm text-text-muted">{profile.resume_score} / 100</p>
            
            {/* --- NEW JUSTIFICATION TEXT --- */}
            {profile.resume_justification && (
              <blockquote className="mt-2 p-2 border-l-2 border-accent-focus bg-white/5 text-left">
                <p className="text-xs sm:text-sm text-text-muted italic">
                  " {profile.resume_justification} "
                </p>
              </blockquote>
            )}
            {/* --- END OF JUSTIFICATION --- */}
            
          </motion.div>

          {/* GitHub Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center space-y-1 sm:space-y-2"
          >
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">GitHub Score</h3>
            <DoughnutChart 
              score={profile.github_score} 
              title="GitHub" 
              size={80} 
              strokeWidth={8} 
              color='#10b981' 
            />
            <p className="text-xs sm:text-sm text-text-muted">{profile.github_score} / 100</p>
          </motion.div>

          {/* Coding Platform Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center space-y-1 sm:space-y-2 sm:col-span-2 lg:col-span-1"
          >
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">Coding Platform Score</h3>
            <DoughnutChart 
              score={75}
              title="Platform" 
              size={80} 
              strokeWidth={8} 
              color='#3b82f6' 
            />
            <p className="text-xs sm:text-sm text-text-muted">75 / 100</p>
          </motion.div>
        </div>

        {/* --- Action Buttons --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Re-analyze Button */}
          <motion.button
            onClick={() => navigate('/upload')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 sm:py-2.5 px-4 rounded-lg shadow-sm text-sm sm:text-base font-medium 
                       text-text-muted bg-white/10 border border-white/10
                       hover:bg-white/20 hover:text-text-primary
                       transition-colors"
          >
            Re-analyze Profile
          </motion.button>
          
          {/* View Leaderboard Button */}
          <motion.button
            onClick={() => navigate('/leaderboard')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 sm:py-2.5 px-4 rounded-lg shadow-sm text-sm sm:text-base font-medium 
                       text-white bg-accent-primary hover:bg-accent-hover
                       focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-offset-bg-primary focus:ring-accent-focus
                       transition-all"
          >
            View Full Leaderboard
          </motion.button>
        </div>

        {/* B2B Opt-in Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between"
        >
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">Join the Talent Pool</h3>
            <p className="text-xs text-text-muted">
              Allow companies to discover your profile for job opportunities.
            </p>
          </div>
          <button
            onClick={handleB2bOptInToggle}
            disabled={isUpdatingOptIn}
            className={`relative inline-flex flex-shrink-0 h-5 w-10 sm:h-6 sm:w-12 border-2 rounded-full cursor-pointer 
                        transition-colors ease-in-out duration-200 focus:outline-none 
                        ${b2bOptIn ? 'bg-accent-green border-accent-green' : 'bg-gray-700 border-gray-600'}`}
          >
            <span className="sr-only">Toggle B2B Opt-in</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white shadow 
                          transform ring-0 transition ease-in-out duration-200 
                          ${b2bOptIn ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}`}
            />
          </button> 
        </motion.div>
      </motion.div>
    </>
  )
}