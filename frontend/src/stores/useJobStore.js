import { create } from 'zustand'
import { mockPostedJobs } from '../data/mockPostedJobs'

const useJobStore = create((set) => ({
  activeJob: null,
  postedJobs: [...mockPostedJobs],

  setActiveJob: (job) => set({ activeJob: job }),

  addJob: (job) => set((state) => ({
    postedJobs: [job, ...state.postedJobs],
    activeJob: job,
  })),

  deleteJob: (jobId) => set((state) => {
    const newJobs = state.postedJobs.filter((job) => job.id !== jobId)
    // Clear activeJob if the deleted job was active
    const newActiveJob = state.activeJob?.id === jobId ? null : state.activeJob
    return {
      postedJobs: newJobs,
      activeJob: newActiveJob,
    }
  }),

  clearActiveJob: () => set({ activeJob: null }),
}))

export default useJobStore

