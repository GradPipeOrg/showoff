import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Import our pages
import UploadPage from './pages/UploadPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx' // 1. Import new page

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
    path: '/leaderboard', // 2. Add new route
    element: <LeaderboardPage />,
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
