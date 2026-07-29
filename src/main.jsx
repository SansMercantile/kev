import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWebsite from './App.jsx'
import AppPlatform from './AppPlatform.jsx'
import './index.css'

const App = import.meta.env.MODE === 'platform' ? AppPlatform : AppWebsite

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
