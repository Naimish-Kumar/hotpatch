'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { devices as devicesApi, auth, type Device } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Search, Monitor, Apple, Smartphone, Activity, Clock } from 'lucide-react'

function timeAgo(dateStr: string): string {
    if (!dateStr) return 'never'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

export default function DevicesPage() {
    const [deviceList, setDeviceList] = useState<Device[]>([])
    const [loading, setLoading] = useState(true)
    const [platformFilter, setPlatformFilter] = useState<'all' | 'android' | 'ios'>('all')
    const [search, setSearch] = useState('')

    const { isAuthenticated, isLoading: authLoading, app } = useAuth()

    useEffect(() => {
        async function fetchDevices() {
            if (!isAuthenticated) return
            try {
                const devs = await devicesApi.list(app?.id || '')
                setDeviceList(devs || [])
            } catch (err) {
                console.error('Failed to fetch devices', err)
            } finally {
                setLoading(false)
            }
        }
        if (!authLoading) {
            fetchDevices()
        }
    }, [isAuthenticated, authLoading, app?.id])

    const filtered = deviceList.filter(d => {
        if (platformFilter !== 'all' && d.platform !== platformFilter) return false
        if (search && !d.device_id.toLowerCase().includes(search.toLowerCase()) && !d.current_version.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const androidCount = deviceList.filter(d => d.platform === 'android').length
    const iosCount = deviceList.filter(d => d.platform === 'ios').length
    const versionCounts: Record<string, number> = {}
    deviceList.forEach(d => { versionCounts[d.current_version] = (versionCounts[d.current_version] || 0) + 1 })
    const versionEntries = Object.entries(versionCounts).sort((a, b) => b[1] - a[1])

    return (
        <DashboardLayout title="Devices">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 800, letterSpacing: '-.5px' }}>Registered Devices</h2>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>{deviceList.length} total · {filtered.length} shown</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search device ID or OS..."
                            style={{ padding: '7px 12px 7px 32px', fontSize: '12px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--white)', outline: 'none', width: '200px', fontFamily: 'Inter,sans-serif' }}
                        />
                    </div>
                    {(['all', 'android', 'ios'] as const).map(p => (
                        <button key={p} onClick={() => setPlatformFilter(p)} style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: platformFilter === p ? '1px solid var(--cyan)' : '1px solid var(--border)', background: platformFilter === p ? 'var(--cdim)' : 'transparent', color: platformFilter === p ? 'var(--cyan)' : 'var(--muted)', cursor: 'pointer', textTransform: 'capitalize', transition: 'all .15s' }}>{p === 'all' ? 'All Platforms' : p}</button>
                    ))}
                </div>
            </div>

            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', padding: '18px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(0,212,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Smartphone size={15} style={{ color: 'var(--cyan)' }} /></div>
                        <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>Total Devices</span>
                    </div>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>{deviceList.length.toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', padding: '18px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(0,229,160,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={15} style={{ color: 'var(--green)' }} /></div>
                        <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>Platform Split</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Monitor size={13} style={{ color: 'var(--green)' }} /><span style={{ fontFamily: 'Syne,sans-serif', fontSize: '22px', fontWeight: 800 }}>{androidCount}</span></div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Android</div>
                        </div>
                        <div style={{ width: '1px', background: 'var(--border)' }} />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Apple size={13} style={{ color: '#c8c8ff' }} /><span style={{ fontFamily: 'Syne,sans-serif', fontSize: '22px', fontWeight: 800 }}>{iosCount}</span></div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>iOS</div>
                        </div>
                    </div>
                </div>
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', padding: '18px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,184,48,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={15} style={{ color: 'var(--amber)' }} /></div>
                        <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>Version Breakdown</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {versionEntries.slice(0, 3).map(([ver, count]) => (
                            <div key={ver} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '11.5px', color: 'var(--cyan)' }}>{ver}</span>
                                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{count} devices</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Device list */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', overflow: 'hidden' }}>
                <table>
                    <thead>
                        <tr><th>Device ID</th><th>Platform</th><th>Current Version</th><th>Last Seen</th></tr>
                    </thead>
                    <tbody>
                        {filtered.map(d => (
                            <tr key={d.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: d.platform === 'android' ? 'rgba(0,229,160,.1)' : 'rgba(200,200,255,.07)' }}>
                                            {d.platform === 'android' ? <Monitor size={13} style={{ color: 'var(--green)' }} /> : <Apple size={13} style={{ color: '#c8c8ff' }} />}
                                        </div>
                                        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '11.5px' }}>{d.device_id}</span>
                                    </div>
                                </td>
                                <td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{d.platform}</td>
                                <td><span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '11.5px', color: 'var(--cyan)' }}>{d.current_version}</span></td>
                                <td style={{ fontSize: '11px', color: 'var(--muted)' }}>{timeAgo(d.last_seen)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    )
}
