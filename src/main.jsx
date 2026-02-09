import React from 'react'
import ReactDOM from 'react-dom/client'
// Import file giao diện chính của bạn
import AppEntry from './BookmarkManager.jsx' 
import './index.css' // Import file CSS (nếu có Tailwind)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppEntry />
  </React.StrictMode>,
)