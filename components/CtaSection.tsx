import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CtaSection({ title = 'Start shipping faster today', subtitle = 'Free to start. No credit card needed. Your first update live in under 10 minutes.' }: { title?: string; subtitle?: string }) {
  return (
    <div style={{ padding: '0 48px 100px' }}>
      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        background: 'linear-gradient(135deg,#0a1e38,#0f2a4a)',
        border: '1px solid var(--border2)', borderRadius: '32px',
        padding: '80px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse,rgba(0,212,255,.08),transparent 70%)',
          pointerEvents: 'none'
        }} />
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: '16px', position: 'relative', lineHeight: 1.1 }}>{title}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '18px', marginBottom: '40px', position: 'relative', fontWeight: 400, maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6 }}>{subtitle}</p>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '14px 34px', border: 'none', borderRadius: '12px',
          background: 'var(--cyan)', color: 'var(--navy)', fontSize: '15.5px', fontWeight: 800,
          cursor: 'pointer', textDecoration: 'none', transition: 'all .22s'
        }}>Get Started Free <ArrowRight size={18} /></Link>
      </div>
    </div>
  )
}
