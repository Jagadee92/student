import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

function getSavedUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);

  function saveSession(data) {
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function login(email, password) {
    const data = await api("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    saveSession(data);
    return data.user;
  }

  async function logout() {
    try {
      if (sessionStorage.getItem("token")) {
        await api("/auth/logout", { method: "POST" });
      }
    } catch {
    } finally {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      setUser(null);
    }
  }

  function saveUser(updatedUser) {
    setUser(updatedUser);
    sessionStorage.setItem("user", JSON.stringify(updatedUser));
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      saveUser,
      isSignedIn: Boolean(user),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
