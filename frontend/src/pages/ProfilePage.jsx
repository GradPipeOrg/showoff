import { Fragment, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, Transition } from '@headlessui/react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Github, ExternalLink, FileText, GraduationCap, ChevronDown, BadgeCheck, RefreshCw } from 'lucide-react'
import ScoreCircle from '../components/ScoreCircle'
import { generateAvatarUrl } from '../utils/avatarUtils'
import { COLLEGE_DOMAINS } from '../constants/collegeDomains'

// Re-usable Feedback Renderer
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

const ProfilePage = () => {
  const context = useOutletContext()
  const { session, profile } = context || { session: null, profile: null }
  const navigate = useNavigate()
  const [showResumeDetails, setShowResumeDetails] = useState(false)
  const [showGithubDetails, setShowGithubDetails] = useState(false)
  const [collegeName, setCollegeName] = useState(profile?.verified_college ?? null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStage, setVerificationStage] = useState('email') // email | otp
  const [collegeEmail, setCollegeEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [pendingCollegeName, setPendingCollegeName] = useState(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResettingCollege, setIsResettingCollege] = useState(false)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const userName = profile?.display_name || session?.user?.email?.split('@')[0] || 'GradPipe User'
  const email = session?.user?.email
  const githubHandle = profile?.github_username || profile?.github_url?.split('github.com/')[1] || userName
  const githubUrl = profile?.github_url || `https://github.com/${githubHandle}`
  const resumeUrl = profile?.resume_url || '#'
  // Generate gender-neutral avatar using initials style (professional and neutral)
  // If profile has avatar_url, use it; otherwise generate initials-based avatar
  // Generate avatar: use profile avatar_url if available, otherwise generate based on gender preference
  const avatarUrl =
    profile?.avatar_url ||
    generateAvatarUrl(userName, profile?.gender || null)

  const VERIFICATION_STORAGE_KEY = 'collegeVerificationFlow'
  const VERIFIED_COLLEGE_STORAGE_KEY = 'verifiedCollegeName'

  // Load persisted verification state (if user navigates away/back)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedCollege = sessionStorage.getItem(VERIFIED_COLLEGE_STORAGE_KEY)
    if (!collegeName && storedCollege) {
      setCollegeName(storedCollege)
    }

    const storedFlow = sessionStorage.getItem(VERIFICATION_STORAGE_KEY)
    if (storedFlow) {
      try {
        const parsed = JSON.parse(storedFlow)
        if (parsed.isVerifying) {
          setIsVerifying(true)
          setVerificationStage(parsed.verificationStage || 'email')
          setCollegeEmail(parsed.collegeEmail || '')
          setPendingCollegeName(parsed.pendingCollegeName || null)
        }
      } catch (err) {
        console.warn('Failed to restore verification state', err)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isVerifying) {
      const stateToPersist = JSON.stringify({
        isVerifying,
        verificationStage,
        collegeEmail,
        pendingCollegeName,
      })
      sessionStorage.setItem(VERIFICATION_STORAGE_KEY, stateToPersist)
    } else {
      sessionStorage.removeItem(VERIFICATION_STORAGE_KEY)
    }
  }, [isVerifying, verificationStage, collegeEmail, pendingCollegeName])

  const handleOpenVerification = () => {
    setIsVerifying(true)
    setVerificationStage('email')
    setCollegeEmail('')
    setOtp('')
    setVerificationError('')
    setPendingCollegeName(null)
  }

  const handleCloseVerification = () => {
    setIsVerifying(false)
    setVerificationError('')
  }

  const handleSendOtp = async () => {
    setVerificationError('')
    if (!collegeEmail.includes('@')) {
      setVerificationError('Please enter a valid college email address.')
      return
    }
    const domain = collegeEmail.split('@')[1]?.toLowerCase()
    if (!domain || !COLLEGE_DOMAINS[domain]) {
      setVerificationError('Sorry, this college is not yet supported.')
      return
    }
    setIsSendingOtp(true)
    try {
      const response = await fetch(`${apiBaseUrl}/college/send_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: collegeEmail.toLowerCase() }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send OTP. Please try again.')
      }
      setPendingCollegeName(data.college_name || COLLEGE_DOMAINS[domain])
      setVerificationStage('otp')
      setVerificationError('')
    } catch (error) {
      setVerificationError(error.message)
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    setVerificationError('')
    if (!otp || otp.length !== 6) {
      setVerificationError('Please enter the 6-digit code you received.')
      return
    }
    if (!session?.user?.id) {
      setVerificationError('Session expired. Please log in again.')
      return
    }
    setIsVerifyingOtp(true)
    try {
      const response = await fetch(`${apiBaseUrl}/college/verify_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: collegeEmail.toLowerCase(),
          otp,
          user_id: session.user.id,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Incorrect code. Please try again.')
      }
      const verifiedName = data.college_name || pendingCollegeName
      setCollegeName(verifiedName)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(VERIFIED_COLLEGE_STORAGE_KEY, verifiedName)
        sessionStorage.removeItem(VERIFICATION_STORAGE_KEY)
      }
      setIsVerifying(false)
      setVerificationStage('email')
      setOtp('')
      setCollegeEmail('')
      setVerificationError('')
    } catch (error) {
      setVerificationError(error.message)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResetVerification = async () => {
    if (!session?.user?.id) return
    setIsResettingCollege(true)
    try {
      const response = await fetch(`${apiBaseUrl}/college/reset_verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session.user.id }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to reset verification.')
      }
      setCollegeName(null)
      setPendingCollegeName(null)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(VERIFIED_COLLEGE_STORAGE_KEY)
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setIsResettingCollege(false)
    }
  }

  const showoffScore = profile?.showoff_score ?? 0
  const resumeScore = profile?.resume_score ?? 0
  const githubScore = profile?.github_score ?? 0

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-purple-500/10 transition-shadow duration-500 p-4 sm:p-6 md:p-8 grid gap-4 sm:gap-6 md:grid-cols-[280px,1fr] lg:grid-cols-[320px,1fr] relative overflow-hidden group"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Gradient glow overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-700 pointer-events-none rounded-2xl sm:rounded-3xl" />
        <div className="flex flex-col items-center gap-4 text-center">
          <img
            src={avatarUrl}
            alt={userName}
            className="w-32 h-32 rounded-2xl border-4 border-white/10 object-cover"
          />
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-widest text-text-subtle">College</p>
            {collegeName ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <BadgeCheck className="w-4 h-4 text-accent-primary" />
                  {collegeName}
                </div>
                <motion.button
                  whileHover={{ scale: isResettingCollege ? 1 : 1.02 }}
                  whileTap={{ scale: isResettingCollege ? 1 : 0.98 }}
                  onClick={handleResetVerification}
                  disabled={isResettingCollege}
                  className={`text-[11px] font-semibold ${isResettingCollege ? 'text-text-subtle' : 'text-text-muted hover:text-text-primary'} bg-white/5 border border-white/10 rounded-xl px-3 py-1`}
                >
                  {isResettingCollege ? 'Resetting...' : 'Re-verify'}
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenVerification}
                className="px-3 py-1.5 rounded-2xl text-xs font-semibold text-text-primary bg-accent-primary/20 border border-accent-primary/40 backdrop-blur-md"
              >
                Verify Your College
              </motion.button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-xs uppercase text-text-subtle tracking-widest">Name</p>
            <p className="text-lg font-semibold text-text-primary">{userName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-text-subtle tracking-widest">Email</p>
            <p className="text-sm text-text-muted break-all">{email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-text-subtle tracking-widest flex items-center gap-1">
              <Github className="w-4 h-4" /> GitHub
            </p>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-accent-primary font-semibold flex items-center gap-1 hover:underline"
            >
              {githubHandle}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase text-text-subtle tracking-widest">Resume</p>
            <div className="flex flex-col gap-2">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-sm font-semibold text-text-primary hover:bg-white/20 transition-all"
              >
                <FileText className="w-4 h-4" />
                View Resume
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/upload')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-accent-primary/20 border border-accent-primary/40 text-sm font-semibold text-text-primary hover:bg-accent-primary/30 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Re-analyze Profile
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden group"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Gradient glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-700 pointer-events-none rounded-2xl sm:rounded-3xl" />

        <div className="text-center mb-6 relative z-10">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">Performance Hub</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Score Breakdown
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-6 items-center relative z-10">
          <div className="flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-semibold text-text-muted">Overall Showoff Score</p>
            <ScoreCircle score={showoffScore} size={180} strokeWidth={14} color="#4f46e5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 backdrop-blur-md border border-orange-500/20 flex flex-col items-center gap-2 hover:scale-105 transition-transform duration-300"
              style={{
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.1)'
              }}
            >
              <p className="text-sm font-semibold text-text-muted">Resume Score</p>
              <ScoreCircle score={resumeScore} size={120} strokeWidth={10} color="#f59e0b" />
              <p className="text-xs text-text-muted">{resumeScore.toFixed(2)} / 100</p>

              {/* Show Details Button */}
              <motion.button
                onClick={() => setShowResumeDetails(!showResumeDetails)}
                className="mt-2 flex items-center gap-1 text-xs text-accent-orange hover:text-accent-orange/80 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <span>{showResumeDetails ? 'Hide' : 'Show'} Details</span>
                <motion.div animate={{ rotate: showResumeDetails ? 180 : 0 }}>
                  <ChevronDown size={14} />
                </motion.div>
              </motion.button>

              {/* Details Content */}
              <AnimatePresence>
                {showResumeDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full mt-2 pt-2 border-t border-white/10 text-left space-y-3"
                  >
                    {profile?.resume_justification && (
                      <blockquote className="p-2 border-l-2 border-accent-orange bg-white/5">
                        <h4 className="text-xs font-semibold text-text-primary mb-1">The "Why":</h4>
                        <p className="text-xs text-text-muted italic">
                          " {profile.resume_justification} "
                        </p>
                      </blockquote>
                    )}
                    {profile?.resume_feedback && (
                      <div>
                        <h4 className="text-xs font-semibold text-text-primary mb-1">The "How to Fix":</h4>
                        <FeedbackRenderer feedback={profile.resume_feedback} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 backdrop-blur-md border border-emerald-500/20 flex flex-col items-center gap-2 hover:scale-105 transition-transform duration-300"
              style={{
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)'
              }}
            >
              <p className="text-sm font-semibold text-text-muted">GitHub Score</p>
              <ScoreCircle score={githubScore} size={120} strokeWidth={10} color="#10b981" />
              <p className="text-xs text-text-muted">{githubScore.toFixed(2)} / 100</p>

              {/* Show Details Button */}
              <motion.button
                onClick={() => setShowGithubDetails(!showGithubDetails)}
                className="mt-2 flex items-center gap-1 text-xs text-accent-green hover:text-accent-green/80 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <span>{showGithubDetails ? 'Hide' : 'Show'} Details</span>
                <motion.div animate={{ rotate: showGithubDetails ? 180 : 0 }}>
                  <ChevronDown size={14} />
                </motion.div>
              </motion.button>

              {/* Details Content */}
              <AnimatePresence>
                {showGithubDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full mt-2 pt-2 border-t border-white/10 text-left space-y-3"
                  >
                    {profile?.github_justification && (
                      <blockquote className="p-2 border-l-2 border-accent-green bg-white/5">
                        <h4 className="text-xs font-semibold text-text-primary mb-1">The "Why":</h4>
                        <p className="text-xs text-text-muted italic">
                          " {profile.github_justification} "
                        </p>
                      </blockquote>
                    )}
                    {profile?.github_feedback && (
                      <div>
                        <h4 className="text-xs font-semibold text-text-primary mb-1">The "How to Fix":</h4>
                        <FeedbackRenderer feedback={profile.github_feedback} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.div>
      <VerificationModal
        isOpen={isVerifying}
        onClose={handleCloseVerification}
        stage={verificationStage}
        email={collegeEmail}
        setEmail={setCollegeEmail}
        otp={otp}
        setOtp={setOtp}
        error={verificationError}
        onSendOtp={handleSendOtp}
        onVerifyOtp={handleVerifyOtp}
        isSendingOtp={isSendingOtp}
        isVerifyingOtp={isVerifyingOtp}
        pendingCollegeName={pendingCollegeName}
      />
    </div>
  )
}

const VerificationModal = ({
  isOpen,
  onClose,
  stage,
  email,
  setEmail,
  otp,
  setOtp,
  error,
  onSendOtp,
  onVerifyOtp,
  isSendingOtp,
  isVerifyingOtp,
  pendingCollegeName,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 text-left align-middle shadow-2xl transition-all space-y-4">
                <div>
                  <Dialog.Title className="text-2xl font-bold text-text-primary">
                    {stage === 'email' ? 'Verify Student Status' : 'Enter OTP'}
                  </Dialog.Title>
                  <p className="text-sm text-text-muted mt-1">
                    {stage === 'email'
                      ? 'Enter your official college email address (.ac.in / .edu).'
                      : `Sent to ${email}`}
                  </p>
                </div>

                {stage === 'email' ? (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-text-subtle uppercase tracking-widest">
                      College Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@iitb.ac.in"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                    <p className="text-xs text-text-subtle">
                      Use your official *.ac.in / *.edu address from the supported institutes list.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-text-subtle uppercase tracking-widest">
                      One Time Password
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-primary tracking-[0.4em] text-center"
                    />
                    <p className="text-xs text-text-subtle">
                      A verification code was sent to <span className="text-text-primary font-semibold">{email}</span> for {pendingCollegeName || 'your college'}.
                    </p>
                  </div>
                )}

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  {stage === 'email' ? (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onSendOtp}
                      disabled={isSendingOtp}
                      className={`flex-1 px-4 py-3 rounded-2xl text-sm font-semibold text-white transition-colors ${isSendingOtp ? 'bg-accent-primary/50 cursor-not-allowed' : 'bg-accent-primary hover:bg-accent-hover'}`}
                    >
                      {isSendingOtp ? 'Sending…' : 'Send OTP'}
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onVerifyOtp}
                      disabled={isVerifyingOtp}
                      className={`flex-1 px-4 py-3 rounded-2xl text-sm font-semibold text-white transition-colors ${isVerifyingOtp ? 'bg-accent-primary/50 cursor-not-allowed' : 'bg-accent-primary hover:bg-accent-hover'}`}
                    >
                      {isVerifyingOtp ? 'Verifying…' : 'Verify'}
                    </motion.button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default ProfilePage

