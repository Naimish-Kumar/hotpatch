'use client'
import { useState, useEffect } from 'react'
import { Users, Search, Filter, MoreHorizontal, ShieldCheck, Mail, Trash2, AlertTriangle } from 'lucide-react'
import { request } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface UserInfo {
    id: string
    email: string
    display_name: string
    avatar_url: string
    is_verified: boolean
    created_at: string
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const { isAuthenticated, isLoading: authLoading } = useAuth()

    useEffect(() => {
        const fetchUsers = async () => {
            if (!isAuthenticated) return
            try {
                const data = await request<UserInfo[]>('/admin/users')
                setUsers(data)
            } catch (err) {
                console.error('Failed to fetch users', err)
            } finally {
                setLoading(false)
            }
        }
        if (!authLoading) {
            fetchUsers()
        }
    }, [isAuthenticated, authLoading])

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) return
        try {
            await request(`/admin/users/${id}`, { method: 'DELETE' })
            setUsers(prev => (prev || []).filter(u => u.id !== id))
        } catch (err) {
            console.error('Failed to delete user', err)
            alert('Failed to delete user')
        }
    }

    const filtered = (users || []).filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div style={{ color: 'var(--muted)', padding: '40px' }}>Loading platform citizens...</div>

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>User Directory</h2>
                    <p style={{ color: 'var(--muted)' }}>Manage all {users?.length || 0} platform accounts and authentication states.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Find users by email or name..."
                            style={{
                                padding: '12px 14px 12px 42px',
                                background: 'var(--navy2)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                color: 'white',
                                width: '320px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '20px 24px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted2)' }}>User Identity</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted2)' }}>Status</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted2)' }}>Joined</th>
                            <th style={{ padding: '20px 24px', textAlign: 'right' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered?.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .2s' }}>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: user.avatar_url ? `url(${user.avatar_url}) center/cover` : 'var(--border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '14px',
                                            fontWeight: 800,
                                            color: 'var(--navy)'
                                        }}>
                                            {!user.avatar_url && user.display_name?.slice(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '15px' }}>{user.display_name || 'Anonymous User'}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Mail size={12} /> {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        background: user.is_verified ? 'rgba(0,229,160,0.1)' : 'rgba(255,184,48,0.1)',
                                        color: user.is_verified ? 'var(--green)' : 'var(--amber)'
                                    }}>
                                        {user.is_verified ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                                        {user.is_verified ? 'VERIFIED' : 'PENDING'}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px', color: 'var(--muted)', fontSize: '14px' }}>
                                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleDelete(user.id, user.email)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--muted)',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            transition: 'all .2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {(filtered?.length === 0 || !filtered) && (
                            <tr>
                                <td colSpan={4} style={{ padding: '80px', textAlign: 'center', color: 'var(--muted)' }}>
                                    <Users size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                    <div>No users found matching your search.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
