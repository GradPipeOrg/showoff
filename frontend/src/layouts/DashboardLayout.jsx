import { useState } from 'react'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const onLogoutClick = async () => {
    console.log('[DashboardLayout] Delegating logout to App...')
    await handleLogout()
  }

  return (
    <div className="min-h-screen w-full flex gap-4 md:gap-6 p-4 md:p-6 lg:p-8">
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{
          opacity: 1,
          x: 0,
          width: isSidebarOpen ? 280 : 72
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col justify-between rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shrink-0 overflow-hidden relative"
      >
        {/* Top Section */}
        <div className="flex flex-col p-4 space-y-6">
          {/* Header with Logo */}
          <div className="flex items-center justify-between min-h-[48px]">
            <AnimatePresence mode="wait">
              {isSidebarOpen ? (
                <motion.div
                  key="logo-text"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <img
                    src="/logo.jpg"
                    alt="GradPipe Showoff"
                    className="w-10 h-10 rounded-lg object-cover border border-white/10"
                  />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-subtle font-semibold">GradPipe</p>
                    <h2 className="text-lg font-bold text-text-primary leading-tight">Showoff</h2>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors ${!isSidebarOpen ? 'absolute top-4 right-4' : ''
                }`}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => {
                  const baseClasses = `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isSidebarOpen ? 'justify-start' : 'justify-center'
                    }`

                  if (isActive) {
                    return `${baseClasses} bg-gradient-to-r from-accent-primary/20 to-accent-violet/20 text-text-primary border border-accent-primary/30 shadow-lg shadow-accent-primary/10`
                  }

                  return `${baseClasses} text-text-muted hover:text-text-primary hover:bg-white/5`
                }}
                title={!isSidebarOpen ? label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative ${isActive ? 'text-accent-primary' : ''}`}>
                      <Icon className="w-5 h-5 shrink-0" />
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute inset-0 rounded-lg bg-accent-primary/10 -z-10"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </div>
                    <AnimatePresence>
                      {isSidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="truncate"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-4 space-y-3 border-t border-white/10">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
              >
                <p className="text-[10px] uppercase tracking-wider text-text-subtle mb-1">Logged in</p>
                <p className="text-xs font-medium text-text-primary truncate">{session?.user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogoutClick}
            className={`w-full flex items-center ${isSidebarOpen ? 'justify-center gap-2' : 'justify-center'} px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-text-muted hover:text-text-primary transition-all`}
            title={!isSidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          <Outlet context={useOutletContext()} />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout

