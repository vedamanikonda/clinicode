import { useState, useEffect, useCallback, useRef } from 'react'

const DEMO_NOTE = `PROCEDURE: Right total knee arthroplasty.

FINDINGS: Advanced tricompartmental osteoarthritis with severe medial compartment collapse, lateral joint space narrowing, and patellofemoral erosion.

Patient was positioned supine with tourniquet applied to the right thigh at 300 mmHg. Standard medial parapatellar approach utilized. Extensor mechanism reflected laterally to expose the joint.

Debridement of the joint was performed. Osteophytes excised from the medial and lateral femoral condyles.

Upon further inspection, several loose bodies were identified and removed from the joint space.

The medial and lateral menisci were excised. Synovectomy was performed in the involved areas of the joint.

Measured resection technique employed for bone preparation. Posterior-stabilized prosthesis selected. Final cemented components implanted. Full range of motion confirmed — stable in all planes.

Wound irrigated with 3L normal saline. Closure in layers. Tourniquet deflated. Patient tolerated the procedure well. Transferred to PACU in stable condition.`

const S = {
  page:    { display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' },
  header:  { background:'#1e1b4b', height:44, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', flexShrink:0 },
  logoRow: { display:'flex', alignItems:'center', gap:12 },
  logoBox: { width:22, height:22, borderRadius:5, background:'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12 },
  logoText:{ color:'#e0e7ff', fontSize:15, fontWeight:500, letterSpacing:-.3 },
  divider: { width:.5, height:18, background:'rgba(255,255,255,.12)' },
  ehrBadge:{ fontSize:10, color:'rgba(224,231,255,.35)', padding:'2px 7px', border:'.5px solid rgba(255,255,255,.12)', borderRadius:4 },
  patBar:  { background:'#134e6e', padding:'5px 16px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', flexShrink:0 },
  tabs:    { background:'white', padding:'0 16px', borderBottom:'.5px solid rgba(0,0,0,.12)', display:'flex', alignItems:'flex-end', flexShrink:0 },
  grid:    { display:'grid', gridTemplateColumns:'minmax(0,1fr) 285px', flex:1, overflow:'hidden' },
  noteCol: { background:'white', display:'flex', flexDirection:'column', overflow:'hidden' },
  toolbar: { padding:'7px 16px', borderBottom:'.5px solid rgba(0,0,0,.12)', display:'flex', gap:5, alignItems:'center', flexShrink:0 },
  noteHdr: { background:'#f8f8f6', borderBottom:'.5px solid rgba(0,0,0,.12)', flexShrink:0 },
  hdrTop:  { padding:'10px 16px', borderBottom:'.5px solid rgba(0,0,0,.12)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  procSec: { padding:'8px 16px', borderBottom:'.5px solid rgba(0,0,0,.12)' },
  caseMeta:{ padding:'7px 16px', display:'flex', gap:18, flexWrap:'wrap' },
  noteWrap:{ flex:1, overflow:'auto' },
  panel:   { borderLeft:'.5px solid rgba(0,0,0,.12)', background:'#f8f8f6', display:'flex', flexDirection:'column', overflow:'hidden' },
  panelHdr:{ padding:'10px 12px', borderBottom:'.5px solid rgba(0,0,0,.12)', background:'white', flexShrink:0 },
  ccLogo:  { display:'flex', alignItems:'center', gap:6, marginBottom:8 },
  ccIcon:  { width:20, height:20, borderRadius:4, background:'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11 },
  covRow:  { display:'flex', justifyContent:'space-between', marginBottom:3 },
  covTrack:{ height:4, background:'rgba(0,0,0,.12)', borderRadius:3, overflow:'hidden' },
  sugg:    { padding:8, overflowY:'auto', flex:1 },
  signBar: { background:'#1e1b4b', padding:'7px 16px', display:'flex', justifyContent:'flex-end', alignItems:'center', gap:8, flexShrink:0 },
}

export default function CliniCode() {
  const [note, setNote]             = useState(DEMO_NOTE)
  const [patName, setPatName]       = useState('Hartwell, Robert S')
  const [preOpDx, setPreOpDx]       = useState('Right knee tricompartmental osteoarthritis, severe')
  const [postOpDx, setPostOpDx]     = useState('Same as preoperative')
  const [procs, setProcs]           = useState([{ code:'27447', name:'Total knee arthroplasty, right', primary:true, added:false }])
  const [gaps, setGaps]             = useState([])
  const [pct, setPct]               = useState(0)
  const [resolved, setResolved]     = useState(new Set())
  const [analyzing, setAnalyzing]   = useState(false)
  const [reasonOpen, setReasonOpen] = useState({})
  const [err, setErr]               = useState(null)
  const [saveLabel, setSaveLabel]   = useState('All changes saved')
  const timer = useRef(null)

  useEffect(() => { runAnalysis(DEMO_NOTE) }, [])

  useEffect(() => {
    if (!note.trim()) { setGaps([]); setPct(0); setAnalyzing(false); return }
    setAnalyzing(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => runAnalysis(note), 1500)
    return () => clearTimeout(timer.current)
  }, [note])

  async function runAnalysis(text) {
    setErr(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_text: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setGaps(data.gaps || [])
      setPct(data.completeness_score || 0)
    } catch (e) {
      setErr(e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const insertQualifier = useCallback((gap) => {
    if (resolved.has(gap.gap_id)) return
    setResolved(s => new Set([...s, gap.gap_id]))
    const idx = note.indexOf(gap.found_text)
    if (idx !== -1) setNote(n => n.slice(0,idx) + gap.replacement_text + n.slice(idx + gap.found_text.length))
    else setNote(n => n + '\n\n' + gap.replacement_text)
    if (gap.codes?.length && gap.badge_type === 'danger') {
      setProcs(p => p.find(x => x.code === gap.codes[0]) ? p : [...p, { code:gap.codes[0], name:gap.procedure_label, primary:false, added:true }])
    }
  }, [resolved, note])

  const toggleReason = id => setReasonOpen(r => ({ ...r, [id]: !r[id] }))

  const rem = gaps.filter(g => !resolved.has(g.gap_id)).length
  const barColor = pct >= 90 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#4f46e5'

  // Banner
  let bBg, bBorder, bIcon, bIconColor, bColor, bMsg
  if (analyzing) {
    bBg='#f8f8f6'; bBorder='rgba(0,0,0,.1)'; bIcon='ti-loader-2'; bIconColor='#888780'; bColor='#888780'; bMsg='Analyzing note with AI...'
  } else if (err) {
    bBg='#fcebeb'; bBorder='rgba(163,45,45,.3)'; bIcon='ti-alert-triangle'; bIconColor='#a32d2d'; bColor='#a32d2d'; bMsg=`Error: ${err}`
  } else if (!note.trim()) {
    bBg='#e6f1fb'; bBorder='rgba(24,95,165,.3)'; bIcon='ti-sparkles'; bIconColor='#185fa5'; bColor='#185fa5'; bMsg='Type your operative note — CliniCode flags documentation gaps as you write'
  } else if (rem === 0 && gaps.length > 0) {
    bBg='#eaf3de'; bBorder='rgba(99,153,34,.3)'; bIcon='ti-circle-check'; bIconColor='#3b6d11'; bColor='#3b6d11'; bMsg='All gaps resolved — note is ready to sign'
  } else if (rem > 0) {
    bBg='#faeeda'; bBorder='rgba(133,79,11,.3)'; bIcon='ti-alert-circle'; bIconColor='#854f0b'; bColor='#854f0b'; bMsg=`${rem} phrase${rem===1?'':' s'} in your note ${rem===1?'lacks':'lack'} the specificity needed to support billing`
  } else {
    bBg='#e6f1fb'; bBorder='rgba(24,95,165,.3)'; bIcon='ti-sparkles'; bIconColor='#185fa5'; bColor='#185fa5'; bMsg='Type your operative note — suggestions appear automatically'
  }

  const F = { fontSize:11, color:'#5f5e5a' }

  return (
    <div style={S.page}>

      {/* CliniCode header */}
      <header style={S.header}>
        <div style={S.logoRow}>
          <div style={S.logoBox}><i className="ti ti-sparkles" aria-hidden="true" /></div>
          <span style={S.logoText}>Clini<span style={{ color:'rgba(224,231,255,.4)', fontWeight:400 }}>Code</span></span>
          <div style={S.divider} />
          <span style={S.ehrBadge}>Integrates with any EHR</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:'#64748b', fontSize:11 }}>Dr. James Park, MD — Orthopedics</span>
          <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(99,102,241,.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#c7d2fe', fontSize:11, fontWeight:500 }}>JP</div>
        </div>
      </header>

      {/* Patient bar */}
      <div style={S.patBar}>
        <input value={patName} onChange={e => setPatName(e.target.value)} placeholder="Patient name"
          style={{ background:'transparent', border:'none', borderBottom:'1px dashed rgba(255,255,255,.25)', outline:'none', color:'#e0f2fe', fontSize:12, fontWeight:500, fontFamily:'inherit', padding:0, minWidth:150 }} />
        <span style={{ color:'#7dd3fc', fontSize:11 }}>06/18/2026</span>
        <span style={{ fontSize:10, padding:'1px 6px', borderRadius:3, fontWeight:500, background:'#0f5132', color:'#d1fae5' }}>OR Suite 4</span>
        <span style={{ fontSize:10, padding:'1px 6px', borderRadius:3, fontWeight:500, background:'#1e3a5f', color:'#bae6fd' }}>Case #2406-203</span>
        <span style={{ color:'#7dd3fc', fontSize:11, marginLeft:'auto' }}>Start: 07:45 · End: 10:22</span>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {['Operative note','Anesthesia','Orders','Charges'].map((t,i) => (
          <div key={t} className={`tab-item${i===0?' active':''}`}>{t}</div>
        ))}
      </div>

      {/* Alert banner */}
      <div style={{ padding:'5px 16px', display:'flex', alignItems:'center', gap:8, borderBottom:`.5px solid ${bBorder}`, background:bBg, transition:'background .5s', flexShrink:0 }}>
        <i className={`ti ${bIcon}`} style={{ fontSize:13, flexShrink:0, color:bIconColor }} aria-hidden="true" />
        <span style={{ fontSize:11, fontWeight:500, color:bColor }}>{bMsg}</span>
        {rem > 0 && <span style={{ fontSize:10, color:bColor, marginLeft:'auto', opacity:.65 }}>See suggestions →</span>}
      </div>

      {/* Main grid */}
      <div style={S.grid}>

        {/* Note editor */}
        <section style={S.noteCol}>
          <div style={S.toolbar}>
            <button onClick={() => document.execCommand('bold')}   style={{ fontSize:12, padding:'3px 7px', border:'.5px solid rgba(0,0,0,.25)', borderRadius:4, background:'transparent', cursor:'pointer', fontWeight:700 }}>B</button>
            <button onClick={() => document.execCommand('italic')} style={{ fontSize:12, padding:'3px 7px', border:'.5px solid rgba(0,0,0,.25)', borderRadius:4, background:'transparent', cursor:'pointer', fontStyle:'italic' }}>I</button>
            <div style={{ width:.5, height:16, background:'rgba(0,0,0,.12)', margin:'0 3px' }} />
            <button style={{ fontSize:11, padding:'3px 8px', border:'.5px solid rgba(0,0,0,.25)', borderRadius:4, background:'transparent', cursor:'pointer' }}>SmartText</button>
            <span style={{ marginLeft:'auto', fontSize:10, color:'#888780' }}>{analyzing ? 'Analyzing...' : saveLabel}</span>
          </div>

          <div style={S.noteHdr}>
            <div style={S.hdrTop}>
              <div>
                <span className="nsl">Preoperative diagnosis</span>
                <input className="dx-input" value={preOpDx} onChange={e => setPreOpDx(e.target.value)} />
              </div>
              <div>
                <span className="nsl">Postoperative diagnosis</span>
                <p style={{ fontSize:12, color:'#2c2c2a', margin:0, lineHeight:1.5, fontFamily:'Georgia,serif', minHeight:18 }}>{postOpDx}</p>
              </div>
            </div>
            <div style={S.procSec}>
              <span className="nsl">Procedure(s) performed</span>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {procs.map((p,i) => (
                  <div key={i} className={`proc-row${p.added?' added':''}`}>
                    <span style={{ fontSize:11, fontWeight:500, flexShrink:0, color:p.added?'#3b6d11':'#185fa5' }}>{p.code}</span>
                    <span style={{ fontSize:11, color:'#5f5e5a' }}>{p.name}</span>
                    <span style={{ fontSize:9, padding:'1px 5px', borderRadius:3, marginLeft:'auto', background:p.added?'#eaf3de':'#e6f1fb', color:p.added?'#3b6d11':'#185fa5' }}>
                      {p.added ? 'Added' : 'Primary'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={S.caseMeta}>
              {[['Surgeon','Park, MD'],['Anesthesia','Spinal'],['EBL','200 mL'],['Complications','None'],['Disposition','PACU, stable']].map(([l,v]) => (
                <div key={l} style={F}><span className="nsl">{l}</span>{v}</div>
              ))}
            </div>
          </div>

          <div style={S.noteWrap}>
            <textarea className="note-textarea" value={note} spellCheck
              onChange={e => {
                setNote(e.target.value)
                setSaveLabel('Saving...')
                clearTimeout(timer.current)
                timer.current = setTimeout(() => setSaveLabel('All changes saved'), 1200)
              }}
              placeholder={"Start typing your operative note here.\n\nCliniCode analyzes documentation as you write and flags phrases too vague to support billing.\n\nTry including: debridement, loose bodies, synovectomy, fracture fixation, bone graft, cholangiogram..."}
            />
          </div>
        </section>

        {/* CliniCode panel */}
        <aside style={S.panel}>
          <div style={S.panelHdr}>
            <div style={S.ccLogo}>
              <div style={S.ccIcon}><i className="ti ti-sparkles" aria-hidden="true" /></div>
              <span style={{ fontSize:13, fontWeight:500, color:'#2c2c2a' }}>CliniCode</span>
              <span style={{ fontSize:10, background:'#e6f1fb', color:'#185fa5', padding:'1px 6px', borderRadius:10, animation:'livepulse 2s infinite' }}>● Live</span>
            </div>
            <div style={S.covRow}>
              <span style={{ fontSize:10, color:'#5f5e5a' }}>Documentation completeness</span>
              <span style={{ fontSize:10, fontWeight:500, color: pct>=90?'#3b6d11':'#2c2c2a' }}>{note.trim() ? pct+'%' : '—'}</span>
            </div>
            <div style={S.covTrack}>
              <div style={{ height:'100%', width:note.trim()?pct+'%':'0%', background:barColor, borderRadius:3, transition:'width .5s ease, background .5s' }} />
            </div>
            <p style={{ fontSize:10, color:'#888780', margin:'3px 0 0', display:'flex', alignItems:'center', gap:5 }}>
              {analyzing
                ? <><span style={{ width:5, height:5, borderRadius:'50%', background:'#4f46e5', display:'inline-block', animation:'scandot .7s infinite' }} /> Analyzing...</>
                : rem===0 && gaps.length>0 ? 'All gaps resolved ✓'
                : rem>0 ? `${rem} documentation gap${rem===1?'':'s'} to resolve`
                : 'Type to detect documentation gaps'
              }
            </p>
          </div>

          <div style={S.sugg}>
            {gaps.length === 0 && !analyzing ? (
              <div style={{ padding:'20px 12px', textAlign:'center', fontSize:11, color:'#888780', lineHeight:1.7 }}>
                <i className="ti ti-sparkles" style={{ fontSize:20, display:'block', marginBottom:6 }} aria-hidden="true" />
                {note.trim() ? 'No gaps detected' : 'Analysis will run automatically'}<br />
                <span style={{ fontSize:10 }}>Suggestions appear as you write</span>
              </div>
            ) : gaps.map(gap => (
              <div key={gap.gap_id} className={`gap-card${resolved.has(gap.gap_id)?' resolved':''}`}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <span className={`badge badge-${gap.badge_type}`}>{gap.badge_text}</span>
                  <i className="ti ti-alert-circle" style={{ fontSize:13, color: gap.badge_type==='danger'?'#a32d2d':gap.badge_type==='warning'?'#854f0b':'#185fa5' }} aria-hidden="true" />
                </div>
                <span className="box-label">Too vague — found in note:</span>
                <div className="found-box">"{gap.found_text}"</div>
                <span className="box-label">Replace with:</span>
                <div className="replace-box">{gap.replacement_text}</div>
                <div style={{ display:'flex', gap:5 }}>
                  <button className={`btn-insert${resolved.has(gap.gap_id)?' done':''}`} onClick={() => insertQualifier(gap)}>
                    <i className={`ti ${resolved.has(gap.gap_id)?'ti-check':'ti-check-box'}`} style={{ fontSize:12 }} aria-hidden="true" />
                    {resolved.has(gap.gap_id) ? 'Inserted' : 'Insert qualifier'}
                  </button>
                  {!resolved.has(gap.gap_id) && (
                    <button className="btn-why" onClick={() => toggleReason(gap.gap_id)}>
                      {reasonOpen[gap.gap_id] ? 'Close' : 'Why?'}
                    </button>
                  )}
                </div>
                {reasonOpen[gap.gap_id] && <div className="reason-box">{gap.reason}</div>}
              </div>
            ))}
          </div>

          <div style={{ padding:'6px 12px', borderTop:'.5px solid rgba(0,0,0,.12)', background:'white', fontSize:10, color:'#888780', textAlign:'center', flexShrink:0 }}>
            <i className="ti ti-lock" style={{ fontSize:10, verticalAlign:-1 }} aria-hidden="true" /> HIPAA compliant · CliniCode AI
          </div>
        </aside>
      </div>

      <footer style={S.signBar}>
        <button style={{ fontSize:11, padding:'4px 14px', border:'.5px solid rgba(255,255,255,.2)', borderRadius:4, background:'transparent', color:'#c7d2fe', cursor:'pointer' }}>Save draft</button>
        <button style={{ fontSize:11, padding:'4px 14px', border:'none', borderRadius:4, background:'#4f46e5', color:'white', cursor:'pointer', fontWeight:500 }}>Sign &amp; submit</button>
      </footer>
    </div>
  )
}
