'use client'
import { Footer } from '@/components/Footer'
import { Rocket, ShieldCheck, GitBranch, Zap, Sparkles, Check } from 'lucide-react'

type TagType = 'new' | 'fix' | 'improved'

interface Release {
  month: string
  ver: string
  title: string
  desc: string
  tags: { label: string; type: TagType }[]
  items: string[]
  icon: any
}

const releases: Release[] = [
  {
    month: 'Feb 2025', ver: 'v1.1.0',
    icon: Sparkles,
    title: 'Brand Refresh: A More Professional HotPatch',
    desc: 'We\'ve overhauled our design system and dashboard. New typography (Syne & Inter), completely new icon set (Lucide), and a more streamlined deployment workflow for power users.',
    tags: [{ label: 'Design', type: 'new' }, { label: 'New', type: 'new' }],
    items: [
      'Entire dashboard refactored with Lucide React icons for a cleaner, SVG-native feel',
      'Typography updated to Inter for readability and Syne for impactful headers',
      'New "Deploy to Edge" modal on the Releases page with drag-and-drop bundle support',
      'Improved loading states and progressive animations throughout the dashboard',
    ]
  },
  {
    month: 'Jan 2025', ver: 'v1.0.5',
    icon: ShieldCheck,
    title: 'Update Signing — Your Users Are Now Even More Protected',
    desc: 'Each bundle is now digitally signed when you publish it, and the app on your users\' device verifies that signature before applying anything. Safety first.',
    tags: [{ label: 'Security', type: 'new' }],
    items: [
      'Digital signatures added to all published updates — automatically secured with Ed25519',
      'Updates from unauthorized sources are now rejected on-device',
      'Dashboard now shows a "Verified" badge on all signed releases',
    ]
  },
  {
    month: 'Dec 2024', ver: 'v1.0.0',
    icon: GitBranch,
    title: 'Gradual Rollouts Released',
    desc: 'You can now release updates to a percentage of your users instead of everyone at once. Start with 5%, check your dashboard, then expand.',
    tags: [{ label: 'Performance', type: 'improved' }, { label: 'New', type: 'new' }],
    items: [
      'Variable rollout control (1–100%) for all release channels',
      'Users assigned to stable groups to ensure consistent experience',
      '85% improvement in update check response times via new edge caching layer',
    ]
  },
  {
    month: 'Nov 2024', ver: 'v0.7.0',
    icon: Zap,
    title: 'Channels & Mandatory Updates',
    desc: 'Channels let you test before you ship. Mandatory updates ensure critical fixes reach users immediately without waiting for a restart.',
    tags: [{ label: 'New Feature', type: 'new' }],
    items: [
      'Three channels built-in: Production, Staging, and Beta',
      'One-click promotion between channels in the dashboard',
      'Mandatory flag for critical security patches and hotfixes',
    ]
  },
  {
    month: 'Oct 2024', ver: 'v0.1.0',
    icon: Rocket,
    title: 'HotPatch Public Beta Launch 🎉',
    desc: 'HotPatch is officially live. Publish your first update, watch it land on your users\' devices in minutes, and never wait for App Store review again.',
    tags: [{ label: 'Launch', type: 'new' }],
    items: [
      'Full React Native support for Android and iOS',
      'Real-time delivery tracking and device distribution analytics',
      'Automatic crash rollback protection for all users',
    ]
  },
]

const tagColors: Record<TagType, { bg: string; color: string }> = {
  new: { bg: 'rgba(0,212,255,.12)', color: 'var(--cyan)' },
  fix: { bg: 'rgba(0,229,160,.12)', color: 'var(--green)' },
  improved: { bg: 'rgba(255,184,48,.12)', color: 'var(--amber)' },
}

export default function Updates() {
  return (
    <div style={{ paddingTop: '66px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '100px 48px' }}>
        <div style={{ marginBottom: '64px' }}>
          <p style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '16px' }}>Product Updates</p>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(40px,5vw,64px)', fontWeight: 800, letterSpacing: '-3px', marginBottom: '16px' }}>What&apos;s new</h1>
          <p style={{ fontSize: '18px', color: 'var(--muted)', fontWeight: 400, maxWidth: '580px', lineHeight: 1.6 }}>
            The latest features, security improvements, and design updates from the HotPatch team.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: '26px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, var(--cyan), transparent)', opacity: .1 }} />

          {releases.map((r, i) => {
            const Icon = r.icon
            return (
              <div key={r.ver} style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: '32px', marginBottom: '80px', position: 'relative' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%', background: 'var(--navy)',
                  border: '2px solid var(--border)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', zIndex: 2, color: 'var(--cyan)', boxShadow: '0 0 20px rgba(0,0,0,.3)'
                }}>
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '14px', color: 'var(--cyan)', fontWeight: 700 }}>{r.month}</div>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
                    <div style={{ fontSize: '12px', color: 'var(--muted2)', fontWeight: 500 }}>{r.ver}</div>
                  </div>
                  <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: 800, letterSpacing: '-.8px', marginBottom: '12px' }}>{r.title}</h3>
                  <p style={{ fontSize: '15.5px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '20px', fontWeight: 400 }}>{r.desc}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                    {r.tags.map(t => (
                      <span key={t.label} style={{ fontSize: '10px', padding: '3px 12px', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', background: tagColors[t.type].bg, color: tagColors[t.type].color }}>{t.label}</span>
                    ))}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {r.items.map(item => (
                        <li key={item} style={{ fontSize: '14.5px', color: 'var(--muted)', display: 'flex', gap: '12px', lineHeight: 1.6 }}>
                          <div style={{ marginTop: '4px', color: 'var(--cyan)', flexShrink: 0 }}><Check size={14} /></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <Footer />
    </div>
  )
}
