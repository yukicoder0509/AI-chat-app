import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.module.css'

// Placeholder App - will be replaced with actual App component in Phase 7
const App = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>AI Chatroom</h1>
      <p>Project structure initialized and ready for development</p>
      <p>LLM Server: {import.meta.env.VITE_LLM_API_URL}</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
