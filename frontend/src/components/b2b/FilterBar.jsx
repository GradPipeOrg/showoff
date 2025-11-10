import { useState } from 'react'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'

const FilterBar = ({ onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [minShowoffScore, setMinShowoffScore] = useState('')
  const [minGithubScore, setMinGithubScore] = useState('')
  const [minResumeScore, setMinResumeScore] = useState('')

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    onFilterChange({
      searchQuery: value,
      minShowoffScore,
      minGithubScore,
      minResumeScore
    })
  }

  const handleScoreChange = (type, value) => {
    const numValue = value === '' ? '' : parseInt(value) || 0
    switch (type) {
      case 'showoff':
        setMinShowoffScore(numValue)
        onFilterChange({
          searchQuery,
          minShowoffScore: numValue,
          minGithubScore,
          minResumeScore
        })
        break
      case 'github':
        setMinGithubScore(numValue)
        onFilterChange({
          searchQuery,
          minShowoffScore,
          minGithubScore: numValue,
          minResumeScore
        })
        break
      case 'resume':
        setMinResumeScore(numValue)
        onFilterChange({
          searchQuery,
          minShowoffScore,
          minGithubScore,
          minResumeScore: numValue
        })
        break
      default:
        break
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full p-4 sm:p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg"
    >
      <div className="space-y-4">
        {/* Smart Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, skills, or keywords..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 
                     text-text-primary placeholder-text-subtle focus:outline-none 
                     focus:ring-2 focus:ring-accent-primary focus:border-transparent"
          />
        </div>

        {/* Showoff Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Min Showoff Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={minShowoffScore}
              onChange={(e) => handleScoreChange('showoff', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 
                       text-text-primary placeholder-text-subtle focus:outline-none 
                       focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Min GitHub Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={minGithubScore}
              onChange={(e) => handleScoreChange('github', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 
                       text-text-primary placeholder-text-subtle focus:outline-none 
                       focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Min Resume Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={minResumeScore}
              onChange={(e) => handleScoreChange('resume', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 
                       text-text-primary placeholder-text-subtle focus:outline-none 
                       focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default FilterBar

