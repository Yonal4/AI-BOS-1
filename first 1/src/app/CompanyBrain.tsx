import { useState, useEffect, useRef, useCallback } from 'react'
import { C } from '../design'
import { Card, Btn, Pill, Spin } from '../components/ui'
import { callAI } from '../utils/ai'
import { useOrgId } from '../context/OrgContext'

const DOC_TYPES = [
  { id:'playbook',  label:'Sales Playbook',    emoji:'📋', example:'Objection handling, ICP, discovery questions' },
  { id:'brand',     label:'Brand Voice Guide', emoji:'🎨', example:'Tone, messaging, dos and don\'ts' },
  { id:'sop',       label:'SOPs & Processes',  emoji:'📝', example:'How we onboard customers, escalation paths' },
  { id:'product',   label:'Product Docs',      emoji:'📦', example:'Features, pricing, roadmap' },
  { id:'customer',  label:'Customer Stories',  emoji:'⭐', example:'Case studies, testimonials' },
  { id:'policy',    label:'Policies',          emoji:'⚖️', example:'Refund policy, SLAs, terms' },
  { id:'faq',       label:'FAQ',               emoji:'❓', example:'Common questions and answers' },
  { id:'team',      label:'Team Info',         emoji:'👥', example:'Org chart, responsibilities, contacts' },
]

interface BrainDoc {
  id: string
  title: string
  type: string
  filename: string | null
  size_bytes: number
  chunk_count: number
  status: 'processing' | 'ready' | 'error'
  error_msg: string | null
  created_at: string
}

interface BrainStatus {
  db: boolean
  embeddings: boolean
  qdrant: boolean
  stats: { doc_count: number; chunk_count: number; processing_count: number } | null
}

interface SearchResult {
  content: string
  score: number
  doc_title: string
  doc_type: string
}

function fmtBytes(n: number) {
  if (!n) return '—'
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  return `${(n / 1024 / 1024).toFixed(1)}MB`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11 }}>
      <div style={{ width:7, height:7, borderRadius:'50%', background: ok ? C.teal : C.text3, boxShadow: ok ? `0 0 6px ${C.teal}` : 'none' }}/>
      <span style={{ color: ok ? C.text2 : C.text3 }}>{label}</span>
    </div>
  )
}

