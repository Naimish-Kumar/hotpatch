'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/lib/auth-context'
import {
    LayoutDashboard, Laptop, ShieldAlert, Settings, Bell, Zap,
    ChevronLeft, ChevronRight, LogOut, Activity, Users, Globe
} from 'lucide-react'

const adminNav = [
    { name: 'System Stats', href: '/admin', icon: Activity },
    { name: 'Applications', href: '/admin/apps', icon: Globe },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    // Security check: Only allow logged-in superadmins
    const { role, logout, isAuthenticated, isLoading } = useAuth()
    const [collapsed, setCollapsed] = useState(false)

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                if (pathname !== '/admin/login') {
                    router.push('/admin/login')
                }
            } else {
                if (role !== 'superadmin') {
                    router.push('/dashboard')
                } else if (pathname === '/admin/login') {
                    router.push('/admin')
                }
            }
        }
    }, [role, isAuthenticated, isLoading, router, pathname])

    const handleLogout = () => {
        logout()
        router.push('/')
    }

    if (pathname === '/admin/login') {
        return <main style={{ width: '100%', height: '100vh', background: '#0a0a0c' }}>{children}</main>
    }

    return (
        <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
            {/* ── SIDEBAR ── */}
            <aside style={{
                width: collapsed ? '64px' : '238px',
                flexShrink: 0,
                background: '#0a0a0a',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                transition: 'width .2s ease',
            }}>
                {/* Logo */}
                <Link href="/admin" style={{
                    padding: '24px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                }}>
                    <Zap size={24} style={{ color: 'var(--red)' }} />
                    {!collapsed && <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 800, color: 'var(--white)' }}>ADMIN</span>}
                </Link>

                {/* Nav */}
                <div style={{ flex: 1, padding: '20px 10px' }}>
                    {adminNav.map(item => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link key={item.name} href={item.href} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                fontSize: '14px',
                                marginBottom: '4px',
                                background: isActive ? 'rgba(255,77,106,.1)' : 'transparent',
                                color: isActive ? 'var(--red)' : 'var(--muted)',
                                fontWeight: isActive ? 600 : 400,
                                textDecoration: 'none',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                transition: 'all .15s',
                            }}>
                                <Icon size={18} />
                                {!collapsed && item.name}
                            </Link>
                        )
                    })}
                </div>

                {/* Bottom */}
                <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
                    <div
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse</span></>}
                    </div>
                    <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--muted)' }}>
                        <LogOut size={18} />
                        {!collapsed && <span style={{ fontSize: '14px' }}>Logout</span>}
                    </div>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <main style={{ flex: 1, overflowY: 'auto', background: 'var(--navy)', height: '100vh' }}>
                <div style={{
                    height: '64px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 40px',
                    background: 'rgba(6,14,26,0.6)',
                    backdropFilter: 'blur(8px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>Control Center</div>
                </div>
                <div style={{ padding: '40px' }}>
                    {children}
                </div>
            </main>
        </div>
    )
}
