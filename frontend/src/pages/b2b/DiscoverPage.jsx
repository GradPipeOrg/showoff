import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FilterBar from '../../components/b2b/FilterBar'
import CandidateCard from '../../components/b2b/CandidateCard'
import { mockTalentPool } from '../../data/mockTalentPool'
import useJobStore from '../../stores/useJobStore'

const DiscoverPage = () => {
  const navigate = useNavigate()
  const { activeJob } = useJobStore()
  const [filters, setFilters] = useState({
    searchQuery: '',
    minShowoffScore: '',
    minGithubScore: '',
    minResumeScore: ''
  })

  useEffect(() => {
    // Redirect to cockpit if no active job (including when a job is deleted)
    if (!activeJob) {
      navigate('/b2b', { replace: true })
    }
  }, [activeJob, navigate])

  // Filter candidates based on search and score filters
  const filteredCandidates = useMemo(() => {
    if (!activeJob) return []

    return mockTalentPool.filter((candidate) => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesSearch =
          candidate.name.toLowerCase().includes(query) ||
          candidate.bio.toLowerCase().includes(query) ||
          candidate.topSkills.some((skill) => skill.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Score filters
      if (filters.minShowoffScore && candidate.showoffScore < parseInt(filters.minShowoffScore)) {
        return false
      }
      if (filters.minGithubScore && candidate.githubScore < parseInt(filters.minGithubScore)) {
        return false
      }
      if (filters.minResumeScore && candidate.resumeScore < parseInt(filters.minResumeScore)) {
        return false
      }

      // Active job skill matching - ensure overlap with requested skills
      if (activeJob?.skills?.length) {
        const requestedSkills = activeJob.skills.map((skill) => skill.toLowerCase())
        const hasOverlap = candidate.topSkills.some((skill) => requestedSkills.includes(skill.toLowerCase()))
        if (!hasOverlap) return false
      }

      // Only show candidates who opted into B2B
      if (!candidate.b2b_opt_in) return false

      return true
    })
  }, [filters, activeJob])

  if (!activeJob) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8"
    >
      {/* Main Frosted Glass Card */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl p-6 sm:p-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/b2b')}
          className="flex items-center gap-2 mb-6 px-4 py-2 rounded-lg bg-white/5 border border-white/10 
                   text-text-primary hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Cockpit</span>
        </motion.button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-8 h-8 text-accent-primary" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Best Matches</h1>
            <p className="text-sm text-text-muted mt-1">
              We analysed your role and surfaced high-signal engineers ready to speak.
            </p>
          </div>
        </div>

        {/* Active Job Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 rounded-xl bg-white/5 border border-white/10 p-5 sm:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-subtle">Active Search</p>
              <h2 className="text-2xl font-semibold text-text-primary mt-1">{activeJob.title}</h2>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-text-muted">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  Location: <span className="text-text-primary font-medium">{activeJob.location}</span>
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  Salary: <span className="text-text-primary font-medium">{activeJob.salaryRange}</span>
                </span>
              </div>
            </div>
            <div className="md:text-right">
              <p className="text-xs uppercase tracking-wide text-text-subtle">Key Skills</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {activeJob.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md bg-white/10 border border-white/10 text-xs sm:text-sm text-text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-text-muted mt-4">
            {activeJob.description}
          </p>
        </motion.div>

        {/* Filter Bar */}
        <div className="mb-8">
          <FilterBar onFilterChange={setFilters} />
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm sm:text-base text-text-muted">
            Showing <span className="font-semibold text-text-primary">{filteredCandidates.length}</span> engineers who match your brief
          </p>
        </div>

        {/* Candidate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCandidates.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <CandidateCard candidate={candidate} />
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCandidates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-lg text-text-muted">No candidates found matching your criteria.</p>
            <p className="text-sm text-text-subtle mt-2">Try adjusting your filters.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default DiscoverPage

