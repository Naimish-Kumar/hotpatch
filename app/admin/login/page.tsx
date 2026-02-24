'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/lib/auth-context'
import { AlertTriangle, ArrowRight, Loader2, ShieldAlert } from 'lucide-react'

export default function AdminLoginPage() {
    const router = useRouter()
    const { superLogin } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await superLogin(email, password)
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Invalid superadmin credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            position: 'relative',
            background: '#0a0a0c', // Darker for admin
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0.05) 0%, transparent 50%)',
                pointerEvents: 'none',
            }} />

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
                    background: 'rgba(20, 20, 25, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '36px',
                    boxShadow: '0 24px 60px rgba(0,0,0,.6)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                        <ShieldAlert size={20} style={{ color: 'var(--red)' }} />
                        <h1 style={{
                            fontFamily: 'Syne, sans-serif',
                            fontSize: '24px',
                            fontWeight: 800,
                            letterSpacing: '-1px',
                            color: 'white'
                        }}>Superadmin</h1>
                    </div>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--muted)',
                        textAlign: 'center',
                        marginBottom: '32px',
                    }}>Enter system credentials to gain elevated access</p>

                    {error && (
                        <div style={{
                            background: 'rgba(255,77,106,.1)',
                            border: '1px solid rgba(255,77,106,.25)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '13px',
                            color: 'var(--red)',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '18px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted2)', marginBottom: '8px', textTransform: 'uppercase' }}>Admin Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="system@hotpatch.io"
                                style={{ width: '100%', padding: '12px 14px', background: '#16161a', border: '1px solid #2a2a32', borderRadius: '10px', color: 'white', outline: 'none' }}
                            />
                        </div>
                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted2)', marginBottom: '8px', textTransform: 'uppercase' }}>Master Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '12px 14px', background: '#16161a', border: '1px solid #2a2a32', borderRadius: '10px', color: 'white', outline: 'none' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'white',
                                color: 'black',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><ShieldAlert size={16} /> Authenticate System</>}
                        </button>
                    </form>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link href="/login" style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}>
                        ← Back to User Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
