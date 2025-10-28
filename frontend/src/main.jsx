import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Import our two new, independent pages
import UploadPage from './pages/UploadPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

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
  // We will add '/leaderboard' here later
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
