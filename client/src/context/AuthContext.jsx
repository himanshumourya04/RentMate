import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rentmate_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('rentmate_user');
    const storedToken = localStorage.getItem('rentmate_token');
    if (stored && storedToken) {
      // Set from localStorage immediately so the UI doesn't flash
      setUser(JSON.parse(stored));
      setToken(storedToken);

      // Then fetch fresh data from the server so profile images / URLs are always current
      axios
        .get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('rentmate_user', JSON.stringify(res.data));
        })
        .catch(() => {
          // Token might have expired — clear stale session
          setUser(null);
          setToken(null);
          localStorage.removeItem('rentmate_user');
          localStorage.removeItem('rentmate_token');
        });
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('rentmate_user', JSON.stringify(userData));
    localStorage.setItem('rentmate_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rentmate_user');
    localStorage.removeItem('rentmate_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line
export const useAuth = () => useContext(AuthContext);
