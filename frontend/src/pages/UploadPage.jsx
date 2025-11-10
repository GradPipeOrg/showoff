import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { UploadCloud, Github } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import mixpanel from 'mixpanel-browser'

// Re-usable loading spinner
const LoadingSpinner = () => (
  <div className="min-h-screen bg-bg-primary flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent-primary"></div>
  </div>
)

export default function UploadPage() {
  const [loading, setLoading] = useState(false)
  const [resumeFile, setResumeFile] = useState(null)
  const [githubUsername, setGithubUsername] = useState('')
  const [session, setSession] = useState(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const navigate = useNavigate()

  // NEW: Auth protection logic
  useEffect(() => {
    // Track page view
    mixpanel.track('Page View', {
      page_url: window.location.href,
      page_title: 'Upload',
      user_id: session?.user?.id,
    })

    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/') // Redirect to landing if not logged in
      } else {
        setSession(session)
        setIsPageLoading(false)
      }
    }
    fetchSession()
  }, [navigate])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.')
        return
      }
      setResumeFile(file)
    }
  }

  const handleRankProfile = async (e) => {
    e.preventDefault()
    if (!resumeFile) {
      alert('Please upload your resume PDF.')
      return
    }
    if (!githubUsername) {
      alert('Please enter your GitHub username.')
      return
    }
    if (!session) {
      alert('Error: No active session. Please log in again.')
      return
    }

    setLoading(true)
    
    try {
      // 1. Create FormData to send file + text + user_id
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('github_username', githubUsername)
      formData.append('user_id', session.user.id) // <-- CRITICAL: Send user_id

      // 1.5. SET THE "IN-PROGRESS" FLAG & TIMESTAMP
      localStorage.setItem('analysis_in_progress', 'true')
      localStorage.setItem('analysis_start_time', Date.now().toString())

      // 2. Call our new "Job Submitter" API
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      
      // Debug logging (remove in production if desired)
      console.log('[UploadPage] API Base URL:', apiBaseUrl)
      console.log('[UploadPage] Full endpoint:', `${apiBaseUrl}/rank_profile`)
      console.log('[UploadPage] Env var present:', !!import.meta.env.VITE_API_BASE_URL)
      
      // Validate API URL in production (not localhost)
      if (window.location.hostname !== 'localhost' && apiBaseUrl.includes('localhost')) {
        console.error('[UploadPage] ERROR: VITE_API_BASE_URL not set! Using localhost fallback in production.')
        alert('Configuration Error: API URL not configured. Please contact support.')
        setLoading(false)
        return
      }
      
      const response = await axios.post(`${apiBaseUrl}/rank_profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      // 3. We no longer get scores. We expect a "processing" status.
      if (response.data.status === "processing") {
        // Success! Redirect to the Dashboard.
        // The dashboard will show the "processing" state (in Phase 3).
        navigate('/dashboard')
      } else {
        // This should not happen if the backend is correct
        throw new Error("Invalid response from server. Expected 'processing' status.")
      }

    } catch (error) {
      console.error('CRITICAL: Error in handleRankProfile:', error)
      let alertMessage = 'An unknown error occurred. Please try again.'
      if (error.response) {
        // The request was made and the server responded with an error
        alertMessage = `Error: ${error.response.data.detail}`
      } else if (error.request) {
        // The request was made but no response was received
        alertMessage = 'Error: Cannot connect to the server. Is it running?'
      } else {
        // Something else happened
        alertMessage = `Error: ${error.message}`
      }
      alert(alertMessage)
    } finally {
      setLoading(false)
    }
  }

  // Show loading spinner while checking auth
  if (isPageLoading) {
    return <LoadingSpinner />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6
                 rounded-2xl border border-white/10 
                 bg-white/5 backdrop-blur-lg shadow-2xl mt-16 sm:mt-0"
    >
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-2 leading-tight">
          Generate Your Score
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-text-muted leading-relaxed">
          Upload your data to get on the leaderboard.
        </p>
      </div>

        <form className="space-y-4 sm:space-y-6" onSubmit={handleRankProfile}>
          
          {/* 1. Resume Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-muted mb-2 text-left">
              Upload your Resume (PDF only)
            </label>
            <div
              className={`relative flex flex-col items-center justify-center 
                          w-full h-32 sm:h-40 px-4 sm:px-6 pt-4 sm:pt-5 pb-4 sm:pb-6 
                          border-2 border-dashed rounded-lg
                          transition-colors
                          ${resumeFile ? 'border-accent-focus' : 'border-white/20 hover:border-white/40'}`}
            >
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-text-subtle" />
                <div className="flex flex-col sm:flex-row text-xs sm:text-sm text-text-subtle">
                  <span className="font-medium text-accent-focus">Upload a file</span>
                  <p className="sm:pl-1">or drag and drop</p>
                </div>
                {resumeFile ? (
                  <p className="text-xs sm:text-sm text-green-400 font-medium pt-1 sm:pt-2 break-all">{resumeFile.name}</p>
                ) : (
                  <p className="text-xs text-text-subtle">PDF up to 10MB</p>
                )}
              </div>
              {/* This makes the whole area a file input */}
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept="application/pdf"
              />
            </div>
          </div>

          {/* 2. GitHub Username */}
          <div>
            <label htmlFor="github" className="block text-xs sm:text-sm font-medium text-text-muted mb-2 text-left">
              Your GitHub Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Github className="h-4 w-4 sm:h-5 sm:w-5 text-text-subtle" />
              </div>
              <input
                type="text"
                name="github"
                id="github"
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 
                           rounded-lg text-sm sm:text-base text-text-secondary placeholder-text-subtle 
                           focus:outline-none focus:ring-2 
                           focus:ring-accent-focus focus:border-accent-focus"
                placeholder="e.g., m-shabir"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 3. Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 px-4 rounded-lg shadow-sm text-base sm:text-lg font-medium 
                       text-white bg-accent-primary hover:bg-accent-hover
                       focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-offset-bg-primary focus:ring-accent-focus
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          >
            {loading ? 'Submitting for Analysis...' : 'Generate My Score'}
          </motion.button>
        </form>
    </motion.div>
  )
}
