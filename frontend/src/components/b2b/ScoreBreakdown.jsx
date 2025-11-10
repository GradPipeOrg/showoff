import { motion } from 'framer-motion'
import ScoreCircle from '../ScoreCircle'

const ScoreBreakdown = ({ candidate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 sm:p-8 shadow-lg"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">
        Score Breakdown
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
        {/* Showoff Score */}
        <div className="flex flex-col items-center space-y-3">
          <ScoreCircle
            score={candidate.showoffScore}
            title="Showoff Score"
            size={120}
            strokeWidth={12}
            color="#4f46e5" // accent-primary
          />
          <h3 className="text-lg font-semibold text-text-primary">Showoff Score</h3>
          <p className="text-sm text-text-muted">{candidate.showoffScore} / 100</p>
        </div>

        {/* GitHub Score */}
        <div className="flex flex-col items-center space-y-3">
          <ScoreCircle
            score={candidate.githubScore}
            title="GitHub Score"
            size={120}
            strokeWidth={12}
            color="#10b981" // accent-green
          />
          <h3 className="text-lg font-semibold text-text-primary">GitHub Score</h3>
          <p className="text-sm text-text-muted">{candidate.githubScore} / 100</p>
        </div>

        {/* Resume Score */}
        <div className="flex flex-col items-center space-y-3">
          <ScoreCircle
            score={candidate.resumeScore}
            title="Resume Score"
            size={120}
            strokeWidth={12}
            color="#f59e0b" // accent-orange
          />
          <h3 className="text-lg font-semibold text-text-primary">Resume Score</h3>
          <p className="text-sm text-text-muted">{candidate.resumeScore} / 100</p>
        </div>
      </div>
    </motion.div>
  )
}

export default ScoreBreakdown

