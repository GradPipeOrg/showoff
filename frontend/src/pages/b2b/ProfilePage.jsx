import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { mockTalentPool } from '../../data/mockTalentPool'
import ProfileHeader from '../../components/b2b/ProfileHeader'
import ScoreBreakdown from '../../components/b2b/ScoreBreakdown'
import ProofOfWork from '../../components/b2b/ProofOfWork'
import AIParsedResume from '../../components/b2b/AIParsedResume'

const ProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // Find candidate in mock data
  const candidate = mockTalentPool.find((c) => c.id === id)

  if (!candidate) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 p-8 text-center"
        >
          <p className="text-lg text-text-muted">Candidate not found</p>
          <button
            onClick={() => navigate('/b2b/discover')}
            className="mt-4 px-6 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white transition-colors"
          >
            Back to Discovery
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8"
    >
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/b2b/discover')}
        className="flex items-center gap-2 mb-6 px-4 py-2 rounded-lg bg-white/5 border border-white/10 
                 text-text-primary hover:bg-white/10 transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Discovery</span>
      </motion.button>

      {/* Multi-Section Layout */}
      <div className="space-y-6">
        {/* Profile Header */}
        <ProfileHeader candidate={candidate} />

        {/* Score Breakdown */}
        <ScoreBreakdown candidate={candidate} />

        {/* Two Column Layout for Proof of Work and Resume */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proof of Work */}
          <ProofOfWork candidate={candidate} />

          {/* AI-Parsed Resume */}
          <AIParsedResume candidate={candidate} />
        </div>
      </div>
    </motion.div>
  )
}

export default ProfilePage

