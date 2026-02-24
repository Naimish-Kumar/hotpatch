import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { CtaSection } from '@/components/CtaSection'
import { Zap, ShieldCheck, BarChart3, GitBranch, TrendingUp, Bell, Check } from 'lucide-react'

const cards = [
  {
    icon: Zap, title: 'Updates in Minutes, Not Days',
    desc: 'The average App Store review takes 24–72 hours. With HotPatch, your update reaches users the moment you publish it. Found a critical bug at 11pm? Fix it and ship it tonight — not next week.',
    bullets: ['No App Store or Play Store submission required', 'Updates go live as soon as you publish', 'Works on Android and iOS simultaneously'],
    radius: '24px 8px 8px 8px'
  },
  {
    icon: ShieldCheck, title: 'Automatic Safety Net',
    desc: 'Every update is verified for integrity before it\'s applied. If an update causes your app to crash, HotPatch detects it automatically on the very next launch and reverts to the last version that was working.',
    bullets: ['Crash detection happens automatically on launch', 'Previous working version is always kept on-device', 'Rollback events reported to your dashboard'],
    radius: '8px 24px 8px 8px'
  },
  {
    icon: BarChart3, title: 'Gradual Rollouts',
    desc: 'Start by sending your update to just 5% of users. Watch how they respond. If everything looks good, increase to 25%, then 50%, then everyone. At any point you can pause or roll back immediately.',
    bullets: ['Set rollout % with a simple slider in your dashboard', 'Each user stays in their assigned group — no randomness', 'Instant rollback any time, from the dashboard'],
    radius: '8px 8px 8px 8px'
  },
  {
    icon: GitBranch, title: 'Release Channels',
    desc: 'Use separate channels to control who gets what. Send an update to your internal team first, then to beta testers, then to everyone. Each channel is independent — promoting to production is one click.',
    bullets: ['Production, Staging, Beta channels built-in', 'Custom channels for any workflow you need', 'One-click promotion between channels'],
    radius: '8px 8px 8px 8px'
  },
  {
    icon: TrendingUp, title: 'Real-time Analytics',
    desc: 'Your dashboard shows you which users are on which version in real time. You\'ll know if an update is rolling out smoothly, how many devices have applied it, and whether any have rolled back.',
    bullets: ['Live update adoption rate per release', 'Version distribution across all your users', 'Rollback alerts with affected device count'],
    radius: '8px 8px 8px 24px'
  },
  {
    icon: Bell, title: 'Mandatory Updates',
    desc: 'For critical fixes — security patches, broken checkout flows, data corruption bugs — you can mark an update as mandatory. The app applies it immediately on next open, rather than waiting for the next relaunch.',
    bullets: ['Toggle mandatory flag when publishing', 'Applied immediately on next app open', 'Seamless for users — no prompts or interruptions'],
    radius: '8px 8px 24px 8px'
  },
]

export default function Features() {
  return (
    <>
      <div style={{ paddingTop: '66px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '100px 48px 60px', textAlign: 'center' }}>
          <p style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '16px' }}>Features</p>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 800, letterSpacing: '-3px', marginBottom: '20px', lineHeight: 1 }}>
            Built around one idea:<br /><span style={{ color: 'var(--cyan)' }}>zero user downtime.</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--muted)', maxWidth: '640px', margin: '0 auto', fontWeight: 400, lineHeight: 1.75 }}>
            Everything HotPatch does is designed to get your updates to users faster, safer, and with zero friction.
          </p>
        </div>

        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 48px 100px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {cards.map(c => {
            const Icon = c.icon
            return (
              <div key={c.title} style={{ background: 'var(--navy2)', borderRadius: c.radius, padding: '56px 48px', border: '1px solid var(--border)', transition: 'all .3s ease' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(0,212,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
                  <Icon size={28} style={{ color: 'var(--cyan)' }} />
                </div>
                <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '26px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '14px' }}>{c.title}</h2>
                <p style={{ fontSize: '15.5px', color: 'var(--muted)', lineHeight: 1.8, marginBottom: '24px', fontWeight: 400 }}>{c.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {c.bullets.map(b => (
                    <div key={b} style={{ fontSize: '14px', color: 'var(--muted)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,229,160,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={11} style={{ color: 'var(--green)' }} />
                      </div>
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <CtaSection title="Ready to try it?" subtitle="Get started free. Your first update live in under 10 minutes." />
        <div style={{ marginTop: '40px' }}>
          <Footer />
        </div>
      </div>
    </>
  )
}
