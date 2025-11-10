import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, jobTitle }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl p-6 sm:p-8 pointer-events-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Delete Job Posting?
                </h2>
                <p className="text-sm text-text-muted mb-4">
                  Are you sure you want to delete this job posting? This action cannot be undone.
                </p>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm font-semibold text-text-primary">{jobTitle}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                           text-text-primary hover:bg-white/10 font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  className="flex-1 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 
                           text-white font-medium transition-colors"
                >
                  Delete Job
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ConfirmDeleteModal

