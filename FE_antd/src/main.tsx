import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import DrawerForm from './Drawer.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <DrawerForm />
  </StrictMode>,
)
