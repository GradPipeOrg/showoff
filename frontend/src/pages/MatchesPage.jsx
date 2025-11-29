import { motion } from 'framer-motion'
import { Briefcase, CheckCircle, MessageSquare } from 'lucide-react'

const mockMatches = [
  {
    id: 'match-1',
    company: 'Google',
    status: 'Recruiter Viewed Your Profile',
    note: '“Looking for a senior backend engineer with deep AI systems experience.”',
    contact: 'Anjali R.',
  },
  {
    id: 'match-2',
    company: 'Zomato',
    status: 'Recruiter Viewed Your Profile',
    note: '“Interested in your distributed systems work—would love a quick sync.”',
    contact: 'Rahul K.',
  },
  {
    id: 'match-3',
    company: 'Cred',
    status: 'Recruiter Viewed Your Profile',
    note: '“Deep data science experience is a great fit for our FinTech team.”',
    contact: 'Sakshi M.',
  },
]

const MatchesPage = () => {
  return (
    <div className="space-y-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl p-6 flex flex-col gap-2"
      >
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-accent-primary" />
          <div>
            <p className="text-xs uppercase tracking-widest text-text-muted">My Matches</p>
            <h2 className="text-2xl font-bold text-text-primary">Recruiter Interest</h2>
          </div>
        </div>
        <p className="text-sm text-text-muted">
          Every recruiter that has opened your profile gets a card below. Stay ready.
        </p>
      </motion.div>

      <div className="space-y-4">
        {mockMatches.map((match) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-text-primary">{match.company}</h3>
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent-green" />
                  {match.status}
                </p>
              </div>
              <div className="text-right text-xs text-text-subtle">Contact: {match.contact}</div>
            </div>
            <p className="text-sm text-text-muted">{match.note}</p>
            <div className="flex items-center gap-3 text-sm">
              <MessageSquare className="w-4 h-4 text-accent-primary" />
              <span className="text-text-muted">Reply through your Recruiter Cockpit inbox.</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default MatchesPage

