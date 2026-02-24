'use client'
import { useState } from 'react'

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`faq-item${open ? ' open' : ''}`}
      onClick={() => setOpen(!open)}
      style={{ borderBottom:'1px solid var(--border)', padding:'20px 0', cursor:'pointer' }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px' }}>
        <span style={{ fontSize:'15px', fontWeight:500 }}>{question}</span>
        <span className="faq-arrow" style={{ color:'var(--cyan)', fontSize:'16px', flexShrink:0 }}>↓</span>
      </div>
      <div className="faq-answer">{answer}</div>
    </div>
  )
}
