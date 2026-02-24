'use client'
import { useState, useEffect } from 'react'
import { Globe, Search, Filter, MoreHorizontal, ArrowUpRight } from 'lucide-react'
import { request } from '@/lib/api'

interface AppInfo {
    id: string
    name: string
    platform: string
    created_at: string
}

export default function AdminApps() {
    const [apps, setApps] = useState<AppInfo[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const data = await request<AppInfo[]>('/admin/apps')
                setApps(data)
            } catch (err) {
                console.error('Failed to fetch apps', err)
            } finally {
                setLoading(false)
            }
        }
        fetchApps()
    }, [])

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>Global Directory</h2>
                    <p style={{ color: 'var(--muted)' }}>Manage all {apps.length} applications registered on the platform.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
                        <input placeholder="Search apps..." style={{
                            padding: '10px 14px 10px 36px',
                            background: 'var(--navy2)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            outline: 'none',
                        }} />
                    </div>
                    <button style={{
                        padding: '10px 20px',
                        background: 'var(--navy2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--white)',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }}><Filter size={16} /> Filter</button>
                </div>
            </div>

            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Application</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Platform</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Created</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '16px 24px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.map((app) => (
                            <tr key={app.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s' }} className="hover-row">
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--cdim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Globe size={18} style={{ color: 'var(--cyan)' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: 700 }}>{app.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--muted2)', fontFamily: 'JetBrains Mono, monospace' }}>{app.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: 'var(--cdim)', color: 'var(--muted)' }}>{app.platform.toUpperCase()}</span>
                                </td>
                                <td style={{ padding: '20px 24px', fontSize: '14px', color: 'var(--muted)' }}>
                                    {new Date(app.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
                                        <span style={{ fontSize: '13px' }}>Active</span>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><MoreHorizontal size={20} /></button>
                                        <button style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', cursor: 'pointer' }}><ArrowUpRight size={20} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {apps.length === 0 && !loading && (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>No applications registered yet.</div>
                )}
            </div>

            <style jsx>{`
                .hover-row:hover {
                    background: rgba(255,255,255,0.03);
                }
            `}</style>
        </div>
    )
}
