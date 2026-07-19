import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initDevtoolsBrand } from './devtoolsBrand'
import './index.css'

initDevtoolsBrand()

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
