'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { auth as authApi, type App } from '@/lib/api'

interface AuthContextType {
    isAuthenticated: boolean
    isLoading: boolean
    user: any | null
    app: App | null
    token: string | null
    role: string | null
    login: (email: string, password: string) => Promise<void>
    loginWithApiKey: (apiKey: string) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<void>
    superLogin: (email: string, password: string) => Promise<void>
    logout: () => void
    error: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any | null>(null)
    const [app, setApp] = useState<App | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [role, setRole] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Check stored auth on mount
        const storedToken = authApi.getToken()
        const storedApp = authApi.getApp()
        const storedUser = localStorage.getItem('hotpatch_user')
        const storedRole = localStorage.getItem('hotpatch_role')
        if (storedToken) {
            setIsAuthenticated(true)
            setToken(storedToken)
            if (storedUser) setUser(JSON.parse(storedUser))
            setApp(storedApp)
            setRole(storedRole)
        }
        setIsLoading(false)
    }, [])

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await authApi.login(email, password)
            let userRole = 'user'
            try {
                const payload = JSON.parse(atob(response.token.split('.')[1]))
                userRole = payload.role || 'user'
            } catch (e) { }

            localStorage.setItem('hotpatch_role', userRole)
            if (response.user) {
                localStorage.setItem('hotpatch_user', JSON.stringify(response.user))
                setUser(response.user)
            }
            setRole(userRole)
            if (response.app) {
                localStorage.setItem('hotpatch_app', JSON.stringify(response.app))
                setApp(response.app)
            }
            setIsAuthenticated(true)
            setToken(response.token)
        } catch (err: any) {
            setError(err.message || 'Login failed')
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [])

    const loginWithApiKey = useCallback(async (apiKey: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await authApi.loginWithToken(apiKey)
            let userRole = 'cli'
            try {
                const payload = JSON.parse(atob(response.token.split('.')[1]))
                userRole = payload.role || 'cli'
            } catch (e) { }

            localStorage.setItem('hotpatch_role', userRole)
            setRole(userRole)
            setIsAuthenticated(true)
            setToken(response.token)
            setApp(response.app || null)
        } catch (err: any) {
            setError(err.message || 'Login failed')
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [])

    const register = useCallback(async (name: string, email: string, password: string) => {
        setIsLoading(true)
        setError(null)
        try {
            await authApi.register(name, email, password)
        } catch (err: any) {
            setError(err.message || 'Registration failed')
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
            setApp(response.app || null)
        } catch (err: any) {
            setError(err.message || 'Login failed')
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [])

    const logout = useCallback(() => {
        authApi.logout()
        setIsAuthenticated(false)
        setToken(null)
        setUser(null)
        setApp(null)
        setRole(null)
        localStorage.removeItem('hotpatch_user')
    }, [])

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, app, token, role, login, loginWithApiKey, register, superLogin, logout, error }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
