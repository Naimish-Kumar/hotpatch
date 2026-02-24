import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { CtaSection } from '@/components/CtaSection'
import {
  Zap, ShieldCheck, BarChart3, GitBranch, Smartphone, TrendingUp,
  Terminal, Globe, ArrowRight, Check, Play, Settings
} from 'lucide-react'

const stats = [
  { val: '2.4M', label: 'Updates delivered to users' },
  { val: '<2 min', label: 'From publish to user devices' },
  { val: '99.98%', label: 'Platform uptime' },
  { val: 'Zero', label: 'App Store rejections' },
]

const features = [
  { icon: Zap, title: 'Updates in Minutes, Not Days', desc: 'The moment you publish, users get your fix. No review queue, no store delay.' },
  { icon: ShieldCheck, title: 'Automatic Safety Net', desc: 'Crash detected? The app automatically reverts. Your users never see a broken app.' },
  { icon: BarChart3, title: 'Gradual Rollouts', desc: 'Ship to 5% first, watch the numbers, expand confidently. One slider in your dashboard.' },
  { icon: GitBranch, title: 'Test Before You Ship', desc: 'Internal team → beta testers → production. Each channel is independent.' },
  { icon: Smartphone, title: 'Android & iOS Together', desc: 'One publish command covers both platforms. One workflow for your whole team.' },
  { icon: TrendingUp, title: 'See What\'s Happening', desc: 'Live adoption rates, version distribution, and rollback alerts — all in your dashboard.' },
]

const steps = [
  { n: '01', t: 'You publish an update', d: 'Run one command from your computer. HotPatch packages, verifies, and secures your update automatically.' },
  { n: '02', t: 'We deliver it instantly', d: 'Your update is distributed globally and made available to your users within seconds of publishing.' },
  { n: '03', t: 'Users receive it silently', d: 'Next time users open your app, it quietly checks for updates in the background. No prompts, no friction.' },
  { n: '04', t: 'App stays protected', d: 'If anything goes wrong, HotPatch detects it and rolls back automatically. Your users never see a broken app.' },
]

const flow = [
  { icon: Terminal, bg: 'rgba(0,212,255,.12)', title: 'You publish an update', sub: 'One command from your terminal' },
  { icon: ShieldCheck, bg: 'rgba(0,229,160,.12)', title: 'Update is verified & secured', sub: 'Integrity check + digital signature' },
  { icon: Globe, bg: 'rgba(255,184,48,.12)', title: 'Delivered to global CDN', sub: 'Instantly available worldwide' },
  { icon: BarChart3, bg: 'rgba(0,212,255,.12)', title: 'Rollout begins (your %)', sub: '5%, 25%, 50%, or 100% of users' },
  { icon: Smartphone, bg: 'rgba(0,229,160,.12)', title: 'User opens app → updated', sub: 'Silent, seamless, automatic' },
]

