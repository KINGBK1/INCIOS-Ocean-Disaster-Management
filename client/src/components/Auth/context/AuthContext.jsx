// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!Cookies.get("token"));

  useEffect(() => {
    const interval = setInterval(() => {
      const token = Cookies.get("token");
      setIsAuthenticated(!!token);
    }, 1000); // check every second

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
