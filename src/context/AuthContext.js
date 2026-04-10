import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    if (stored) { setUser(JSON.parse(stored)); setRole(storedRole); }
  }, []);

  const loginUser = (userData, userRole, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userRole);
    setUser(userData); setRole(userRole);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null); setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
