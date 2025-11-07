import { motion } from 'framer-motion'
import ConnectButton from './ConnectButton'

const ProfileHeader = ({ candidate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 sm:p-8 shadow-lg"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Profile Picture and Info */}
        <div className="flex items-center gap-4 sm:gap-6 flex-1">
          <img
            src={candidate.profilePicUrl}
            alt={candidate.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white/20"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              {candidate.name}
            </h1>
            <p className="text-sm sm:text-base text-text-muted">{candidate.bio}</p>
          </div>
        </div>

        {/* Connect Button */}
        <div className="w-full sm:w-auto">
          <ConnectButton candidateName={candidate.name} />
        </div>
      </div>
    </motion.div>
  )
}

export default ProfileHeader

