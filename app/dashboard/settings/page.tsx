'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import { Trash2, AlertTriangle, Loader2, Plus, Bell, Link2, Globe, Shield } from 'lucide-react'
import { settings as settingsApi, type Webhook, type Settings } from '@/lib/api'

export default function SettingsPage() {
    const { app } = useAuth()
    const [appName, setAppName] = useState('')
    const [webhooks, setWebhooks] = useState<Webhook[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState('')
    const [webhookPayload, setWebhookPayload] = useState({ url: '', events: ['release.created', 'release.rolled_back'] })

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

    useEffect(() => {
        if (!app?.id) return
        fetchData()
    }, [app?.id])

    async function fetchData() {
        try {
            const [s, w] = await Promise.all([
                settingsApi.getAppSettings(),
                settingsApi.listWebhooks()
            ])
            setAppName(s.app_name)
            setWebhooks(w)
        } catch (err) {
            console.error('Failed to fetch settings', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdateSettings() {
        setSaving(true)
        try {
            await settingsApi.updateAppSettings(appName, {})
            showToast('Settings saved successfully')
        } catch (err: any) {
            showToast(err.message || 'Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    async function handleAddWebhook() {
        if (!webhookPayload.url) return
        try {
            await settingsApi.createWebhook(webhookPayload.url, webhookPayload.events)
            showToast('Webhook added successfully')
            setWebhookPayload({ url: '', events: ['release.created', 'release.rolled_back'] })
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Failed to add webhook')
        }
    }

    async function handleDeleteWebhook(id: string) {
        if (!confirm('Are you sure you want to delete this webhook?')) return
        try {
            await settingsApi.deleteWebhook(id)
            showToast('Webhook deleted')
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Failed to delete webhook')
        }
    }

    if (loading) {
        return (
            <DashboardLayout title="Settings">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--muted)' }}>
                    <Loader2 size={32} className="spinning" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title="Settings">
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
                    background: 'var(--navy2)', border: '1px solid var(--border2)', borderRadius: '10px',
                    padding: '12px 20px', fontSize: '13px', fontWeight: 500,
                    boxShadow: '0 12px 40px rgba(0,0,0,.5)',
                }}>{toast}</div>
            )}

            <div style={{ maxWidth: '800px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 800, letterSpacing: '-.5px' }}>App Settings</h2>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Configure your application and outbound notifications</p>
                </div>

                {/* App info */}
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <Globe size={18} style={{ color: 'var(--cyan)' }} />
                        <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'Syne,sans-serif' }}>General Information</div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>App Name</label>
                        <input value={appName} onChange={e => setAppName(e.target.value)} style={{
                            width: '100%', padding: '10px 14px', background: 'var(--navy)', border: '1px solid var(--border)',
                            borderRadius: '9px', color: 'var(--white)', fontSize: '14px', outline: 'none', fontFamily: 'Inter,sans-serif',
                        }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>App ID</label>
                            <div style={{ padding: '10px 14px', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '9px', fontFamily: 'JetBrains Mono,monospace', fontSize: '12px', color: 'var(--muted)' }}>{app?.id}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Platform</label>
                            <div style={{ padding: '10px 14px', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '9px', fontSize: '14px', color: 'var(--muted)', textTransform: 'capitalize' }}>{app?.platform}</div>
                        </div>
                    </div>

                    <button onClick={handleUpdateSettings} disabled={saving} style={{
                        padding: '10px 24px', borderRadius: '8px', border: 'none',
                        background: 'var(--cyan)', color: 'var(--navy)', fontSize: '13px',
                        fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        {saving ? <Loader2 size={14} className="spinning" /> : null}
                        Save General Settings
                    </button>
                </div>

                {/* Webhooks Section */}
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <Link2 size={18} style={{ color: 'var(--amber)' }} />
                        <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'Syne,sans-serif' }}>Outbound Webhooks</div>
                    </div>

                    <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,184,48,.05)', border: '1px solid rgba(255,184,48,.1)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                            <input
                                value={webhookPayload.url}
                                onChange={e => setWebhookPayload({ ...webhookPayload, url: e.target.value })}
                                placeholder="https://api.example.com/webhooks/hotpatch"
                                style={{ flex: 1, padding: '10px 14px', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '9px', color: 'var(--white)', fontSize: '13px', outline: 'none' }}
                            />
                            <button onClick={handleAddWebhook} style={{ padding: '0 20px', borderRadius: '8px', background: 'var(--cyan)', color: 'var(--navy)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                                Add
                            </button>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', gap: '15px' }}>
                            <span>Available Events: `release.created`, `release.rolled_back`</span>
                        </div>
                    </div>

                    {webhooks.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px', border: '1px dashed var(--border)', borderRadius: '10px' }}>No webhooks configured.</div>
                    ) : webhooks.map(w => (
                        <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '10px' }}>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.url}</div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Events: {w.events}</div>
                            </div>
                            <button onClick={() => handleDeleteWebhook(w.id)} style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,77,106,.1)', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Danger zone */}
                <div style={{
                    background: 'var(--navy2)', border: '1px solid rgba(255,77,106,.2)',
                    borderRadius: '14px', padding: '24px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <AlertTriangle size={16} style={{ color: 'var(--red)' }} />
                        <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'Syne,sans-serif', color: 'var(--red)' }}>Danger Zone</div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>Deletion actions are permanent and cannot be undone.</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{
                            padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,77,106,.3)',
                            background: 'rgba(255,77,106,.06)', color: 'var(--red)', fontSize: '13px',
                            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '8px',
                        }}><Trash2 size={14} /> Purge Releases</button>
                        <button style={{
                            padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,77,106,.5)',
                            background: 'rgba(255,77,106,.1)', color: 'var(--red)', fontSize: '13px',
                            fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '8px',
                        }}><Trash2 size={14} /> Delete Application</button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

