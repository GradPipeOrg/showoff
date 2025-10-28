import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { UploadCloud, Github } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

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
    setLoading(true)
    
    // --- THIS IS THE REAL PHASE 3 ---
    try {
      // 1. Create FormData to send file + text
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('github_username', githubUsername)

      // 2. Call our "Mock" FastAPI backend
      const response = await axios.post('http://localhost:8000/rank_profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      const mockScores = response.data 
      // e.g., { resume_score: 88, github_score: 92, ... }

      // 3. Save the "mock" scores to our Supabase 'profiles' table
      // This fulfills the "contract" for Pratham's dashboard
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          resume_score: mockScores.resume_score,
          github_score: mockScores.github_score,
          showoff_score: mockScores.showoff_score,
          rank: mockScores.rank,
        })
        .eq('user_id', session.user.id)

      if (updateError) {
        throw updateError
      }

      // On success, navigate to the DASHBOARD, not the landing page
      navigate('/dashboard')

    } catch (error) {
      // Log the full error to the console
      console.error('CRITICAL: Error in handleRankProfile:', error)

      // Check if it's a Supabase API error (like RLS)
      if (error.code) {
        alert(`Error saving scores: ${error.message} (Code: ${error.code})`)
      } else if (error.response) {
        // This is an Axios (backend) error
        alert('Error from backend API. Please check server logs.')
      } else {
        // Generic error
        alert('An unknown error occurred. Please try again.')
      }
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
      className="w-full max-w-lg mx-auto p-6 sm:p-8 space-y-6
                 rounded-2xl border border-white/10 
                 bg-white/5 backdrop-blur-lg shadow-2xl"
    >
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
          Generate Your Score
        </h1>
        <p className="text-base sm:text-lg text-text-muted">
          Upload your data to get on the leaderboard.
        </p>
      </div>

        <form className="space-y-6" onSubmit={handleRankProfile}>
          
          {/* 1. Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2 text-left">
              Upload your Resume (PDF only)
            </label>
            <div
              className={`relative flex flex-col items-center justify-center 
                          w-full h-40 px-6 pt-5 pb-6 
                          border-2 border-dashed rounded-lg
                          transition-colors
                          ${resumeFile ? 'border-accent-focus' : 'border-white/20 hover:border-white/40'}`}
            >
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-10 w-10 text-text-subtle" />
                <div className="flex text-sm text-text-subtle">
                  <span className="font-medium text-accent-focus">Upload a file</span>
                  <p className="pl-1">or drag and drop</p>
                </div>
                {resumeFile ? (
                  <p className="text-sm text-green-400 font-medium pt-2">{resumeFile.name}</p>
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
            <label htmlFor="github" className="block text-sm font-medium text-text-muted mb-2 text-left">
              Your GitHub Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Github className="h-5 w-5 text-text-subtle" />
              </div>
              <input
                type="text"
                name="github"
                id="github"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 
                           rounded-lg text-text-secondary placeholder-text-subtle 
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
            className="w-full py-3 px-4 rounded-lg shadow-sm text-lg font-medium 
                       text-white bg-accent-primary hover:bg-accent-hover
                       focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-offset-bg-primary focus:ring-accent-focus
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          >
            {loading ? 'Generating Your Score...' : 'Generate My Score'}
          </motion.button>
        </form>
    </motion.div>
  )
}
