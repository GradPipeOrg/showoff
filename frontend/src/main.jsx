import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Import Mixpanel SDK
import mixpanel from 'mixpanel-browser'

// Near entry of your product, init Mixpanel
mixpanel.init('8ad683729e6487e22df733d62345288c', {
  debug: true,
  track_pageview: true,
  persistence: 'localStorage',
  autocapture: true,
  record_sessions_percent: 100,
})

// Import our pages
import UploadPage from './pages/UploadPage.jsx'
import ProcessingPage from './pages/ProcessingPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import MatchesPage from './pages/MatchesPage.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
// B2B Recruiter Cockpit pages
import DiscoverPage from './pages/b2b/DiscoverPage.jsx'
import RecruiterProfilePage from './pages/b2b/ProfilePage.jsx'
import JobPostingPage from './pages/b2b/JobPostingPage.jsx'
import RecruiterCockpitPage from './pages/b2b/RecruiterCockpitPage.jsx'
import B2BWaitlistPage from './pages/b2b/B2BWaitlistPage.jsx' // Our "YC-hack" v4.9.5

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        element: <DashboardLayout />,
        children: [
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'leaderboard',
            element: <LeaderboardPage />,
          },
          {
            path: 'matches',
            element: <MatchesPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/upload',
    element: <UploadPage />,
  },
  {
    path: '/processing',
    element: <ProcessingPage />,
  },
  // B2B Recruiter Cockpit routes
  {
    path: '/b2b',
    element: <RecruiterCockpitPage />,
  },
  {
    path: '/b2b/dashboard',
    element: <RecruiterCockpitPage />,
  },
  {
    path: '/b2b/post-job',
    element: <JobPostingPage />,
  },
  {
    path: '/b2b/discover',
    element: <DiscoverPage />,
  },
  {
    path: '/b2b/profile/:id',
    element: <RecruiterProfilePage />,
  },
  // "YC-hack" v4.9.5: Our manual B2B lead-gen form
  {
    path: '/b2b/join',
    element: <B2BWaitlistPage />,
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
