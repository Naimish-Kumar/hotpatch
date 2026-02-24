'use client'
import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Timer, TrendingUp, AlertCircle, HardDrive, Users, RotateCcw } from 'lucide-react'
import { dashboard, DashboardOverview, DailyMetric, VersionDistribution } from '@/lib/api'

const kpis = [
    { label: 'Avg Install Time', value: '1.2s', delta: '-0.3s', up: true, icon: Timer, iconColor: 'var(--cyan)', iconBg: 'rgba(0,212,255,.12)' },
    { label: 'Success Rate', value: '98.3%', delta: '+0.7%', up: true, icon: TrendingUp, iconColor: 'var(--green)', iconBg: 'rgba(0,229,160,.12)' },
    { label: 'Failed Updates', value: '142', delta: '-23', up: true, icon: AlertCircle, iconColor: 'var(--red)', iconBg: 'rgba(255,77,106,.12)' },
    { label: 'Avg Bundle Size', value: '2.4 MB', delta: '-0.1 MB', up: true, icon: HardDrive, iconColor: 'var(--amber)', iconBg: 'rgba(255,184,48,.12)' },
    { label: 'Active Users', value: '84.2k', delta: '+12.4%', up: true, icon: Users, iconColor: 'var(--cyan)', iconBg: 'rgba(0,212,255,.12)' },
    { label: 'Rollback Rate', value: '0.04%', delta: '-0.01%', up: true, icon: RotateCcw, iconColor: 'var(--green)', iconBg: 'rgba(0,229,160,.12)' },
]

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function AnalyticsPage() {
    const lineRef = useRef<HTMLCanvasElement>(null)
    const barRef = useRef<HTMLCanvasElement>(null)
    const pieRef = useRef<HTMLCanvasElement>(null)
    const heatRef = useRef<HTMLCanvasElement>(null)
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
    const [stats, setStats] = useState<DashboardOverview | null>(null)
    const [trends, setTrends] = useState<Record<string, DailyMetric[]> | null>(null)
    const [distribution, setDistribution] = useState<VersionDistribution[]>([])
    const chartsRef = useRef<any[]>([])

    useEffect(() => {
        const load = async () => {
            try {
                const [s, t, d] = await Promise.all([
                    dashboard.getStats(),
                    dashboard.getTrends(),
                    dashboard.getDistribution()
                ])
                setStats(s)
                setTrends(t)
                setDistribution(d)
            } catch (e) {
                console.error('Failed to load analytics', e)
            }
        }
        load()
    }, [])

    useEffect(() => {
        chartsRef.current.forEach(c => c?.destroy())
        chartsRef.current = []
            ; (async () => {
                const { Chart, registerables } = await import('chart.js')
                Chart.register(...registerables)
                Chart.defaults.color = '#5c7a9e'
                Chart.defaults.font.family = 'JetBrains Mono,monospace'

                const days = period === '7d' ? 7 : period === '30d' ? 30 : 90

                if (lineRef.current && trends) {
                    const dau = trends.daily_active_devices || []
                    const installs = trends.installations || []

                    const labels = dau.slice(-days).map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
                    const dauData = dau.slice(-days).map(d => d.value)
                    const installData = installs.slice(-days).map(d => d.value)

                    const ctx = lineRef.current.getContext('2d')!
                    const gC = ctx.createLinearGradient(0, 0, 0, 210); gC.addColorStop(0, 'rgba(0,212,255,.18)'); gC.addColorStop(1, 'rgba(0,212,255,0)')
                    const gG = ctx.createLinearGradient(0, 0, 0, 210); gG.addColorStop(0, 'rgba(0,229,160,.14)'); gG.addColorStop(1, 'rgba(0,229,160,0)')
                    const c = new Chart(ctx, {
                        type: 'line', data: {
                            labels, datasets: [
                                { label: 'Active Devices', data: dauData, borderColor: '#00d4ff', backgroundColor: gC, fill: true, tension: .4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
                                { label: 'Installations', data: installData, borderColor: '#00e5a0', backgroundColor: gG, fill: true, tension: .4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
                            ]
                        }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0a1628', borderColor: 'rgba(0,212,255,.2)', borderWidth: 1, titleColor: '#f0f6ff', bodyColor: '#5c7a9e', padding: 10, titleFont: { family: 'Inter' }, bodyFont: { family: 'Inter' } } }, scales: { x: { grid: { color: 'rgba(0,212,255,.04)' }, ticks: { maxTicksLimit: 6, font: { size: 10 } } }, y: { grid: { color: 'rgba(0,212,255,.05)' }, ticks: { font: { size: 10 } } } } }
                    })
                    chartsRef.current.push(c)
                }

                if (pieRef.current && distribution.length > 0) {
                    const c = new Chart(pieRef.current.getContext('2d')!, {
                        type: 'doughnut', data: { labels: distribution.map(d => d.version), datasets: [{ data: distribution.map(d => d.count), backgroundColor: ['#00d4ff', '#00e5a0', '#ffb830', '#ff4d6a', '#1a3a6b'], borderColor: '#0a1628', borderWidth: 3, hoverOffset: 5 }] },
                        options: { responsive: true, maintainAspectRatio: false, cutout: '66%', plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11, family: 'Inter' }, boxWidth: 9, boxHeight: 9 } }, tooltip: { backgroundColor: '#0a1628', borderColor: 'rgba(0,212,255,.2)', borderWidth: 1, titleColor: '#f0f6ff', bodyColor: '#5c7a9e', padding: 9 } } }
                    })
                    chartsRef.current.push(c)
                }

                // Bar charts and Heatmaps (keep mock for now as backend doesn't provide hourly yet)
                if (barRef.current) {
                    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
                    const c = new Chart(barRef.current.getContext('2d')!, {
                        type: 'bar', data: { labels: hours, datasets: [{ label: 'Installs', data: hours.map((_, i) => { const h = i; return Math.round(300 + 700 * Math.exp(-((h - 14) ** 2) / 30) + Math.random() * 120) }), backgroundColor: 'rgba(0,212,255,.45)', borderColor: 'rgba(0,212,255,.7)', borderWidth: 1, borderRadius: 3 }] },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0a1628', borderColor: 'rgba(0,212,255,.2)', borderWidth: 1, titleColor: '#f0f6ff', bodyColor: '#5c7a9e', padding: 9 } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } }, y: { grid: { color: 'rgba(0,212,255,.05)' }, ticks: { font: { size: 10 } } } } }
                    })
                    chartsRef.current.push(c)
                }
            })()
        return () => { chartsRef.current.forEach(c => c?.destroy()); chartsRef.current = [] }
    }, [period, stats, trends, distribution])

    const kpis = [
        { label: 'Total Devices', value: stats?.total_devices ?? '...', delta: stats?.devices_trend ? `${stats.devices_trend > 0 ? '+' : ''}${stats.devices_trend}%` : '...', up: (stats?.devices_trend ?? 0) >= 0, icon: Users, iconColor: 'var(--cyan)', iconBg: 'rgba(0,212,255,.12)' },
        { label: 'Active (24h)', value: stats?.active_last_24h ?? '...', delta: 'Live', up: true, icon: TrendingUp, iconColor: 'var(--green)', iconBg: 'rgba(0,229,160,.12)' },
        { label: 'Success Rate', value: stats?.success_rate ? `${stats.success_rate.toFixed(1)}%` : '...', delta: 'Average', up: true, icon: TrendingUp, iconColor: 'var(--green)', iconBg: 'rgba(0,229,160,.12)' },
        { label: 'Releases', value: stats?.total_releases ?? '...', delta: 'Total', up: true, icon: HardDrive, iconColor: 'var(--amber)', iconBg: 'rgba(255,184,48,.12)' },
        { label: 'Bandwidth Saved', value: stats?.bandwidth_saved ? formatBytes(stats.bandwidth_saved) : '0 B', delta: 'Total Saved', up: true, icon: HardDrive, iconColor: 'var(--cyan)', iconBg: 'rgba(0,212,255,.12)' },
        { label: 'Failed Updates', value: '0', delta: '0%', up: true, icon: AlertCircle, iconColor: 'var(--red)', iconBg: 'rgba(255,77,106,.12)' },
    ]

    return (
        <DashboardLayout title="Analytics">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 800, letterSpacing: '-.5px' }}>Performance Analytics</h2>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Update delivery insights and error analysis</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {(['7d', '30d', '90d'] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)} style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: period === p ? '1px solid var(--cyan)' : '1px solid var(--border)', background: period === p ? 'var(--cdim)' : 'transparent', color: period === p ? 'var(--cyan)' : 'var(--muted)', cursor: 'pointer', transition: 'all .15s' }}>{p}</button>
                    ))}
                </div>
            </div>

            {/* KPI metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '12px', marginBottom: '20px' }}>
                {kpis.map(k => {
                    const Icon = k.icon
                    return (
                        <div key={k.label} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: k.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={14} style={{ color: k.iconColor }} strokeWidth={2} />
                                </div>
                            </div>
                            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>{k.value}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginTop: '4px' }}>{k.label}</div>
                            <div style={{ fontSize: '10.5px', color: k.up ? 'var(--green)' : 'var(--red)', marginTop: '2px' }}>{k.delta}</div>
                        </div>
                    )
                })}
            </div>

            {/* Charts row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', padding: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 700 }}>Update Deliveries</div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Last {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '14px' }}>
                            {[{ c: 'var(--cyan)', l: 'Android' }, { c: 'var(--green)', l: 'iOS' }].map(it => (
                                <div key={it.l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--muted)' }}>
                                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: it.c }} />{it.l}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: '220px', position: 'relative' }}><canvas ref={lineRef} /></div>
                </div>
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', padding: '22px' }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Failure Reasons</div>
                    <div style={{ height: '220px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <canvas ref={pieRef} style={{ maxHeight: '220px' }} />
                    </div>
                </div>
            </div>

            {/* Charts row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', padding: '22px' }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Installs by Hour</div>
                    <div style={{ height: '200px', position: 'relative' }}><canvas ref={barRef} /></div>
                </div>
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', padding: '22px' }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Activity by Day</div>
                    <div style={{ height: '200px', position: 'relative' }}><canvas ref={heatRef} /></div>
                </div>
            </div>
        </DashboardLayout >
    )
}
