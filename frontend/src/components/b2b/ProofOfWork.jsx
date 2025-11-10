import { motion } from 'framer-motion'
import { Github, Code, ExternalLink } from 'lucide-react'

const ProofOfWork = ({ candidate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 sm:p-8 shadow-lg"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">
        Verifiable Links
      </h2>
      
      <div className="space-y-4">
        {/* GitHub Link */}
        {candidate.links.github && (
          <motion.a
            href={candidate.links.github}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 
                     hover:bg-white/10 transition-all group"
          >
            <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20">
              <Github className="w-6 h-6 text-text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-muted">GitHub</p>
              <p className="text-sm text-text-primary truncate">{candidate.links.github}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-text-subtle group-hover:text-text-primary" />
          </motion.a>
        )}

        {/* LeetCode Link */}
        {candidate.links.leetcode && (
          <motion.a
            href={candidate.links.leetcode}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 
                     hover:bg-white/10 transition-all group"
          >
            <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20">
              <Code className="w-6 h-6 text-text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-muted">LeetCode</p>
              <p className="text-sm text-text-primary truncate">{candidate.links.leetcode}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-text-subtle group-hover:text-text-primary" />
          </motion.a>
        )}

        {/* Fallback if no links */}
        {!candidate.links.github && !candidate.links.leetcode && (
          <p className="text-sm text-text-muted italic">No verifiable links available</p>
        )}
      </div>
    </motion.div>
  )
}

export default ProofOfWork

