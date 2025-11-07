import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, Check, Loader2 } from 'lucide-react'

const ConnectButton = ({ candidateName }) => {
  const [status, setStatus] = useState('idle') // 'idle', 'loading', 'requested'

  const handleClick = () => {
    if (status === 'idle') {
      setStatus('loading')
      // "Wizard of Oz" Logic: Simulate API call
      setTimeout(() => {
        setStatus('requested')
      }, 2000)
    }
  }

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting...</span>
          </>
        )
      case 'requested':
        return (
          <>
            <Check className="w-5 h-5" />
            <span>Connection Requested</span>
          </>
        )
      default:
        return (
          <>
            <UserPlus className="w-5 h-5" />
            <span>Connect with {candidateName}</span>
          </>
        )
    }
  }

  const getButtonStyles = () => {
    switch (status) {
      case 'loading':
        return 'bg-bg-tertiary text-text-muted cursor-not-allowed'
      case 'requested':
        return 'bg-green-500 hover:bg-green-600 text-white'
      default:
        return 'bg-accent-primary hover:bg-accent-hover text-white'
    }
  }

  return (
    <motion.button
      whileHover={status === 'idle' ? { scale: 1.05 } : {}}
      whileTap={status === 'idle' ? { scale: 0.95 } : {}}
      onClick={handleClick}
      disabled={status === 'loading' || status === 'requested'}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${getButtonStyles()}`}
    >
      {getButtonContent()}
    </motion.button>
  )
}

export default ConnectButton

