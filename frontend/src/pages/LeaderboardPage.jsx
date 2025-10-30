import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trophy } from 'lucide-react'

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

export default function LeaderboardPage() {
  const [session, setSession] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('table') // 'table' or 'mentimeter'
  const [currentPage, setCurrentPage] = useState(1);
  const profilesPerPage = 10; // For pagination
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

      // 2. Fetch all profiles, ordered by score
      // We must fix the RLS SELECT policy first for this to work
      const { data: boardData, error: boardError } = await supabase
        .from('profiles')
        .select('user_id, email, showoff_score, b2b_opt_in') 
        .not('showoff_score', 'is', null) // Only select users with a score
        .order('showoff_score', { ascending: false })
        .limit(100) // Limit to top 100 for now

      if (boardError) {
        console.error('Error fetching leaderboard:', boardError)
        if (boardError.code === '42501') {
           alert('CRITICAL: Leaderboard RLS policy is wrong. Please check Supabase.')
        }
        setLoading(false)
        return
      }
      
      // Manually add rank and map to display
      const rankedData = boardData.map((profile, index) => ({
        ...profile,
        rank: index + 1,
        displayName: profile.email.split('@')[0], // Extract username from email
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${profile.email.split('@')[0]}` // DiceBear avatar
      }))
      setLeaderboard(rankedData)

      // 3. Find the current user in the list
      const userProfile = rankedData.find(p => p.user_id === session.user.id)
      setCurrentUserProfile(userProfile)
      
      setLoading(false)
    }

    fetchData()
  }, [navigate])
  
  // Pagination logic
  const indexOfLastProfile = currentPage * profilesPerPage;
  const indexOfFirstProfile = indexOfLastProfile - profilesPerPage;
  const currentProfiles = leaderboard.slice(indexOfFirstProfile, indexOfLastProfile);
  const totalPages = Math.ceil(leaderboard.length / profilesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto p-6 sm:p-8 space-y-8
                 rounded-2xl border border-white/10 
                 bg-white/5 backdrop-blur-lg shadow-2xl"
    >
      {/* --- Header --- */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Global Leaderboard</h1>
        <motion.button
          onClick={() => navigate('/dashboard')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-3 py-2 
                     rounded-lg text-sm font-medium 
                     text-text-muted bg-white/5 border border-white/10
                     hover:text-text-primary hover:bg-white/10
                     transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </motion.button>
      </div>

      {/* --- View Toggle --- */}
      <div className="flex space-x-2 bg-white/5 rounded-lg p-1 w-fit mx-auto">
        <button
          onClick={() => setView('table')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                      ${view === 'table' ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-white/10'}`}
        >
          Table View
        </button>
        <button
          onClick={() => setView('mentimeter')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                      ${view === 'mentimeter' ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-white/10'}`}
        >
          Mentimeter View
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
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-text-muted">
                      Rank
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-text-muted">
                      User
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-text-muted">
                      Show-off Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentProfiles.map((profile) => {
                    const isCurrentUser = profile.user_id === session.user.id
                    return (
                      <motion.tr
                        key={profile.user_id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        className={`${isCurrentUser ? 'bg-accent-primary/20 hover:bg-accent-primary/30' : 'hover:bg-white/5'} transition-colors`}
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-text-primary">
                          <span className={`${isCurrentUser ? 'bg-accent-focus text-white' : 'bg-white/10 text-text-muted'} 
                                            px-2 py-1 rounded-md text-xs font-semibold`}>
                            #{profile.rank}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-text-primary">
                          <div className="flex items-center gap-3">
                            <img src={profile.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full" />
                            <span>{profile.displayName} {isCurrentUser && '(You)'}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          <span className="text-xl font-bold text-text-primary">
                            {profile.showoff_score}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
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
            {currentProfiles.map((profile) => {
              const isCurrentUser = profile.user_id === session.user.id
              return (
                <motion.div
                  key={profile.user_id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`p-4 rounded-lg flex flex-col gap-2 
                              ${isCurrentUser ? 'bg-accent-primary/20 border border-accent-focus' : 'bg-white/5 border border-white/10'} 
                              transition-colors`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-text-subtle w-8 text-center">
                        #{profile.rank}
                      </span>
                      <img src={profile.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full" />
                      <span className="text-sm font-medium text-text-primary">
                        {profile.displayName} {isCurrentUser && '(You)'}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-text-primary">
                      {profile.showoff_score}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      className="bg-accent-primary h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${profile.showoff_score}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* --- Pagination --- */}
      <div className="flex justify-center mt-6">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-white/5 text-sm font-medium text-text-muted hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => paginate(i + 1)}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium 
                          ${currentPage === i + 1 ? 'z-10 bg-accent-primary border-accent-primary text-white' : 'bg-white/5 border-gray-600 text-text-muted hover:bg-white/10'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-white/5 text-sm font-medium text-text-muted hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      </div>

    </motion.div>
  )
}
