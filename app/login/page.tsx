'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/lib/auth-context'
import { AlertTriangle, ArrowRight, Loader2, Play, Mail, Lock, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { login, loginWithApiKey } = useAuth()

    const [apiKey, setApiKey] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [mode, setMode] = useState<'email' | 'apikey' | 'demo'>('email')
    const [verified, setVerified] = useState(false)

    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            setVerified(true)
        }
    }, [searchParams])

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await login(email, password)
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Invalid email or password.')
        } finally {
            setLoading(false)
        }
    }

    const handleApiKeyLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await loginWithApiKey(apiKey)
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Invalid API key.')
        } finally {
            setLoading(false)
        }
    }

    const handleDemoLogin = () => {
        localStorage.setItem('hotpatch_token', 'demo_token_for_preview')
        localStorage.setItem('hotpatch_role', 'user')
        localStorage.setItem('hotpatch_app', JSON.stringify({
            id: 'demo-app-id',
            name: 'MyApp Production',
            platform: 'android',
            created_at: new Date().toISOString(),
        }))
        window.location.href = '/dashboard'
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <div className="hero-grid" />

            <div className="afu" style={{
                position: 'relative',
                zIndex: 2,
                width: '100%',
                maxWidth: '420px',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Link href="/">
                        <Logo width={180} height={40} />
                    </Link>
                </div>

                <div style={{
                    background: 'var(--navy2)',
                    border: '1px solid var(--border2)',
                    borderRadius: '16px',
                    padding: '36px',
                    boxShadow: '0 24px 60px rgba(0,0,0,.4)',
                }}>
                    <h1 style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: '24px',
                        fontWeight: 800,
                        letterSpacing: '-1px',
                        marginBottom: '6px',
                        textAlign: 'center',
                    }}>Welcome back</h1>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--muted)',
                        textAlign: 'center',
                        marginBottom: '28px',
                    }}>Sign in to manage your OTA updates</p>

                    {/* Verified Alert */}
                    {verified && (
                        <div style={{
                            background: 'rgba(0,212,255,.1)',
                            border: '1px solid rgba(0,212,255,.25)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '13px',
                            color: 'var(--cyan)',
                            marginBottom: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <ShieldCheck size={14} /> Email verified successfully! You can now log in.
                        </div>
                    )}

                    {/* Google Login Button */}
                    <button
                        onClick={() => window.location.href = 'http://localhost:8080/auth/google/login'}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'white',
                            color: 'black',
                            border: 'none',
                            borderRadius: '9px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            marginBottom: '20px',
                            transition: 'all .2s'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.701-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.834.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                            <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.579c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0 5.482 0 2.443 2.048.957 4.962l3.007 2.332C4.672 5.163 6.656 3.579 9 3.579z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        marginBottom: '20px',
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
                        <span style={{ fontSize: '11px', color: 'var(--muted2)', textTransform: 'uppercase' }}>or use email</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
                    </div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        background: 'var(--navy)',
                        padding: '4px',
                        borderRadius: '10px',
                        marginBottom: '24px',
                        border: '1px solid var(--border2)',
                    }}>
                        <button
                            onClick={() => setMode('email')}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none',
                                background: mode === 'email' ? 'var(--cdim)' : 'transparent',
                                color: mode === 'email' ? 'var(--cyan)' : 'var(--muted)',
                                cursor: 'pointer', transition: 'all .2s'
                            }}>Email Login</button>
                        <button
                            onClick={() => setMode('apikey')}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none',
                                background: mode === 'apikey' ? 'var(--cdim)' : 'transparent',
                                color: mode === 'apikey' ? 'var(--cyan)' : 'var(--muted)',
                                cursor: 'pointer', transition: 'all .2s'
                            }}>API Key</button>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(255,77,106,.1)',
                            border: '1px solid rgba(255,77,106,.25)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '13px',
                            color: 'var(--red)',
                            marginBottom: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}

                    {mode === 'email' ? (
                        <form onSubmit={handleEmailLogin}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Email</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        style={{ width: '100%', padding: '11px 12px 11px 36px', background: 'var(--navy)', border: '1px solid var(--border2)', borderRadius: '9px', color: 'white', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{ width: '100%', padding: '11px 12px 11px 36px', background: 'var(--navy)', border: '1px solid var(--border2)', borderRadius: '9px', color: 'white', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'var(--cyan)',
                                    color: 'var(--navy)',
                                    border: 'none',
                                    borderRadius: '9px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleApiKeyLogin}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>API Key</label>
                                <input
                                    type="password"
                                    required
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    placeholder="hp_xxxxxxxxxxxxxxxxxxxx"
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        background: 'var(--navy)',
                                        border: '1px solid var(--border2)',
                                        borderRadius: '9px',
                                        color: 'white',
                                        outline: 'none',
                                        fontFamily: 'JetBrains Mono, monospace',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'var(--cyan)',
                                    color: 'var(--navy)',
                                    border: 'none',
                                    borderRadius: '9px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Login with Key'}
                            </button>
                        </form>
                    )}

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <Link href="/register" style={{ fontSize: '13px', color: 'var(--cyan)', textDecoration: 'none' }}>
                            Don't have an account? Sign up
                        </Link>
                    </div>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link href="/admin/login" style={{ fontSize: '12px', color: 'var(--muted2)', textDecoration: 'none' }}>
                        Superadmin access? Login here
                    </Link>
                </div>
            </div>
        </div>
    )
}
