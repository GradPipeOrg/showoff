import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award } from 'lucide-react'

const CandidateCard = ({ candidate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 
                 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
    >
      <Link to={`/b2b/profile/${candidate.id}`} className="block">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={candidate.profilePicUrl}
            alt={candidate.name}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white/20"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-text-primary truncate">
              {candidate.name}
            </h3>
            <p className="text-sm text-text-muted truncate">{candidate.bio}</p>
          </div>
        </div>

        {/* Showoff Score - Prominently Displayed */}
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-accent-violet" />
          <span className="text-3xl sm:text-4xl font-bold text-accent-violet">
            {candidate.showoffScore}
          </span>
          <span className="text-sm text-text-muted">/ 100</span>
        </div>

        {/* Top Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {candidate.topSkills.slice(0, 4).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-md bg-white/10 text-xs sm:text-sm text-text-muted 
                       border border-white/10"
            >
              {skill}
            </span>
          ))}
          {candidate.topSkills.length > 4 && (
            <span className="px-2 py-1 rounded-md bg-white/10 text-xs sm:text-sm text-text-muted border border-white/10">
              +{candidate.topSkills.length - 4}
            </span>
          )}
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
          <div className="text-center">
            <p className="text-xs text-text-subtle">Resume</p>
            <p className="text-sm font-semibold text-text-primary">{candidate.resumeScore}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-subtle">GitHub</p>
            <p className="text-sm font-semibold text-text-primary">{candidate.githubScore}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-subtle">Overall</p>
            <p className="text-sm font-semibold text-accent-primary">{candidate.showoffScore}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default CandidateCard

