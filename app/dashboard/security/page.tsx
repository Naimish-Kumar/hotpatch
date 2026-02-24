'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ShieldCheck, Key, Ticket, PenLine, Hash, RotateCcw, Package, CircleCheck, Ban, Rocket, Copy, RefreshCw, X, Loader2, Plus, Trash2 } from 'lucide-react'
import { security as securityApi, type ApiKey, type SigningKey, type AuditLog } from '@/lib/api'

export default function SecurityPage() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
    const [signingKeys, setSigningKeys] = useState<SigningKey[]>([])
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState('')
    const [newKeyModal, setNewKeyModal] = useState<'api' | 'signing' | null>(null)
    const [showApiKey, setShowApiKey] = useState<string | null>(null)
    const [newSigningKey, setNewSigningKey] = useState({ name: '', public_key: '' })

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [keys, signs, logs] = await Promise.all([
                securityApi.listApiKeys(),
                securityApi.listSigningKeys(),
                securityApi.listAuditLogs()
            ])
            setApiKeys(keys)
            setSigningKeys(signs)
            setAuditLogs(logs)
        } catch (err) {
            console.error('Failed to fetch security data', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateApiKey() {
        try {
            const name = prompt('Enter a name for the new API key:')
            if (!name) return
            const res = await securityApi.createApiKey(name)
            showToast('API Key created successfully')
            setShowApiKey(res.raw_key)
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Failed to create API key')
        }
    }

    async function handleCreateSigningKey() {
        try {
            if (!newSigningKey.name || !newSigningKey.public_key) return
            await securityApi.createSigningKey(newSigningKey.name, newSigningKey.public_key)
            showToast('Signing key added successfully')
            setNewKeyModal(null)
            setNewSigningKey({ name: '', public_key: '' })
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Failed to add signing key')
        }
    }

    async function handleDeleteApiKey(id: string) {
        if (!confirm('Are you sure you want to revoke this API key?')) return
        try {
            await securityApi.deleteApiKey(id)
            showToast('API Key revoked')
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Failed to delete key')
        }
    }

    if (loading) {
        return (
            <DashboardLayout title="Security">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--muted)' }}>
                    <Loader2 size={32} className="spinning" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title="Security">
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
                    background: 'var(--navy2)', border: '1px solid var(--border2)', borderRadius: '10px',
                    padding: '12px 20px', fontSize: '13px', fontWeight: 500,
                    boxShadow: '0 12px 40px rgba(0,0,0,.5)',
                }}>{toast}</div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 800, letterSpacing: '-.5px' }}>Security & Signing</h2>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Manage API keys, Ed25519 signing keys, and audit trails</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleCreateApiKey} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--navy2)', border: '1px solid var(--border2)', color: 'var(--cyan)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={14} /> New API Key
                    </button>
                    <button onClick={() => setNewKeyModal('signing')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--cyan)', color: 'var(--navy)', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={14} /> New Signing Key
                    </button>
                </div>
            </div>

            {/* Secret display modal (for newly created API key) */}
            {showApiKey && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--navy2)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '32px', width: '450px', maxWidth: '90vw' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>New API Key Created</h3>
                        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '20px' }}>Copy this key now. You won't be able to see it again for security reasons.</p>
                        <div style={{ background: 'var(--navy)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', fontFamily: 'JetBrains Mono,monospace', overflowX: 'auto', marginBottom: '20px' }}>
                            {showApiKey}
                        </div>
                        <button onClick={() => setShowApiKey(null)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--cyan)', color: 'var(--navy)', fontWeight: 700, cursor: 'pointer' }}>I've saved the key</button>
                    </div>
                </div>
            )}

            {/* Signing Key Modal */}
            {newKeyModal === 'signing' && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--navy2)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '32px', width: '500px', maxWidth: '90vw' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Add Public Signing Key</h3>
                            <X size={18} style={{ cursor: 'pointer' }} onClick={() => setNewKeyModal(null)} />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Key Name</label>
                            <input value={newSigningKey.name} onChange={e => setNewSigningKey({ ...newSigningKey, name: e.target.value })} style={{ width: '100%', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: 'white' }} placeholder="e.g. My Production Key" />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Public Key (PEM or Base64)</label>
                            <textarea value={newSigningKey.public_key} onChange={e => setNewSigningKey({ ...newSigningKey, public_key: e.target.value })} style={{ width: '100%', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: 'white', minHeight: '100px', fontFamily: 'JetBrains Mono,monospace' }} placeholder="MCowBQYDK2VwAyEA..." />
                        </div>
                        <button onClick={handleCreateSigningKey} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--cyan)', color: 'var(--navy)', fontWeight: 700, cursor: 'pointer' }}>Add Signing Key</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                {/* Signing keys list */}
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <Key size={18} style={{ color: 'var(--cyan)' }} />
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>Signing Keys</div>
                    </div>
                    {signingKeys.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px', border: '1px dashed var(--border)', borderRadius: '10px' }}>No signing keys configured.</div>
                    ) : signingKeys.map(k => (
                        <div key={k.id} style={{ background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{k.name}</span>
                                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: k.is_active ? 'rgba(0,229,160,.12)' : 'rgba(255,255,255,.05)', color: k.is_active ? '#00e5a0' : 'var(--muted)' }}>{k.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'JetBrains Mono,monospace', wordBreak: 'break-all', marginBottom: '8px' }}>{k.public_key.substring(0, 40)}...</div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => { navigator.clipboard.writeText(k.public_key); showToast('Copied') }} style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>Copy</button>
                                <button onClick={async () => { await securityApi.deleteSigningKey(k.id); fetchData() }} style={{ background: 'transparent', border: 'none', color: 'var(--red)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* API keys list */}
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <Ticket size={18} style={{ color: 'var(--amber)' }} />
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>API Keys</div>
                    </div>
                    {apiKeys.map(k => (
                        <div key={k.id} style={{ background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{k.name}</span>
                                <Trash2 size={13} style={{ color: 'var(--red)', cursor: 'pointer' }} onClick={() => handleDeleteApiKey(k.id)} />
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'JetBrains Mono,monospace' }}>{k.prefix}••••••••</div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '8px' }}>Created: {new Date(k.created_at).toLocaleDateString()} · Last Used: {k.last_used ? new Date(k.last_used).toLocaleDateString() : 'Never'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Audit log (dynamic) */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'Syne,sans-serif' }}>Audit Trail</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Sensitive actions on this application</div>
                    </div>
                </div>
                {auditLogs.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>No audit logs recorded.</div>
                ) : auditLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 24px', borderBottom: '1px solid rgba(0,212,255,.05)' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(0,212,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={14} style={{ color: 'var(--cyan)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px' }}>
                                <span style={{ fontWeight: 600 }}>{log.actor}</span> performed <span style={{ color: 'var(--cyan)' }}>{log.action}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>IP: {log.ip_address} · {log.metadata}</div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    )
}

