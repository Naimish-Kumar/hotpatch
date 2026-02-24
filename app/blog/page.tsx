'use client'
import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { CtaSection } from '@/components/CtaSection'
import {
    Clock, Calendar, User, ArrowRight,
    Search, Tag, ChevronRight, Share2
} from 'lucide-react'

const posts = [
    {
        id: 1,
        title: 'The Future of React Native OTA: New Patterns for 2026',
        excerpt: 'Explore how edge computing and predictive pre-fetching are changing the way mobile applications receive updates in real-time.',
        author: 'Naimish Kumar',
        date: 'Feb 24, 2026',
        readTime: '6 min read',
        tag: 'Architecture',
        color: 'var(--cyan)'
    },
    {
        id: 2,
        title: 'Securing Your JavaScript Bundles at Scale',
        excerpt: 'A deep dive into digital signatures, integrity checks, and how to prevent man-in-the-middle attacks on your mobile assets.',
        author: 'Sarah Chen',
        date: 'Feb 20, 2026',
        readTime: '8 min read',
        tag: 'Security',
        color: 'var(--green)'
    },
    {
        id: 3,
        title: '5 Reasons Apps Get Rejected (And How OTA Avoids Them)',
        excerpt: 'Store guidelines are shifting. Learn how to maintain compliance while keeping your release velocity at its peak.',
        author: 'Mark Thompson',
        date: 'Feb 15, 2026',
        readTime: '5 min read',
        tag: 'Engineering',
        color: 'var(--amber)'
    },
    {
        id: 4,
        title: 'Automating Rollbacks with Predictive Analytics',
        excerpt: 'Leveraging machine learning to detect anomalous crash patterns before they affect your entire user base.',
        author: 'Alex Rivier',
        date: 'Feb 08, 2026',
        readTime: '7 min read',
        tag: 'DevOps',
        color: 'var(--cyan)'
    },
    {
        id: 5,
        title: 'Optimizing Bundle Size for Global Markets',
        excerpt: 'Techniques for ensuring your OTA updates don\'t break the data bank for users on limited connectivity plans.',
        author: 'Priya Das',
        date: 'Jan 28, 2026',
        readTime: '10 min read',
        tag: 'Optimization',
        color: 'var(--green)'
    }
]

export default function BlogPage() {
    const featured = posts[0]
    const others = posts.slice(1)

    return (
        <>
            <div className="hero-grid" style={{ height: '50vh', opacity: 0.3 }} />

            <section style={{ padding: '160px 48px 80px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <div className="afu" style={{ color: 'var(--cyan)', fontSize: '12px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px' }}>HotPatch Journal</div>
                    <h1 className="afu1" style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: '20px' }}>
                        Insights from the <span style={{ color: 'var(--cyan)' }}>Edge</span>
                    </h1>
                    <p className="afu2" style={{ color: 'var(--muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                        Deep dives into mobile architecture, security, and the future of instant software delivery.
                    </p>
                </div>

                {/* ── FEATURED POST ── */}
                <Link href={`/blog/${featured.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="afu3" style={{
                        background: 'var(--navy2)', border: '1px solid var(--border2)', borderRadius: '24px',
                        padding: '60px', marginBottom: '60px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px',
                        alignItems: 'center', transition: 'transform .3s, border-color .3s', cursor: 'pointer'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <span style={{ padding: '4px 12px', borderRadius: '100px', background: 'var(--cdim)', color: 'var(--cyan)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
                                    FEATURED
                                </span>
                                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{featured.date}</span>
                            </div>
                            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.2, marginBottom: '24px' }}>
                                {featured.title}
                            </h2>
                            <p style={{ color: 'var(--muted)', fontSize: '17px', lineHeight: 1.7, marginBottom: '32px' }}>
                                {featured.excerpt}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{featured.author[0]}</div>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>{featured.author}</span>
                                <span style={{ color: 'var(--muted)', fontSize: '14px' }}>· {featured.readTime}</span>
                            </div>
                        </div>
                        <div style={{
                            height: '340px', background: 'var(--navy)', borderRadius: '16px', border: '1px solid var(--border)',
                            position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'radial-gradient(circle at center, var(--cyan) 0%, transparent 70%)' }} />
                            <Search size={64} style={{ color: 'var(--cyan)', opacity: 0.1 }} />
                        </div>
                    </div>
                </Link>

                {/* ── POSTS GRID ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
                    {others.map((p, i) => (
                        <Link key={p.id} href={`/blog/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className={`afu${(i % 4) + 1}`} style={{
                                background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '20px',
                                padding: '40px', height: '100%', display: 'flex', flexDirection: 'column',
                                transition: 'all .3s', cursor: 'pointer'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '1px' }}>{p.tag}</span>
                                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{p.date}</span>
                                </div>
                                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '16px', flexGrow: 1 }}>{p.title}</h3>
                                <p style={{ color: 'var(--muted)', fontSize: '14.5px', lineHeight: 1.6, marginBottom: '24px' }}>{p.excerpt}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--navy3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>{p.author[0]}</div>
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{p.author}</span>
                                    <span style={{ color: 'var(--muted)', fontSize: '13px' }}>· {p.readTime}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ── PAGINATION ── */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '80px', gap: '10px' }}>
                    <button style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border2)', background: 'var(--navy2)', color: 'var(--white)', cursor: 'pointer' }}>1</button>
                    <button style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid transparent', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>2</button>
                    <button style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid transparent', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>3</button>
                    <button style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid transparent', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </section>

            <CtaSection />
            <Footer />
        </>
    )
}
