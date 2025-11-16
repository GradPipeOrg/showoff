//DashboardPage.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Check, X, Clock, Award, User, Github, Briefcase, ChevronDown, Linkedin, Twitter, Instagram, Sparkles, TrendingUp, Zap } from 'lucide-react'
import mixpanel from 'mixpanel-browser'

// --- 1. Re-usable Loading Spinner ---
const LoadingSpinner = () => (
  <div className="min-h-screen bg-bg-primary flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent-primary"></div>
  </div>
)

// --- 2. "Active Analysis" State Component (v4.9 "Steve Jobs" Edition) ---
const ActiveAnalysisState = ({ userName }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { text: "Job submitted to 'Deep Tech' queue", duration: 2000 },
    { text: "Downloading and parsing resume PDF", duration: 10000 },
    { text: "Analyzing resume with v1.9 'Context-Aware' Engine", duration: 20000 },
    { text: "Scraping GitHub repositories (v4.2 Scraper)", duration: 15000 },
    { text: "Running 'Deep Tech' code analysis on snippets", duration: 20000 },
    { text: "Calculating final 'Showoff Score'", duration: 10000 },
    { text: "Finalizing results... (this can take a moment)", duration: 999999 }, // Stays here until unmounted
  ]

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, steps[currentStep].duration)
      return () => clearTimeout(timer)
    }
  }, [currentStep, steps.length])

  const StepIcon = ({ index }) => {
    if (index < currentStep) {
      return <Check className="h-5 w-5 text-accent-green" />
    }
    if (index === currentStep) {
      return <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-accent-primary" />
    }
    return <Clock className="h-5 w-5 text-text-subtle" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6
               rounded-2xl border border-white/10 
               bg-white/5 backdrop-blur-lg shadow-2xl mt-16 sm:mt-0"
    >
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary mb-2">
          Analyzing Your Profile, {userName}
        </h1>
        <p className="text-sm sm:text-base text-text-muted">
          This <strong>Deep Tech analysis</strong> may take 60-100 seconds. We are
          running your profile through our "Context-Aware" AI engines.
        </p>
      </div>

      <div className="space-y-3 pt-4 border-t border-white/10">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: index <= currentStep ? 1 : 0.4 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <StepIcon index={index} />
            <span className={`text-sm ${
              index === currentStep ? 'text-text-primary font-medium' : 
              index < currentStep ? 'text-text-muted' : 'text-text-subtle'
            }`}>
              {step.text}
            </span>
          </motion.div>
        ))}
      </div>
      <p className="text-xs sm:text-sm text-text-subtle text-center pt-4">
        Note: This page will update automatically the <em>instant</em> your score is ready.
      </p>
    </motion.div>
  )
}

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
        <span className="text-lg font-bold text-text-primary">{score?.toFixed(2) ?? '0.00'}</span>
      </div>
    </div>
  )
}

