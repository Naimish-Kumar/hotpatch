'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/lib/auth-context'
import { AlertTriangle, ArrowRight, Loader2, Play } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const { login, superLogin } = useAuth()
    const [apiKey, setApiKey] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [mode, setMode] = useState<'login' | 'super' | 'demo'>('login')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await login(apiKey)
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Invalid API key. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleSuperLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await superLogin(email, password)
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Invalid email or password.')
        } finally {
            setLoading(false)
        }
    }

    const handleDemoLogin = () => {
        // Set demo mode — store fake token for demo dashboard
        localStorage.setItem('hotpatch_token', 'demo_token_for_preview')
        localStorage.setItem('hotpatch_role', 'cli')
        localStorage.setItem('hotpatch_app', JSON.stringify({
            id: 'demo-app-id',
            name: 'MyApp Production',
            platform: 'android',
            created_at: new Date().toISOString(),
        }))
        router.push('/dashboard')
        // Force page reload to pick up the new token
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
            {/* Background effects */}
            <div className="hero-grid" />
            <div style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '400px',
                background: 'radial-gradient(ellipse, rgba(0,212,255,.06) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div className="afu" style={{
                position: 'relative',
                zIndex: 2,
                width: '100%',
                maxWidth: '420px',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Link href="/">
                        <Logo width={180} height={40} />
                    </Link>
                </div>

                {/* Card */}
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
                    }}>Sign in to access your dashboard</p>

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
                            onClick={() => setMode('login')}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, border: 'none',
                                background: mode === 'login' ? 'var(--cdim)' : 'transparent',
                                color: mode === 'login' ? 'var(--cyan)' : 'var(--muted)',
                                cursor: 'pointer', transition: 'all .2s'
                            }}>API Key</button>
                        <button
                            onClick={() => setMode('super')}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, border: 'none',
                                background: mode === 'super' ? 'var(--cdim)' : 'transparent',
                                color: mode === 'super' ? 'var(--cyan)' : 'var(--muted)',
                                cursor: 'pointer', transition: 'all .2s'
                            }}>Superadmin</button>
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

                    {mode === 'login' ? (
                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: '18px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--muted)',
                                    marginBottom: '6px',
                                    letterSpacing: '.5px',
                                    textTransform: 'uppercase',
                                }}>API Key</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    placeholder="hp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        background: 'var(--navy)',
                                        border: '1px solid var(--border2)',
                                        borderRadius: '9px',
                                        color: 'var(--white)',
                                        fontSize: '14px',
                                        fontFamily: 'JetBrains Mono, monospace',
                                        outline: 'none',
                                        transition: 'border-color .2s',
                                    }}
                                />
                                <p style={{
                                    fontSize: '11px',
                                    color: 'var(--muted2)',
                                    marginTop: '6px',
                                }}>Find your API key in your terminal after running <code style={{
                                    background: 'rgba(0,212,255,.08)',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    color: 'var(--cyan)',
                                }}>hotpatch login</code></p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !apiKey}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: loading ? 'var(--blue)' : 'var(--cyan)',
                                    color: 'var(--navy)',
                                    border: 'none',
                                    borderRadius: '9px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: loading ? 'wait' : 'pointer',
                                    transition: 'all .18s',
                                    opacity: !apiKey ? 0.5 : 1,
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : <><ArrowRight size={14} /> Sign In</>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSuperLogin}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--muted)',
                                    marginBottom: '6px',
                                    letterSpacing: '.5px',
                                    textTransform: 'uppercase',
                                }}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@hotpatch.io"
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        background: 'var(--navy)',
                                        border: '1px solid var(--border2)',
                                        borderRadius: '9px',
                                        color: 'var(--white)',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--muted)',
                                    marginBottom: '6px',
                                    letterSpacing: '.5px',
                                    textTransform: 'uppercase',
                                }}>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        background: 'var(--navy)',
                                        border: '1px solid var(--border2)',
                                        borderRadius: '9px',
                                        color: 'var(--white)',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email || !password}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: loading ? 'var(--blue)' : 'var(--cyan)',
                                    color: 'var(--navy)',
                                    border: 'none',
                                    borderRadius: '9px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: loading ? 'wait' : 'pointer',
                                    transition: 'all .18s',
                                    opacity: (!email || !password) ? 0.5 : 1,
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Authenticating...</> : <><ArrowRight size={14} /> Superadmin Login</>}
                            </button>
                        </form>
                    )}

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        margin: '24px 0',
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        <span style={{ fontSize: '11px', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    </div>

                    {/* Demo button */}
                    <button
                        onClick={handleDemoLogin}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'transparent',
                            color: 'var(--cyan)',
                            border: '1px solid var(--border2)',
                            borderRadius: '9px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all .18s',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        <Play size={14} style={{ marginRight: '4px' }} /> Explore Demo Dashboard
                    </button>
                </div>

                {/* Bottom link */}
                <p style={{
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--muted)',
                    marginTop: '22px',
                }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/docs" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 500 }}>
                        Get started →
                    </Link>
                </p>
            </div>
        </div>
    )
}
