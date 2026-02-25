'use client'
import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { releases as releasesApi, devices as devicesApi, dashboard as dashboardApi, auth, type Release, type Device, type DailyMetric } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Smartphone, CheckCircle2, TrendingUp, RotateCcw, Monitor, Apple, HardDrive } from 'lucide-react'

const chColor: Record<string, { bg: string; color: string }> = {
  production: { bg: 'rgba(0,229,160,.12)', color: '#00e5a0' },
  staging: { bg: 'rgba(255,184,48,.12)', color: '#ffb830' },
  beta: { bg: 'rgba(0,212,255,.12)', color: '#00d4ff' },
}


function timeAgo(dateStr: string): string {
  if (!dateStr) return 'never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const kpiMeta = [
  { label: 'Active Devices', key: 'active_devices', icon: Smartphone, iconColor: 'var(--cyan)', iconBg: 'rgba(0,212,255,.12)', delta: '↑ 12.4%', up: true },
  { label: 'Updates Delivered', key: 'updates_delivered', icon: CheckCircle2, iconColor: 'var(--green)', iconBg: 'rgba(0,229,160,.12)', delta: '↑ 8.7%', up: true },
  { label: 'Success Rate', key: 'install_rate', icon: TrendingUp, iconColor: 'var(--amber)', iconBg: 'rgba(255,184,48,.12)', delta: '↓ 0.2%', up: false },
  { label: 'Bandwidth Saved', key: 'bandwidth_saved', icon: HardDrive, iconColor: 'var(--cyan)', iconBg: 'rgba(0,212,255,.12)', delta: 'Total saved', up: true },
]

