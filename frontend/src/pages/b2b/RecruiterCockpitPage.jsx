import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, Plus } from 'lucide-react'
import JobPostingCard from '../../components/b2b/JobPostingCard'
import useJobStore from '../../stores/useJobStore'

const RecruiterCockpitPage = () => {
  const navigate = useNavigate()
  const { postedJobs } = useJobStore()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8"
    >
      {/* Main Frosted Glass Card */}
      <div className="rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl p-6 sm:p-8 md:p-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
              Welcome Back, Recruiter
            </h1>
          </div>
          
          {/* Primary CTA - Post New Job Button */}
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(79, 70, 229, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/b2b/post-job')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl 
                     bg-accent-primary hover:bg-accent-hover text-white font-semibold 
                     shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Post a New Job</span>
          </motion.button>
        </div>

        {/* My Job Postings Section */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-6 h-6 text-accent-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              My Active Pipelines
            </h2>
          </div>

          {/* Job Postings Grid */}
          {postedJobs.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {postedJobs.map((job) => (
                <JobPostingCard key={job.id} job={job} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 rounded-xl bg-white/5 border border-white/10"
            >
              <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-lg text-text-muted mb-2">No job postings yet</p>
              <p className="text-sm text-text-subtle mb-6">
                Post your first job to start finding top talent
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/b2b/post-job')}
                className="px-6 py-3 rounded-lg bg-accent-primary hover:bg-accent-hover 
                         text-white font-medium transition-all"
              >
                Post Your First Job
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default RecruiterCockpitPage

