'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/lib/auth-context'
import {
    LayoutDashboard, Package, Smartphone, GitBranch, BarChart3, ShieldCheck, ShieldAlert,
    Settings, Bell, Zap, ChevronLeft, ChevronRight, ChevronDown, LogOut,
    ChevronsUpDown
} from 'lucide-react'

const navSections = [
    {
        label: 'Overview',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Releases', href: '/dashboard/releases', icon: Package },
            { name: 'Devices', href: '/dashboard/devices', icon: Smartphone },
        ],
    },
    {
        label: 'Manage',
        items: [
            { name: 'Channels', href: '/dashboard/channels', icon: GitBranch },
            { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
            { name: 'Security', href: '/dashboard/security', icon: ShieldCheck },
        ],
    },
    {
        label: 'Account',
        items: [
            { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        ],
    },
]

export function DashboardLayout({ children, title }: { children: React.ReactNode; title?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, app, logout, role } = useAuth()
    const [collapsed, setCollapsed] = useState(false)
    const isSuper = role === 'superadmin'

    const handleLogout = () => {
        logout()
        router.push('/')
    }

    return (
        <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
            {/* ── SIDEBAR ── */}
            <aside style={{
                width: collapsed ? '64px' : '238px',
                flexShrink: 0,
                background: 'var(--navy2)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                height: '100vh',
                transition: 'width .2s ease',
            }}>
                {/* Logo */}
                <Link href="/" style={{
                    padding: collapsed ? '18px 14px 14px' : '18px 18px 14px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                }}>
                    {collapsed
                        ? <Zap size={20} style={{ color: 'var(--cyan)' }} />
                        : <Logo width={140} height={30} />
                    }
                </Link>

                {/* App selector */}
                {!collapsed && (
                    <div style={{ padding: '10px 10px 2px' }}>
                        {isSuper && (
                            <Link href="/admin" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 14px',
                                background: 'rgba(255,77,106,.1)',
                                color: 'var(--red)',
                                fontSize: '12px',
                                fontWeight: 700,
                                borderRadius: '9px',
                                textDecoration: 'none',
                                marginBottom: '10px',
                                border: '1px solid rgba(255,77,106,.2)',
                                transition: 'all .2s'
                            }}>
                                <ShieldAlert size={14} />
                                <span>Switch to Admin</span>
                            </Link>
                        )}
                        <div style={{
                            padding: '10px 14px',
                            margin: '0 0 2px',
                            border: '1px solid var(--border)',
                            borderRadius: '9px',
                            background: 'rgba(0,212,255,.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div>
                                <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginBottom: '2px' }}>Current App</div>
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>{app?.name || 'MyApp Production'}</div>
                            </div>
                            <ChevronsUpDown size={14} style={{ color: 'var(--muted)' }} />
                        </div>
                    </div>
                )}

                {/* Navigation */}
                {navSections.map(section => (
                    <div key={section.label} style={{ padding: '14px 10px 2px' }}>
                        {!collapsed && (
                            <div style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                color: 'var(--muted2)',
                                padding: '0 8px',
                                marginBottom: '3px',
                            }}>{section.label}</div>
                        )}
                        {section.items.map(item => {
                            const isActive = pathname === item.href
                            const Icon = item.icon
                            return (
                                <Link key={item.name} href={item.href} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '9px',
                                    padding: collapsed ? '8px' : '8px 10px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    marginBottom: '1px',
                                    background: isActive ? 'var(--cdim)' : 'transparent',
                                    color: isActive ? 'var(--cyan)' : 'var(--muted)',
                                    fontWeight: isActive ? 500 : 400,
                                    textDecoration: 'none',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    transition: 'all .15s',
                                }}>
                                    <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                                    {!collapsed && item.name}
                                </Link>
                            )
                        })}
                    </div>
                ))}

                {/* Bottom user section */}
                <div style={{ marginTop: 'auto', padding: '14px 10px', borderTop: '1px solid var(--border)' }}>
                    {/* Collapse toggle */}
                    <div
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: '9px',
                            padding: '7px 9px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: 'var(--muted)',
                            marginBottom: '6px',
                        }}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
                    </div>

                    {/* User */}
                    <div
                        onClick={handleLogout}
                        title="Click to logout"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                            padding: '7px 9px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                        }}
                    >
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: user?.avatar_url ? `url(${user.avatar_url}) center/cover` : 'linear-gradient(135deg,var(--cyan),var(--blue))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--navy)',
                            flexShrink: 0,
                            border: '1px solid rgba(0,212,255,.2)'
                        }}>
                            {!user?.avatar_url && (user?.display_name?.slice(0, 2).toUpperCase() || 'HP')}
                        </div>
                        {!collapsed && (
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user?.display_name || app?.name || 'User'}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {role === 'superadmin' ? 'Superadmin' : 'Pro Plan'}
                                </div>
                            </div>
                        )}
                        {!collapsed && <LogOut size={14} style={{ color: 'var(--muted)', marginLeft: '4px' }} />}
                    </div>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <main style={{ flex: 1, overflowY: 'auto', background: 'var(--navy)', height: '100vh' }}>
                {/* Topbar */}
                <div style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    padding: '0 30px',
                    height: '58px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(6,14,26,0.9)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <div style={{
                        fontFamily: 'Syne,sans-serif',
                        fontSize: '17px',
                        fontWeight: 800,
                        letterSpacing: '-.4px',
                    }}>{title || 'Dashboard'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <button style={{
                            width: '33px',
                            height: '33px',
                            borderRadius: '7px',
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}><Bell size={15} /></button>
                        <Link href="/dashboard/releases" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '7px 16px',
                            background: 'var(--cyan)',
                            color: 'var(--navy)',
                            border: 'none',
                            borderRadius: '7px',
                            fontFamily: 'Inter,sans-serif',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            transition: 'all .18s',
                        }}><Zap size={14} /> New Release</Link>
                    </div>
                </div>

                <div style={{ padding: '26px 30px' }}>
                    {children}
                </div>
            </main>
        </div>
    )
}
