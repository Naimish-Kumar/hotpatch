'use client'
import { useState } from 'react'
import { Footer } from '@/components/Footer'
import { FaqItem } from '@/components/FaqItem'
import { Terminal, Info, AlertTriangle, CheckCircle2, BookOpen, Layers, Zap, ShieldSafe, BarChart3, RotateCcw, Smartphone } from 'lucide-react'

type Section = { id: string; label: string }
const tocSections: { heading: string; links: Section[] }[] = [
  {
    heading: 'Getting Started', links: [
      { id: 'gs-overview', label: 'Overview' },
      { id: 'gs-setup', label: 'Setting Up' },
      { id: 'gs-first', label: 'Your First Update' },
    ]
  },
  {
    heading: 'Using HotPatch', links: [
      { id: 'using-channels', label: 'Channels' },
      { id: 'using-rollout', label: 'Rollout Control' },
      { id: 'using-rollback', label: 'Rollback' },
      { id: 'using-mandatory', label: 'Mandatory Updates' },
    ]
  },
  {
    heading: 'Your Dashboard', links: [
      { id: 'dash-releases', label: 'Managing Releases' },
      { id: 'dash-devices', label: 'Tracking Devices' },
      { id: 'dash-analytics', label: 'Understanding Analytics' },
    ]
  },
  {
    heading: 'Safety & Trust', links: [
      { id: 'safety-how', label: 'How Updates Stay Safe' },
      { id: 'safety-faq', label: 'FAQ' },
    ]
  },
]

function Callout({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  const Icon = warn ? AlertTriangle : Info
  return (
    <div style={{
      background: warn ? 'rgba(255,184,48,.05)' : 'rgba(0,212,255,.05)',
      border: `1px solid ${warn ? 'rgba(255,184,48,.1)' : 'rgba(0,212,255,.1)'}`,
      borderLeft: `3px solid ${warn ? 'var(--amber)' : 'var(--cyan)'}`,
      borderRadius: '8px', padding: '16px 20px', margin: '24px 0',
      fontSize: '14px', color: 'var(--muted)', lineHeight: 1.65,
      display: 'flex', gap: '14px'
    }}>
      <div style={{ flexShrink: 0, marginTop: '2px' }}><Icon size={16} style={{ color: warn ? 'var(--amber)' : 'var(--cyan)' }} /></div>
      <div>{children}</div>
    </div>
  )
}

function TipBox({ title, children }: { title: React.ReactNode; children: string }) {
  return (
    <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', margin: '0' }}>
      <h4 style={{ fontFamily: 'Syne,sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>{title}</h4>
      <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.65, margin: 0, fontWeight: 400 }}>{children}</p>
    </div>
  )
}

function StepCard({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 22px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%', background: 'var(--cdim)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono,monospace', fontSize: '12px', color: 'var(--cyan)', fontWeight: 700 }}>{num}</div>
      <div>
        <h5 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{title}</h5>
        <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, margin: 0, fontWeight: 400 }}>{desc}</p>
      </div>
    </div>
  )
}

const Badge = ({ children, type }: { children: string; type: 'prod' | 'staging' | 'beta' }) => {
  const colors = { prod: 'rgba(0,229,160,.12)', staging: 'rgba(255,184,48,.12)', beta: 'rgba(0,212,255,.12)' }
  const text = { prod: 'var(--green)', staging: 'var(--amber)', beta: 'var(--cyan)' }
  return <span style={{ display: 'inline-block', fontSize: '11px', padding: '2px 9px', borderRadius: '5px', fontWeight: 500, verticalAlign: 'middle', margin: '0 2px', background: colors[type], color: text[type], textTransform: 'uppercase', letterSpacing: '.5px' }}>{children}</span>
}

const faqs = [
  { q: 'Does HotPatch violate App Store guidelines?', a: 'No. Apple and Google allow updates to an app\'s JavaScript layer through OTA delivery, as long as the update doesn\'t change the app\'s core purpose or introduce new native functionality. HotPatch is designed to stay within these guidelines — the same model used by other major OTA tools in the ecosystem.' },
  { q: 'Will users see any pop-ups or interruptions when an update is applied?', a: 'No. Updates are applied silently in the background. For standard updates, users get the new version the next time they restart the app — they won\'t notice anything different. For mandatory updates, the app reloads immediately on next open, but there\'s still no pop-up or prompt. The experience is seamless.' },
  { q: 'What happens if a user has no internet connection when an update is available?', a: 'Nothing bad happens. The app continues running on its current version. The next time the user opens the app with an internet connection, HotPatch will check for updates again and apply the latest one at that point.' },
  { q: 'Can I update something that was originally in a store release?', a: 'HotPatch can update any part of your app that lives in the JavaScript layer — your screens, components, navigation, business logic, API calls, and most features. It cannot change native code, such as permissions, new native modules, or changes to your app\'s binary. Those still require a store release.' },
  { q: 'What if I publish a broken update?', a: 'If it causes crashes, HotPatch\'s automatic rollback catches it and reverts affected devices on their next launch. If the issue is not a crash (e.g. wrong content), you can manually roll back from your dashboard in seconds — all users will revert to the previous version on their next app open. Then publish a corrected update.' },
  { q: 'How long does it take for an update to reach all my users?', a: 'Updates are available to devices within seconds of publishing. How quickly 100% of your users receive it depends on how often they open your app. Most active users will have the update within a few hours. Users who haven\'t opened the app in a while will get it the next time they do.' },
  { q: 'Is my update data private?', a: 'Your update bundles are stored securely in your account and are not accessible to other users. HotPatch does not read the contents of your app bundle. Device tracking uses anonymous IDs only — no personal user data is collected by HotPatch.' },
]

