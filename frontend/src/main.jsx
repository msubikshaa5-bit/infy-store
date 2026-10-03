import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { ShopProvider } from './ShopContext.jsx';

// Order matters: ShopProvider needs the router and the logged-in user
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <App />
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);