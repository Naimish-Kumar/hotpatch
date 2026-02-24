'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { auth as authApi, type App } from '@/lib/api'

interface AuthContextType {
    isAuthenticated: boolean
    isLoading: boolean
    app: App | null
    token: string | null
    role: string | null
    login: (apiKey: string) => Promise<void>
    superLogin: (email: string, password: string) => Promise<void>
    logout: () => void
    error: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [app, setApp] = useState<App | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [role, setRole] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Check stored auth on mount
        const storedToken = authApi.getToken()
        const storedApp = authApi.getApp()
        const storedRole = localStorage.getItem('hotpatch_role')
        if (storedToken) {
            setIsAuthenticated(true)
            setToken(storedToken)
            setApp(storedApp)
            setRole(storedRole)
        }
        setIsLoading(false)
    }, [])

    const login = useCallback(async (apiKey: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await authApi.login(apiKey)

            // Basic JWT decoding for role (or just trust the response if we add it there)
            // For now, let's assume the API returns role or we decode it
            let userRole = 'cli'
            try {
                const payload = JSON.parse(atob(response.token.split('.')[1]))
                userRole = payload.role || 'cli'
            } catch (e) { }

            localStorage.setItem('hotpatch_role', userRole)
            setRole(userRole)

            setIsAuthenticated(true)
            setToken(response.token)
            setApp(response.app)
        } catch (err: any) {
            setError(err.message || 'Login failed')
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [])

    const superLogin = useCallback(async (email: string, password: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await authApi.superLogin(email, password)

            let userRole = 'superadmin'
            try {
                const payload = JSON.parse(atob(response.token.split('.')[1]))
                userRole = payload.role || 'superadmin'
            } catch (e) { }

            localStorage.setItem('hotpatch_role', userRole)
            setRole(userRole)

            setIsAuthenticated(true)
            setToken(response.token)
            setApp(response.app)
        } catch (err: any) {
            setError(err.message || 'Login failed')
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [])

    const logout = useCallback(() => {
        authApi.logout()
        localStorage.removeItem('hotpatch_role')
        setIsAuthenticated(false)
        setToken(null)
        setApp(null)
        setRole(null)
    }, [])

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, app, token, role, login, superLogin, logout, error }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
