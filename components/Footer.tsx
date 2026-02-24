'use client'
import Link from 'next/link'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)', padding: '60px 48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      maxWidth: '1200px', margin: '0 auto', width: '100%'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '60px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <div>
          <Logo width={140} height={30} />
          <p style={{ marginTop: '20px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, maxWidth: '280px' }}>
            The enterprise-grade over-the-air update server for modern React Native applications.
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Product</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/features" style={linkStyle}>Features</Link>
            <Link href="/services" style={linkStyle}>Services</Link>
            <Link href="/pricing" style={linkStyle}>Pricing</Link>
            <Link href="/updates" style={linkStyle}>Release Notes</Link>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Company</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/about" style={linkStyle}>About Us</Link>
            <Link href="/contact" style={linkStyle}>Contact</Link>
            <Link href="/blog" style={linkStyle}>Blog</Link>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Legal</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>
            <Link href="/terms" style={linkStyle}>Terms of Service</Link>
            <Link href="/security" style={linkStyle}>Security</Link>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '60px',
        paddingTop: '30px',
        borderTop: '1px solid var(--border)',
        width: '100%',
        maxWidth: '1200px',
        margin: '60px auto 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
        color: 'var(--muted2)'
      }}>
        <div>© 2025 HotPatch OTA. Built for React Native.</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>Twitter</span>
          <span>GitHub</span>
          <span>Discord</span>
        </div>
      </div>
    </footer>
  )
}

const linkStyle = {
  fontSize: '14px',
  color: 'var(--muted)',
  textDecoration: 'none',
  transition: 'color .2s',
}
