import { motion } from 'framer-motion'
import { Briefcase, Inbox } from 'lucide-react'

const MatchesPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl shadow-2xl p-10"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white">Matches</h2>
              <p className="text-sm text-slate-400">Recruiter interest in your profile</p>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Inbox className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No matches yet</h3>
            <p className="text-slate-500 max-w-md">
              When recruiters view your profile, they'll appear here. Keep your profile updated!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default MatchesPage
