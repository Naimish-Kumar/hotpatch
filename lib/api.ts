// HotPatch API Client — connects the Next.js frontend to the Go backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface App {
    id: string
    name: string
    platform: string
    api_key?: string
    created_at: string
}

export interface Release {
    id: string
    app_id: string
    version: string
    channel: string
    bundle_url: string
    hash: string
    signature: string
    mandatory: boolean
    rollout_percentage: number
    is_active: boolean
    created_at: string
}

export interface Device {
    id: string
    app_id: string
    device_id: string
    platform: string
    app_version: string
    sdk_version: string
    os_version: string
    last_seen: string
    created_at: string
}

export interface Installation {
    id: string
    device_id: string
    release_id: string
    status: 'downloaded' | 'installed' | 'failed' | 'rolled_back'
    installed_at: string
}

export interface DashboardStats {
    active_devices: number
    total_releases: number
    updates_delivered: number
    install_rate: number
    auto_rollbacks: number
    devices_trend: number
    releases_trend: number
    delivery_trend: number
}

export interface UserResponse {
    id: string
    email: string
    display_name: string
    avatar_url: string
    is_verified: boolean
}

export interface LoginResponse {
    token: string
    token_type: string
    expires_in: number
    user?: UserResponse
    app?: App
}

// ── Analytics Models ─────────────────────────────────
export interface DashboardOverview {
    total_devices: number
    active_last_24h: number
    total_releases: number
    updates_delivered: number
    success_rate: number
    devices_trend: number
    bandwidth_saved: number
}

export interface VersionDistribution {
    version: string
    count: number
    percent: number
}

export interface DailyMetric {
    date: string
    value: number
}

// ── Channel Models ───────────────────────────────────
export interface Channel {
    id: string
    app_id: string
    name: string
    slug: string
    description: string
    color: string
    auto_rollout: boolean
    created_at: string
}

// ── Security Models ──────────────────────────────────
export interface ApiKey {
    id: string
    app_id: string
    name: string
    prefix: string
    last_used: string | null
    created_at: string
    expires_at: string | null
}

export interface SigningKey {
    id: string
    app_id: string
    name: string
    public_key: string
    is_active: boolean
    created_at: string
}

export interface AuditLog {
    id: string
    app_id: string
    actor: string
    action: string
    entity_id: string
    metadata: string
    ip_address: string
    created_at: string
}

// ── Settings Models ──────────────────────────────────
export interface Settings {
    app_id: string
    app_name: string
    platform_configs: any
}

export interface Webhook {
    id: string
    app_id: string
    url: string
    events: string
    is_active: boolean
    created_at: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    per_page: number
}

class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message)
        this.status = status
        this.name = 'ApiError'
    }
}

function getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('hotpatch_token')
}

function setToken(token: string) {
    localStorage.setItem('hotpatch_token', token)
}

function clearToken() {
    localStorage.removeItem('hotpatch_token')
    localStorage.removeItem('hotpatch_app')
}

export async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken()
    const storedApp = typeof window !== 'undefined' ? localStorage.getItem('hotpatch_app') : null
    const app = storedApp ? JSON.parse(storedApp) : null

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    if (app?.id) {
        headers['X-App-ID'] = app.id
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    })

    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(body.error || body.message || 'Request failed', res.status)
    }

    if (res.status === 204) return {} as T
    return res.json()
}

// ── Auth ──────────────────────────────────────────────
export const auth = {
    async loginWithToken(apiKey: string): Promise<LoginResponse> {
        const data = await request<LoginResponse>('/auth/token', {
            method: 'POST',
            body: JSON.stringify({ api_key: apiKey }),
        })
        setToken(data.token)
        if (data.app) {
            localStorage.setItem('hotpatch_app', JSON.stringify(data.app))
        }
        return data
    },

    async login(email: string, password: string): Promise<LoginResponse> {
        const data = await request<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        })
        setToken(data.token)
        // Store user/app info if needed
        return data
    },

    async superLogin(email: string, password: string): Promise<LoginResponse> {
        const data = await request<LoginResponse>('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        })
        setToken(data.token)
        if (data.app) {
            localStorage.setItem('hotpatch_app', JSON.stringify(data.app))
        }
        return data
    },

    async register(name: string, email: string, password: string): Promise<{ message: string }> {
        return request<{ message: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        })
    },

    async verify(token: string): Promise<{ status: string }> {
        return request<{ status: string }>(`/auth/verify?token=${token}`)
    },

    logout() {
        clearToken()
        localStorage.removeItem('hotpatch_role')
    },

    isAuthenticated(): boolean {
        return !!getToken()
    },

    getApp(): App | null {
        if (typeof window === 'undefined') return null
        const stored = localStorage.getItem('hotpatch_app')
        return stored ? JSON.parse(stored) : null
    },

    getToken,
}

