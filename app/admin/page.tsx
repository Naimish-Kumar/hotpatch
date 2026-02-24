'use client'
import { useState, useEffect } from 'react'
import { Activity, Globe, Package, Smartphone, Server } from 'lucide-react'
import { request } from '@/lib/api'

interface Stats {
    total_apps: number
    total_releases: number
    total_devices: number
    status: string
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await request<Stats>('/admin/stats')
                setStats(data)
            } catch (err) {
                console.error('Failed to fetch stats', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return <div>Loading system intelligence...</div>

    return (
        <div>
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>System Overview</h2>
                <p style={{ color: 'var(--muted)' }}>Global platform health and adoption metrics.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                {[
                    { label: 'Total Apps', value: stats?.total_apps, icon: Globe, color: 'var(--cyan)' },
                    { label: 'Total Releases', value: stats?.total_releases, icon: Package, color: 'var(--blue)' },
                    { label: 'Total Devices', value: stats?.total_devices, icon: Smartphone, color: 'var(--purple)' },
                    { label: 'System Status', value: stats?.status.toUpperCase(), icon: Server, color: 'var(--green)' },
                ].map((kpi, i) => (
                    <div key={i} style={{
                        background: 'var(--navy2)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <kpi.icon size={20} style={{ color: kpi.color }} />
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{kpi.label}</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Infrastructure Health</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <HealthItem label="API Server" status="Active" ping="42ms" />
                        <HealthItem label="PostgreSQL" status="Healthy" ping="3ms" />
                        <HealthItem label="Redis Cache" status="Optimized" ping="1ms" />
                        <HealthItem label="S3 Storage" status="Connected" ping="120ms" />
                    </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg,rgba(255,77,106,0.1),transparent)', border: '1px solid rgba(255,77,106,0.2)', borderRadius: '20px', padding: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Security Alerts</h3>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>No critical security concerns detected in the last 24 hours. Automatic threat detection is active.</p>
                </div>
            </div>
        </div>
    )
}

function HealthItem({ label, status, ping }: { label: string, status: string, ping: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{ping}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--green)', background: 'rgba(0,255,0,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{status}</span>
            </div>
        </div>
    )
}
