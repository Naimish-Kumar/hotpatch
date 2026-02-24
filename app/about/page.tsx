'use client'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Footer } from '@/components/Footer'
import { CheckCircle, Zap, Shield, Users } from 'lucide-react'

export default function AboutPage() {
    return (
        <div style={{ background: 'var(--navy)', minHeight: '100vh', color: 'var(--white)' }}>
            {/* Header */}
            <nav style={{
                padding: '24px 48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(6,14,26,0.8)',
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <Link href="/"><Logo width={140} height={30} /></Link>
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <Link href="/features" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px' }}>Features</Link>
                    <Link href="/pricing" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px' }}>Pricing</Link>
                    <Link href="/login" style={{
                        padding: '10px 24px',
                        background: 'var(--cyan)',
                        color: 'var(--navy)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 700
                    }}>Dashboard</Link>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section style={{ padding: '120px 48px 80px', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '56px', fontWeight: 800, letterSpacing: '-2px', marginBottom: '24px' }}>
                        Modernizing App Updates <br /> for <span className="text-gradient">React Native</span>
                    </h1>
                    <p style={{ fontSize: '20px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '48px' }}>
                        HotPatch was born out of a simple frustration: why does it take days to fix a typo or a critical bug in a mobile app? We're on a mission to give developers total control over their deployments.
                    </p>
                </section>

                {/* Values */}
                <section style={{ padding: '100px 48px', background: 'var(--navy2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px' }}>
                        {[
                            { icon: Zap, title: 'Instant Speed', desc: 'Push code updates in seconds, not days. Bypass app store review for JS changes.' },
                            { icon: Shield, title: 'Rock Solid', desc: 'Secure by design. Every patch is signed and verified before it touches a device.' },
                            { icon: Users, title: 'Developer First', desc: 'Built by developers for developers. A CLI that feels like home and an API that stays out of your way.' },
                            { icon: CheckCircle, title: 'Reliable', desc: '99.9% delivery success rate. Intelligent rollbacks ensure your users never see a broken app.' }
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '30px', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                                <item.icon size={32} style={{ color: 'var(--cyan)', marginBottom: '20px' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>{item.title}</h3>
                                <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Story */}
                <section style={{ padding: '120px 48px', maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '32px', textAlign: 'center' }}>Our Story</h2>
                    <div style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1.8 }}>
                        <p style={{ marginBottom: '24px' }}>
                            In 2024, our team was building complex React Native applications for high-growth startups. We found ourselves constantly blocked by slow app store review cycles. A small UI fix would take 48 hours to reach users. A critical crash would take even longer.
                        </p>
                        <p style={{ marginBottom: '24px' }}>
                            We looked at existing OTA solutions and found them either too complex, too expensive, or unreliable. We wanted something that integrated seamlessly with existing CI/CD pipelines, supported local development, and provided deep analytics into update adoption.
                        </p>
                        <p>
                            HotPatch is the culmination of that vision. A high-performance, open-source-friendly OTA server that puts the power of deployment back into the hands of the engineers.
                        </p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
