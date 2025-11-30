import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { UploadCloud, Github, Zap, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import mixpanel from 'mixpanel-browser'

// Premium loading spinner
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-4 border-dashed rounded-full border-indigo-500"
    />
  </div>
)

export default function UploadPage() {
  const [loading, setLoading] = useState(false)
  const [resumeFile, setResumeFile] = useState(null)
  const [githubUsername, setGithubUsername] = useState('')
  const [session, setSession] = useState(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('[UploadPage] useEffect started')
    const fetchSession = async () => {
      console.log('[UploadPage] Fetching session...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[UploadPage] Session:', session ? 'Found' : 'Not found')
      setSession(session)
      setIsPageLoading(false)

      mixpanel.track('Page View', {
        page_url: window.location.href,
        page_title: 'Upload',
        user_id: session?.user?.id,
      })

      if (!session) {
        console.log('[UploadPage] No session, redirecting to /')
        navigate('/')
      } else {
        console.log('[UploadPage] Session found, staying on upload page')
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

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setResumeFile(file)
    } else {
      alert('Please drop a PDF file.')
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
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('github_username', githubUsername)
      formData.append('user_id', session.user.id)

      localStorage.setItem('analysis_in_progress', 'true')
      localStorage.setItem('analysis_start_time', Date.now().toString())

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

      console.log('[UploadPage] API Base URL:', apiBaseUrl)
      console.log('[UploadPage] Full endpoint:', `${apiBaseUrl}/rank_profile`)
      console.log('[UploadPage] Env var present:', !!import.meta.env.VITE_API_BASE_URL)

      if (window.location.hostname !== 'localhost' && apiBaseUrl.includes('localhost')) {
        console.error('[UploadPage] ERROR: VITE_API_BASE_URL not set!')
        alert('Configuration Error: API URL not configured. Please contact support.')
        setLoading(false)
        return
      }

      const response = await axios.post(`${apiBaseUrl}/rank_profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.status === "processing") {
        mixpanel.track('Score Generation Success')
        navigate('/processing')
      } else {
        throw new Error("Invalid response from server. Expected 'processing' status.")
      }

    } catch (error) {
      console.error('CRITICAL: Error in handleRankProfile:', error)
      let alertMessage = 'An unknown error occurred. Please try again.'
      if (error.response) {
        alertMessage = `Error: ${error.response.data.detail}`
      } else if (error.request) {
        alertMessage = 'Error: Cannot connect to the server. Is it running?'
      } else {
        alertMessage = `Error: ${error.message}`
      }
      alert(alertMessage)
    } finally {
      setLoading(false)
    }
  }

  if (isPageLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Single Unified Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-10 rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl shadow-2xl shadow-indigo-500/10"
        >
          {/* Back Button */}
          <motion.button
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </motion.button>

          {/* Integrated Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
              Generate Your Score
            </h1>
            <p className="text-slate-400">
              Upload your resume and GitHub to get ranked
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleRankProfile}>

            {/* Resume Upload - More Compact */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Resume
              </label>
              <motion.div
                whileHover={{ scale: resumeFile ? 1 : 1.01 }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                relative flex flex-col items-center justify-center 
                w-full h-32 px-6 py-6
                border-2 border-dashed rounded-xl
                transition-all duration-200 cursor-pointer
                ${resumeFile
                    ? 'border-indigo-400/50 bg-indigo-500/5'
                    : isDragging
                      ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]'
                      : 'border-white/20 hover:border-white/30 bg-white/5 hover:bg-white/[0.07]'
                  }
              `}
              >
                <AnimatePresence mode="wait">
                  {resumeFile ? (
                    <motion.div
                      key="file-selected"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <UploadCloud className="mx-auto h-8 w-8 text-indigo-400 mb-2" />
                      <p className="text-sm font-medium text-slate-200">
                        {resumeFile.name}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-file"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <UploadCloud className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      <div className="text-sm text-slate-400">
                        <span className="font-medium text-slate-300">Drop PDF here</span>
                        <span className="text-slate-500"> or click</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  id="file-upload"
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept="application/pdf"
                />
              </motion.div>
            </div>

            {/* GitHub Username - More Compact */}
            <div>
              <label htmlFor="github" className="block text-sm font-medium text-slate-300 mb-2">
                GitHub Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Github className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  name="github"
                  id="github"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.07] border border-white/20
                           rounded-xl text-slate-200 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                           focus:border-indigo-400/50 hover:border-white/30
                           transition-all"
                  placeholder="your-username"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button - More Refined */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full relative mt-8 py-3.5 px-6 rounded-xl text-base font-semibold
                       text-white bg-gradient-to-r from-indigo-600 to-purple-600
                       hover:from-indigo-500 hover:to-purple-500
                       shadow-lg shadow-indigo-500/30
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Score
                  </>
                )}
              </span>
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
