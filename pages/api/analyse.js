/**
 * STS NPD Compliance Engine — Serverless API Route
 * Runs on Vercel Edge-compatible Node runtime.
 * API key is server-side only — never exposed to client.
 * No data is stored, logged, or retained beyond this request.
 */

export default async function handler(req, res) {
  // Only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local for local dev, or set it as an environment variable in Vercel.",
    });
  }

  const { stage, productName, category, description, targetCountries, materials, notes, fileContents } = req.body;

  if (!category || !targetCountries?.length) {
    return res.status(400).json({ error: "category and targetCountries are required" });
  }

  // Build prompt — identical logic to original JSX but runs server-side
  const CATEGORIES = {
    sleeping_bags: "Sleeping Bags & Quilts",
    tents: "Tents & Shelters",
    packs: "Packs & Bags",
    apparel: "Apparel & Footwear",
    accessories: "Accessories & Equipment",
    hydration: "Hydration & Nutrition",
    cookware: "Cookware & Kitchen",
    stoves: "Stoves & Fuel Systems",
    water_treatment: "Water Treatment & Filters",
    electronics: "Electronics & Navigation",
    first_aid: "First Aid & Safety",
    lighting: "Lighting",
  };

  const catLabel = CATEGORIES[category] || category;
  const isBrief = stage === "brief";

  const fileSection = fileContents?.length
    ? "\n\n--- UPLOADED DOCUMENTS ---\n" + fileContents.map(f => `[${f.name}]\n${f.content}`).join("\n---\n")
    : "";

  const systemPrompt = `You are the Sea to Summit NPD IMS Compliance Engine — a global expert in product safety, chemical compliance (REACH/RoHS/PFAS/Prop 65), packaging regulations (EPR/plastic taxes/labelling/recycled content), textiles, ISO standards (14001:2026, 9001:2015, 45001:2018), and sustainability (CSRD/ESPR/greenwashing). You have web_search — USE IT to retrieve current regulatory data before responding. Return ONLY valid raw JSON, no markdown fences, no preamble, no commentary.`;

  const briefPrompt = `Stage 1 NPD IMS Compliance Pre-Screen. Search the web for current regulations for "${catLabel}" and recent packaging EPR/plastic levy updates before responding.

Product: ${productName || "Not specified"}
Category: ${catLabel}
Description: ${description || "Not specified"}
Markets: ${targetCountries.join(", ")}
Materials: ${materials || "Not yet specified"}
Notes: ${notes || "None"}${fileSection}

Return JSON exactly matching this schema (populate all arrays with real findings, minimum 3-5 per section):
{
  "productName": "",
  "category": "",
  "stage": "Stage 1 — Concept Pre-Screen",
  "date": "today",
  "overall_risk": "critical|high|medium|low",
  "executive_summary": "3-4 sentences covering regulatory, EMS, QMS, OHS dimensions",
  "risk_counts": {"product_flags": 0, "packaging_flags": 0, "certifications": 0},
  "ims_dashboard": {
    "regulatory": {"level": "high", "label": "5 product flags 4 packaging"},
    "ems": {"level": "high", "label": "7 aspects 3 risks 3 opps"},
    "qms": {"level": "medium", "label": "4 QMS control gaps"},
    "ohs": {"level": "high", "label": "3 hazard sources"}
  },
  "ims_findings": [
    {"finding": "", "severity": "critical|high|medium|low", "framework": "REG|EMS|QMS|OHS", "clause_ref": "", "scope": "", "action_required": ""}
  ],
  "product_flags": [{"flag": "", "severity": "critical|high|medium", "regulation": "", "markets": [], "detail": "", "action": "", "fws": ["REG"], "alternative": ""}],
  "packaging_flags": [{"flag": "", "severity": "critical|high|medium", "regulation": "", "markets": [], "detail": "", "action": "", "fws": ["REG"]}],
  "packaging_landscape": {"epr": [""], "labelling": [""], "recycled_content": [""], "plastic_levies": [""], "material_restrictions": [""]},
  "certifications": [{"name": "", "markets": [], "mandatory": true, "type": "product|packaging|both", "timeline": "", "cost": "", "notes": ""}],
  "ems_aspects": [{"material": "", "aspect": "", "impact": "", "lifecycle_stages": "", "significance": "critical|high|medium|low", "obligation": ""}],
  "ems_ro": [{"type": "Risk|Opportunity", "description": "", "clause": "", "action": ""}],
  "ems_change_flags": [{"change": "", "why": "", "owner": "", "requirement": ""}],
  "qms_gaps": [{"area": "", "clause": "", "gap": "", "action": ""}],
  "ohs_hazards": [{"source": "", "hazard_type": "", "exposed": "", "classification": "", "control": ""}],
  "market_readiness": {
    "MARKET": {"reg_product": "READY|ACTION", "reg_packaging": "READY|ACTION", "qms": "READY|ACTION", "ohs": "READY|ACTION", "notes": ""}
  },
  "actions": [{"priority": 1, "action": "", "owner": "", "timeline": "", "detail": "", "fws": ["REG","EMS"]}],
  "sources_searched": [""]
}`;

  const protoPrompt = `Stage 2 BOM & Design Review. Search for current restricted substances, certification requirements for "${catLabel}", and packaging EPR requirements.

Product: ${productName || "Not specified"}
Category: ${catLabel}
Description: ${description || "Not specified"}
Markets: ${targetCountries.join(", ")}
BOM: ${materials || "See uploaded documents"}
Notes: ${notes || "None"}${fileSection}

Return JSON exactly:
{
  "productName": "", "category": "", "stage": "Stage 2 — BOM & Design Review", "date": "today",
  "overall_risk": "critical|high|medium|low", "executive_summary": "3-4 sentences",
  "go_no_go": {"recommendation": "GO|CONDITIONAL GO|NO GO", "conditions": [], "critical_path": []},
  "risk_counts": {"bom_issues": 0, "product_checks": 0, "packaging_checks": 0},
  "ims_dashboard": {
    "regulatory": {"level": "high", "label": ""},
    "ems": {"level": "high", "label": ""},
    "qms": {"level": "medium", "label": ""},
    "ohs": {"level": "high", "label": ""}
  },
  "ims_findings": [{"finding": "", "severity": "", "framework": "REG|EMS|QMS|OHS", "clause_ref": "", "scope": "", "action_required": ""}],
  "bom_compliance": [{"material": "", "concerns": [], "regulations": [], "markets": [], "severity": "critical|high|medium|low", "recommendation": "", "alternative": ""}],
  "product_checklist": [{"regulation": "", "area": "product|chemical|performance|safety", "markets": [], "status": "pass|review|fail|tbd", "finding": "", "action": "", "standard": ""}],
  "packaging_checklist": [{"requirement": "", "type": "epr|labelling|material|recycled_content|plastic_levy|marking", "markets": [], "status": "compliant|action_needed|not_assessed", "detail": "", "action": "", "deadline": ""}],
  "ems_aspects": [{"material": "", "aspect": "", "impact": "", "lifecycle_stages": "", "significance": "", "obligation": ""}],
  "qms_gaps": [{"area": "", "clause": "", "gap": "", "action": ""}],
  "ohs_hazards": [{"source": "", "hazard_type": "", "exposed": "", "classification": "", "control": ""}],
  "testing_plan": [{"test": "", "regulation": "", "scope": "product|packaging|both", "markets": [], "accreditation": "", "cost": "", "weeks": "", "priority": "critical|high|medium"}],
  "sustainability": {"score": 5, "rationale": "", "positives": [], "gaps": [], "improvements": [], "certifications": []},
  "market_readiness": {"MARKET": {"reg_product": "READY|ACTION", "reg_packaging": "READY|ACTION", "qms": "READY|ACTION", "ohs": "READY|ACTION", "notes": ""}},
  "actions": [{"priority": 1, "action": "", "owner": "", "timeline": "", "detail": "", "fws": []}],
  "sources_searched": [""]
}`;

  // Abort the upstream call if it doesn't complete within 290s — Vercel Pro
  // function timeout is 300s, hobby is 60s. Leave headroom either way.
  const controller = new AbortController();
  const timeoutMs = Number(process.env.ANTHROPIC_TIMEOUT_MS) || 290_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-opus-4-5",
        max_tokens: 16384,
        system: systemPrompt,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: isBrief ? briefPrompt : protoPrompt }],
      }),
      signal: controller.signal,
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => "");
      let detail = errText;
      try {
        const j = JSON.parse(errText);
        detail = j?.error?.message || errText;
      } catch {
        /* not JSON — keep raw text */
      }
      return res.status(502).json({
        error: `Anthropic API error (${anthropicRes.status})`,
        detail: detail.slice(0, 500),
      });
    }

    const data = await anthropicRes.json();

    // Extract the text response from content blocks
    const textBlock = data.content?.find(b => b.type === "text");
    if (!textBlock?.text) {
      return res.status(502).json({ error: "No text response from API", raw: data.content });
    }

    // Strip any accidental markdown fences and parse JSON
    let raw = textBlock.text.trim();
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract JSON from mixed content
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return res.status(502).json({ error: "Could not parse JSON response", raw: raw.slice(0, 500) });
      }
    }

    // No data stored — return result directly
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("API route error:", err);
    if (err?.name === "AbortError") {
      return res.status(504).json({
        error: "The compliance analysis took too long and was cancelled. Try fewer markets or rerun.",
      });
    }
    return res.status(500).json({ error: err.message || "Unknown server error" });
  } finally {
    clearTimeout(timer);
  }
}

// Vercel function configuration. Pro plan can extend maxDuration up to 300.
// On Hobby this is clamped to 60 — long runs may still time out.
export const maxDuration = 300;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
    responseLimit: "8mb",
  },
};
