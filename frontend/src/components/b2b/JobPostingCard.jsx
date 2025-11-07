import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, TrendingUp, Eye, Trash2 } from 'lucide-react'
import useJobStore from '../../stores/useJobStore'
import ConfirmDeleteModal from './ConfirmDeleteModal'

const JobPostingCard = ({ job }) => {
  const navigate = useNavigate()
  const { setActiveJob, deleteJob } = useJobStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleViewMatches = () => {
    setActiveJob(job)
    navigate('/b2b/discover')
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation() // Prevent any parent click handlers
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    deleteJob(job.id)
    setShowDeleteModal(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 shadow-lg hover:shadow-xl transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-text-primary mb-2">{job.title}</h3>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent-green/20 text-accent-green border border-accent-green/30">
            {job.status}
          </span>
          {/* Delete Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDeleteClick}
            className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 
                     border border-transparent hover:border-red-500/30 transition-all"
            aria-label="Delete job posting"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* The "Wizard of Oz" Magic - Matches Found */}
      <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-violet/20 border border-accent-violet/30">
            <TrendingUp className="w-5 h-5 text-accent-violet" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-accent-violet">{job.matchesFound}</span>
              <span className="text-sm text-text-muted">matches</span>
            </div>
            <p className="text-xs text-text-subtle mt-1">Top-Tier Matches Found</p>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {job.skills.slice(0, 4).map((skill, index) => (
            <span
              key={index}
              className="px-2.5 py-1 rounded-md bg-white/10 text-xs text-text-muted border border-white/10"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs text-text-muted border border-white/10">
              +{job.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleViewMatches}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg 
                 bg-accent-primary hover:bg-accent-hover text-white font-medium 
                 transition-all shadow-sm"
      >
        <Eye className="w-4 h-4" />
        <span>View Matches</span>
      </motion.button>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        jobTitle={job.title}
      />
    </motion.div>
  )
}

export default JobPostingCard

