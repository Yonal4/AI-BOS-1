export const C = {
  bg:      '#0a0a0f',
  bg2:     '#0d0d14',
  bg3:     '#111118',
  bg4:     '#16161f',
  border:  'rgba(255,255,255,0.06)',
  border2: 'rgba(255,255,255,0.10)',
  border3: 'rgba(255,255,255,0.15)',
  text:    '#f0f0f8',
  text2:   '#9b9bb8',
  text3:   '#6b6b88',
  purple:  '#7c6dfa',
  purple2: '#a594ff',
  teal:    '#22d3b0',
  coral:   '#f06a40',
  gold:    '#facc4b',
  green:   '#4ade80',
  grad:    'linear-gradient(135deg,#7c6dfa 0%,#22d3b0 100%)',
} as const

export const AGENTS = [
  { id: 'lexi', name: 'Lexi', role: 'Marketing Agent', emoji: 'M', color: '#f06a40', bg: 'rgba(240,106,64,0.15)' },
  { id: 'aria', name: 'Aria', role: 'Sales Agent', emoji: 'S', color: '#7c6dfa', bg: 'rgba(124,109,250,0.15)' },
]
