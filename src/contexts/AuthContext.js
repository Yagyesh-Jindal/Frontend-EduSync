"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "../services/api"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on app load
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData && userData !== "undefined") {
      try {
        const parsedUser = JSON.parse(userData)
        // Ensure we have all required user properties
        if (!parsedUser.name || parsedUser.name === 'User') {
          // If name is missing or default, try to get it from backend
          refreshUserData(token, parsedUser)
        } else {
          setUser(parsedUser)
        }
        // Set default authorization header
        authAPI.defaults.headers.common["Authorization"] = `Bearer ${token}`
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  // Function to refresh user data from backend
  const refreshUserData = async (token, currentUserData) => {
    try {
      // Set the token for the request
      authAPI.defaults.headers.common["Authorization"] = `Bearer ${token}`
      
      // Get fresh user data from backend (you may need to create this endpoint)
      const response = await authAPI.get("/users/profile")
      
      if (response.data) {
        const updatedUserData = {
          ...currentUserData,
          name: response.data.name || currentUserData.name,
          role: response.data.role || currentUserData.role
        }
        
        // Update localStorage and state
        localStorage.setItem("user", JSON.stringify(updatedUserData))
        setUser(updatedUserData)
      } else {
        setUser(currentUserData)
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
      setUser(currentUserData)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await authAPI.post("/auth/login", { email, password })
      const { token, user: userData } = response.data

      // Store in localStorage
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(userData))

      // Set authorization header
      authAPI.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(userData)
      return { success: true, user: userData }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.post("/auth/register", userData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error("Registration error:", error)
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    delete authAPI.defaults.headers.common["Authorization"]
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
