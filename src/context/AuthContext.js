import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // Verify token and get user info with timeout
      const verifyToken = async () => {
        try {
          const response = await api.get("/auth/me/");
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setUser(null);
        } finally {
          setLoading(false);
        }
      };

      // Set a timeout to ensure loading doesn't hang forever
      const timeout = setTimeout(() => {
        setLoading(false);
        setUser(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }, 5000); // 5 second timeout

      verifyToken();

      return () => clearTimeout(timeout);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login/", { email, password });
      const { tokens, data } = response.data;

      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      setUser(data);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register/", userData);

      const { tokens, data } = response.data;

      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      setUser(data);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch (error) {
      // Ignore logout errors
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user || !user.role) return false;

    const rolePermissions = {
      viewer: ["view_records"],
      analyst: ["view_records", "view_analytics"],
      admin: [
        "view_records",
        "view_analytics",
        "manage_users",
        "manage_records",
      ],
    };

    return rolePermissions[user.role.name]?.includes(permission) || false;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    hasPermission,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
