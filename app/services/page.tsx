'use client'
import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { CtaSection } from '@/components/CtaSection'
import {
    ShieldCheck, Globe, Zap, Headset,
    Code2, Layers, Cpu, Lock, ArrowRight,
    Server, Cloud, Database, BarChart
} from 'lucide-react'

const services = [
    {
        title: 'Managed OTA Cloud',
        desc: 'Global, zero-latency delivery network optimized specifically for JavaScript bundles and assets. Automatic versioning and region-locking included.',
        icon: Cloud,
        color: 'var(--cyan)',
        bg: 'rgba(0,212,255,.1)'
    },
    {
        title: 'Security & Compliance',
        desc: 'End-to-end encryption, digital signing, and SOC2 compliant infrastructure. We handle the heavy lifting of keeping your updates secure.',
        icon: ShieldCheck,
        color: 'var(--green)',
        bg: 'rgba(0,229,160,.1)'
    },
    {
        title: 'Enterprise Support',
        desc: 'Direct access to engineers who built the platform. 24/7 monitoring and emergency rollback support for mission-critical applications.',
        icon: Headset,
        color: 'var(--amber)',
        bg: 'rgba(255,184,48,.1)'
    },
    {
        title: 'Custom SDK Integration',
        desc: 'Need custom update logic? Our team helps you extend our SDK to handle complex user segmenting, A/B testing, and local fallback strategies.',
        icon: Code2,
        color: 'var(--cyan)',
        bg: 'rgba(0,212,255,.1)'
    }
]

const highlights = [
    { title: 'Global CDN', icon: Globe, d: '120+ Edge nodes worldwide' },
    { title: 'Auto Rollback', icon: Zap, d: 'Detect & fix crashes instantly' },
    { title: 'Version Control', icon: Layers, d: 'Manage multiple channels' },
    { title: 'Hardware Ready', icon: Cpu, d: 'Optimized for low-end devices' },
]

export default function ServicesPage() {
    return (
        <>
            <div className="hero-grid" style={{ height: '70vh', opacity: 0.5 }} />

            {/* ── HERO ── */}
            <section style={{
                padding: '160px 48px 100px', textAlign: 'center', position: 'relative', zIndex: 2
            }}>
                <div className="afu" style={{
                    display: 'inline-block', color: 'var(--cyan)', fontSize: '12px', fontWeight: 600,
                    letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px'
                }}>Our Expertise</div>
                <h1 className="afu1" style={{
                    fontFamily: 'Syne, sans-serif', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800,
                    letterSpacing: '-2px', lineHeight: 1.1, marginBottom: '24px'
                }}>
                    Enterprise-grade <span style={{ color: 'var(--cyan)' }}>OTA Solutions</span>
                </h1>
                <p className="afu2" style={{
                    fontSize: '18px', color: 'var(--muted)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.7
                }}>
                    From managed infrastructure to custom SDK extensions, we provide the tools and expertise
                    to scale your React Native deployments globally.
                </p>
            </section>

            {/* ── SERVICES GRID ── */}
            <section style={{ padding: '0 48px 120px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px'
                }}>
                    {services.map((s, i) => (
                        <div key={s.title} className={`afu${i + 1}`} style={{
                            background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '24px',
                            padding: '48px', transition: 'all .3s', position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px',
                                background: `radial-gradient(circle, ${s.bg} 0%, transparent 70%)`
                            }} />

                            <div style={{
                                width: '56px', height: '56px', borderRadius: '14px', background: s.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px',
                                border: '1px solid var(--border2)'
                            }}>
                                <s.icon size={24} style={{ color: s.color }} />
                            </div>

                            <h3 style={{
                                fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 800,
                                marginBottom: '16px', letterSpacing: '-0.5px'
                            }}>{s.title}</h3>

                            <p style={{
                                fontSize: '15.5px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '32px'
                            }}>{s.desc}</p>

                            <Link href="/contact" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--cyan)',
                                fontWeight: 600, fontSize: '14px', textDecoration: 'none'
                            }}>
                                Learn more <ArrowRight size={16} />
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── ARCHITECTURE SECTION ── */}
            <section style={{
                padding: '120px 48px', background: 'rgba(10,22,40,0.5)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
                    <div>
                        <h2 style={{
                            fontFamily: 'Syne, sans-serif', fontSize: '38px', fontWeight: 800,
                            marginBottom: '24px', letterSpacing: '-1.5px'
                        }}>Built for Reliability</h2>
                        <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: 1.8, marginBottom: '40px' }}>
                            Our architecture is designed for 99.99% availability. We use a multi-region deployment strategy
                            that ensures your users always download the latest update from the node closest to them.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {highlights.map(h => (
                                <div key={h.title}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <h.icon size={16} style={{ color: 'var(--cyan)' }} />
                                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{h.title}</span>
                                    </div>
                                    <p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{h.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{
                        background: 'var(--navy2)', border: '1px solid var(--border2)', borderRadius: '24px',
                        padding: '40px', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.4)'
                    }}>
                        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                            {[
                                { t: 'Ingest', s: 'Bundle Upload & Sign', i: Server },
                                { t: 'Distribute', s: 'Global CDN Sync', i: Globe },
                                { t: 'Serve', s: 'Edge Node Delivery', i: Database },
                                { t: 'Analyze', s: 'Real-time Metrics', i: BarChart }
                            ].map((step, idx) => (
                                <div key={step.t} style={{
                                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                                    background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)'
                                }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%', background: 'var(--cdim)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontFamily: 'JetBrains Mono'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{step.t}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{step.s}</div>
                                    </div>
                                    <step.i size={18} style={{ color: 'var(--cyan)', opacity: 0.5 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <CtaSection />
            <Footer />
        </>
    )
}
