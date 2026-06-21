import { CSSProperties } from 'react'
import { C } from '../design'

export const Pill = ({ children, color = C.purple2, bg = 'rgba(124,109,250,0.12)', style = {} }: any) => (
  <span style={{ padding:'2px 10px', borderRadius:20, background:bg, color, fontSize:11, fontWeight:600, ...style }}>{children}</span>
)

export const Card = ({ children, style = {}, onClick }: any) => (
  <div onClick={onClick} style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:12, padding:'16px 18px', ...style, cursor:onClick?'pointer':'default' }}>{children}</div>
)

export const Btn = ({ children, onClick, variant = 'primary', style = {}, disabled = false }: any) => {
  const v: any = {
    primary: { background:C.purple, color:'#fff', border:'none' },
    ghost:   { background:'rgba(255,255,255,0.05)', color:C.text2, border:`0.5px solid ${C.border2}` },
    teal:    { background:C.teal, color:'#fff', border:'none' },
    danger:  { background:'rgba(240,106,64,0.12)', color:C.coral, border:`0.5px solid rgba(240,106,64,0.3)` },
    success: { background:'rgba(74,222,128,0.12)', color:C.green, border:`0.5px solid rgba(74,222,128,0.3)` },
    outline: { background:'transparent', color:C.purple2, border:`0.5px solid rgba(124,109,250,0.4)` },
  }
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600,
        cursor:disabled?'not-allowed':'pointer', transition:'.15s', opacity:disabled?.5:1,
        display:'inline-flex', alignItems:'center', gap:6,
        ...v[variant], ...style }}>
      {children}
    </button>
  )
}

export const Spin = ({ size = 13, color = '#fff' }: any) => (
  <span style={{ display:'inline-block', width:size, height:size,
    border:`2px solid rgba(255,255,255,0.2)`, borderTopColor:color,
    borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }} />
)

export const Badge = ({ children, type = 'default' }: any) => {
  const t: any = {
    default: { bg:'rgba(155,155,184,0.12)', c:C.text2 },
    success: { bg:'rgba(74,222,128,0.12)', c:C.green },
    warning: { bg:'rgba(250,204,75,0.12)', c:C.gold },
    danger:  { bg:'rgba(240,106,64,0.12)', c:C.coral },
    info:    { bg:'rgba(124,109,250,0.12)', c:C.purple2 },
  }
  const s = t[type] || t.default
  return <span style={{ padding:'2px 8px', borderRadius:6, background:s.bg, color:s.c, fontSize:11, fontWeight:600 }}>{children}</span>
}

export const Tab = ({ label, active, onClick, color = C.purple, activeColor = C.purple2 }: any) => (
  <button onClick={onClick} style={{
    padding:'6px 14px', borderRadius:8, border:`0.5px solid ${active?color:C.border}`,
    background:active?`${color}18`:'transparent', color:active?activeColor:C.text3,
    fontSize:12, fontWeight:active?600:400, cursor:'pointer'
  }}>{label}</button>
)

export const SectionHeader = ({ icon, title, subtitle, children }: any) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
    <div>
      <div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>{icon} {title}</div>
      {subtitle && <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>{subtitle}</div>}
    </div>
    {children}
  </div>
)

export const KpiGrid = ({ items }: { items: Array<{ label:string; value:any; sub?:string; color:string }> }) => (
  <div style={{ display:'grid', gridTemplateColumns:`repeat(${items.length},1fr)`, gap:10, marginBottom:16 }}>
    {items.map(k => (
      <Card key={k.label} style={{ padding:'12px 14px' }}>
        <div style={{ fontSize:10, color:C.text3, marginBottom:4, letterSpacing:.5 }}>{k.label.toUpperCase()}</div>
        <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
        {k.sub && <div style={{ fontSize:10, color:C.text3, marginTop:3 }}>{k.sub}</div>}
      </Card>
    ))}
  </div>
)

export const SparkLine = ({ data, color }: { data:number[], color:string }) => {
  const max = Math.max(...data), min = Math.min(...data)
  const w = 120, h = 36, pad = 4
  const pts = data.map((v,i) => {
    const x = pad + (i/(data.length-1))*(w-pad*2)
    const y = h-pad - ((v-min)/(max-min||1))*(h-pad*2)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {data.map((v,i) => {
        const x = pad+(i/(data.length-1))*(w-pad*2)
        const y = h-pad-((v-min)/(max-min||1))*(h-pad*2)
        return i===data.length-1 ? <circle key={i} cx={x} cy={y} r={3} fill={color}/> : null
      })}
    </svg>
  )
}
