import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Trophy, Briefcase, LogOut, Menu, X } from 'lucide-react'
import { supabase } from '../supabaseClient'

const navItems = [
  { label: 'My Profile', path: '/profile', icon: User },
  { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { label: 'My Matches', path: '/matches', icon: Briefcase },
]

const DashboardLayout = () => {
  const { session, handleLogout } = useOutletContext()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Closed by default on mobile
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile/desktop breakpoint
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      setIsMobile(mobile)
      if (!mobile) {
        setIsSidebarOpen(true) // Auto-open on desktop
      } else {
        setIsSidebarOpen(false) // Auto-close on mobile
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const onLogoutClick = async () => {
    console.log('[DashboardLayout] Delegating logout to App...')
    await handleLogout()
  }

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex relative">
      {/* Mobile Overlay - Enhanced */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile && !isSidebarOpen ? -280 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`
          ${isMobile ? 'fixed' : 'sticky'} 
          top-0 left-0 h-screen
          w-[280px]
          flex flex-col justify-between 
          bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 
          backdrop-blur-2xl 
          border-r border-white/10 
          shadow-2xl shadow-purple-500/10
          z-50
          overflow-hidden
        `}
      >
        {/* Top Section */}
        <div className="flex flex-col p-5 space-y-6">
          {/* Header with Logo */}
          <div className="flex items-center justify-between min-h-[48px]">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/20">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-bold">GradPipe</p>
                <h2 className="text-xl font-black bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                  Showoff
                </h2>
              </div>
            </motion.div>

            {/* Mobile close button */}
            {isMobile && (
              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map(({ label, path, icon: Icon }, index) => (
              <motion.div
                key={path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: isSidebarOpen ? index * 0.1 : 0,
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                <NavLink
                  to={path}
                  onClick={closeSidebarOnMobile}
                  className={({ isActive }) => {
                    const baseClasses = `relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group overflow-hidden`

                    if (isActive) {
                      return `${baseClasses} bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-white border border-indigo-400/50 shadow-lg shadow-indigo-500/20`
                    }

                    return `${baseClasses} text-slate-300 hover:text-white hover:bg-white/5 hover:border-white/10`
                  }}
                >
                  {({ isActive }) => (
                    <>
                      {/* Animated background */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <div className={`relative z-10 ${isActive ? 'text-white' : ''}`}>
                        <Icon className="w-5 h-5 shrink-0" />
                      </div>
                      <motion.span className="relative z-10 truncate">
                        {label}
                      </motion.span>

                      {/* Hover glow effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                      </div>
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-5 space-y-3 border-t border-white/10 bg-gradient-to-t from-slate-950/50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Logged in as</p>
            <p className="text-xs font-semibold text-slate-200 truncate">{session?.user?.email}</p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogoutClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Premium Mobile Menu Button - Glassmorphic FAB */}
      {isMobile && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: isSidebarOpen ? 90 : 0
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl text-white shadow-2xl lg:hidden group backdrop-blur-xl bg-white/10 border border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          }}
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {/* Animated background pulse */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-purple-500/20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Icon with rotation animation */}
          <motion.div
            animate={{ rotate: isSidebarOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {isSidebarOpen ? (
              <X className="w-6 h-6 relative z-10 drop-shadow-lg" />
            ) : (
              <Menu className="w-6 h-6 relative z-10 drop-shadow-lg" />
            )}
          </motion.div>

          {/* Glowing halo effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/40 to-pink-500/40 blur-2xl opacity-60 -z-10 group-hover:opacity-80 transition-opacity" />
        </motion.button>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen w-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className={`w-full h-full p-4 lg:p-8 ${isMobile ? 'pb-24' : ''}`}>
          <Outlet context={useOutletContext()} />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout

