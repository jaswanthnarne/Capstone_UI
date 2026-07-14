import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: 'var(--color-text-primary)',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          },
          success: { iconTheme: { primary: 'var(--color-success)', secondary: '#ffffff' } },
          error: { iconTheme: { primary: 'var(--color-danger)', secondary: '#ffffff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
