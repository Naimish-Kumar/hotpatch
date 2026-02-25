'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Activity, Globe, Package, Smartphone, Server, Shield } from 'lucide-react'
import { request } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface Stats {
    total_apps: number
    total_releases: number
    total_devices: number
    status: string
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    const { isAuthenticated, isLoading: authLoading } = useAuth()

    useEffect(() => {
        const fetchStats = async () => {
            if (!isAuthenticated) return
            try {
                const data = await request<Stats>('/admin/stats')
                setStats(data)
            } catch (err) {
                console.error('Failed to fetch stats', err)
            } finally {
                setLoading(false)
            }
        }
        if (!authLoading) {
            fetchStats()
        }
    }, [isAuthenticated, authLoading])

    if (loading) return <div>Loading system intelligence...</div>

    return (
        <div style={{ maxWidth: '1200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>Control Center</h2>
                    <p style={{ color: 'var(--muted)' }}>Global platform health and operational intelligence.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href="/admin/apps" style={{
                        padding: '10px 20px',
                        background: 'var(--navy2)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>View Apps</Link>
                    <Link href="/admin/settings" style={{
                        padding: '10px 20px',
                        background: 'var(--red)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>System Settings</Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                {[
                    { label: 'Platform Apps', value: stats?.total_apps, icon: Globe, color: 'var(--cyan)' },
                    { label: 'Deployments', value: stats?.total_releases, icon: Package, color: 'var(--blue)' },
                    { label: 'Client Nodes', value: stats?.total_devices, icon: Smartphone, color: 'var(--purple)' },
                    { label: 'Engine Status', value: stats?.status.toUpperCase(), icon: Server, color: 'var(--green)' },
                ].map((kpi, i) => (
                    <div key={i} style={{
                        background: 'var(--navy2)',
                        border: '1px solid var(--border)',
                        borderRadius: '20px',
                        padding: '24px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}>
                            <kpi.icon size={80} style={{ color: kpi.color }} />
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{kpi.label}</div>
                        <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{kpi.value || '0'}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Infrastructure Heartbeat</h3>
                        <div style={{ fontSize: '12px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)' }} />
                            Operational
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <HealthItem label="API Node (Go)" status="Active" ping="42ms" color="var(--cyan)" />
                        <HealthItem label="Database (PG)" status="Healthy" ping="3ms" color="var(--blue)" />
                        <HealthItem label="Cache (Redis)" status="Optimized" ping="1ms" color="var(--purple)" />
                        <HealthItem label="Object Store" status="Connected" ping="120ms" color="var(--green)" />
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03), transparent)',
                    border: '1px solid var(--border)',
                    borderRadius: '24px',
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <Shield size={32} style={{ color: 'var(--red)', marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Security Perimeter</h3>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>
                        All administrative actions are being audited. Unauthorized access attempts are automatically logged to the security service.
                    </p>
                    <button style={{
                        marginTop: '24px',
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}>Download Audit Logs</button>
                </div>
            </div>
        </div>
    )
}

function HealthItem({ label, status, ping, color }: { label: string, status: string, ping: string, color: string }) {
    return (
        <div style={{
            padding: '16px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.03)'
        }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--muted)' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: color }}>{status}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted2)', fontFamily: 'JetBrains Mono' }}>{ping}</span>
            </div>
        </div>
    )
}

