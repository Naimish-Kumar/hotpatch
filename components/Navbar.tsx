'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from './Logo'

const links = [
  { href: '/features', label: 'Features' },
  { href: '/docs', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/updates', label: 'Updates' },
]

export function Navbar() {
  const path = usePathname()
  if (path.startsWith('/dashboard') || path === '/login') return null

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: '66px',
      background: 'rgba(6,14,26,0.9)', backdropFilter: 'blur(18px)',
      borderBottom: '1px solid var(--border)'
    }}>
      <Link href="/"><Logo width={200} height={44} /></Link>
      <ul style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none' }}>
        {links.map(l => {
          const active = path === l.href
          return (
            <li key={l.href}>
              <Link href={l.href} style={{
                background: 'none', border: 'none', color: active ? 'var(--cyan)' : 'var(--muted)',
                fontFamily: 'Inter,sans-serif', fontSize: '14px', fontWeight: 500,
                padding: '6px 14px', borderRadius: '7px', cursor: 'pointer',
                textDecoration: 'none', display: 'block', position: 'relative',
                transition: 'all .18s'
              }}>
                {l.label}
                {active && (
                  <span style={{
                    position: 'absolute', bottom: '-21px', left: '50%', transform: 'translateX(-50%)',
                    width: '18px', height: '2px', background: 'var(--cyan)', borderRadius: '2px',
                    display: 'block'
                  }} />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link href="/login" style={{
          padding: '7px 18px', border: '1px solid var(--border2)', borderRadius: '8px',
          background: 'transparent', color: 'var(--white)', fontSize: '13.5px', fontWeight: 500,
          cursor: 'pointer', textDecoration: 'none', transition: 'all .18s'
        }}>Sign In</Link>
        <Link href="/login" style={{
          padding: '7px 18px', border: 'none', borderRadius: '8px',
          background: 'var(--cyan)', color: 'var(--navy)', fontSize: '13.5px', fontWeight: 700,
          cursor: 'pointer', textDecoration: 'none', transition: 'all .18s'
        }}>Get Started Free</Link>
      </div>
    </nav>
  )
}
