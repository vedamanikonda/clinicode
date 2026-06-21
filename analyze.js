const PROMPT = (text) => `You are a certified Clinical Documentation Improvement (CDI) specialist and professional medical coder.

Analyze this operative note for documentation gaps — places where procedures are described too vaguely to support billing.

OPERATIVE NOTE:
${text}

CPT DOCUMENTATION REQUIREMENTS — check every procedure mentioned:

DEBRIDEMENT (CPT 27091): Requires (1) extent in sq cm or qualifier (extensive/limited), (2) tissue type (necrotic/fibrous/infected), (3) depth (superficial vs deep). Without all three, payers bundle it into the primary procedure.

LOOSE BODIES (CPT 27331): Requires (1) specific count — not "several" or "multiple", and (2) size of the largest fragment in cm. Vague language = automatic claim denial.

SYNOVECTOMY (CPT 27332 vs 27333): Requires specific compartments named (medial/lateral/suprapatellar/anterior/posterior). Without compartments, cannot distinguish 27332 (limited) from 27333 (complete, 3+ compartments).

FRACTURE FIXATION: Requires (1) specific fracture site, (2) fixation method (ORIF/screws/plate/wire), and (3) stability confirmation. Cannot bill separately without all three.

BONE GRAFT (CPT 20900/20902): Requires (1) graft type (autograft/allograft/synthetic) and (2) harvest site for autograft. Different types = different codes.

CHOLECYSTECTOMY (CPT 47562 vs 47563): If cholangiogram performed, must document technique and findings — required to upgrade billing code.

APPENDECTOMY (CPT 44950/44960/44970): Must specify approach (laparoscopic vs open) and appendix condition (perforated = 44960).

LYSIS OF ADHESIONS (CPT 44005): Must specify extent and reason — without this it gets bundled as routine exposure.

ADENOIDECTOMY WITH TONSILLECTOMY: Combined = 42820. Billing separately (42825 + 42830) = unbundling = denial.

RULES: found_text must be VERBATIM from the note. Only flag genuine gaps. Do not flag negated procedures.

Return ONLY valid JSON, no other text:
{"gaps":[{"gap_id":"g1","procedure_label":"Debridement","badge_text":"Insufficient · 27091","badge_type":"danger","found_text":"exact verbatim phrase","replacement_text":"specific qualifying language","reason":"plain-English billing rationale","severity":"high","codes":["27091"]}],"completeness_score":42,"summary":"Brief overall assessment."}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { note_text } = req.body

  if (!note_text?.trim()) {
    return res.status(400).json({ error: 'note_text is required' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: PROMPT(note_text) }],
      }),
    })

    const data = await response.json()

    if (data.error) {
      return res.status(502).json({ error: data.error.message })
    }

    let raw = data.content[0].text.trim()
    if (raw.startsWith('```')) raw = raw.replace(/```json\n?|```\n?/g, '').trim()

    const result = JSON.parse(raw)
    return res.status(200).json(result)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
