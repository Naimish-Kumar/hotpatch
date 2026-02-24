'use client'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Footer } from '@/components/Footer'

export default function PrivacyPage() {
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

            <main style={{ padding: '80px 48px', maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '48px', fontWeight: 800, marginBottom: '40px' }}>Privacy Policy</h1>

                <div className="legal-content" style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '15px' }}>
                    <p style={{ marginBottom: '24px' }}>Last updated: February 24, 2026</p>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ color: 'var(--white)', fontSize: '22px', marginBottom: '16px' }}>1. Information We Collect</h2>
                        <p style={{ marginBottom: '16px' }}>
                            At HotPatch, we collect minimal data required to deliver over-the-air updates to your applications.
                        </p>
                        <ul style={{ paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '10px' }}><strong>App Information:</strong> App name, platform (iOS/Android), and version strings.</li>
                            <li style={{ marginBottom: '10px' }}><strong>Device Data:</strong> Unique device identifiers, OS version, and model category (e.g., iPhone 15) to ensure compatible update delivery.</li>
                            <li style={{ marginBottom: '10px' }}><strong>Usage Metrics:</strong> Installation success rates, download counts, and basic adoption trends.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ color: 'var(--white)', fontSize: '22px', marginBottom: '16px' }}>2. How We Use Your Information</h2>
                        <p style={{ marginBottom: '16px' }}>
                            The information collected is used solely for:
                        </p>
                        <ul style={{ paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '10px' }}>Determining if a device needs an update.</li>
                            <li style={{ marginBottom: '10px' }}>Providing analytics to developers about their releases.</li>
                            <li style={{ marginBottom: '10px' }}>Monitoring system performance and security.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ color: 'var(--white)', fontSize: '22px', marginBottom: '16px' }}>3. Data Security</h2>
                        <p>
                            We implement industry-standard security measures to protect your data. All communication between devices and our servers is encrypted via TLS. Update packages are cryptographically signed to prevent tampering.
                        </p>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ color: 'var(--white)', fontSize: '22px', marginBottom: '16px' }}>4. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at <Link href="mailto:privacy@hotpatch.io" style={{ color: 'var(--cyan)' }}>privacy@hotpatch.io</Link>.
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    )
}
