import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Check } from 'lucide-react'
import mixpanel from 'mixpanel-browser'

export default function B2BWaitlistPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    work_email: '',
    your_role: '',
    company_size: '1-10',
    hiring_for_role: '',
    ideal_candidate_desc: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // This is the "YC-hack" - a direct, public insert
      const { data, error } = await supabase
        .from('b2b_waitlist')
        .insert([formData])

      if (error) {
        // This will fail if RLS policy is wrong
        throw error
      }

      // Success - Track Conversion event
      mixpanel.track('Conversion', {
        'Conversion Type': 'B2B Waitlist Signup',
        'Conversion Value': 0,
      })
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting B2B form:', error)
      // Track error event
      mixpanel.track('Error', {
        error_type: 'form_submission',
        error_message: error.message,
        page_url: window.location.href,
      })
      setError(`Failed to submit: ${error.message}. Please try again.`)
      setLoading(false)
    }
  }

  return (
    <>
      <header className="absolute top-0 left-0 right-0 p-3 sm:p-4 md:p-6 flex justify-between items-center z-10">
        <h1 className="text-lg sm:text-xl font-bold text-text-primary">GradPipe Showoff</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 
                     rounded-lg text-xs sm:text-sm font-medium 
                     text-text-muted bg-white/5 border border-white/10
                     hover:text-text-primary hover:bg-white/10
                     transition-colors"
        >
          <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
          Back to Home
        </motion.button>
      </header>
    
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        className="w-full max-w-xs sm:max-w-md md:max-w-2xl mx-auto p-4 sm:p-6 md:p-8 text-center
                   rounded-2xl border border-white/10 
                   bg-white/5 backdrop-blur-lg shadow-2xl mt-24 sm:mt-0"
      >
        {submitted ? (
          <div className="space-y-4 sm:space-y-6 py-8">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Check className="h-16 w-16 text-accent-green mx-auto" />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
              Your 90% problem has been solved.
            </h2>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              Thanks, {formData.full_name}. We'll be in touch at {formData.work_email} shortly to start the agentic matching process.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-5 py-2 
                       rounded-lg text-xs sm:text-sm font-medium 
                       text-text-muted bg-white/5 border border-white/10
                       hover:text-text-primary hover:bg-white/10
                       transition-colors"
            >
              <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
              Back to Home
            </motion.button>
          </div>
        ) : (
          <form className="space-y-4 sm:space-y-6 text-left" onSubmit={handleSubmit}>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary text-center">GradPipe: Input Your Impossible Role.</h2>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed text-center pb-2">
              Get high-touch access to our pool of elite talent. Our AI Agent will match you with the top 1% of candidates.
            </p>
          
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full_name" className="block text-xs sm:text-sm font-medium text-text-muted mb-2">Full Name</label>
                <input type="text" name="full_name" id="full_name" required value={formData.full_name} onChange={handleChange}
                  className="w-full px-3 sm:pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-sm sm:text-base text-text-secondary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-focus focus:border-accent-focus" />
              </div>
              <div>
                <label htmlFor="work_email" className="block text-xs sm:text-sm font-medium text-text-muted mb-2">Work Email</label>
                <input type="email" name="work_email" id="work_email" required value={formData.work_email} onChange={handleChange}
                  className="w-full px-3 sm:pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-sm sm:text-base text-text-secondary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-focus focus:border-accent-focus" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_name" className="block text-xs sm:text-sm font-medium text-text-muted mb-2">Company Name</label>
                <input type="text" name="company_name" id="company_name" required value={formData.company_name} onChange={handleChange}
                  className="w-full px-3 sm:pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-sm sm:text-base text-text-secondary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-focus focus:border-accent-focus" />
              </div>
              <div>
                <label htmlFor="your_role" className="block text-xs sm:text-sm font-medium text-text-muted mb-2">Your Role (e.g., Founder, CTO)</label>
                <input type="text" name="your_role" id="your_role" required value={formData.your_role} onChange={handleChange}
                  className="w-full px-3 sm:pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-sm sm:text-base text-text-secondary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-focus focus:border-accent-focus" />
              </div>
            </div>

            <div>
              <label htmlFor="company_size" className="block text-xs sm:text-sm font-medium text-text-muted mb-2">Company Size</label>
              <select 
                name="company_size" 
                id="company_size" 
                required 
                value={formData.company_size} 
                onChange={handleChange}
                className="w-full px-3 sm:pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-sm sm:text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-focus focus:border-accent-focus"
                style={{ color: '#ffffff' }}
              >
                <option value="1-10" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>1-10</option>
                <option value="11-50" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>11-50</option>
                <option value="50-200" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>50-200</option>
                <option value="200+" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>200+</option>
              </select>
            </div>

            <div>
              <label htmlFor="hiring_for_role" className="block text-xs sm:text-sm font-medium text-text-muted mb-2">What role are you hiring for?</label>
              <input type="text" name="hiring_for_role" id="hiring_for_role" required value={formData.hiring_for_role} onChange={handleChange} placeholder="e.g., Founding ML Engineer, Systems Engineer"
                className="w-full px-3 sm:pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-sm sm:text-base text-text-secondary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-focus focus:border-accent-focus" />
            </div>

            <div>
              <label htmlFor="ideal_candidate_desc" className="block text-xs sm:text-sm font-medium text-text-muted mb-2">Describe your ideal candidate (optional)</label>
              <textarea name="ideal_candidate_desc" id="ideal_candidate_desc" value={formData.ideal_candidate_desc} onChange={handleChange} rows="3"
                placeholder="e.g., A 90+ score systems-level C++ dev who loves compilers..."
                className="w-full px-3 sm:pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-sm sm:text-base text-text-secondary placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-focus focus:border-accent-focus"></textarea>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 px-4 rounded-lg shadow-sm text-base sm:text-lg font-medium 
                     text-white bg-accent-violet hover:bg-[#6d28d9]
                     focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-offset-bg-primary focus:ring-accent-violet
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all"
            >
              <span className="flex items-center justify-center gap-2 sm:gap-3">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white" />
                ) : (
                  <Send size={18} className="sm:w-5 sm:h-5" />
                )}
                {loading ? 'Submitting...' : 'Join Waitlist'}
              </span>
            </motion.button>
          </form>
        )}
      </motion.div>
    </>
  )
}

