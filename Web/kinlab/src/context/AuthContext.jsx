import React, { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  // 3. Al cargar, intenta leer el usuario desde localStorage.
  // Si no existe, el valor inicial es null.
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error al parsear el usuario de localStorage", error);
      return null;
    }
  });

  const navigate = useNavigate();

  const login = (payload) => {
    // payload puede ser el usuario directamente o un objeto { user, token }
    let userData = payload;
    let token = null;
    if (payload && typeof payload === 'object' && 'user' in payload) {
      userData = payload.user;
      token = payload.token || null;
    }

    // Guarda usuario y token en localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('token', token);
    }
    setUser(userData);
    navigate('/home');
  };

  const logout = () => {
    //Al hacer logout, borra al usuario del estado Y de localStorage.
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/'); // Redirige al login
  };

  const value = {user, login, logout};

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

