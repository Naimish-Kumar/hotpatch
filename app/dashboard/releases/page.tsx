'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { releases as releasesApi, channels as channelsApi, auth, type Release, type Channel } from '@/lib/api'
import { AlertTriangle, X, RotateCcw, UploadCloud, FileUp, Info, Check, Loader2 } from 'lucide-react'

const chColor: Record<string, { bg: string; color: string }> = {
    production: { bg: 'rgba(0,229,160,.12)', color: '#00e5a0' },
    staging: { bg: 'rgba(255,184,48,.12)', color: '#ffb830' },
    beta: { bg: 'rgba(0,212,255,.12)', color: '#00d4ff' },
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

export default function ReleasesPage() {
    const [releaseList, setReleaseList] = useState<Release[]>([])
    const [channels, setChannels] = useState<Channel[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'superseded'>('all')
    const [selectedRelease, setSelectedRelease] = useState<Release | null>(null)
    const [rolloutValue, setRolloutValue] = useState(100)
    const [actionLoading, setActionLoading] = useState(false)
    const [createModalOpen, setCreateModalOpen] = useState(false)

    // Create form
    const [newVersion, setNewVersion] = useState('')
    const [newChannel, setNewChannel] = useState('production')
    const [isMandatory, setIsMandatory] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    const [toast, setToast] = useState('')

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        fetchReleases()
    }, [filter, statusFilter])

    async function fetchInitialData() {
        try {
            const chs = await channelsApi.list()
            setChannels(chs)
            if (chs.length > 0) setNewChannel(chs[0].slug)
        } catch (err) {
            console.error('Failed to fetch channels', err)
        }
    }

    async function fetchReleases() {
        setLoading(true)
        try {
            const app = auth.getApp()
            const params: any = { app_id: app?.id || '', per_page: 50 }
            if (filter !== 'all') params.channel = filter
            if (statusFilter === 'active') params.is_active = 'true'
            else if (statusFilter === 'superseded') params.is_active = 'false'
            const res = await releasesApi.list(params)
            setReleaseList(res.data || [])
        } catch (err) {
            console.error('Failed to fetch releases', err)
        } finally {
            setLoading(false)
        }
    }

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

    const handleRollback = async (release: Release) => {
        setActionLoading(true)
        try {
            await releasesApi.rollback(release.id)
            showToast(`Rolled back to ${release.version}`)
            fetchReleases()
        } catch (err: any) {
            showToast(err.message || 'Rollback failed')
        } finally {
            setActionLoading(false)
        }
    }

    const handleRolloutChange = async (release: Release, pct: number) => {
        setActionLoading(true)
        try {
            await releasesApi.updateRollout(release.id, pct)
            showToast(`Rollout updated to ${pct}%`)
            fetchReleases()
        } catch (err: any) {
            showToast(err.message || 'Rollout update failed')
        } finally {
            setActionLoading(false)
        }
    }

    const handleCreateRelease = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newVersion || !file) return
        setActionLoading(true)
        try {
            const formData = new FormData()
            formData.append('version', newVersion)
            formData.append('channel', newChannel)
            formData.append('mandatory', String(isMandatory))
            formData.append('bundle', file)

            await releasesApi.create(formData)
            showToast(`Release ${newVersion} published successfully`)
            setCreateModalOpen(false)
            setNewVersion('')
            setFile(null)
            fetchReleases()
        } catch (err: any) {
            showToast(err.message || 'Failed to create release')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <DashboardLayout title="Releases">
            {toast && (
                <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, background: 'var(--navy2)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '12px 20px', fontSize: '13px', fontWeight: 500, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>{toast}</div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 800, letterSpacing: '-.5px' }}>All Releases</h2>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                        {loading ? '---' : `${releaseList.length} releases discovered`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setCreateModalOpen(true)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--cyan)', color: 'var(--navy)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UploadCloud size={16} /> New Release
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button onClick={() => setFilter('all')} style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: filter === 'all' ? '1px solid var(--cyan)' : '1px solid var(--border)', background: filter === 'all' ? 'var(--cdim)' : 'transparent', color: filter === 'all' ? 'var(--cyan)' : 'var(--muted)', cursor: 'pointer', transition: 'all .15s' }}>All Channels</button>
                {channels.map(ch => (
                    <button key={ch.id} onClick={() => setFilter(ch.slug)} style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: filter === ch.slug ? '1px solid var(--cyan)' : '1px solid var(--border)', background: filter === ch.slug ? 'var(--cdim)' : 'transparent', color: filter === ch.slug ? 'var(--cyan)' : 'var(--muted)', cursor: 'pointer', transition: 'all .15s' }}>{ch.name}</button>
                ))}
                <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />
                {(['all', 'active', 'superseded'] as const).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: statusFilter === s ? '1px solid var(--cyan)' : '1px solid var(--border)', background: statusFilter === s ? 'var(--cdim)' : 'transparent', color: statusFilter === s ? 'var(--cyan)' : 'var(--muted)', cursor: 'pointer', textTransform: 'capitalize', transition: 'all .15s' }}>{s === 'all' ? 'All Status' : s}</button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--muted)' }}>
                    <Loader2 size={32} className="spinning" />
                </div>
            ) : releaseList.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'var(--navy2)', border: '1px dashed var(--border)', borderRadius: '16px', color: 'var(--muted)' }}>
                    <UploadCloud size={40} style={{ marginBottom: '14px', opacity: 0.5 }} />
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>No releases found</div>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Start by publishing your first hotpatch release.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {releaseList.map(r => (
                        <div key={r.id} onClick={() => { setSelectedRelease(r); setRolloutValue(r.rollout_percentage) }} style={{ background: selectedRelease?.id === r.id ? 'rgba(0,212,255,.04)' : 'var(--navy2)', border: selectedRelease?.id === r.id ? '1px solid var(--border2)' : '1px solid var(--border)', borderRadius: '12px', padding: '18px 22px', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto', alignItems: 'center', gap: '16px', transition: 'all .15s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '13px', padding: '3px 11px', borderRadius: '6px', background: 'var(--cdim)', color: 'var(--cyan)', border: '1px solid rgba(0,212,255,.18)', fontWeight: 500 }}>{r.version}</span>
                                {r.mandatory && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,77,106,.12)', color: 'var(--red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}><AlertTriangle size={10} /> MANDATORY</span>}
                            </div>
                            <span style={{ fontSize: '10.5px', padding: '3px 9px', borderRadius: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', background: (chColor[r.channel] || chColor.production).bg, color: (chColor[r.channel] || chColor.production).color }}>{r.channel}</span>
                            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '11px', color: 'var(--muted2)' }}>{r.hash.slice(0, 8)}...</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: '90px' }}>
                                <div className="ptrack"><div className="pfill" style={{ width: `${r.rollout_percentage}%` }} /></div>
                                <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'JetBrains Mono,monospace' }}>{r.rollout_percentage}%</span>
                            </div>
                            <span className={`status-dot ${r.is_active ? 'on' : 'off'}`} style={{ fontSize: '12px' }}>{r.is_active ? 'Live' : 'Superseded'}</span>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', minWidth: '60px', textAlign: 'right' }}>{timeAgo(r.created_at)}</span>
                        </div>
                    ))}
                </div>
            )}

            {selectedRelease && (
                <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', zIndex: 100, background: 'var(--navy2)', borderLeft: '1px solid var(--border2)', boxShadow: '-20px 0 60px rgba(0,0,0,.5)', overflowY: 'auto', padding: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: 800 }}>Release Details</h3>
                        <button onClick={() => setSelectedRelease(null)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '10.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Version</div>
                            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '18px', color: 'var(--cyan)', fontWeight: 600 }}>{selectedRelease.version}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '10.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Channel</div>
                                <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '5px', fontWeight: 600, textTransform: 'uppercase', background: (chColor[selectedRelease.channel] || chColor.production).bg, color: (chColor[selectedRelease.channel] || chColor.production).color }}>{selectedRelease.channel}</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '10.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Status</div>
                                <span className={`status-dot ${selectedRelease.is_active ? 'on' : 'off'}`} style={{ fontSize: '13px' }}>{selectedRelease.is_active ? 'Live' : 'Superseded'}</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>SHA256 Hash</div>
                            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '12px', color: 'var(--muted)', wordBreak: 'break-all' }}>{selectedRelease.hash}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Rollout Percentage</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input type="range" min={1} max={100} value={rolloutValue} onChange={e => setRolloutValue(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--cyan)' }} />
                                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '14px', color: 'var(--cyan)', minWidth: '40px' }}>{rolloutValue}%</span>
                            </div>
                            {rolloutValue !== selectedRelease.rollout_percentage && (
                                <button onClick={() => handleRolloutChange(selectedRelease, rolloutValue)} disabled={actionLoading} style={{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: 'var(--cyan)', color: 'var(--navy)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{actionLoading ? 'Updating...' : `Update to ${rolloutValue}%`}</button>
                            )}
                        </div>
                        {!selectedRelease.is_active && (
                            <button onClick={() => handleRollback(selectedRelease)} disabled={actionLoading} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--amber)', background: 'rgba(255,184,48,.08)', color: 'var(--amber)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <RotateCcw size={14} /> {actionLoading ? 'Rolling back...' : 'Rollback to this version'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {createModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <form onSubmit={handleCreateRelease} style={{ background: 'var(--navy2)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '32px', width: '480px', maxWidth: '95vw' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 800 }}>Publish New Release</h3>
                            <button type="button" onClick={() => setCreateModalOpen(false)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Version</label>
                                <input value={newVersion} onChange={e => setNewVersion(e.target.value)} placeholder="v2.4.1" required style={{ width: '100%', padding: '10px 12px', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--white)', fontSize: '14px', outline: 'none', fontFamily: 'JetBrains Mono,monospace' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Channel</label>
                                <select value={newChannel} onChange={e => setNewChannel(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--white)', fontSize: '14px', outline: 'none' }}>
                                    {channels.map(ch => (
                                        <option key={ch.id} value={ch.slug}>{ch.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>BUNDLE FILE</label>
                            <label style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                gap: '10px', height: '120px', border: '2px dashed var(--border2)',
                                borderRadius: '12px', background: 'var(--navy)', cursor: 'pointer',
                                transition: 'all .2s'
                            }}>
                                <input type="file" accept=".zip,.jsbundle,.bundle" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                                {file ? (
                                    <>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,229,160,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={20} style={{ color: 'var(--green)' }} /></div>
                                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{file.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</div>
                                    </>
                                ) : (
                                    <>
                                        <FileUp size={28} style={{ color: 'var(--muted)' }} />
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted)' }}>Drop your bundle here or click to browse</div>
                                        <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>Supports .jsbundle, .zip, .bundle</div>
                                    </>
                                )}
                            </label>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', cursor: 'pointer' }} onClick={() => setIsMandatory(!isMandatory)}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid var(--border2)', background: isMandatory ? 'var(--cyan)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                                {isMandatory && <Check size={12} style={{ color: 'var(--navy)' }} />}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>Make this release mandatory</span>
                        </div>

                        <button type="submit" disabled={actionLoading || !newVersion || !file} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--cyan)', color: 'var(--navy)', fontSize: '14px', fontWeight: 800, cursor: 'pointer', opacity: (actionLoading || !newVersion || !file) ? 0.5 : 1, transition: 'all .2s' }}>
                            {actionLoading ? <Loader2 size={16} className="spinning" /> : 'Deploy to Edge Network'}
                        </button>
                    </form>
                </div>
            )}
        </DashboardLayout>
    )
}

