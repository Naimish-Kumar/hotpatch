'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Rocket, FlaskConical, Tag, ArrowRightLeft, CheckCircle2, ShieldCheck, X, ArrowRight, Loader2 } from 'lucide-react'
import { channels as channelsApi, releases as releasesApi, type Channel, type Release } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const channelIcons: Record<string, any> = {
    production: Rocket,
    staging: FlaskConical,
    beta: Tag,
    default: Tag
}

interface ChannelWithStats extends Channel {
    activeRelease?: string
    releaseCount: number
}

export default function ChannelsPage() {
    const [channelList, setChannelList] = useState<ChannelWithStats[]>([])
    const [selected, setSelected] = useState<ChannelWithStats | null>(null)
    const [promoteOpen, setPromoteOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    const { isAuthenticated, isLoading: authLoading } = useAuth()

    useEffect(() => {
        async function fetchData() {
            if (!isAuthenticated) return
            try {
                const [chs, rels] = await Promise.all([
                    channelsApi.list(),
                    releasesApi.list({ per_page: 100 })
                ])

                const chsWithStats = chs.map(ch => {
                    const chRels = rels.data.filter(r => r.channel === ch.slug)
                    const active = chRels.find(r => r.is_active)
                    return {
                        ...ch,
                        activeRelease: active?.version || 'No active release',
                        releaseCount: chRels.length
                    }
                })

                setChannelList(chsWithStats)
                if (chsWithStats.length > 0) setSelected(chsWithStats[0])
            } catch (err) {
                console.error('Failed to fetch channels', err)
            } finally {
                setLoading(false)
            }
        }
        if (!authLoading) {
            fetchData()
        }
    }, [isAuthenticated, authLoading])

    if (loading) {
        return (
            <DashboardLayout title="Channels">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--muted)' }}>
                    <Loader2 size={32} className="spinning" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title="Channels">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 800, letterSpacing: '-.5px' }}>Release Channels</h2>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Manage release channels and promotion pipeline</p>
                </div>
            </div>

            {/* Channel cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
                {channelList.map(ch => {
                    const isSelected = selected?.id === ch.id
                    const Icon = channelIcons[ch.slug] || channelIcons.default
                    return (
                        <div key={ch.id} onClick={() => setSelected(ch)} style={{ background: isSelected ? 'rgba(0,212,255,.04)' : 'var(--navy2)', border: isSelected ? '1px solid var(--border2)' : '1px solid var(--border)', borderRadius: '14px', padding: '24px', cursor: 'pointer', transition: 'all .2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${ch.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={18} style={{ color: ch.color }} strokeWidth={2} />
                                </div>
                                <div>
                                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '16px', fontWeight: 700 }}>{ch.name}</div>
                                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{ch.releaseCount} releases</span>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>Current</div>
                                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '13px', color: ch.color }}>{ch.activeRelease}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>Rollout</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{ch.auto_rollout ? 'Auto' : 'Manual'}</div>
                                </div>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>{ch.description}</p>
                        </div>
                    )
                })}
            </div>

            {/* Pipeline visualization */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px', marginBottom: '20px' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '16px', fontWeight: 700, marginBottom: '22px' }}>Deployment Pipeline</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                    {[...channelList].reverse().map((ch, i) => {
                        const Icon = channelIcons[ch.slug] || channelIcons.default
                        return (
                            <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ padding: '14px 24px', borderRadius: '12px', border: `1px solid ${ch.color}22`, background: `${ch.color}08`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Icon size={16} style={{ color: ch.color }} />
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{ch.name}</div>
                                        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '11px', color: ch.color }}>{ch.activeRelease}</div>
                                    </div>
                                </div>
                                {i < (channelList.length - 1) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '40px', height: '1px', background: 'var(--border2)' }} />
                                        <ArrowRight size={14} style={{ color: 'var(--muted)' }} />
                                        <div style={{ width: '20px', height: '1px', background: 'var(--border2)' }} />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
                <div style={{ textAlign: 'center', marginTop: '18px' }}>
                    <button onClick={() => setPromoteOpen(true)} style={{ padding: '9px 22px', borderRadius: '8px', border: '1px solid var(--border2)', background: 'var(--cdim)', color: 'var(--cyan)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowRightLeft size={14} /> Promote Release
                    </button>
                </div>
            </div>

            {/* Channel policies */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Channel Policies</div>
                    {[
                        { icon: CheckCircle2, color: 'var(--green)', label: 'Production', rules: ['100% rollout required from staging', 'Minimum 24h soak time', 'Auto-rollback on >0.5% crash rate'] },
                        { icon: FlaskConical, color: 'var(--amber)', label: 'Staging', rules: ['Progressive rollout (10% → 50% → 100%)', 'Internal team testing required', 'Minimum 4h before promotion'] },
                        { icon: Tag, color: 'var(--cyan)', label: 'Beta', rules: ['Immediate deployment', 'No rollout restrictions', 'Opt-in users only'] },
                    ].map(p => {
                        const Icon = p.icon
                        return (
                            <div key={p.label} style={{ marginBottom: '14px', padding: '14px', borderRadius: '10px', background: 'var(--navy)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Icon size={14} style={{ color: p.color }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{p.label}</span>
                                </div>
                                {p.rules.map((rule, i) => (
                                    <div key={i} style={{ fontSize: '11.5px', color: 'var(--muted)', paddingLeft: '22px', position: 'relative', marginBottom: '3px', lineHeight: 1.5 }}>
                                        <span style={{ position: 'absolute', left: '6px', color: 'var(--border2)' }}>·</span>
                                        {rule}
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>

                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Promotion Rules</div>
                    {[
                        { from: 'Beta', to: 'Staging', icon: ArrowRightLeft, desc: 'Requires passing integration tests and minimum 2h runtime without crashes.', color: 'var(--cyan)' },
                        { from: 'Staging', to: 'Production', icon: ShieldCheck, desc: 'Requires 100% staged rollout, 24h soak, and manual approval from an admin.', color: 'var(--green)' },
                    ].map(rule => {
                        const Icon = rule.icon
                        return (
                            <div key={rule.from} style={{ padding: '14px', borderRadius: '10px', background: 'var(--navy)', border: '1px solid var(--border)', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <Icon size={14} style={{ color: rule.color }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{rule.from}</span>
                                    <ArrowRight size={12} style={{ color: 'var(--muted)' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{rule.to}</span>
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, paddingLeft: '22px' }}>{rule.desc}</p>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Promote modal */}
            {promoteOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--navy2)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '32px', width: '420px', maxWidth: '90vw', animation: 'fadeInUp .2s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: 800 }}>Promote Release</h3>
                            <button onClick={() => setPromoteOpen(false)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>From</label>
                            <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--white)', fontSize: '13px', outline: 'none' }}>
                                <option>Beta (v2.3.9)</option>
                                <option>Staging (v2.4.2-rc)</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>To</label>
                            <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--white)', fontSize: '13px', outline: 'none' }}>
                                <option>Staging</option>
                                <option>Production</option>
                            </select>
                        </div>
                        <button onClick={() => setPromoteOpen(false)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--cyan)', color: 'var(--navy)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Confirm Promotion</button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
