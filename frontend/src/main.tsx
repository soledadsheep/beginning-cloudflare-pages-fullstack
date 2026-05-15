import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './main.css'
//import App from './App.tsx'
import App from './App_antd.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)