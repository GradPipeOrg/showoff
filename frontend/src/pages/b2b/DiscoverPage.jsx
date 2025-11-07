import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import FilterBar from '../../components/b2b/FilterBar'
import CandidateCard from '../../components/b2b/CandidateCard'
import { mockTalentPool } from '../../data/mockTalentPool'

const DiscoverPage = () => {
  const [filters, setFilters] = useState({
    searchQuery: '',
    minShowoffScore: '',
    minGithubScore: '',
    minResumeScore: ''
  })

  // Filter candidates based on search and score filters
  const filteredCandidates = useMemo(() => {
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

      // Only show candidates who opted into B2B
      if (!candidate.b2b_opt_in) return false

      return true
    })
  }, [filters])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8"
    >
      {/* Main Frosted Glass Card */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-8 h-8 text-accent-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Talent Discovery</h1>
        </div>

        {/* Filter Bar */}
        <div className="mb-8">
          <FilterBar onFilterChange={setFilters} />
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm sm:text-base text-text-muted">
            Found <span className="font-semibold text-text-primary">{filteredCandidates.length}</span> candidates
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

