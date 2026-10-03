import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token is saved, we must ask the server who it belongs to before showing pages
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('token')) // expired or invalid token
      .finally(() => setLoading(false));
  }, []);

  async function authenticate(path, body) {
    const data = await api(path, { method: 'POST', body });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }

  const login = (email, password) => authenticate('/auth/login', { email, password });
  const register = (name, email, password) => authenticate('/auth/register', { name, email, password });

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}