export default function DashboardPage() {
  const [releaseList, setReleaseList] = useState<Release[]>([])
  const [deviceList, setDeviceList] = useState<Device[]>([])
  const [stats, setStats] = useState({ active_devices: 0, updates_delivered: 0, install_rate: 0, bandwidth_saved: 0 })
  const [loading, setLoading] = useState(true)
  const lineRef = useRef<HTMLCanvasElement>(null)
  const donutRef = useRef<HTMLCanvasElement>(null)
  const chartsInit = useRef(false)

  const { isAuthenticated, isLoading: authLoading, app } = useAuth()

  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return
      const appId = app?.id || ''
      try {
        const [relRes, devRes, statsRes] = await Promise.allSettled([
          releasesApi.list({ per_page: 5 }),
          devicesApi.list(appId),
          dashboardApi.getStats()
        ])

        const rels = relRes.status === 'fulfilled' ? relRes.value.data : []
        const devs = devRes.status === 'fulfilled' ? devRes.value : []

        setReleaseList(rels || [])
        setDeviceList(devs || [])

        if (statsRes.status === 'fulfilled') {
          setStats({
            active_devices: statsRes.value.total_devices,
            updates_delivered: statsRes.value.updates_delivered,
            install_rate: statsRes.value.success_rate,
            bandwidth_saved: statsRes.value.bandwidth_saved
          })
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
      } finally { setLoading(false) }
    }
    if (!authLoading) {
      fetchData()
    }
  }, [isAuthenticated, authLoading, app?.id])

  useEffect(() => {
    if (loading) return
    let isMounted = true
      ; (async () => {
        const { Chart, registerables } = await import('chart.js')
        if (!isMounted) return
        Chart.register(...registerables)
        Chart.defaults.color = '#5c7a9e'
        Chart.defaults.font.family = 'JetBrains Mono,monospace'

        // Fetch Trends and Distribution for charts
        let trends, dist;
        try {
          [trends, dist] = await Promise.all([
            dashboardApi.getTrends(),
            dashboardApi.getDistribution()
          ])
        } catch (err) {
          console.error('Failed to fetch chart data', err)
          return
        }

        if (!isMounted) return

        const destroyExisting = (canvas: HTMLCanvasElement | null) => {
          if (canvas) {
            const existingChart = Chart.getChart(canvas)
            if (existingChart) existingChart.destroy()
          }
        }

        if (lineRef.current) {
          destroyExisting(lineRef.current)
          const ctx = lineRef.current.getContext('2d')!
          const dau = trends.daily_active_devices || []
          const labels = dau.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
          const dauValues = dau.map(d => d.value)
          const installValues = (trends.installations || []).map(d => d.value)

          const gC = ctx.createLinearGradient(0, 0, 0, 210); gC.addColorStop(0, 'rgba(0,212,255,.22)'); gC.addColorStop(1, 'rgba(0,212,255,0)')
          const gG = ctx.createLinearGradient(0, 0, 0, 210); gG.addColorStop(0, 'rgba(0,229,160,.16)'); gG.addColorStop(1, 'rgba(0,229,160,0)')

          new Chart(ctx, {
            type: 'line', data: {
              labels, datasets: [
                { label: 'Active Devices', data: dauValues, borderColor: '#00d4ff', backgroundColor: gC, fill: true, tension: .4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
                { label: 'Installations', data: installValues, borderColor: '#00e5a0', backgroundColor: gG, fill: true, tension: .4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
              ]
            }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0a1628', borderColor: 'rgba(0,212,255,.2)', borderWidth: 1 } }, scales: { x: { grid: { color: 'rgba(0,212,255,.04)' }, ticks: { maxTicksLimit: 6 } }, y: { grid: { color: 'rgba(0,212,255,.05)' } } } }
          })
        }

        if (donutRef.current) {
          destroyExisting(donutRef.current)
          const ctx = donutRef.current.getContext('2d')!
          const topDist = dist.slice(0, 4)
          new Chart(ctx, {
            type: 'doughnut', data: { labels: topDist.map(e => e.version), datasets: [{ data: topDist.map(e => Math.round(e.percent)), backgroundColor: ['#00d4ff', '#00aacc', '#006688', '#003344'], borderColor: '#0a1628', borderWidth: 3 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } } } }
          })
        }
      })()
    return () => { isMounted = false }
  }, [loading])

  const formatVal = (key: string, val: number) => {
    if (key === 'install_rate') return val.toFixed(1) + '%'
    if (key === 'bandwidth_saved') {
      if (val === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(val) / Math.log(k))
      return parseFloat((val / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }
    if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M'
    return val.toLocaleString()
  }

  return (
    <DashboardLayout title="Overview">
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
        {kpiMeta.map(k => {
          const Icon = k.icon
          const val = stats[k.key as keyof typeof stats]
          return (
            <div key={k.label} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', padding: '20px 22px', transition: 'border-color .2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>{k.label}</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: k.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} style={{ color: k.iconColor }} strokeWidth={2} />
                </div>
              </div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '28px', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '7px' }}>{formatVal(k.key, val)}</div>
              <div style={{ fontSize: '11.5px', color: k.up ? 'var(--green)' : 'var(--red)' }}>{k.delta} <span style={{ color: 'var(--muted)' }}>vs last month</span></div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 700, letterSpacing: '-.3px' }}>Update Deliveries</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Last 30 days · All channels</div>
            </div>
            <div style={{ display: 'flex', gap: '14px' }}>
              {[{ c: 'var(--cyan)', l: 'Android' }, { c: 'var(--green)', l: 'iOS' }].map(it => (
                <div key={it.l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--muted)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: it.c }} />{it.l}
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: '210px', position: 'relative' }}><canvas ref={lineRef} /></div>
        </div>
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', padding: '22px' }}>
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 700, letterSpacing: '-.3px' }}>Version Distribution</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Active devices today</div>
          </div>
          <div style={{ height: '210px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas ref={donutRef} style={{ maxHeight: '200px' }} />
          </div>
        </div>
      </div>

      {/* Bottom tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 700 }}>Recent Releases</div>
            <a href="/dashboard/releases" style={{ fontSize: '12px', color: 'var(--cyan)', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>View all →</a>
          </div>
          <table>
            <thead><tr><th>Version</th><th>Channel</th><th>Rollout</th><th>Status</th><th>Published</th></tr></thead>
            <tbody>
              {releaseList.slice(0, 5).map((r) => (
                <tr key={r.id}>
                  <td><span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '11.5px', padding: '2px 9px', borderRadius: '5px', background: 'var(--cdim)', color: 'var(--cyan)', border: '1px solid rgba(0,212,255,.18)' }}>{r.version}</span></td>
                  <td><span style={{ fontSize: '10.5px', padding: '2px 7px', borderRadius: '4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px', background: (chColor[r.channel] || chColor.production).bg, color: (chColor[r.channel] || chColor.production).color }}>{r.channel}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div className="ptrack"><div className="pfill" style={{ width: `${r.rollout_percentage}%` }} /></div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.rollout_percentage}%</span>
                    </div>
                  </td>
                  <td><span className={`status-dot ${r.is_active ? 'on' : 'off'}`} style={{ fontSize: '12px' }}>{r.is_active ? 'Live' : 'Superseded'}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: '11px' }}>{timeAgo(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '13px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 700 }}>Active Devices</div>
            <a href="/dashboard/devices" style={{ fontSize: '12px', color: 'var(--cyan)', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>View all →</a>
          </div>
          {deviceList.slice(0, 5).map(d => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 22px', borderBottom: '1px solid rgba(0,212,255,.05)', cursor: 'pointer', transition: 'background .15s' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: d.platform === 'android' ? 'rgba(0,229,160,.1)' : 'rgba(200,200,255,.07)' }}>
                {d.platform === 'android' ? <Monitor size={14} style={{ color: 'var(--green)' }} /> : <Apple size={14} style={{ color: '#c8c8ff' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '11.5px' }}>{d.device_id}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>{d.platform}</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '11.5px', color: 'var(--cyan)' }}>{d.current_version}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
