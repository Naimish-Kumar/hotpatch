'use client'
import { useState, useEffect } from 'react'
import { Save, AlertCircle, RefreshCw, Key, Shield, Database, Mail, Settings } from 'lucide-react'
import { request } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface Setting {
    key: string
    value: string
    description: string
}

export default function AdminSettings() {
    const [settings, setSettings] = useState<Setting[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)

    const { isAuthenticated, isLoading: authLoading } = useAuth()

    useEffect(() => {
        const fetchSettings = async () => {
            if (!isAuthenticated) return
            try {
                const data = await request<Setting[]>('/admin/settings')
                setSettings(data)
            } catch (err) {
                console.error('Failed to fetch settings', err)
            } finally {
                setLoading(false)
            }
        }
        if (!authLoading) {
            fetchSettings()
        }
    }, [isAuthenticated, authLoading])

    const handleUpdate = async (key: string, value: string) => {
        setSaving(key)
        try {
            await request(`/admin/settings/${key}`, {
                method: 'PUT',
                body: JSON.stringify({ value })
            })
            // Update local state
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
        } catch (err) {
            console.error('Failed to update setting', err)
            alert('Failed to save setting')
        } finally {
            setSaving(null)
        }
    }

    if (loading) return <div style={{ color: 'var(--muted)', padding: '40px' }}>Loading platform configuration...</div>

    return (
        <div>
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>Platform Configuration</h2>
                <p style={{ color: 'var(--muted)' }}>Global system credentials and backend environment overrides.</p>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
                {settings.map((setting) => (
                    <div key={setting.key} style={{
                        background: 'var(--navy2)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '40px'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <SettingIcon key_name={setting.key} />
                                <span style={{ fontWeight: 700, fontSize: '15px' }}>{setting.key}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{setting.description || 'System credential or global configuration key.'}</div>
                        </div>

                        <div style={{ flex: 2, display: 'flex', gap: '12px' }}>
                            <input
                                defaultValue={setting.value}
                                onBlur={(e) => {
                                    if (e.target.value !== setting.value) {
                                        handleUpdate(setting.key, e.target.value)
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: '13px'
                                }}
                                type={isSecret(setting.key) ? "password" : "text"}
                            />
                            <button
                                onClick={(e) => {
                                    const input = e.currentTarget.previousSibling as HTMLInputElement
                                    handleUpdate(setting.key, input.value)
                                }}
                                disabled={saving === setting.key}
                                style={{
                                    padding: '0 16px',
                                    height: '42px',
                                    background: 'var(--cyan)',
                                    color: 'var(--navy)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: saving === setting.key ? 0.5 : 1
                                }}
                            >
                                {saving === setting.key ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                                Save
                            </button>
                        </div>
                    </div>
                ))}

                {settings.length === 0 && (
                    <div style={{
                        padding: '80px',
                        textAlign: 'center',
                        background: 'var(--navy2)',
                        border: '1px dashed var(--border)',
                        borderRadius: '20px',
                        color: 'var(--muted)'
                    }}>
                        <AlertCircle size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No configurable settings found in the database.</p>
                        <p style={{ fontSize: '13px' }}>Initialize settings in backend models to see them here.</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}

function isSecret(key: string) {
    const secrets = ['KEY', 'SECRET', 'PASSWORD', 'TOKEN']
    return secrets.some(s => key.toUpperCase().includes(s))
}

function SettingIcon({ key_name }: { key_name: string }) {
    const k = key_name.toUpperCase()
    if (k.includes('STRIPE')) return <Key size={16} style={{ color: 'var(--purple)' }} />
    if (k.includes('AWS') || k.includes('S3') || k.includes('R2')) return <Database size={16} style={{ color: 'var(--blue)' }} />
    if (k.includes('JWT') || k.includes('AUTH') || k.includes('SECRET')) return <Shield size={16} style={{ color: 'var(--red)' }} />
    if (k.includes('MAIL') || k.includes('SMTP')) return <Mail size={16} style={{ color: 'var(--green)' }} />
    return <Settings size={16} style={{ color: 'var(--muted)' }} />
}