export default function Docs() {
  const [activeId, setActiveId] = useState('gs-overview')

  function scrollTo(id: string) {
    setActiveId(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const S = ({ children, id }: { children: React.ReactNode; id: string }) =>
    <div id={id} style={{ marginBottom: '80px', scrollMarginTop: '100px' }}>{children}</div>

  const H2 = ({ children }: { children: string }) =>
    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>{children}</h2>

  const H3 = ({ children }: { children: string }) =>
    <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: '19px', fontWeight: 700, letterSpacing: '-.4px', margin: '36px 0 14px' }}>{children}</h3>

  const P = ({ children }: { children: React.ReactNode }) =>
    <p style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1.85, marginBottom: '18px', fontWeight: 400 }}>{children}</p>

  const UL = ({ items }: { items: React.ReactNode[] }) => (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '24px' }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: '15px', color: 'var(--muted)', display: 'flex', gap: '12px', lineHeight: 1.6, fontWeight: 400 }}>
          <span style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: '4px' }}><CheckCircle2 size={14} /></span>{item}
        </li>
      ))}
    </ul>
  )

  const OL = ({ items }: { items: React.ReactNode[] }) => (
    <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '24px', counterReset: 'li' }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: '15px', color: 'var(--muted)', display: 'flex', gap: '12px', lineHeight: 1.6, fontWeight: 400 }}>
          <span style={{ color: 'var(--cyan)', flexShrink: 0, fontFamily: 'JetBrains Mono,monospace', fontSize: '12px', fontWeight: 700, marginTop: '4px', minWidth: '22px' }}>{i + 1}.</span>{item}
        </li>
      ))}
    </ol>
  )

  const B = ({ children }: { children: string }) => <code style={{ color: 'var(--cyan)', background: 'rgba(0,212,255,.08)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'JetBrains Mono,monospace', fontSize: '13px', fontWeight: 500 }}>{children}</code>

  return (
    <div style={{ paddingTop: '66px' }}>
      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '80px 48px', gap: '80px', alignItems: 'flex-start' }}>

        {/* TOC Sidebar */}
        <div style={{ width: '220px', flexShrink: 0, position: 'sticky', top: '100px' }}>
          {tocSections.map(s => (
            <div key={s.heading} style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted2)', padding: '0 0 8px 12px', display: 'block' }}>{s.heading}</span>
              {s.links.map(l => (
                <a
                  key={l.id}
                  className={`toc-link${activeId === l.id ? ' active' : ''}`}
                  onClick={() => scrollTo(l.id)}
                  style={{
                    display: 'block', padding: '7px 12px', borderRadius: '7px', fontSize: '14px',
                    color: activeId === l.id ? 'var(--cyan)' : 'var(--muted)',
                    textDecoration: 'none', cursor: 'pointer', transition: 'all .2s',
                    background: activeId === l.id ? 'var(--cdim)' : 'transparent',
                    fontWeight: activeId === l.id ? 600 : 400
                  }}
                >{l.label}</a>
              ))}
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>

          <S id="gs-overview">
            <H2>What is HotPatch?</H2>
            <P>HotPatch lets you send updates to your React Native app directly to your users&apos; devices — no App Store submission, no review wait, no need for users to manually update. Your users always have the latest version of your app the next time they open it.</P>
            <P>Think of it like this: when you update a website, your users see the new version immediately. HotPatch brings that same instant delivery model to mobile apps.</P>
            <Callout><strong style={{ color: 'var(--white)' }}>What can HotPatch update?</strong> HotPatch updates your app&apos;s JavaScript layer — which covers your entire UI, all your screens, business logic, and most features. It cannot change native device features (like camera permissions or push notification setup), which still require a full App Store release.</Callout>
            <H3>Who is it for?</H3>
            <P>HotPatch is for any team building React Native apps who wants to move faster — fix bugs instantly, ship features without waiting for review, and know their users are always on the latest version.</P>
          </S>

          <S id="gs-setup">
            <H2>Setting Up</H2>
            <P>Getting HotPatch into your app takes about 10 minutes. There are two things to do: add HotPatch to your project, and connect it to your account.</P>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '24px 0' }}>
              <StepCard num={1} title="Create your account" desc="Sign up at hotpatch.dev. Create a new app in your dashboard and copy your App ID." />
              <StepCard num={2} title="Add HotPatch SDK" desc="Install the HotPatch SDK into your React Native project using npm or yarn." />
              <StepCard num={3} title="Configure your App ID" desc="Add configuration to your app's entry file, pasting in your App ID and choosing your starting channel." />
              <StepCard num={4} title="Install the CLI" desc="Install the HotPatch command-line tool. This is what you'll use to publish updates." />
              <StepCard num={5} title="Final Store Release" desc="Submit one final native build with HotPatch included. All future updates can go through HotPatch." />
            </div>
            <Callout warn><strong style={{ color: 'var(--amber)' }}>Note:</strong> HotPatch requires one native build to be installed on your users&apos; devices. Once they have that version, all future updates can go through HotPatch.</Callout>
          </S>

          <S id="gs-first">
            <H2>Your First Update</H2>
            <P>Once HotPatch is set up, publishing an update is a single command. Here&apos;s the full picture of what happens:</P>
            <OL items={[
              'You make a change to your app and are ready to ship it.',
              <span key="2">You run <B>hotpatch release --version 1.0.5</B> from your terminal.</span>,
              'HotPatch packages your app, verifies everything is intact, and secures it with a digital signature.',
              'The update is uploaded to our global delivery network — this takes seconds.',
              'The next time any of your users opens the app, it silently checks for updates in the background.',
              'The update downloads, is verified on-device, and is applied immediately.',
              'Your dashboard updates in real time as users receive it.',
            ]} />
            <Callout><strong style={{ color: 'var(--white)' }}>First time tip:</strong> Start with a rollout of 10% to verify everything is working, then expand to 100% Once you&apos;re confident.</Callout>
          </S>

          <S id="using-channels">
            <H2>Channels</H2>
            <P>Channels let you control who receives which updates. Think of them as separate lanes for your updates — your team, your beta testers, and your real users can all be on different versions at the same time.</P>
            <H3>The default channels</H3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '24px 0' }}>
              <TipBox title={<>Production <Badge type="prod">prod</Badge></>}>Your live users. Updates here reach everyone using your app. Use this channel only for tested, stable updates.</TipBox>
              <TipBox title={<>Staging <Badge type="staging">staging</Badge></>}>Your internal team and QA testers. Use this to verify an update is working correctly before promoting.</TipBox>
              <TipBox title={<>Beta <Badge type="beta">beta</Badge></>}>Early adopters or willing testers. A good middle ground between internal testing and full production.</TipBox>
            </div>
          </S>

          <S id="using-rollout">
            <H2>Rollout Control</H2>
            <P>Rollout control lets you release an update to a percentage of your users first, watch how it performs, and then expand gradually. This reduces risk dramatically.</P>
            <OL items={[
              'Publish with 10% rollout',
              'Check your dashboard for any automated rollback alerts',
              'If stable, increase to 50%, then 100%',
            ]} />
            <Callout><strong style={{ color: 'var(--white)' }}>Important:</strong> Once a user is assigned to a rollout group, they stay in it to ensure consistency.</Callout>
          </S>

          <S id="using-rollback">
            <H2>Rollback</H2>
            <H3>Automatic rollback</H3>
            <P>HotPatch monitors your app on every launch. If an update causes the app to crash, it&apos;s detected automatically and the app silently reverts to the previous working version.</P>
            <H3>Manual rollback</H3>
            <P>If you spot a problem, you can roll back from your Releases page. Users will revert to the previous version on their next app open.</P>
          </S>

          <S id="dash-analytics">
            <H2>Understanding Analytics</H2>
            <P>Your dashboard gives you an at-a-glance view of how your updates are performing.</P>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '24px 0' }}>
              <TipBox title="Total Devices">The number of unique devices that have checked in with HotPatch.</TipBox>
              <TipBox title="Updates Delivered">Total number of successful update installations across all devices.</TipBox>
              <TipBox title="Average Install Rate">Percentage of devices that have successfully applied your latest updates.</TipBox>
              <TipBox title="Crash Rollbacks">How many times HotPatch has automatically reverted an update due to a crash.</TipBox>
            </div>
          </S>

          <S id="safety-how">
            <H2>How Updates Stay Safe</H2>
            <P>Before any update reaches a user&apos;s device, it goes through multiple layers of verification automatically:</P>
            <UL items={[
              <><strong style={{ color: 'var(--white)' }}>Integrity check:</strong> Verified to ensure it wasn&apos;t corrupted in transit.</>,
              <><strong style={{ color: 'var(--white)' }}>Digital signature:</strong> Every update is signed with Ed25519 when you publish.</>,
              <><strong style={{ color: 'var(--white)' }}>Encrypted delivery:</strong> Delivered strictly over HTTPS with pinning options.</>,
              <><strong style={{ color: 'var(--white)' }}>Crash coverage:</strong> The automatic rollback system catches startup failures.</>,
            ]} />
          </S>

          <S id="safety-faq">
            <H2>Frequently Asked Questions</H2>
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {faqs.map(f => <FaqItem key={f.q} question={f.q} answer={f.a} />)}
            </div>
          </S>

        </div>
      </div>
      <Footer />
    </div>
  )
}
