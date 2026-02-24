'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/lib/auth-context'
import { AlertTriangle, ArrowRight, Loader2, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
    const router = useRouter()
    const { register } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await register(name, email, password)
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                position: 'relative',
                background: 'var(--navy)',
            }}>
                <div style={{
                    background: 'var(--navy2)',
                    border: '1px solid var(--border2)',
                    borderRadius: '16px',
                    padding: '40px',
                    maxWidth: '420px',
                    textAlign: 'center',
                    boxShadow: '0 24px 60px rgba(0,0,0,.4)',
                }}>
                    <div style={{ color: 'var(--cyan)', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                        <CheckCircle size={60} />
                    </div>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Verify your email</h1>
                    <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
                        We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.
                    </p>
                    <Link href="/login" style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px',
                        background: 'var(--cyan)',
                        color: 'var(--navy)',
                        borderRadius: '9px',
                        fontWeight: 700,
                        textDecoration: 'none',
                    }}>
                        Back to Login
                    </Link>
                </div>
            </div>
        )
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
                    }}>Create account</h1>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--muted)',
                        textAlign: 'center',
                        marginBottom: '28px',
                    }}>Join HotPatch and start pushing updates</p>

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

                    <form onSubmit={handleRegister}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--muted)',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '.5px',
                            }}>Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="John Doe"
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    background: 'var(--navy)',
                                    border: '1px solid var(--border2)',
                                    borderRadius: '9px',
                                    color: 'var(--white)',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--muted)',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '.5px',
                            }}>Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    background: 'var(--navy)',
                                    border: '1px solid var(--border2)',
                                    borderRadius: '9px',
                                    color: 'var(--white)',
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
                                textTransform: 'uppercase',
                                letterSpacing: '.5px',
                            }}>Password</label>
                            <input
                                type="password"
                                required
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
                                    outline: 'none',
                                }}
                            />
                            <p style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '6px' }}>Must be at least 8 characters long</p>
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
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all .18s',
                            }}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
                        </button>
                    </form>
                </div>

                <p style={{
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--muted)',
                    marginTop: '22px',
                }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 500 }}>
                        Sign in →
                    </Link>
                </p>
            </div>
        </div>
    )
}
