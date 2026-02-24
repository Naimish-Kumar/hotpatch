'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { FaqItem } from '@/components/FaqItem'
import { Check, ArrowRight } from 'lucide-react'

const free = ['Up to 10,000 active devices', 'Unlimited updates', '1 release channel', 'Automatic crash rollback', 'Basic dashboard', 'Community support']
const pro = ['Unlimited active devices', 'Unlimited updates', '3 release channels', 'Gradual rollout control', 'Full analytics & version tracking', 'Mandatory update flag', 'Smaller update downloads', 'Priority email support']
const ent = ['Everything in Pro', 'Unlimited channels', 'Self-hosted option', 'Team management & SSO', '99.99% uptime SLA', 'A/B testing', 'Dedicated account manager', 'Slack support']

const tableRows = [
  ['Active devices', '10,000', 'Unlimited', 'Unlimited'],
  ['Monthly updates', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['Release channels', '1', '3', 'Unlimited'],
  ['Automatic crash rollback', '✓', '✓', '✓'],
  ['Gradual rollout control', '—', '✓', '✓'],
  ['Mandatory updates', '—', '✓', '✓'],
  ['Analytics & tracking', 'Basic', 'Full', 'Full'],
  ['Smaller update downloads', '—', '✓', '✓'],
  ['A/B testing', '—', '—', '✓'],
  ['Self-hosted', '—', '—', '✓'],
  ['Uptime SLA', '—', '99.9%', '99.99%'],
  ['Support', 'Community', 'Priority email', 'Dedicated + Slack'],
]

const pricingFaqs = [
  { q: "What counts as an 'active device'?", a: "An active device is any unique device that has checked in with HotPatch at least once in the past 30 days. Devices that haven't opened your app in over 30 days don't count against your limit." },
  { q: 'Can I switch plans at any time?', a: 'Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period.' },
  { q: "What happens if I go over 10,000 devices on the Free plan?", a: "We'll notify you when you're approaching the limit. Updates will continue working for existing devices, but new devices beyond the limit won't receive updates until you upgrade to Pro." },
  { q: 'Is the 14-day Pro trial really free?', a: 'Yes — no credit card required to start your trial. At the end of 14 days you can choose to subscribe or your account returns to the Free plan. Your data and releases are preserved either way.' },
]

function PlanFeature({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '30px' }}>
      {items.map(item => (
        <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '14px', color: 'var(--muted)', fontWeight: 400 }}>
          <span style={{ color: 'var(--cyan)', width: '18px', height: '18px', background: 'rgba(0,212,255,.1)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check size={11} strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function Pricing() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const yearly = period === 'yearly'

  const activeBtn = { padding: '7px 20px', borderRadius: '7px', border: 'none', background: 'var(--cyan)', color: 'var(--navy)', fontFamily: 'Inter,sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }
  const inactiveBtn = { padding: '7px 20px', borderRadius: '7px', border: 'none', background: 'transparent', color: 'var(--muted)', fontFamily: 'Inter,sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }

  return (
    <div style={{ paddingTop: '66px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px 0', textAlign: 'center' }}>
        <p style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '14px' }}>Pricing</p>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(36px,5vw,58px)', fontWeight: 800, letterSpacing: '-2.5px', marginBottom: '14px' }}>Simple, transparent pricing</h1>
        <p style={{ fontSize: '18px', color: 'var(--muted)', maxWidth: '520px', margin: '0 auto', fontWeight: 400, lineHeight: 1.75 }}>
          No charge per update. No surprise bills. Pay a flat monthly rate and ship as many updates as your users need.
        </p>
        {/* Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '32px', padding: '4px', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px' }}>
          <button style={!yearly ? activeBtn : inactiveBtn} onClick={() => setPeriod('monthly')}>Monthly</button>
          <button style={yearly ? activeBtn : inactiveBtn} onClick={() => setPeriod('yearly')}>
            Yearly &nbsp;<span style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 700 }}>Save 25%</span>
          </button>
        </div>
      </div>

      <div style={{ padding: '40px 48px 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '22px', marginTop: '56px' }}>
            {/* Free */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '38px 34px', transition: 'all .2s' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Free</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '50px', fontWeight: 800, letterSpacing: '-3px', lineHeight: 1, marginBottom: '5px' }}><span style={{ fontSize: '22px', verticalAlign: 'top', marginTop: '10px', display: 'inline-block', color: 'var(--muted)' }}>$</span>0</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '30px', fontWeight: 500 }}>forever, no card needed</div>
              <PlanFeature items={free} />
              <Link href="/login" style={{ display: 'block', width: '100%', padding: '11px', borderRadius: '9px', fontFamily: 'Inter,sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--white)', textAlign: 'center', textDecoration: 'none' }}>
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div style={{ background: 'linear-gradient(160deg,rgba(0,212,255,.06),var(--navy2))', border: '1px solid var(--cyan)', borderRadius: '20px', padding: '38px 34px', position: 'relative', transition: 'all .2s' }}>
              <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', padding: '3px 14px', background: 'var(--cyan)', color: 'var(--navy)', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', borderRadius: '100px' }}>MOST POPULAR</div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Pro</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '50px', fontWeight: 800, letterSpacing: '-3px', lineHeight: 1, marginBottom: '5px' }}>
                <span style={{ fontSize: '22px', verticalAlign: 'top', marginTop: '10px', display: 'inline-block', color: 'var(--muted)' }}>$</span>
                {yearly ? '37' : '49'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '30px', fontWeight: 500 }}>{yearly ? 'per month, billed yearly' : 'per month · cancel anytime'}</div>
              <PlanFeature items={pro} />
              <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '11px', borderRadius: '9px', fontFamily: 'Inter,sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer', border: 'none', background: 'var(--cyan)', color: 'var(--navy)', textAlign: 'center', textDecoration: 'none' }}>
                Start 14-Day Free Trial <ArrowRight size={16} />
              </Link>
            </div>

            {/* Enterprise */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '38px 34px', transition: 'all .2s' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Enterprise</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '34px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1, marginBottom: '5px', paddingTop: '6px' }}>Custom</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '30px', fontWeight: 500 }}>billed annually</div>
              <PlanFeature items={ent} />
              <button style={{ width: '100%', padding: '11px', borderRadius: '9px', fontFamily: 'Inter,sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--white)' }}>
                Contact Sales
              </button>
            </div>
          </div>

          {/* Comparison table */}
          <div style={{ marginTop: '90px' }}>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '30px', fontWeight: 800, letterSpacing: '-.8px', marginBottom: '8px' }}>Compare plans</h2>
            <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '32px', fontWeight: 400 }}>Everything you need to know about what&apos;s included.</p>
            <div style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--navy2)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '20px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>What&apos;s included</th>
                    <th style={{ textAlign: 'center', padding: '20px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Free</th>
                    <th style={{ textAlign: 'center', padding: '20px', fontSize: '12px', fontWeight: 600, color: 'var(--cyan)', textTransform: 'uppercase' }}>Pro</th>
                    <th style={{ textAlign: 'center', padding: '20px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(([feature, free, pro, ent], i) => (
                    <tr key={feature} style={{ borderBottom: i < tableRows.length - 1 ? '1px solid rgba(255,255,255,.03)' : 'none' }}>
                      <td style={{ padding: '18px 24px', fontSize: '14px', color: 'var(--muted)', fontWeight: 400 }}>{feature}</td>
                      <td style={{ padding: '18px', textAlign: 'center', fontSize: '14px', color: free === '✓' ? 'var(--green)' : 'var(--white)', fontWeight: free === '✓' ? 700 : 400 }}>{free}</td>
                      <td style={{ padding: '18px', textAlign: 'center', fontSize: '14px', color: pro === '✓' ? 'var(--green)' : 'var(--cyan)', fontWeight: 700 }}>{pro}</td>
                      <td style={{ padding: '18px', textAlign: 'center', fontSize: '14px', color: ent === '✓' ? 'var(--green)' : 'var(--white)', fontWeight: ent === '✓' ? 700 : 400 }}>{ent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing FAQ */}
          <div style={{ marginTop: '100px', marginBottom: '80px' }}>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '30px', fontWeight: 800, letterSpacing: '-.8px', marginBottom: '32px' }}>Pricing questions</h2>
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {pricingFaqs.map(f => <FaqItem key={f.q} question={f.q} answer={f.a} />)}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
