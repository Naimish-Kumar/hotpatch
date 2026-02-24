'use client'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Footer } from '@/components/Footer'

export default function TermsPage() {
    return (
        <div style={{ background: 'var(--navy)', minHeight: '100vh', color: 'var(--white)' }}>
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
            </nav>

            <main style={{ padding: '80px 48px', maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '48px', fontWeight: 800, marginBottom: '40px' }}>Terms of Service</h1>

                <div className="legal-content" style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '15px' }}>
                    <p style={{ marginBottom: '24px' }}>Welcome to HotPatch. By using our services, you agree to these terms.</p>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ color: 'var(--white)', fontSize: '22px', marginBottom: '16px' }}>1. Usage</h2>
                        <p>
                            HotPatch provides tools for over-the-air updates. You are responsible for the content of the updates you push to your users. You must comply with Apple App Store and Google Play Store guidelines regarding OTA updates.
                        </p>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ color: 'var(--white)', fontSize: '22px', marginBottom: '16px' }}>2. Account Responsibility</h2>
                        <p>
                            You are responsible for maintaining the confidentiality of your API keys and superadmin credentials. Any activity under your account is your responsibility.
                        </p>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ color: 'var(--white)', fontSize: '22px', marginBottom: '16px' }}>3. Prohibited Conduct</h2>
                        <p>
                            You may not use HotPatch to distribute malware, spyware, or any unauthorized software. We reserve the right to suspend accounts that violate these terms.
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    )
}
