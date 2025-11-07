import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, MapPin, Hash, IndianRupee, StickyNote, X, ArrowLeft } from 'lucide-react'
import useJobStore from '../../stores/useJobStore'

const JobPostingPage = () => {
  const navigate = useNavigate()
  const { addJob } = useJobStore()

  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [formError, setFormError] = useState('')

  const addSkill = (value) => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (skills.some((skill) => skill.toLowerCase() === trimmed.toLowerCase())) return
    setSkills((prev) => [...prev, trimmed])
    setSkillInput('')
    setFormError('')
  }

  const handleSkillKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addSkill(skillInput)
    } else if (event.key === 'Backspace' && skillInput === '' && skills.length) {
      event.preventDefault()
      setSkills((prev) => prev.slice(0, -1))
    }
  }

  const removeSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((skill) => skill !== skillToRemove))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!skills.length) {
      setFormError('Please add at least one key skill.')
      return
    }

    // Generate a "Wizard of Oz" matches count (fake AI number)
    // In production, this would come from your backend
    const matchesFound = Math.floor(Math.random() * 20) + 5 // Random between 5-24

    const job = {
      id: `job-${Date.now()}`, // Generate a unique ID
      title: jobTitle.trim(),
      location: location.trim(),
      salaryRange: salaryRange.trim(),
      description: description.trim(),
      skills,
      status: 'Actively Matching',
      matchesFound,
      createdAt: new Date().toISOString(),
    }

    addJob(job)
    // After posting, redirect to discover page to see matches immediately
    navigate('/b2b/discover')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl p-6 sm:p-8 md:p-10"
      >
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

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-accent-primary/10 border border-accent-primary/30">
            <Briefcase className="w-6 h-6 text-accent-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Post a New Job</h1>
            <p className="text-sm sm:text-base text-text-muted mt-1">
              Tell us what you are hiring for and we will surface the strongest engineering talent instantly.
            </p>
          </div>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <label className="flex flex-col gap-2 text-left">
              <span className="text-sm font-semibold text-text-muted flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-accent-primary" /> Job Title
              </span>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                placeholder="Senior Backend Engineer"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-text-primary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </label>

            <label className="flex flex-col gap-2 text-left">
              <span className="text-sm font-semibold text-text-muted flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent-primary" /> Location
              </span>
              <input
                type="text"
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Remote • Mumbai • Hybrid"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-text-primary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </label>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <label className="flex flex-col gap-2 text-left">
              <span className="text-sm font-semibold text-text-muted flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-accent-primary" /> Salary Range (CTC)
              </span>
              <input
                type="text"
                required
                value={salaryRange}
                onChange={(event) => setSalaryRange(event.target.value)}
                placeholder="15 - 20 LPA"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-text-primary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </label>

            <label className="flex flex-col gap-2 text-left">
              <span className="text-sm font-semibold text-text-muted flex items-center gap-2">
                <Hash className="w-4 h-4 text-accent-primary" /> Key Skills / Requirements
              </span>
              <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((skill) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/10 border border-white/10 text-sm text-text-primary"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-text-subtle hover:text-text-muted"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.span>
                  ))}
                </div>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Type a skill and press Enter (e.g., React, Node.js)"
                  className="w-full bg-transparent text-sm text-text-primary placeholder-text-subtle focus:outline-none"
                />
              </div>
            </label>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-col gap-2 text-left"
          >
            <span className="text-sm font-semibold text-text-muted flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-accent-primary" /> Job Description
            </span>
            <textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the role, team, expectations, tech stack, and what success looks like."
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-text-primary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            />
          </motion.div>

          {formError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400"
            >
              {formError}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg bg-accent-primary hover:bg-accent-hover text-white font-semibold shadow-lg transition-all"
          >
            Find Talent
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default JobPostingPage

