import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, MessageSquare, Send, CheckCircle, XCircle } from 'lucide-react'
import mixpanel from 'mixpanel-browser'

// Re-usable loading spinner
const LoadingSpinner = () => (
  <div className="min-h-screen bg-bg-primary flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent-primary"></div>
  </div>
)

// List item variant for staggered animation
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

// --- v4.9.13 "Hot Feedback" Modal ---
const FeedbackModal = ({ session, setShowModal }) => {
  const [feedbackText, setFeedbackText] = useState('')
  const [state, setState] = useState('idle') // 'idle', 'loading', 'success', 'error'
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (feedbackText.trim().length < 10) {
      setError('Feedback must be at least 10 characters.')
      return
    }
    setState('loading')
    setError('')

    const { data, error: dbError } = await supabase
      .from('user_feedback')
      .insert({
        feedback_text: feedbackText,
        user_id: session.user.id // "Bug-proof" RLS
      })

    if (dbError) {
      console.error('Error submitting feedback:', dbError)
      setError(`Error: ${dbError.message}`)
      setState('error')
    } else {
      setState('success')
      mixpanel.track('Feedback Submitted', { feedback_length: feedbackText.length })
      setTimeout(() => setShowModal(false), 2000) // Close after 2s
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => state !== 'loading' && setShowModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-md bg-bg-primary border border-white/10 rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()} // Prevent closing on modal click
      >
        {state === 'success' ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle className="h-12 w-12 text-accent-green mx-auto" />
            <h3 className="text-lg font-medium text-text-primary">Feedback Sent</h3>
            <p className="text-sm text-text-muted">Thanks for helping us build a "bug-proof" product. LFG.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-medium text-text-primary">Submit "Bug-Proof" Feedback</h3>
            <p className="text-sm text-text-muted">
              Found a "bug"? Have a "gap-less" idea? We're listening.
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g., The GitHub score seems 'buggy'..."
              className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-text-secondary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-focus focus:border-accent-focus"
              disabled={state === 'loading'}
            />
            {error && (
              <p className="text-sm text-red-400 flex items-center gap-2">
                <XCircle size={16} />
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <motion.button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={state === 'loading'}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted bg-white/10 hover:bg-white/20 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={state === 'loading'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-accent-primary hover:bg-accent-hover transition-all disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
              >
                {state === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white" />
                ) : (
                  <Send size={16} />
                )}
                Submit
              </motion.button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
// Skeleton Loader Component
const SkeletonRow = () => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="animate-pulse"
  >
    <td className="whitespace-nowrap py-4 pl-4 pr-3">
      <div className="h-6 w-12 bg-white/10 rounded-md"></div>
    </td>
    <td className="whitespace-nowrap px-3 py-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-white/10 rounded-full"></div>
        <div className="h-4 w-32 bg-white/10 rounded"></div>
      </div>
    </td>
    <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right">
      <div className="h-6 w-16 bg-white/10 rounded ml-auto"></div>
    </td>
  </motion.tr>
)

export default function LeaderboardPage() {
  const [session, setSession] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [view, setView] = useState('table') // 'table' or 'mentimeter'
  const [rankingType, setRankingType] = useState('global') // 'global' or 'college'
  const [currentPage, setCurrentPage] = useState(1);
  const profilesPerPage = 10;
  const navigate = useNavigate()

  // v4.9.13 "Hot Feedback" state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      console.log('[Leaderboard] Starting to fetch data...')

      // 1. Auth Protection
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) {
        console.log('[Leaderboard] No session, redirecting to home')
        navigate('/')
        return
      }
      setSession(currentSession)
      console.log('[Leaderboard] Session found:', currentSession.user.email)

      // Track page view
      mixpanel.track('Page View', {
        page_url: window.location.href,
        page_title: 'Leaderboard',
        user_id: currentSession.user.id,
      })

      // 2. Fetch all profiles, ordered by score
      console.log('[Leaderboard] Fetching profiles from Supabase...')
      const { data: boardData, error: boardError } = await supabase
        .from('profiles')
        .select('user_id, email, showoff_score, b2b_opt_in')
        .gt('showoff_score', 0) // Only get users with scores > 0
        .order('showoff_score', { ascending: false })

      if (boardError) {
        console.error('[Leaderboard] Error details:', {
          message: boardError.message,
          code: boardError.code,
          details: boardError.details,
          hint: boardError.hint,
          full: boardError
        })
        if (boardError.code === '42501') {
          alert('CRITICAL: Leaderboard RLS policy is wrong. Please check Supabase.')
        } else {
          alert(`Database Error: ${boardError.message}\n\nCheck console for details.`)
        }
        setIsLoadingData(false)
        return
      }

      console.log(`[Leaderboard] Fetched ${boardData?.length || 0} profiles`)

      // Manually add rank and map to display
      const rankedData = boardData.map((profile, index) => ({
        ...profile,
        rank: index + 1,
        displayName: profile.email.split('@')[0],
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${profile.email.split('@')[0]}`
      }))
      setLeaderboard(rankedData)

      // 3. Find the current user in the list
      const userProfile = rankedData.find(p => p.user_id === currentSession.user.id)
      console.log('[Leaderboard] Current user rank:', userProfile?.rank || 'Not found')
      setCurrentUserProfile(userProfile)

      setIsLoadingData(false)
      console.log('[Leaderboard] Data loaded successfully!')
    }

    fetchData()
  }, [navigate]) // Only navigate as dependency

  // Pagination logic
  const indexOfLastProfile = currentPage * profilesPerPage;
  const indexOfFirstProfile = indexOfLastProfile - profilesPerPage;
  const currentProfiles = leaderboard.slice(indexOfFirstProfile, indexOfLastProfile);
  const totalPages = Math.ceil(leaderboard.length / profilesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Smart pagination with ellipsis
  const getPageNumbers = () => {
    const delta = 2; // Pages to show around current page
    const pages = [];

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      pages.push(i);
    }

    // Always show last page if there are multiple pages
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    // Add ellipsis
    const pagesWithEllipsis = [];
    let prev = 0;
    pages.forEach(page => {
      if (page - prev > 1) {
        pagesWithEllipsis.push('...');
      }
      pagesWithEllipsis.push(page);
      prev = page;
    });

    return pagesWithEllipsis;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto space-y-6
                 rounded-2xl border border-white/10 
                 bg-white/5 backdrop-blur-lg shadow-2xl p-6"
    >
      {/* Your Rank Sticky Banner */}
      {!isLoadingData && currentUserProfile && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 -mx-6 -mt-6 mb-6 px-6 py-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl border-b border-white/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                #{currentUserProfile.rank}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-text-subtle">Your Rank</p>
                <p className="text-sm font-semibold text-text-primary">
                  {currentUserProfile.displayName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-subtle">Your Score</p>
              <p className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {currentUserProfile.showoff_score?.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 pb-4 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {rankingType === 'global' ? 'Compete with everyone' : 'Your college rankings'}
            </p>
          </div>

          {/* Global/College Toggle */}
          <div className="flex gap-2 bg-white/5 rounded-xl p-1 border border-white/10 w-fit">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRankingType('global')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${rankingType === 'global'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-text-muted hover:text-text-primary'
                }`}
            >
              🌍 Global
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRankingType('college')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${rankingType === 'college'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-text-muted hover:text-text-primary'
                }`}
            >
              🎓 College
            </motion.button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-2 bg-white/5 rounded-lg p-1 w-fit mx-auto border border-white/10">
        <button
          onClick={() => setView('table')}
          className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors
                      ${view === 'table' ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-white/10'}`}
        >
          <span className="hidden sm:inline">Table View</span>
          <span className="sm:hidden">Table</span>
        </button>
        <button
          onClick={() => setView('mentimeter')}
          className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors
                      ${view === 'mentimeter' ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-white/10'}`}
        >
          <span className="hidden sm:inline">Mentimeter View</span>
          <span className="sm:hidden">Cards</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'table' ? (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flow-root"
          >
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th scope="col" className="py-2 sm:py-3.5 pl-2 sm:pl-4 pr-2 sm:pr-3 text-left text-xs sm:text-sm font-semibold text-text-muted">
                      Rank
                    </th>
                    <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3.5 text-left text-xs sm:text-sm font-semibold text-text-muted">
                      User
                    </th>
                    <th scope="col" className="relative py-2 sm:py-3.5 pl-2 sm:pl-3 pr-2 sm:pr-4 text-right text-xs sm:text-sm font-semibold text-text-muted">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoadingData ? (
                    // Show skeleton loaders while loading
                    Array.from({ length: profilesPerPage }).map((_, index) => (
                      <SkeletonRow key={`skeleton-${index}`} />
                    ))
                  ) : currentProfiles.length === 0 ? (
                    // No data state
                    <tr>
                      <td colSpan="3" className="py-12 text-center text-text-muted">
                        No rankings available yet
                      </td>
                    </tr>
                  ) : (
                    // Actual data - Enhanced Premium Design
                    currentProfiles.map((profile) => {
                      const isCurrentUser = profile.user_id === session?.user?.id
                      return (
                        <motion.tr
                          key={profile.user_id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{
                            backgroundColor: 'rgba(99, 102, 241, 0.08)'
                          }}
                          transition={{ duration: 0.2 }}
                          className={`group cursor-pointer ${isCurrentUser
                            ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-pink-500/20 border-l-4 border-indigo-400'
                            : 'hover:shadow-lg hover:shadow-indigo-500/5'
                            }`}
                        >
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="inline-flex items-center justify-center"
                            >
                              <span className={`
                                ${isCurrentUser
                                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                                  : 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 text-slate-300 border border-white/10'
                                } 
                                px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-sm
                                transition-all duration-200
                              `}>
                                #{profile.rank}
                              </span>
                            </motion.div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex items-center gap-3">
                              <motion.img
                                whileHover={{ scale: 1.15, rotate: -5 }}
                                src={profile.avatarUrl}
                                alt="Avatar"
                                className="h-10 w-10 rounded-full border-2 border-white/10 shadow-lg"
                              />
                              <span className={`
                                font-medium truncate
                                ${isCurrentUser
                                  ? 'text-white font-semibold'
                                  : 'text-slate-200 group-hover:text-white'
                                }
                                transition-colors duration-200
                              `}>
                                {profile.displayName}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-indigo-300 font-normal">(You)</span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm">
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              className={`
                                text-xl font-black 
                                ${isCurrentUser
                                  ? 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent'
                                  : 'text-slate-100 group-hover:text-white'
                                }
                                transition-all duration-200
                              `}
                            >
                              {profile.showoff_score?.toFixed(2) ?? '0.00'}
                            </motion.span>
                          </td>
                        </motion.tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="mentimeter-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {isLoadingData ? (
              // Skeleton for cards
              Array.from({ length: profilesPerPage }).map((_, index) => (
                <div key={`skeleton-card-${index}`} className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-6 w-12 bg-white/10 rounded-xl"></div>
                      <div className="h-10 w-10 bg-white/10 rounded-full"></div>
                      <div className="h-4 w-32 bg-white/10 rounded"></div>
                    </div>
                    <div className="h-6 w-16 bg-white/10 rounded"></div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full"></div>
                </div>
              ))
            ) : currentProfiles.length === 0 ? (
              <div className="py-12 text-center text-text-muted">
                No rankings available yet
              </div>
            ) : (
              currentProfiles.map((profile) => {
                const isCurrentUser = profile.user_id === session?.user?.id
                return (
                  <motion.div
                    key={profile.user_id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{
                      scale: 1.02,
                      backgroundColor: 'rgba(99, 102, 241, 0.08)'
                    }}
                    transition={{ duration: 0.2 }}
                    className={`
                      group cursor-pointer p-4 rounded-2xl flex flex-col gap-3 
                      backdrop-blur-sm border-2 shadow-lg
                      ${isCurrentUser
                        ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-pink-500/20 border-indigo-400/50 shadow-indigo-500/20'
                        : 'bg-white/5 border-white/10 hover:border-indigo-500/30 hover:shadow-indigo-500/10'
                      }
                      transition-all duration-200
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="inline-flex items-center justify-center"
                        >
                          <span className={`
                            ${isCurrentUser
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                              : 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 text-slate-300 border border-white/10'
                            }
                            px-3 py-1.5 rounded-xl text-sm font-bold backdrop-blur-sm
                            transition-all duration-200
                          `}>
                            #{profile.rank}
                          </span>
                        </motion.div>
                        <motion.img
                          whileHover={{ scale: 1.15, rotate: -5 }}
                          src={profile.avatarUrl}
                          alt="Avatar"
                          className="h-10 w-10 rounded-full border-2 border-white/10 shadow-lg flex-shrink-0"
                        />
                        <span className={`
                          font-medium truncate
                          ${isCurrentUser
                            ? 'text-white font-semibold'
                            : 'text-slate-200 group-hover:text-white'
                          }
                          transition-colors duration-200
                        `}>
                          {profile.displayName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-indigo-300 font-normal">(You)</span>
                          )}
                        </span>
                      </div>
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className={`
                          text-xl font-black flex-shrink-0
                          ${isCurrentUser
                            ? 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent'
                            : 'text-slate-100 group-hover:text-white'
                          }
                          transition-all duration-200
                        `}
                      >
                        {profile.showoff_score?.toFixed(2) ?? '0.00'}
                      </motion.span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden border border-white/10">
                      <motion.div
                        className={`h-2 rounded-full ${isCurrentUser
                          ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/50'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md shadow-cyan-500/30'
                          }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${profile.showoff_score}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- v4.9.13 "Hot Feedback" Button --- */}
      <div className="text-center border-t border-white/10 pt-4 sm:pt-6">
        <motion.button
          onClick={() => {
            setShowFeedbackModal(true)
            mixpanel.track('View Feedback Modal')
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                    text-text-muted bg-white/5 border border-white/10
                    hover:text-text-primary hover:bg-white/10
                    transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageSquare size={16} />
          Got "bug-proof" feedback?
        </motion.button>
      </div>

      <AnimatePresence>
        {showFeedbackModal && (
          <FeedbackModal
            session={session}
            setShowModal={setShowFeedbackModal}
          />
        )}
      </AnimatePresence>
      {/* Smart Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="relative z-0 inline-flex rounded-xl shadow-sm gap-1" aria-label="Pagination">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 sm:px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-xs sm:text-sm font-medium text-text-muted hover:bg-white/10 hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">‹</span>
            </motion.button>

            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm text-text-subtle"
                  >
                    ...
                  </span>
                );
              }

              return (
                <motion.button
                  key={page}
                  whileHover={{ scale: currentPage !== page ? 1.05 : 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => paginate(page)}
                  className={`relative inline-flex items-center px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm font-semibold transition-all ${currentPage === page
                    ? 'z-10 bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10 hover:text-text-primary'
                    }`}
                >
                  {page}
                </motion.button>
              );
            })}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 sm:px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-xs sm:text-sm font-medium text-text-muted hover:bg-white/10 hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">›</span>
            </motion.button>
          </nav>
        </div>
      )}

    </motion.div>
  )
}