// --- 3.5. Re-usable Feedback Renderer ---
const FeedbackRenderer = ({ feedback }) => {
  if (!feedback) return null

  // Split by newline, filter out empty strings
  const feedbackItems = feedback.split('\n').filter(item => item.trim() !== '')
  
  return (
    <ul className="list-disc list-inside space-y-1 pl-1">
      {feedbackItems.map((item, index) => (
        <li key={index} className="text-xs sm:text-sm text-text-muted">
          {/* Remove leading numbers/bullets from the string itself */}
          {item.replace(/^[\d.-]+\s*/, '')}
        </li>
      ))}
    </ul>
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
  
  // v4.9.2 UI State for collapsible cards
  const [showResumeDetails, setShowResumeDetails] = useState(false)
  const [showGithubDetails, setShowGithubDetails] = useState(false)
  
  // CRITICAL FIX: Single source of truth for processing state
  const [isProcessing, setIsProcessing] = useState(false)
  
  const navigate = useNavigate()
  
  // Refs to prevent race conditions
  const processingRef = useRef(false)
  const realtimeSubscribedRef = useRef(false)
  const pollIntervalRef = useRef(null)
  const initialProfileLoadedRef = useRef(false)
  const hasExistingScoresRef = useRef(false)
  
  // === v4.9.13 "Showoff" Loop ===
  const handleShare = (platform) => {
    const score = profile.showoff_score?.toFixed(2)
    const rank = profile.rank
    const url = "https://showoff.gradpipe.com"
    const text = `I just got my "Deep Tech" engineering score on Showoff! 🚀\n\nI'm ranked #${rank} with a score of ${score}/100. \n\nFind out how good you *really* are:`
    
    // Prefer the Web Share API when available (mobile-first, native sheet)
    if (navigator?.share) {
      try {
        navigator.share({
          title: `I'm Ranked #${rank} on Showoff!`,
          text,
          url
        })
        mixpanel.track('Share Score', { 'platform': platform || 'web-share', 'rank': rank, 'score': score, 'method': 'navigator.share' })
        return
      } catch (e) {
        // fall through to platform-specific URLs
      }
    }
    
    let shareUrl = ""
    if (platform === 'linkedin') {
      // LinkedIn frequently ignores prefilled title/summary in modern UI.
      // Fallback to copying the caption and opening the share page.
      try {
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(`${text}\n${url}`)
        }
      } catch (e) {
        // ignore clipboard errors
      }
      mixpanel.track('Share Score', { 'platform': 'linkedin', 'rank': rank, 'score': score, 'copied': true })
      // Use official offsite share endpoint with URL; user pastes caption manually.
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
      try {
        setTimeout(() => {
          // eslint-disable-next-line no-alert
          alert('Your LinkedIn caption is copied. Paste it into the post composer.')
        }, 100)
      } catch {}
    } else if (platform === 'twitter') {
      const hashtags = 'ShowoffScore,DeepTech,GradPipe'
      const via = 'GradPipe' // adjust if different handle
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}&hashtags=${encodeURIComponent(hashtags)}&via=${encodeURIComponent(via)}`
      mixpanel.track('Share Score', { 'platform': 'twitter', 'rank': rank, 'score': score })
    } else if (platform === 'instagram') {
      try {
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(`${text}\n${url}`)
        }
      } catch (e) {
        // ignore clipboard errors; still proceed to open IG
      }
      mixpanel.track('Share Score', { 'platform': 'instagram', 'rank': rank, 'score': score, 'copied': true })
      shareUrl = 'https://www.instagram.com/create/story'
      // Hint the user that caption is copied
      try {
        // Non-blocking UX; safe no-op if alerts are suppressed
        setTimeout(() => {
          // eslint-disable-next-line no-alert
          alert('Your caption is copied. Paste it into your Instagram story.')
        }, 100)
      } catch {}
    }
    
    window.open(shareUrl, '_blank')
  }

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
    // Track page view
    mixpanel.track('Page View', {
      page_url: window.location.href,
      page_title: 'Dashboard',
      user_id: session?.user?.id,
    })

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
      mixpanel.track('Candidate B2B Opt-in', { 'opt_in_status': newOptInStatus })
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
        <ActiveAnalysisState userName={userName} />
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
          <p className="text-sm sm:text-base text-text-muted">{profile.showoff_score?.toFixed(2) ?? '0.00'} / 100</p>
          
          {/* --- v4.9.13 "Showoff" Loop Buttons --- */}
          <div className="flex justify-center gap-3 mt-4">
            <motion.button
              onClick={() => handleShare('linkedin')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium 
                       text-[#0A66C2] bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20
                       transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Linkedin size={16} />
              Share
            </motion.button>
            <motion.button
              onClick={() => handleShare('twitter')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium 
                       text-[#1DA1F2] bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20
                       transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Twitter size={16} />
              Share
            </motion.button>
            <motion.button
              onClick={() => handleShare('instagram')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium 
                       text-[#E1306C] bg-[#E1306C]/10 hover:bg-[#E1306C]/20
                       transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Instagram size={16} />
              Story
            </motion.button>
          </div>
          {/* --- END "Showoff" Loop --- */}
        </div>

        {/* --- PROMINENT B2B Opt-in Card (v5.0 - High Visibility) --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
          className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300
            ${b2bOptIn 
              ? 'bg-gradient-to-br from-accent-green/20 via-accent-green/10 to-accent-primary/10 border-accent-green shadow-lg shadow-accent-green/20' 
              : 'bg-gradient-to-br from-accent-violet/20 via-accent-primary/15 to-accent-blue/10 border-accent-primary/50 shadow-lg shadow-accent-primary/10 hover:border-accent-primary hover:shadow-xl hover:shadow-accent-primary/20'
            }`}
        >
          {/* Animated background glow */}
          <div className={`absolute inset-0 opacity-30 ${b2bOptIn ? 'bg-accent-green' : 'bg-accent-primary'} blur-3xl animate-pulse`} />
          
          <motion.button
            onClick={handleB2bOptInToggle}
            disabled={isUpdatingOptIn}
            className="relative w-full p-4 sm:p-6 text-left focus:outline-none focus:ring-2 focus:ring-accent-focus focus:ring-offset-2 focus:ring-offset-bg-primary rounded-2xl"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Icon Section */}
              <div className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center transition-all duration-300
                ${b2bOptIn 
                  ? 'bg-accent-green/20 text-accent-green' 
                  : 'bg-accent-primary/20 text-accent-primary'
                }`}
              >
                {b2bOptIn ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
                  </motion.div>
                ) : (
                  <Briefcase className="w-7 h-7 sm:w-8 sm:h-8" />
                )}
              </div>

              {/* Content Section */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`text-lg sm:text-xl font-bold transition-colors
                    ${b2bOptIn ? 'text-accent-green' : 'text-text-primary'}
                  `}>
                    {b2bOptIn ? '✓ You\'re in the Talent Pool!' : 'Get Discovered by Top Companies'}
                  </h3>
                  {!b2bOptIn && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Zap className="w-5 h-5 text-accent-primary" />
                    </motion.div>
                  )}
                </div>
                <p className="text-sm sm:text-base text-text-muted leading-relaxed">
                  {b2bOptIn 
                    ? 'Recruiters can now discover your profile. You\'ll be notified when companies are interested!'
                    : 'Join thousands of developers being discovered by elite tech companies. Turn on your profile visibility and unlock exclusive opportunities.'
                  }
                </p>
                
                {/* Benefits List (when not opted in) */}
                {!b2bOptIn && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-1.5"
                  >
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted">
                      <TrendingUp className="w-4 h-4 text-accent-green flex-shrink-0" />
                      <span>Get matched with roles that fit your skills</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted">
                      <Award className="w-4 h-4 text-accent-primary flex-shrink-0" />
                      <span>Exclusive access to top-tier opportunities</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Toggle Button - Large and Prominent */}
              <div className="flex-shrink-0 relative">
                <motion.div
                  className={`relative inline-flex items-center h-12 w-24 sm:h-14 sm:w-28 rounded-full transition-all duration-300 pointer-events-none
                    ${b2bOptIn 
                      ? 'bg-accent-green shadow-lg shadow-accent-green/30' 
                      : 'bg-gray-700 shadow-lg'
                    }
                  `}
                >
                  <motion.div
                    className={`absolute top-1 left-1 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300
                      ${b2bOptIn ? 'translate-x-12 sm:translate-x-14' : 'translate-x-0'}
                    `}
                    layout
                  >
                    {b2bOptIn ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-accent-green" />
                      </motion.div>
                    ) : (
                      <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                    )}
                  </motion.div>
                  <span className="sr-only">Toggle Talent Pool</span>
                </motion.div>
                {isUpdatingOptIn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white" />
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        </motion.div>
        {/* --- END Prominent B2B Opt-in --- */}

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
            <p className="text-xs sm:text-sm text-text-muted">{profile.resume_score?.toFixed(2) ?? '0.00'} / 100</p>
            
            {/* --- v4.9.2 "Actionable" Button --- */}
            <motion.button
              onClick={() => { if (!showResumeDetails) { mixpanel.track('View Score Details', { 'card': 'resume' }) }; setShowResumeDetails(!showResumeDetails) }}
              className="mt-2 flex items-center gap-1 text-xs sm:text-sm text-accent-focus hover:text-accent-hover transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <span>{showResumeDetails ? 'Hide' : 'Show'} Details</span>
              <motion.div animate={{ rotate: showResumeDetails ? 180 : 0 }}>
                <ChevronDown size={16} />
              </motion.div>
            </motion.button>

            {/* --- v4.9.2 "Actionable" Content --- */}
            <AnimatePresence>
              {showResumeDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full mt-2 pt-2 border-t border-white/10 text-left space-y-3"
                >
                  {profile.resume_justification && (
                    <blockquote className="p-2 border-l-2 border-accent-focus bg-white/5">
                      <h4 className="text-xs sm:text-sm font-semibold text-text-primary mb-1">The "Why":</h4>
                      <p className="text-xs sm:text-sm text-text-muted italic">
                        " {profile.resume_justification} "
                      </p>
                    </blockquote>
                  )}
                  {profile.resume_feedback && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-text-primary mb-1">The "How to Fix":</h4>
                      <FeedbackRenderer feedback={profile.resume_feedback} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
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
            <p className="text-xs sm:text-sm text-text-muted">{profile.github_score?.toFixed(2) ?? '0.00'} / 100</p>
            
            {/* --- v4.9.2 "Actionable" Button --- */}
            <motion.button
              onClick={() => { if (!showGithubDetails) { mixpanel.track('View Score Details', { 'card': 'github' }) }; setShowGithubDetails(!showGithubDetails) }}
              className="mt-2 flex items-center gap-1 text-xs sm:text-sm text-accent-green hover:text-accent-green/80 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <span>{showGithubDetails ? 'Hide' : 'Show'} Details</span>
              <motion.div animate={{ rotate: showGithubDetails ? 180 : 0 }}>
                <ChevronDown size={16} />
              </motion.div>
            </motion.button>
            
            {/* --- v4.9.2 "Actionable" Content --- */}
            <AnimatePresence>
              {showGithubDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full mt-2 pt-2 border-t border-white/10 text-left space-y-3"
                >
                  {profile.github_justification && (
                    <blockquote className="p-2 border-l-2 border-accent-green bg-white/5">
                      <h4 className="text-xs sm:text-sm font-semibold text-text-primary mb-1">The "Why":</h4>
                      <p className="text-xs sm:text-sm text-text-muted italic">
                        " {profile.github_justification} "
                      </p>
                    </blockquote>
                  )}
                  {profile.github_feedback && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-text-primary mb-1">The "How to Fix":</h4>
                      <FeedbackRenderer feedback={profile.github_feedback} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
          </motion.div>

          {/* Coding Platform Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center space-y-1 sm:space-y-2 sm:col-span-2 lg:col-span-1"
          >
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">Coding Platform Score</h3>
            <div className="flex items-center justify-center" style={{ width: 80, height: 80 }}>
              <p className="text-xs sm:text-sm text-text-muted italic">Coming Soon</p>
            </div>
            <p className="text-xs sm:text-sm text-text-muted">—</p>
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
      </motion.div>
    </>
  )
}