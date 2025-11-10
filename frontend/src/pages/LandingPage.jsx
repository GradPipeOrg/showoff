import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { motion } from 'framer-motion'
import { Award, BarChart2, Github, LogOut, ArrowRight, UploadCloud, Cpu, User, Briefcase } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Re-usable Google Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

// This component receives the session and profile as props
export default function LandingPage({ session, profile }) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
      // for local it will take to "http://localhost:5173"
      // for production it will take to "https://showoff-psi.vercel.app"
        redirectTo: window.location.origin
      }
    })
    if (error) {
      alert(error.error_description || error.message)
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    supabase.auth.signOut()
  }

  const handleRecruiterLogin = () => {
    // For now, redirect recruiters to the recruiter cockpit (no auth yet)
    navigate('/b2b')
  }

  // Determine the user's "state"
  const isLoggedOut = !session
  const isOnboarding = session && (!profile || profile.resume_score === null)
  const isLoggedInHub = session && (profile && profile.resume_score !== null)

  const userName = session?.user?.email?.split('@')[0] || 'User'

  return (
    <>
      {/* --- Universal Header --- */}
      <header className="absolute top-0 left-0 right-0 p-3 sm:p-4 md:p-6 flex justify-between items-center z-10">
        <h1 className="text-lg sm:text-xl font-bold text-text-primary">GradPipe Showoff</h1>
        {session && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 
                       rounded-lg text-xs sm:text-sm font-medium 
                       text-text-muted bg-white/5 border border-white/10
                       hover:text-text-primary hover:bg-white/10
                       transition-colors"
          >
            <LogOut size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </motion.button>
        )}
      </header>

      {/* --- Main Content --- */}
      <motion.div
        key={isLoggedOut ? 'out' : isOnboarding ? 'onboard' : 'hub'} // This forces re-animation on state change
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        className="w-full max-w-xs sm:max-w-md md:max-w-2xl mx-auto p-4 sm:p-6 md:p-8 text-center
                   rounded-2xl border border-white/10 
                   bg-white/5 backdrop-blur-lg shadow-2xl mt-16 sm:mt-0"
      >
        {/* --- STATE 1: Logged-Out Hook --- */}
        {isLoggedOut && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary leading-tight">
              Find Out How Good You <em>Really</em> Are.
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-text-muted leading-relaxed">
              We built a v1.9 'Context-Aware' AI Engine that analyzes your Resume and GitHub to give you a 'Showoff Score', the same way a top tech recruiter would.
            </p>
            
            {/* Two Separate Sign-In Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              {/* User/Candidate Sign-In */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(79, 70, 229, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex-1 sm:flex-initial px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg shadow-sm 
                         font-medium text-base sm:text-lg text-white bg-accent-primary 
                         hover:bg-accent-hover transition-all"
              >
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">Sign In as </span>Candidate
                </span>
              </motion.button>

              {/* Recruiter Sign-In */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRecruiterLogin}
                className="flex-1 sm:flex-initial px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg shadow-sm 
                         font-medium text-base sm:text-lg text-white bg-accent-violet 
                         hover:bg-[#6d28d9] transition-all border border-white/10"
              >
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <Briefcase className="w-5 h-5" />
                  <span className="hidden sm:inline">Sign In as </span>Recruiter
                </span>
              </motion.button>
            </div>
          </div>
        )}

        {/* --- STATE 2: Onboarding Nudge --- */}
        {isOnboarding && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary leading-tight">
              One Last Step, {userName}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-text-muted leading-relaxed">
              You're in. Now, generate your "Show-off Score" to get on the leaderboard.
            </p>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(79, 70, 229, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/upload')}
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg shadow-sm 
                         font-medium text-base sm:text-lg text-white bg-accent-primary 
                         hover:bg-accent-hover transition-all"
            >
              <span className="flex items-center justify-center gap-2 sm:gap-3">
                <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                Generate My Score
              </span>
            </motion.button>
          </div>
        )}

        {/* --- STATE 3: Logged-In Hub --- */}
        {isLoggedInHub && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary leading-tight">
              Welcome Back, {userName}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-text-muted leading-relaxed">
              Your score is ready. See how you stack up or update your profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg shadow-sm 
                           font-medium text-base sm:text-lg text-white bg-accent-primary 
                           hover:bg-accent-hover transition-all"
              >
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <Award size={18} className="sm:w-5 sm:h-5" />
                  View My Dashboard
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/leaderboard')} // Pratham's future route
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg shadow-sm 
                           font-medium text-base sm:text-lg text-text-muted bg-white/10 border border-white/10
                           hover:bg-white/20 hover:text-text-primary
                           transition-colors"
              >
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <BarChart2 size={18} className="sm:w-5 sm:h-5" />
                  See the Leaderboard
                </span>
              </motion.button>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="text-text-subtle hover:text-text-muted transition-colors pt-2 sm:pt-4 text-xs sm:text-sm"
            >
              Re-upload or Update Profile
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}
