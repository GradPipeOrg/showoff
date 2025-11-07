import { motion } from 'framer-motion'
import { Briefcase, GraduationCap, FolderKanban } from 'lucide-react'

const AIParsedResume = ({ candidate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 sm:p-8 shadow-lg"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">
        AI-Powered Resume
      </h2>
      
      <div className="space-y-8">
        {/* Experience Section */}
        {candidate.experience && candidate.experience.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-accent-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Experience</h3>
            </div>
            <div className="space-y-4">
              {candidate.experience.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div>
                      <p className="text-base font-semibold text-text-primary">{exp.role}</p>
                      <p className="text-sm text-accent-primary">{exp.company}</p>
                    </div>
                    <p className="text-sm text-text-muted mt-1 sm:mt-0">{exp.duration}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Education Section */}
        {candidate.education && candidate.education.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-accent-green" />
              <h3 className="text-lg font-semibold text-text-primary">Education</h3>
            </div>
            <div className="space-y-4">
              {candidate.education.map((edu, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div>
                      <p className="text-base font-semibold text-text-primary">{edu.degree}</p>
                      <p className="text-sm text-accent-green">{edu.school}</p>
                    </div>
                    <p className="text-sm text-text-muted mt-1 sm:mt-0">{edu.duration}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {candidate.projects && candidate.projects.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FolderKanban className="w-5 h-5 text-accent-violet" />
              <h3 className="text-lg font-semibold text-text-primary">Projects</h3>
            </div>
            <div className="space-y-4">
              {candidate.projects.map((project, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <p className="text-base font-semibold text-text-primary mb-2">
                    {project.name}
                  </p>
                  <p className="text-sm text-text-muted">{project.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {candidate.topSkills && candidate.topSkills.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Top Skills</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.topSkills.map((skill, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className="px-3 py-1.5 rounded-md bg-white/10 text-sm text-text-primary 
                           border border-white/10"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default AIParsedResume

