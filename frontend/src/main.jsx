import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Import our pages
import UploadPage from './pages/UploadPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
// B2B Recruiter Cockpit pages
import DiscoverPage from './pages/b2b/DiscoverPage.jsx'
import ProfilePage from './pages/b2b/ProfilePage.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // This is our main "bouncer" and "hub"
  },
  {
    path: '/upload',
    element: <UploadPage />, // The onboarding/update flow
  },
  {
    path: '/dashboard',
    element: <DashboardPage />, // Pratham's dashboard
  },
  {
    path: '/leaderboard',
    element: <LeaderboardPage />,
  },
  // B2B Recruiter Cockpit routes
  {
    path: '/b2b/discover',
    element: <DiscoverPage />,
  },
  {
    path: '/b2b/profile/:id',
    element: <ProfilePage />,
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
