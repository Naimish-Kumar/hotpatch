'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Footer } from '@/components/Footer'
import { Mail, MessageSquare, Send, MapPin } from 'lucide-react'

export default function ContactPage() {
    const [sent, setSent] = useState(false)

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

            <main style={{ padding: '100px 48px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>
                    {/* Info Side */}
                    <div>
                        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '56px', fontWeight: 800, letterSpacing: '-2px', marginBottom: '24px' }}>
                            Let's <span className="text-gradient">Talk</span>
                        </h1>
                        <p style={{ fontSize: '18px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '48px' }}>
                            Have questions about scaling? Need a custom enterprise plan? Or just want to say hi? Our team is here to help.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--cdim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Mail size={20} style={{ color: 'var(--cyan)' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '4px' }}>Email us</div>
                                    <div style={{ fontSize: '16px', fontWeight: 600 }}>hello@hotpatch.io</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--cdim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageSquare size={20} style={{ color: 'var(--cyan)' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '4px' }}>Discord</div>
                                    <div style={{ fontSize: '16px', fontWeight: 600 }}>Join our community</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px' }}>
                        {!sent ? (
                            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Name</label>
                                        <input required type="text" style={{ width: '100%', padding: '12px 16px', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', color: 'white', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Email</label>
                                        <input required type="email" style={{ width: '100%', padding: '12px 16px', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', color: 'white', outline: 'none' }} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Subject</label>
                                    <input required type="text" style={{ width: '100%', padding: '12px 16px', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', color: 'white', outline: 'none' }} />
                                </div>
                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Message</label>
                                    <textarea required rows={5} style={{ width: '100%', padding: '12px 16px', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', color: 'white', outline: 'none', resize: 'none' }} />
                                </div>
                                <button type="submit" style={{ width: '100%', padding: '14px', background: 'var(--cyan)', color: 'var(--navy)', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <Send size={18} /> Send Message
                                </button>
                            </form>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,212,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <Send size={32} style={{ color: 'var(--cyan)' }} />
                                </div>
                                <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Message Sent!</h3>
                                <p style={{ color: 'var(--muted)' }}>We'll get back to you shortly.</p>
                                <button onClick={() => setSent(false)} style={{ marginTop: '32px', background: 'transparent', border: 'none', color: 'var(--cyan)', fontWeight: 600, cursor: 'pointer' }}>Send another message</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
