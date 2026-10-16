import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import store from './store.js'
import { Provider } from 'react-redux'
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
 <React.StrictMode>
      <Provider store={store}>
  <GoogleOAuthProvider clientId="373366357915-p7jsqji9fn9arbbrgputcg126eeun1ac.apps.googleusercontent.com">
    <CartProvider>
      <App />
    </CartProvider>
  </GoogleOAuthProvider>
      </Provider>
  </React.StrictMode>,
)
