import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Clock, LogOut } from 'lucide-react'
import mixpanel from 'mixpanel-browser'

// --- Re-usable Loading Spinner ---
const LoadingSpinner = () => (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent-primary"></div>
    </div>
)

// --- Active Analysis State Component ---
const ActiveAnalysisState = ({ userName }) => {
    const [currentStep, setCurrentStep] = useState(0)

    const steps = [
        { text: "Job submitted to 'Deep Tech' queue", duration: 2000 },
        { text: "Downloading and parsing resume PDF", duration: 10000 },
        { text: "Analyzing resume with v1.9 'Context-Aware' Engine", duration: 20000 },
        { text: "Scraping GitHub repositories (v4.2 Scraper)", duration: 15000 },
        { text: "Running 'Deep Tech' code analysis on snippets", duration: 20000 },
        { text: "Calculating final 'Showoff Score'", duration: 10000 },
        { text: "Finalizing results... (this can take a moment)", duration: 999999 }, // Stays here until unmounted
    ]

    useEffect(() => {
        if (currentStep < steps.length - 1) {
            const timer = setTimeout(() => {
                setCurrentStep(currentStep + 1)
            }, steps[currentStep].duration)
            return () => clearTimeout(timer)
        }
    }, [currentStep, steps.length])

    const StepIcon = ({ index }) => {
        if (index < currentStep) {
            return <Check className="h-5 w-5 text-accent-green" />
        }
        if (index === currentStep) {
            return <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-accent-primary" />
        }
        return <Clock className="h-5 w-5 text-text-subtle" />
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
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary mb-2">
                    Analyzing Your Profile, {userName}
                </h1>
                <p className="text-sm sm:text-base text-text-muted">
                    This <strong>Deep Tech analysis</strong> may take 60-100 seconds. We are
                    running your profile through our "Context-Aware" AI engines.
                </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: index <= currentStep ? 1 : 0.4 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-3"
                    >
                        <StepIcon index={index} />
                        <span className={`text-sm ${index === currentStep ? 'text-text-primary font-medium' :
                            index < currentStep ? 'text-text-muted' : 'text-text-subtle'
                            }`}>
                            {step.text}
                        </span>
                    </motion.div>
                ))}
            </div>
            <p className="text-xs sm:text-sm text-text-subtle text-center pt-4">
                Note: This page will update automatically the <em>instant</em> your score is ready.
            </p>
        </motion.div>
    )
}

export default function ProcessingPage() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const pollIntervalRef = useRef(null)
    const isMountedRef = useRef(true) // Track if component is mounted

    useEffect(() => {
        // Set mounted to true when component mounts
        isMountedRef.current = true

        // Track page view
        mixpanel.track('Page View', {
            page: 'ProcessingPage',
            timestamp: new Date().toISOString()
        })

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSession(session)
                setLoading(false)
                startPolling(session.user.id)
            } else {
                setLoading(false)
                navigate('/')
            }
        })

        const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
            setSession(session)
            if (!session) {
                navigate('/')
            }
        })

        return () => {
            // Mark component as unmounted
            isMountedRef.current = false
            authListener.subscription.unsubscribe()
            if (pollIntervalRef.current) {
                console.log('[Processing] Clearing interval on unmount')
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
            }
        }
    }, [navigate])

    const startPolling = (userId) => {
        // Clear any existing interval first
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
        }

        pollIntervalRef.current = setInterval(async () => {
            // Don't do anything if component is unmounted
            if (!isMountedRef.current) {
                console.log('[Processing] Component unmounted, skipping poll')
                return
            }

            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('resume_score, github_score, showoff_score')
                    .eq('user_id', userId)
                    .single()

                if (error) {
                    console.error('[Processing] Polling error:', error)
                    return
                }

                if (profile) {
                    if (profile.resume_score !== null && profile.github_score !== null) {
                        console.log('[Processing] Scores detected, navigating to /profile')
                        clearInterval(pollIntervalRef.current)
                        pollIntervalRef.current = null
                        // Only navigate if still mounted
                        if (isMountedRef.current) {
                            navigate('/profile')
                        }
                    } else {
                        console.log('[Processing] Found scores but they are stale (re-analysis in progress)')
                    }
                }
            } catch (error) {
                console.error('[Processing] Error polling:', error)
            }
        }, 3000) // Poll every 3 seconds
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        navigate('/')
    }

    if (loading) return <LoadingSpinner />

    const userName = session?.user?.email?.split('@')[0] || 'User'

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
            <motion.button
                onClick={handleSignOut}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 
                   flex items-center gap-2 px-3 py-2 
                   rounded-lg text-sm font-medium 
                   text-text-muted bg-white/5 border border-white/10
                   hover:text-text-primary hover:bg-white/10
                   transition-colors"
            >
                <LogOut size={16} />
                Sign Out
            </motion.button>
            <ActiveAnalysisState userName={userName} />
        </div>
    )
}