export default function Home() {
  return (
    <>
      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', position: 'relative', padding: '130px 48px 80px', overflow: 'hidden'
      }}>
        <div className="hero-grid" />
        <div style={{
          position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '720px', height: '380px',
          background: 'radial-gradient(ellipse,rgba(0,212,255,.07) 0%,transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '880px' }}>
          <div className="afu" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '5px 16px', border: '1px solid var(--border2)', borderRadius: '100px',
            background: 'var(--cdim)', fontSize: '11.1px', fontWeight: 600,
            letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '30px'
          }}>
            <span className="badge-dot" /> Now in Public Beta
          </div>
          <h1 className="afu1" style={{
            fontFamily: 'Syne,sans-serif', fontSize: 'clamp(46px,8vw,90px)', fontWeight: 800,
            lineHeight: 1.0, letterSpacing: '-3px', marginBottom: '26px'
          }}>
            Fix your app<br /><span style={{ color: 'var(--cyan)' }}>without waiting</span>
          </h1>
          <p className="afu2" style={{
            fontSize: '18px', fontWeight: 400, color: 'var(--muted)',
            maxWidth: '590px', margin: '0 auto 44px', lineHeight: 1.75
          }}>
            HotPatch lets you push updates to your React Native app instantly. Straight to your
            users&apos; phones, no App Store review, no friction.
          </p>
          <div className="afu3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '72px' }}>
            <Link href="/login" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '13px 32px', border: 'none', borderRadius: '10px',
              background: 'var(--cyan)', color: 'var(--navy)', fontSize: '15px', fontWeight: 700,
              cursor: 'pointer', textDecoration: 'none', transition: 'all .22s'
            }}>Get Started <ArrowRight size={18} /></Link>
            <Link href="/docs" style={{
              padding: '13px 32px', border: '1px solid var(--border2)', borderRadius: '10px',
              background: 'transparent', color: 'var(--white)', fontSize: '15px', fontWeight: 500,
              cursor: 'pointer', textDecoration: 'none', transition: 'all .22s'
            }}>See How It Works</Link>
          </div>
          {/* Terminal */}
          <div className="afu4" style={{
            maxWidth: '600px', margin: '0 auto', borderRadius: '14px', overflow: 'hidden',
            border: '1px solid var(--border2)', boxShadow: '0 40px 80px rgba(0,0,0,.5)'
          }}>
            <div style={{ background: '#0d1a28', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {['#ff5f57', '#ffbd2e', '#28c840'].map(c => (
                <div key={c} style={{ width: '11px', height: '11px', borderRadius: '50%', background: c }} />
              ))}
              <div style={{ flex: 1, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace', fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
                Publishing an update
              </div>
            </div>
            <div style={{ background: '#070d16', padding: '22px 24px', textAlign: 'left', fontFamily: 'JetBrains Mono,monospace', fontSize: '13px', lineHeight: 2.1 }}>
              <div><span style={{ color: 'var(--muted)' }}>$ </span><span>hotpatch release --version 2.4.1 --channel production</span></div>
              <div style={{ color: 'var(--muted)' }}>  ⠙ Packaging your update...</div>
              <div style={{ color: 'var(--muted)' }}>  ⠙ Securing bundle (verification + signing)...</div>
              <div style={{ color: 'var(--cyan)' }}>  ✓ Bundle verified and signed</div>
              <div style={{ color: 'var(--muted)' }}>  ⠙ Delivering to CDN...</div>
              <div style={{ color: 'var(--green)' }}>  ✓ Update 2.4.1 is live</div>
              <div style={{ color: 'var(--amber)' }}>  → Reaching 10% of users first · Can expand anytime</div>
              <div><span style={{ color: 'var(--muted)' }}>$ </span><span className="cursor-blink" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div style={{ padding: '0 48px' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
          border: '1px solid var(--border)', borderRadius: '16px',
          background: 'rgba(10,22,40,.9)', backdropFilter: 'blur(14px)', overflow: 'hidden'
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: '34px 30px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '38px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, marginBottom: '5px' }}>
                <span style={{ color: 'var(--cyan)' }}>{s.val}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ padding: '100px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '14px' }}>Why HotPatch</p>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(30px,4vw,46px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: '56px', maxWidth: '580px' }}>
          Your users get fixes immediately. Not in 3 days.
        </h2>
        <div className="feat-grid">
          {features.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} style={{ background: 'var(--navy2)', padding: '38px 34px', transition: 'background .2s' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '11px', background: 'var(--cdim)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <Icon size={20} style={{ color: 'var(--cyan)' }} />
                </div>
                <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '17px', fontWeight: 700, letterSpacing: '-.4px', marginBottom: '9px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7, fontWeight: 400 }}>{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ padding: '0 48px 100px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '14px' }}>The Process</p>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(30px,4vw,46px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: '36px' }}>
              Publish in seconds. Users see it in minutes.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {steps.map((s, i) => (
                <div key={s.n} style={{ display: 'flex', gap: '22px', padding: '26px 0', borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ flexShrink: 0, width: '34px', height: '34px', borderRadius: '50%', border: '1px solid var(--border2)', background: 'var(--cdim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono,monospace', fontSize: '12px', color: 'var(--cyan)', fontWeight: 600 }}>
                    {s.n}
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'Syne,sans-serif', fontSize: '15.5px', fontWeight: 700, marginBottom: '5px' }}>{s.t}</h4>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.65, fontWeight: 400 }}>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px' }}>
            {flow.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={f.title}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px', borderRadius: '9px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} style={{ color: 'white' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '13px', fontWeight: 500 }}>{f.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>{f.sub}</div>
                    </div>
                  </div>
                  {i < flow.length - 1 && <div style={{ textAlign: 'center', color: 'var(--cyan)', fontSize: '11px', opacity: .4, padding: '1px 0 1px 24px' }}>↓</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <CtaSection />
      <Footer />
    </>
  )
}
