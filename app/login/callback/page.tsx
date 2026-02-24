'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const token = searchParams.get('token')
        if (token) {
            localStorage.setItem('hotpatch_token', token)
            localStorage.setItem('hotpatch_role', 'user')

            // Redirect to dashboard
            router.push('/dashboard')
        } else {
            router.push('/login?error=Authentication failed')
        }
    }, [router, searchParams])

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--navy)',
            color: 'white',
        }}>
            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--cyan)', marginBottom: '20px' }} />
            <h2 style={{ fontFamily: 'Syne, sans-serif' }}>Completing login...</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '10px' }}>Please wait while we set up your session.</p>
        </div>
    )
}