export default function CompanyBrain() {
  const orgId = useOrgId()
  const [tab, setTab] = useState<'docs'|'search'|'missing'|'add'>('docs')
  const [docs, setDocs] = useState<BrainDoc[]>([])
  const [status, setStatus] = useState<BrainStatus | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(true)

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchMode, setSearchMode] = useState<'semantic'|'fulltext'|null>(null)
  const [aiAnswer, setAiAnswer] = useState('')
  const [querying, setQuerying] = useState(false)

  const [addMode, setAddMode] = useState<'file'|'text'>('file')
  const [addType, setAddType] = useState('playbook')
  const [addTitle, setAddTitle] = useState('')
  const [addText, setAddText] = useState('')
  const [addFile, setAddFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const orgHeaders = (extra?: Record<string, string>) => ({
    ...(orgId ? { 'x-org-id': orgId } : {}),
    ...extra
  })

  const fetchDocs = useCallback(async () => {
    try {
      const r = await fetch('/api/brain/documents', { headers: orgId ? { 'x-org-id': orgId } : {} })
      const data = await r.json()
      if (data.documents) setDocs(data.documents)
    } catch {/* ignore */}
  }, [orgId])

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/brain/status', { headers: orgId ? { 'x-org-id': orgId } : {} })
      const data = await r.json()
      setStatus(data)
    } catch {/* ignore */}
  }, [orgId])

  useEffect(() => {
    Promise.all([fetchDocs(), fetchStatus()]).finally(() => setLoadingDocs(false))
  }, [fetchDocs, fetchStatus])

  useEffect(() => {
    const hasProcessing = docs.some(d => d.status === 'processing')
    if (hasProcessing && !pollRef.current) {
      pollRef.current = setInterval(() => {
        fetchDocs()
        fetchStatus()
      }, 2500)
    } else if (!hasProcessing && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  }, [docs, fetchDocs, fetchStatus])

  const typeEmoji = (t: string) => DOC_TYPES.find(d => d.id === t)?.emoji || '📄'
  const readyDocs = docs.filter(d => d.status === 'ready')
  const missing = DOC_TYPES.filter(dt => !readyDocs.some(d => d.type === dt.id))
  const totalChunks = status?.stats?.chunk_count ?? readyDocs.reduce((s, d) => s + d.chunk_count, 0)
  const health = Math.round((readyDocs.length / DOC_TYPES.length) * 100)

  const handleSearch = async () => {
    if (!query.trim() || querying) return
    setQuerying(true); setSearchResults([]); setAiAnswer('')
    try {
      const r = await fetch('/api/brain/search', {
        method: 'POST', headers: orgHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ query, limit: 6 })
      })
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setSearchResults(data.results || [])
      setSearchMode(data.mode)
      if (data.results?.length) {
        const ctx = data.results.map((r: SearchResult, i: number) => `[${i+1}] (${r.doc_title}): ${r.content}`).join('\n\n')
        const answer = await callAI(
          `You are the Company Brain — a knowledge system. Answer using ONLY the provided context chunks. Be specific and cite document names. If the context doesn't contain the answer, say so.`,
          `Context:\n${ctx}\n\nQuestion: ${query}`, 600
        )
        setAiAnswer(answer)
      }
    } catch (e: any) {
      setAiAnswer(`Error: ${e.message}`)
    }
    setQuerying(false)
  }

  const handleUploadFile = async () => {
    if (!addFile || !addTitle.trim()) return
    setUploading(true); setUploadMsg('')
    try {
      const fd = new FormData()
      fd.append('file', addFile)
      fd.append('title', addTitle)
      fd.append('type', addType)
      const r = await fetch('/api/brain/upload', { method: 'POST', body: fd, headers: orgHeaders() })
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setUploadMsg('✓ Uploaded! Processing in background…')
      setAddTitle(''); setAddFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await fetchDocs()
      setTab('docs')
    } catch (e: any) {
      setUploadMsg(`Error: ${e.message}`)
    }
    setUploading(false)
  }

  const handleAddText = async () => {
    if (!addText.trim() || !addTitle.trim()) return
    setUploading(true); setUploadMsg('')
    try {
      const r = await fetch('/api/brain/add', {
        method: 'POST', headers: orgHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ title: addTitle, type: addType, content: addText })
      })
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setUploadMsg('✓ Added! Processing in background…')
      setAddTitle(''); setAddText('')
      await fetchDocs()
      setTab('docs')
    } catch (e: any) {
      setUploadMsg(`Error: ${e.message}`)
    }
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this document from Company Brain?')) return
    try {
      await fetch(`/api/brain/documents/${id}`, { method: 'DELETE', headers: orgHeaders() })
      setDocs(p => p.filter(d => d.id !== id))
      fetchStatus()
    } catch {/* ignore */}
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${C.border2}`,
    borderRadius: 8, color: C.text, fontSize: 13, outline: 'none',
    boxSizing: 'border-box' as const
  }

  return (
    <div style={{ height:'100%', overflow:'auto', padding:'20px', background:C.bg, boxSizing:'border-box' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>🧠 Company Brain</div>
        <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>
          Persistent AI memory — documents, embeddings, and semantic search for all agents
        </div>
      </div>

      {/* Service status bar */}
      {status && (
        <div style={{ display:'flex', gap:16, padding:'10px 14px', background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:10, marginBottom:14 }}>
          <StatusBadge ok={status.db} label="PostgreSQL" />
          <StatusBadge ok={status.embeddings} label="Voyage AI Embeddings" />
          <StatusBadge ok={status.qdrant} label="Qdrant Vectors" />
          {!status.embeddings && (
            <span style={{ fontSize:11, color:C.text3, marginLeft:'auto' }}>
              Add <code style={{ background:C.bg3, padding:'1px 5px', borderRadius:4 }}>VOYAGE_API_KEY</code> + <code style={{ background:C.bg3, padding:'1px 5px', borderRadius:4 }}>QDRANT_URL</code> secrets for semantic search
            </span>
          )}
        </div>
      )}

      {/* Health bar */}
      <Card style={{ marginBottom:16, background:'rgba(124,109,250,0.04)', border:`0.5px solid rgba(124,109,250,0.25)` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:600, color:C.purple2 }}>Brain Health</span>
          <span style={{ fontSize:13, fontWeight:700, color:health>70?C.teal:health>40?C.gold:C.coral }}>{health}%</span>
        </div>
        <div style={{ height:8, background:'rgba(255,255,255,0.07)', borderRadius:8, marginBottom:12 }}>
          <div style={{ height:'100%', width:`${health}%`, background:health>70?C.teal:health>40?'linear-gradient(90deg,#facc4b,#22d3b0)':C.coral, borderRadius:8, transition:'.5s' }}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { label:'Documents', val:readyDocs.length, tot:DOC_TYPES.length, color:C.purple2 },
            { label:'Chunks indexed', val:totalChunks, tot:'∞', color:C.teal },
            { label:'Missing docs', val:missing.length, tot:DOC_TYPES.length, color:C.coral },
            { label:'Coverage', val:`${health}%`, tot:'100%', color:C.gold }
          ].map(m => (
            <div key={m.label}>
              <div style={{ fontSize:10, color:C.text3, marginBottom:2 }}>{m.label.toUpperCase()}</div>
              <div style={{ fontSize:18, fontWeight:700, color:m.color }}>{m.val} <span style={{ fontSize:12, color:C.text3 }}>/ {m.tot}</span></div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16 }}>
        {[
          { id:'docs',    label:`📂 Documents (${docs.length})` },
          { id:'search',  label:'🔍 Memory Search' },
          { id:'missing', label:`⚠️ Missing (${missing.length})` },
          { id:'add',     label:'+ Add Content' }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{ padding:'8px 16px', borderRadius:8, border:`0.5px solid ${tab===t.id?C.purple:'rgba(255,255,255,0.1)'}`, background:tab===t.id?'rgba(124,109,250,0.12)':'transparent', color:tab===t.id?C.purple2:C.text3, fontSize:12, fontWeight:tab===t.id?600:400, cursor:'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* DOCUMENTS TAB */}
      {tab==='docs' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {loadingDocs && (
            <Card style={{ textAlign:'center', padding:32 }}><Spin size={18} /><div style={{ marginTop:8, color:C.text3, fontSize:12 }}>Loading documents…</div></Card>
          )}
          {!loadingDocs && docs.length === 0 && (
            <Card style={{ textAlign:'center', padding:'40px' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🧠</div>
              <div style={{ color:C.text2, marginBottom:16 }}>No documents yet. Add content to train your agents.</div>
              <Btn onClick={() => setTab('add')}>+ Add First Document</Btn>
            </Card>
          )}
          {docs.map(d => (
            <div key={d.id} style={{ background:C.bg2, border:`0.5px solid ${d.status==='error'?'rgba(240,106,64,0.3)':C.border}`, borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{typeEmoji(d.type)}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.title}</div>
                <div style={{ fontSize:11, color:C.text3, marginTop:2 }}>
                  {d.type}
                  {d.filename && ` · ${d.filename}`}
                  {' · '}{d.chunk_count} chunks
                  {' · '}{fmtBytes(d.size_bytes)}
                  {' · '}{timeAgo(d.created_at)}
                </div>
                {d.status==='error' && <div style={{ fontSize:11, color:C.coral, marginTop:2 }}>⚠ {d.error_msg}</div>}
              </div>
              {d.status==='processing' && <div style={{ display:'flex', alignItems:'center', gap:6 }}><Spin size={11}/><span style={{ fontSize:11, color:C.text3 }}>Indexing…</span></div>}
              {d.status==='ready' && <Pill color={C.teal} bg="rgba(34,211,176,0.1)">✓ Ready</Pill>}
              {d.status==='error' && <Pill color={C.coral} bg="rgba(240,106,64,0.1)">✕ Error</Pill>}
              <button onClick={() => handleDelete(d.id)}
                style={{ background:'none', border:'none', color:C.text3, cursor:'pointer', fontSize:16, padding:'0 4px', flexShrink:0 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* SEARCH TAB */}
      {tab==='search' && (
        <div>
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:10, color:C.purple2 }}>
              🔍 Query Company Brain {searchMode && <span style={{ fontSize:11, fontWeight:400, color:C.text3 }}>· {searchMode === 'semantic' ? '✦ semantic search' : '⌨ full-text search'}</span>}
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSearch()}
                placeholder="e.g. What's our ICP? How do we handle pricing objections?"
                style={{ flex:1, padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:13, outline:'none' }}/>
              <Btn onClick={handleSearch} disabled={querying}>{querying?<><Spin size={12}/>Searching…</>:'Search →'}</Btn>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {["What's our ICP?","How do we handle pricing objections?","What are our top use cases?","Who are our biggest customers?","What is our onboarding process?"].map(q => (
                <button key={q} onClick={() => setQuery(q)}
                  style={{ padding:'4px 10px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border}`, borderRadius:20, fontSize:11, color:C.text3, cursor:'pointer' }}>{q}</button>
              ))}
            </div>
          </Card>

          {aiAnswer && (
            <Card style={{ background:'rgba(34,211,176,0.04)', border:`0.5px solid rgba(34,211,176,0.25)`, marginBottom:12 }}>
              <div style={{ fontSize:11, color:C.teal, fontWeight:600, marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>🧠 AI Synthesis</div>
              <div style={{ fontSize:14, lineHeight:1.8, color:C.text, whiteSpace:'pre-wrap' }}>{aiAnswer}</div>
            </Card>
          )}

          {searchResults.length > 0 && (
            <div>
              <div style={{ fontSize:11, color:C.text3, marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Source Chunks ({searchResults.length})</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {searchResults.map((r, i) => (
                  <div key={i} style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:14 }}>{typeEmoji(r.doc_type)}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:C.text2 }}>{r.doc_title}</span>
                      <span style={{ marginLeft:'auto', fontSize:11, color:C.text3 }}>score {(r.score * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ fontSize:12, color:C.text2, lineHeight:1.7 }}>{r.content.length > 400 ? r.content.slice(0, 400) + '…' : r.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!querying && searchResults.length === 0 && query && (
            <Card style={{ textAlign:'center', padding:32 }}>
              <div style={{ fontSize:24, marginBottom:8 }}>🔍</div>
              <div style={{ color:C.text2 }}>No results found. Try a different query or add more documents.</div>
            </Card>
          )}
        </div>
      )}

      {/* MISSING TAB */}
      {tab==='missing' && (
        <div>
          {missing.length === 0 ? (
            <Card style={{ textAlign:'center', padding:32 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
              <div style={{ color:C.teal, fontWeight:600 }}>All document types covered!</div>
            </Card>
          ) : (
            <>
              <div style={{ background:'rgba(250,204,75,0.06)', border:`0.5px solid rgba(250,204,75,0.25)`, borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.gold, marginBottom:4 }}>⚠️ {missing.length} document types missing — agent accuracy reduced</div>
                <div style={{ fontSize:12, color:C.text2 }}>Upload these docs to give your agents complete knowledge.</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
                {missing.map(dt => (
                  <div key={dt.id} style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:10, padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:20 }}>{dt.emoji}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{dt.label}</div>
                        <div style={{ fontSize:11, color:C.text3 }}>{dt.example}</div>
                      </div>
                    </div>
                    <button onClick={() => { setAddType(dt.id); setTab('add') }}
                      style={{ width:'100%', padding:'8px', background:'rgba(124,109,250,0.1)', border:`0.5px solid rgba(124,109,250,0.3)`, borderRadius:8, color:C.purple2, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      + Add this document →
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ADD CONTENT TAB */}
      {tab==='add' && (
        <Card>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Add Content to Company Brain</div>

          {/* Mode toggle */}
          <div style={{ display:'flex', gap:4, marginBottom:16 }}>
            {[{id:'file',label:'📎 Upload File (PDF/DOCX/TXT)'},{id:'text',label:'✍️ Paste Text'}].map(m => (
              <button key={m.id} onClick={() => setAddMode(m.id as any)}
                style={{ flex:1, padding:'8px', borderRadius:8, border:`0.5px solid ${addMode===m.id?C.purple:'rgba(255,255,255,0.1)'}`, background:addMode===m.id?'rgba(124,109,250,0.12)':'transparent', color:addMode===m.id?C.purple2:C.text3, fontSize:12, fontWeight:addMode===m.id?600:400, cursor:'pointer' }}>
                {m.label}
              </button>
            ))}
          </div>

          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:C.text2, marginBottom:6 }}>Document type</div>
            <select value={addType} onChange={e => setAddType(e.target.value)}
              style={{ ...inputStyle, background:C.bg3 }}>
              {DOC_TYPES.map(dt => <option key={dt.id} value={dt.id}>{dt.emoji} {dt.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:C.text2, marginBottom:6 }}>Document title</div>
            <input value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="e.g. Sales Playbook Q3 2026"
              style={inputStyle}/>
          </div>

          {addMode === 'file' ? (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:C.text2, marginBottom:6 }}>File (PDF, DOCX, or TXT — max 20MB)</div>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border:`1.5px dashed ${addFile?C.purple:C.border2}`, borderRadius:10, padding:'24px', textAlign:'center', cursor:'pointer', background: addFile?'rgba(124,109,250,0.06)':'transparent', transition:'.2s' }}>
                {addFile ? (
                  <div>
                    <div style={{ fontSize:22, marginBottom:4 }}>📄</div>
                    <div style={{ fontSize:13, fontWeight:600, color:C.purple2 }}>{addFile.name}</div>
                    <div style={{ fontSize:11, color:C.text3, marginTop:2 }}>{fmtBytes(addFile.size)}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:28, marginBottom:6 }}>📎</div>
                    <div style={{ fontSize:13, color:C.text2 }}>Click to select a PDF, DOCX, or TXT file</div>
                    <div style={{ fontSize:11, color:C.text3, marginTop:4 }}>Max 20MB</div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" style={{ display:'none' }}
                  onChange={e => setAddFile(e.target.files?.[0] || null)}/>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:C.text2, marginBottom:6 }}>Content</div>
              <textarea value={addText} onChange={e => setAddText(e.target.value)}
                placeholder="Paste your document content here. The more detailed, the smarter your agents become…"
                style={{ ...inputStyle, minHeight:180, lineHeight:1.6, resize:'vertical', fontFamily:'inherit' }}/>
              <div style={{ fontSize:11, color:C.text3, marginTop:4 }}>
                {addText.split(/\s+/).filter(Boolean).length} words · ~{Math.max(1, Math.floor(addText.split(/\s+/).filter(Boolean).length / 400))} chunks
              </div>
            </div>
          )}

          {uploadMsg && (
            <div style={{ padding:'10px 14px', borderRadius:8, background: uploadMsg.startsWith('✓') ? 'rgba(34,211,176,0.08)' : 'rgba(240,106,64,0.08)', border:`0.5px solid ${uploadMsg.startsWith('✓')?'rgba(34,211,176,0.3)':'rgba(240,106,64,0.3)'}`, fontSize:12, color: uploadMsg.startsWith('✓') ? C.teal : C.coral, marginBottom:12 }}>
              {uploadMsg}
            </div>
          )}

          <Btn
            onClick={addMode === 'file' ? handleUploadFile : handleAddText}
            disabled={uploading || (addMode==='file' ? !addFile || !addTitle.trim() : !addText.trim() || !addTitle.trim())}
            style={{ display:'flex', alignItems:'center', gap:8 }}>
            {uploading ? <><Spin size={12}/>Processing…</> : '🧠 Add to Company Brain'}
          </Btn>
        </Card>
      )}
    </div>
  )
}
