import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, getToken, setToken, clearToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      getMe()
        .then(u => {
          setUser(u);
          setMustChangePassword(u.must_change_password === 1);
        })
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData, mustChange) => {
    setToken(token);
    setUser(userData);
    setMustChangePassword(mustChange || false);
  };

  const checkPasswordChange = useCallback(() => {
    setMustChangePassword(false);
    if (user) {
      setUser({ ...user, must_change_password: 0 });
    }
  }, [user]);

  const logout = () => {
    clearToken();
    setUser(null);
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, mustChangePassword, login, logout, checkPasswordChange }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