// ── Releases ─────────────────────────────────────────
export const releases = {
    async list(params?: {
        app_id?: string
        channel?: string
        is_active?: string
        page?: number
        per_page?: number
    }): Promise<PaginatedResponse<Release>> {
        const qs = new URLSearchParams()
        if (params?.app_id) qs.set('app_id', params.app_id)
        if (params?.channel) qs.set('channel', params.channel)
        if (params?.is_active) qs.set('is_active', params.is_active)
        if (params?.page) qs.set('page', String(params.page))
        if (params?.per_page) qs.set('per_page', String(params.per_page))
        return request<PaginatedResponse<Release>>(`/releases?${qs}`)
    },

    async get(id: string): Promise<Release> {
        return request<Release>(`/releases/${id}`)
    },

    async create(formData: FormData): Promise<Release> {
        const token = getToken()
        const res = await fetch(`${API_BASE}/releases`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        })
        if (!res.ok) {
            const body = await res.json().catch(() => ({ error: res.statusText }))
            throw new ApiError(body.error || 'Upload failed', res.status)
        }
        return res.json()
    },

    async rollback(id: string): Promise<Release> {
        return request<Release>(`/releases/${id}/rollback`, { method: 'PATCH' })
    },

    async updateRollout(id: string, percentage: number): Promise<void> {
        await request(`/releases/${id}/rollout`, {
            method: 'PATCH',
            body: JSON.stringify({ rollout_percentage: percentage }),
        })
    },

    async archive(id: string): Promise<void> {
        await request(`/releases/${id}`, { method: 'DELETE' })
    },
}

// ── Devices ──────────────────────────────────────────
export const devices = {
    async list(appId: string): Promise<Device[]> {
        const data = await request<{ devices: Device[] }>(`/devices?app_id=${appId}`)
        return data.devices || []
    },

    async stats(appId: string): Promise<Record<string, number>> {
        return request<Record<string, number>>(`/installations/stats?app_id=${appId}`)
    },
}

// ── Dashboard Stats (aggregated) ─────────────────────
export const dashboard = {
    async getStats(): Promise<DashboardOverview> {
        return request<DashboardOverview>('/analytics/overview')
    },

    async getTrends(): Promise<Record<string, DailyMetric[]>> {
        return request<Record<string, DailyMetric[]>>('/analytics/trends')
    },

    async getDistribution(): Promise<VersionDistribution[]> {
        return request<VersionDistribution[]>('/analytics/distribution')
    }
}

// ── Channels ─────────────────────────────────────────
export const channels = {
    async list(): Promise<Channel[]> {
        return request<Channel[]>('/channels')
    },
    async get(slug: string): Promise<Channel> {
        return request<Channel>(`/channels/${slug}`)
    },
    async create(data: { name: string, slug: string, description?: string, color?: string, auto_rollout?: boolean }): Promise<Channel> {
        return request<Channel>('/channels', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },
    async update(slug: string, data: Partial<Channel>): Promise<Channel> {
        return request<Channel>(`/channels/${slug}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        })
    },
    async delete(slug: string): Promise<void> {
        await request(`/channels/${slug}`, { method: 'DELETE' })
    }
}

// ── Security ─────────────────────────────────────────
export const security = {
    async listApiKeys(): Promise<ApiKey[]> {
        return request<ApiKey[]>('/security/api-keys')
    },
    async createApiKey(name: string, expires_at?: string): Promise<{ api_key: ApiKey, raw_key: string }> {
        return request<{ api_key: ApiKey, raw_key: string }>('/security/api-keys', {
            method: 'POST',
            body: JSON.stringify({ name, expires_at })
        })
    },
    async deleteApiKey(id: string): Promise<void> {
        await request(`/security/api-keys/${id}`, { method: 'DELETE' })
    },
    async listSigningKeys(): Promise<SigningKey[]> {
        return request<SigningKey[]>('/security/signing-keys')
    },
    async createSigningKey(name: string, public_key: string): Promise<SigningKey> {
        return request<SigningKey>('/security/signing-keys', {
            method: 'POST',
            body: JSON.stringify({ name, public_key })
        })
    },
    async deleteSigningKey(id: string): Promise<void> {
        await request(`/security/signing-keys/${id}`, { method: 'DELETE' })
    },
    async listAuditLogs(): Promise<AuditLog[]> {
        return request<AuditLog[]>('/security/audit-logs')
    }
}

// ── Settings ─────────────────────────────────────────
export const settings = {
    async getAppSettings(): Promise<Settings> {
        return request<Settings>('/settings/app')
    },
    async updateAppSettings(name: string, platformConfigs: any): Promise<Settings> {
        return request<Settings>('/settings/app', {
            method: 'PATCH',
            body: JSON.stringify({ name, platform_configs: platformConfigs })
        })
    },
    async listWebhooks(): Promise<Webhook[]> {
        return request<Webhook[]>('/settings/webhooks')
    },
    async createWebhook(url: string, events: string[]): Promise<{ webhook: Webhook, secret: string }> {
        return request<{ webhook: Webhook, secret: string }>('/settings/webhooks', {
            method: 'POST',
            body: JSON.stringify({ url, events: events.join(',') })
        })
    },
    async deleteWebhook(id: string): Promise<void> {
        await request(`/settings/webhooks/${id}`, { method: 'DELETE' })
    }
}

export default { auth, releases, devices, dashboard, channels, security, settings }
