import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { motion } from 'framer-motion'
import { Award, BarChart2, Github, LogOut, ArrowRight, UploadCloud, Cpu, User, Briefcase, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'

// Re-usable Google Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

export default function LandingPage() {
  const { session, profile } = useOutletContext()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
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
    navigate('/b2b/join')
  }

  const isLoggedOut = !session
  const isOnboarding = session && (!profile || profile.resume_score === null)
  const isLoggedInHub = session && (profile && profile.resume_score !== null)
  const userName = session?.user?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Header */}
      <header className="relative z-20 p-4 sm:p-6 md:p-8 flex justify-between items-center max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
        >
          GradPipe Showoff
        </motion.h1>
        {session && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium 
                       text-text-muted bg-white/5 border border-white/10
                       hover:text-text-primary hover:bg-white/10 transition-all"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </motion.button>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        {/* STATE 1: Logged Out - Modern Hero */}
        {isLoggedOut && (
          <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-12 items-center min-h-[calc(100vh-200px)]">
            {/* Left: Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-300">AI-Powered Career Analysis</span>
              </motion.div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Find Out How Good
                </span>
                <br />
                <span className="text-text-primary">You <span className="text-purple-400">REALLY</span> Are.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-text-muted max-w-2xl leading-relaxed">
                Our <strong className="text-text-primary">Context-Aware AI Engine</strong> analyzes your resume and GitHub profile like a top tech recruiter would — giving you actionable insights to level up.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(99, 102, 241, 0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="group relative px-8 py-4 rounded-xl shadow-lg text-lg font-bold overflow-hidden
                             text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
                             hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500
                             focus:outline-none focus:ring-4 focus:ring-purple-500/50
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-300"
                  style={{ boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <User className="w-5 h-5" />
                    {loading ? 'Signing In...' : 'Get Started as Candidate'}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRecruiterLogin}
                  className="px-8 py-4 rounded-xl text-lg font-semibold
                             text-text-primary bg-white/5 border border-white/20
                             hover:bg-white/10 hover:border-white/30
                             transition-all duration-300 backdrop-blur-sm"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    I'm a Recruiter
                  </span>
                </motion.button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-text-muted">60-90sec analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-text-muted">Actionable feedback</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Floating Preview Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />

                {/* Card */}
                <div className="relative rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 p-8 space-y-6"
                  style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>
                  <div className="text-center">
                    <p className="text-sm text-text-muted mb-2">Your Showoff Score</p>
                    <div className="relative w-48 h-48 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
                        <circle cx="96" cy="96" r="88" stroke="url(#gradient1)" strokeWidth="12" fill="none"
                          strokeDasharray="552" strokeDashoffset="138" strokeLinecap="round"
                          className="transition-all duration-1000" />
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="50%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-5xl font-black bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">75</div>
                          <div className="text-xs text-text-subtle">/100</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <div className="text-2xl font-bold text-orange-400">82</div>
                      <div className="text-xs text-text-muted mt-1">Resume</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-2xl font-bold text-emerald-400">68</div>
                      <div className="text-xs text-text-muted mt-1">GitHub</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* How It Works Section - For Logged Out Users */}
        {isLoggedOut && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-24"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                How It Works
              </h2>
              <p className="text-text-muted text-lg">Get your score in three simple steps</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: UploadCloud, title: '1. Upload Profile', desc: 'Submit your PDF resume and GitHub username', color: 'from-blue-500/10 to-cyan-500/5', borderColor: 'border-blue-500/20', iconColor: 'text-blue-400' },
                { icon: Cpu, title: '2. AI Analysis', desc: 'Our Context-Aware engine runs Deep Tech analysis', color: 'from-purple-500/10 to-pink-500/5', borderColor: 'border-purple-500/20', iconColor: 'text-purple-400' },
                { icon: Award, title: '3. See Your Rank', desc: 'Get your Showoff Score and leaderboard position', color: 'from-amber-500/10 to-orange-500/5', borderColor: 'border-amber-500/20', iconColor: 'text-amber-400' },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${step.color} backdrop-blur-md border ${step.borderColor} 
                             hover:shadow-xl transition-all duration-300`}
                >
                  <step.icon className={`w-12 h-12 ${step.iconColor} mb-4`} />
                  <h3 className="text-xl font-bold text-text-primary mb-2">{step.title}</h3>
                  <p className="text-sm text-text-muted">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* STATE 2: Onboarding */}
        {isOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center space-y-8 py-20"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black">
              <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                One Last Step, {userName}
              </span>
            </h2>
            <p className="text-xl text-text-muted">
              You're in. Now generate your Showoff Score to get on the leaderboard.
            </p>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(99, 102, 241, 0.4)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/upload')}
              className="px-8 py-4 rounded-xl shadow-lg text-lg font-bold
                         text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
                         hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500
                         transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <ArrowRight size={20} />
                Generate My Score
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* STATE 3: Logged In Hub */}
        {isLoggedInHub && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center space-y-8 py-20"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black">
              <span className="text-text-primary">Welcome Back,</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                {userName}
              </span>
            </h2>
            <p className="text-xl text-text-muted">
              Your score is ready. See how you stack up or update your profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 rounded-xl text-lg font-semibold
                           text-white bg-gradient-to-r from-indigo-600 to-purple-600
                           hover:from-indigo-500 hover:to-purple-500
                           transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <Award size={20} />
                  View My Dashboard
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/leaderboard')}
                className="px-8 py-4 rounded-xl text-lg font-semibold
                           text-text-primary bg-white/5 border border-white/20
                           hover:bg-white/10
                           transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <BarChart2 size={20} />
                  See Leaderboard
                </span>
              </motion.button>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="text-text-subtle hover:text-text-muted transition-colors text-sm"
            >
              Re-upload or Update Profile
            </button>
          </motion.div>
        )}
      </main>
    </div>
  )
}
