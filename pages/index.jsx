import { useState, useRef, useCallback } from "react";


/* ── Brand colours ───────────────────────────────────────────────────────── */
const C = {
  navy:"#1F2A44", navyD:"#151D30", navyM:"#253354", navyL:"#2D3F5E",
  coral:"#E8512A", coralL:"#F06943",
  sand:"#F5F0E8", sandD:"#EDE5D8", sandL:"#FAF8F4",
  slate:"#6B7A99", slateL:"#94A3B8", slateXL:"#CBD5E1",
  border:"#E2E8F0", borderD:"#D1D9E6",
  ink:"#0D1520", white:"#FFFFFF",
  greyM:"#374151", greyL:"#6B7280",
  FR:"#E8512A", FE:"#059669", FQ:"#1F2A44", FO:"#D97706",
};

const COUNTRIES = [
  "Andorra","Argentina","Australia","Austria","Bahrain","Belarus","Belgium","Bhutan",
  "Botswana","Brazil","Brunei","Bulgaria","Cambodia","Canada","Chile","China",
  "Costa Rica","Croatia","Czech Republic","Denmark","Ecuador","Estonia","Finland",
  "France","Georgia","Germany","Greece","Hong Kong","Hungary","Iceland","India",
  "Indonesia","Ireland","Israel","Italy","Japan","Kuwait","Kazakhstan","Latvia",
  "Lithuania","Luxembourg","Macedonia","Malaysia","Mexico","Namibia","Nepal",
  "Netherlands","New Caledonia","New Zealand","Norway","Oman","Paraguay","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia","Saudi Arabia",
  "Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sweden",
  "Switzerland","Taiwan","Thailand","U.A.E.","Ukraine","United Kingdom","Uruguay",
  "USA","Vietnam",
];

const CATEGORIES = [
  {id:"sleeping_bags",label:"Sleeping Bags & Quilts",icon:"🛏️"},
  {id:"sleeping_pads",label:"Sleeping Pads & Mats",icon:"🧩"},
  {id:"backpacks",label:"Backpacks & Daypacks",icon:"🎒"},
  {id:"drybags",label:"Dry Bags & Waterproof Cases",icon:"💧"},
  {id:"towels",label:"Travel Towels",icon:"🏊"},
  {id:"trekking_poles",label:"Trekking Poles",icon:"🏔️"},
  {id:"headlamps",label:"Headlamps & Lighting",icon:"🔦"},
  {id:"cookware",label:"Cookware & Kitchen",icon:"🍳"},
  {id:"stoves",label:"Stoves & Fuel Systems",icon:"🔥"},
  {id:"water_treatment",label:"Water Treatment & Filters",icon:"🧪"},
  {id:"apparel",label:"Apparel & Baselayers",icon:"👕"},
  {id:"footwear",label:"Footwear & Gaiters",icon:"👟"},
  {id:"gloves_hats",label:"Gloves, Hats & Accessories",icon:"🧤"},
  {id:"tents",label:"Tents & Shelters",icon:"⛺"},
  {id:"tarps",label:"Tarps & Groundsheets",icon:"🏕️"},
  {id:"hammocks",label:"Hammocks",icon:"🌿"},
  {id:"chairs",label:"Chairs & Seating",icon:"🪑"},
  {id:"tables",label:"Tables & Camp Furniture",icon:"🪵"},
  {id:"food",label:"Food & Nutrition",icon:"🍫"},
  {id:"ppe",label:"PPE & Safety Equipment",icon:"🦺"},
  {id:"sunscreen",label:"Sunscreen & Skincare",icon:"☀️"},
  {id:"insect_repellent",label:"Insect Repellent",icon:"🦟"},
  {id:"first_aid",label:"First Aid & Medical",icon:"🩺"},
  {id:"electronics",label:"Electronics & Solar",icon:"⚡"},
  {id:"navigation",label:"Navigation & GPS",icon:"🧭"},
  {id:"ropes_cordage",label:"Ropes & Cordage",icon:"🪢"},
  {id:"carabiners",label:"Carabiners & Hardware",icon:"🔗"},
  {id:"knives_tools",label:"Knives & Multi-tools",icon:"🔪"},
];

const REGIONS = {
  "EU / EEA":["Austria","Belgium","Bulgaria","Croatia","Czech Republic","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Iceland","Ireland","Italy","Latvia","Lithuania","Luxembourg","Netherlands","Norway","Poland","Portugal","Romania","Slovakia","Slovenia","Spain","Sweden"],
  "Asia Pacific":["Australia","New Zealand","China","Japan","South Korea","Hong Kong","Taiwan","Singapore","India","Indonesia","Malaysia","Philippines","Thailand","Vietnam","Cambodia","Brunei"],
  "Americas":["USA","Canada","Brazil","Argentina","Chile","Mexico","Peru","Ecuador","Uruguay","Paraguay","Costa Rica"],
  "GCC":["U.A.E.","Saudi Arabia","Qatar","Kuwait","Bahrain","Oman"],
  "Rest of World":["United Kingdom","Switzerland","Russia","Ukraine","Kazakhstan","Belarus","Georgia","Israel","South Africa","Namibia","Botswana","New Caledonia","Andorra","Macedonia","Bhutan","Nepal"],
};

async function extractText(file) {
  const n = file.name.toLowerCase();
  if (n.match(/\.(txt|md|csv)$/)) return file.text();
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if (c >= 32 && c < 127) s += String.fromCharCode(c);
    else if (c === 10 || c === 13) s += " ";
  }
  if (n.endsWith(".docx")) {
    const matches = s.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
    const text = matches.map(m => m.replace(/<[^>]+>/g, "")).join(" ");
    return (text || s.replace(/\s+/g, " ")).substring(0, 15000);
  }
  const frags = s.match(/[\x20-\x7E]{4,}/g) || [];
  return frags.join(" ").replace(/\s+/g, " ").substring(0, 15000);
}

/* ── Colour helpers ──────────────────────────────────────────────────────── */
const riskCol = r => ({critical:"#EF4444",high:"#F97316",medium:"#F59E0B",low:"#10B981"}[r]||C.slate);
const sevCol  = s => ({critical:"#EF4444",high:"#F97316",medium:"#F59E0B",low:"#10B981"}[s?.toLowerCase()]||C.slate);
const sevBg   = s => ({critical:"#FEF2F2",high:"#FFF7ED",medium:"#FFFBEB",low:"#ECFDF5"}[s?.toLowerCase()]||"#F8FAFC");
const fwCol   = fw => ({REG:C.FR,EMS:C.FE,QMS:C.FQ,OHS:C.FO}[fw]||C.slate);
const stCol   = s => ({pass:"#10B981",compliant:"#10B981",review:"#F59E0B",action_needed:"#F59E0B",fail:"#EF4444",tbd:"#94A3B8",not_assessed:"#94A3B8"}[s]||C.slate);
const stLbl   = s => ({pass:"PASS",compliant:"COMPLIANT",review:"REVIEW",action_needed:"ACTION",fail:"FAIL",tbd:"TBD",not_assessed:"N/A"}[s]||(s||"").toUpperCase());

const today = new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});

/* ── HTML escape (used for every API/user value interpolated into the report) ── */
const ESC_MAP = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ESC_MAP[c]);

/* ── HTML report builder ─────────────────────────────────────────────────── */
function buildHTMLReport(result, stage) {
  const isBrief = stage === "brief";
  const sust = result.sustainability || {};
  const gng  = result.go_no_go || {};
  const ims  = result.ims_dashboard || {};
  const gngC = {GO:"#10B981","CONDITIONAL GO":"#F59E0B","NO GO":"#EF4444"}[gng.recommendation]||C.slate;
  const gngI = {GO:"✅","CONDITIONAL GO":"⚠️","NO GO":"🚫"}[gng.recommendation]||"📋";

  /* ── style helpers ── */
  const tbl   = `width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px`;
  const thS   = (bg=C.navy) => `background:${bg};padding:8px 10px;text-align:left;font-family:'IBM Plex Mono',monospace;font-size:8px;color:#94A3B8;letter-spacing:1px;font-weight:700;white-space:nowrap;overflow:hidden`;
  const tdS   = `padding:8px 10px;vertical-align:top;line-height:1.5;word-wrap:break-word;overflow-wrap:break-word`;
  const secH  = (txt,color=C.FR,sub="") =>
    `<div style="border-top:2px solid ${color};padding-top:8px;margin:24px 0 12px"><span style="font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:700;color:${color};letter-spacing:2px;text-transform:uppercase">${esc(txt)}</span>${sub?`<span style="font-size:9px;color:#94A3B8;margin-left:8px">${esc(sub)}</span>`:""}</div>`;

  /* ── fw tag ── */
  const fwTag = fw => `<span style="font-family:'IBM Plex Mono',monospace;font-size:7px;font-weight:700;color:${fwCol(fw)};border:1px solid ${fwCol(fw)}30;border-radius:3px;padding:1px 5px;margin-right:3px">${esc(fw)}</span>`;
  const sevBadge = s => `<span style="font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:700;padding:2px 7px;border-radius:3px;background:${sevBg(s)};color:${sevCol(s)}">${esc((s||"").toUpperCase())}</span>`;
  const statusBadge = s => `<span style="font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:700;padding:2px 6px;border-radius:3px;background:${stCol(s)}18;color:${stCol(s)}">${esc(stLbl(s))}</span>`;

  /* ── Dashboard panel ── */
  const dashPanel = (label, data, borderCol) => {
    if (!data) return "";
    const lc = riskCol(data.level);
    return `<div style="border-left:3px solid ${borderCol};padding:10px 12px;background:#FAF8F4;flex:1;min-width:0;overflow:hidden">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:7px;color:${borderCol};letter-spacing:1.5px;font-weight:700;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(label)}</div>
      <div style="font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:700;color:${lc};line-height:1;margin-bottom:4px">${esc((data.level||"").toUpperCase())}</div>
      <div style="font-size:9.5px;color:#6B7280;line-height:1.4;word-wrap:break-word">${esc(data.label)}</div>
    </div>`;
  };

  /* ── IMS Findings register row ── */
  const findingRow = (f,i) => `<tr style="background:${i%2===0?"#fff":"#F9FAFB"}">
    <td style="${tdS};font-weight:600;color:#1F2A44;font-size:10.5px;width:22%">${esc(f.finding)}</td>
    <td style="${tdS};width:9%">${sevBadge(f.severity)}</td>
    <td style="${tdS};width:7%">${f.framework?`<span style="font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:700;color:${fwCol(f.framework)}">${esc(f.framework)}</span>`:""}</td>
    <td style="${tdS};font-family:'IBM Plex Mono',monospace;font-size:8.5px;color:#6B7280;width:12%">${esc(f.clause_ref)}</td>
    <td style="${tdS};font-size:10px;color:#6B7280;width:12%">${esc(f.scope)}</td>
    <td style="${tdS};font-size:10.5px;width:38%">${esc(f.action_required)}</td>
  </tr>`;

  /* ── Flag card ── */
  const flagCard = (f, accentColor=C.FR) => {
    const sc = sevCol(f.severity);
    const fws = (f.fws||[]).length ? f.fws : ["REG"];
    return `<div style="border:1px solid #E2E8F0;border-left:3px solid ${sc};border-radius:6px;margin-bottom:10px;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px 8px">
        <span style="font-weight:700;font-size:11px;color:#1F2A44">${esc(f.flag||f.title||"")}</span>
        ${sevBadge(f.severity)}
      </div>
      <div style="background:#1A2438;padding:4px 12px;display:flex;gap:6px">${fws.map(fwTag).join("")}</div>
      ${f.regulation?`<div style="padding:5px 12px 0;font-family:'IBM Plex Mono',monospace;font-size:8px;color:#94A3B8">${esc(f.regulation)}</div>`:""}
      ${f.markets?.length?`<div style="padding:3px 12px 0;font-size:10px;color:#6B7280">Markets: ${esc(f.markets.join(", "))}</div>`:""}
      <div style="padding:8px 12px;font-size:11px;color:#374151;line-height:1.6">${esc(f.detail)}</div>
      ${f.action?`<div style="padding:0 12px 10px;font-size:10.5px;font-weight:700;color:${C.FR}">→ ${esc(f.action)}</div>`:""}
      ${f.alternative?`<div style="padding:0 12px 10px;font-size:10px;color:#059669;font-weight:600">💡 Alternative: ${esc(f.alternative)}</div>`:""}
    </div>`;
  };

  /* ── Market readiness cell ── */
  const mrCell = (status) => status === "READY"
    ? `<td style="${tdS};white-space:nowrap"><span style="color:#10B981;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700">✓ READY</span></td>`
    : `<td style="${tdS};white-space:nowrap"><span style="color:#EF4444;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700">✗ ACTION</span></td>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NPD IMS Compliance Report — ${esc(result.productName||"Product")}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#F5F0E8;color:#0D1520;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:13px}
.wrap{max-width:900px;margin:0 auto;background:#fff;box-shadow:0 2px 20px rgba(0,0,0,0.08)}
table{border-spacing:0}
td,th{border-bottom:1px solid #F1F5F9}
@media print{
  body{background:#fff}
  .wrap{box-shadow:none;max-width:100%}
  section{page-break-inside:avoid}
  .no-print{display:none!important}
}
</style>
</head>
<body>
<div class="wrap">

<!-- COVER HEADER: white bg, coral top stripe, navy bottom strip -->
<div style="background:#fff;position:relative;padding:40px 44px 32px;border-top:5px solid ${C.FR}">
  <div style="border-top:1px solid #E2E8F0;padding-top:18px;margin-bottom:14px"></div>
  <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:${C.FR};letter-spacing:2px;margin-bottom:10px">NPD IMS Pre-Assessment Screening Report</div>
  <div style="font-size:30px;font-weight:800;color:${C.navy};line-height:1.15;margin-bottom:6px">${esc(result.productName||"Product")}</div>
  <div style="font-size:13px;color:#6B7A99;margin-bottom:24px">${esc(result.category||"")} · ${esc(result.stage||"")}</div>

  <!-- 4 framework badges -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid #E2E8F0;margin-bottom:24px">
    ${[
      ["REGULATORY COMPLIANCE", C.FR],
      ["ISO 14001:2026 ENV MGMT", C.FE],
      ["ISO 9001:2015 QUALITY MGT", C.FQ],
      ["ISO 45001:2018 OCC. HEALTH", C.FO],
    ].map(([label,col],i)=>`<div style="border-left:3px solid ${col};padding:10px 12px;${i<3?"border-right:1px solid #E2E8F0":""}">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:700;color:${col}">${label}</div>
    </div>`).join("")}
  </div>

  <!-- Metadata grid -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0">
    ${[
      ["STAGE",result.stage||"Stage 1 — Concept Pre-Screen",C.navy],
      ["OVERALL RISK",(result.overall_risk||"").toUpperCase(),riskCol(result.overall_risk)],
      ["TARGET MARKETS",Object.keys(result.market_readiness||{}).join(" · ")||"",C.navy],
      ["DATE PREPARED",today,C.navy],
    ].map(([l,v,vc])=>`<div style="padding:0 0 12px"><div style="font-family:'IBM Plex Mono',monospace;font-size:7px;color:#94A3B8;letter-spacing:1.5px;margin-bottom:4px">${esc(l)}</div><div style="font-size:10.5px;font-weight:700;color:${vc}">${esc(v)}</div></div>`).join("")}
    ${[
      ["PREPARED BY","NPD IMS Compliance Engine",C.navy],
      ["PRODUCT CATEGORY",result.category||"",C.navy],
      ["REVISION","Draft 1.0",C.navy],
      ["CLASSIFICATION","CONFIDENTIAL",C.FR],
    ].map(([l,v,vc])=>`<div style="padding:12px 0 0;border-top:1px solid #F5F0E8"><div style="font-family:'IBM Plex Mono',monospace;font-size:7px;color:#94A3B8;letter-spacing:1.5px;margin-bottom:4px">${esc(l)}</div><div style="font-size:10.5px;font-weight:700;color:${vc}">${esc(v)}</div></div>`).join("")}
  </div>
</div>

<!-- MAIN BODY -->
<div style="padding:0 44px 44px">

<!-- EXECUTIVE SUMMARY -->
<section>
${secH("Executive Summary",C.FR)}
<p style="font-size:13px;line-height:1.8;color:#374151">${esc(result.executive_summary||"")}</p>
</section>

<!-- IMS DASHBOARD -->
${(ims.regulatory||ims.ems||ims.qms||ims.ohs) ? `
<div style="display:flex;gap:1px;background:#E2E8F0;border:1px solid #E2E8F0;margin:16px 0 20px">
  ${dashPanel("REGULATORY",ims.regulatory,C.FR)}
  ${dashPanel("ISO 14001:2026",ims.ems,C.FE)}
  ${dashPanel("ISO 9001:2015",ims.qms,C.FQ)}
  ${dashPanel("ISO 45001:2018",ims.ohs,C.FO)}
</div>` : ""}

<!-- IMS FINDINGS REGISTER -->
${(result.ims_findings||[]).length ? `
<section>
${secH("IMS Findings Register — All Frameworks Consolidated",C.navy)}
<p style="font-size:10px;color:#6B7280;margin-bottom:8px">All findings across all four frameworks in a single register. Framework column identifies primary domain. Cross-cutting findings are tagged once, not repeated.</p>
<table style="${tbl}">
<colgroup>
  <col style="width:22%"><col style="width:9%"><col style="width:7%">
  <col style="width:12%"><col style="width:12%"><col style="width:38%">
</colgroup>
<thead><tr style="background:${C.navy}">
  <th style="${thS()}">Finding</th>
  <th style="${thS()}">Severity</th>
  <th style="${thS()}">Framework</th>
  <th style="${thS()}">Clause / Ref</th>
  <th style="${thS()}">Scope</th>
  <th style="${thS()}">Action Required</th>
</tr></thead>
<tbody>
${(result.ims_findings||[]).map((f,i)=>findingRow(f,i)).join("")}
</tbody>
</table>
</section>` : ""}

<!-- GO / NO-GO -->
${gng.recommendation ? `
<section>
${secH("Recommendation",C.FR)}
<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#F8FAFC;border-left:4px solid ${gngC};border-radius:0 6px 6px 0;margin-bottom:8px">
  <span style="font-size:24px">${gngI}</span>
  <div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:7.5px;color:#6B7A99;letter-spacing:1.5px;margin-bottom:2px">GO / NO-GO RECOMMENDATION</div>
    <div style="font-size:20px;font-weight:800;color:${gngC}">${esc(gng.recommendation)}</div>
  </div>
</div>
${gng.conditions?.length?`<div style="padding:10px 14px;background:#FFFBEB;border-left:3px solid #F59E0B;border-radius:0 6px 6px 0;margin-bottom:6px"><div style="font-family:'IBM Plex Mono',monospace;font-size:7.5px;color:#D97706;margin-bottom:4px;letter-spacing:1px">CONDITIONS</div>${gng.conditions.map(c=>`<div style="font-size:11px;color:#374151;margin-bottom:2px">• ${esc(c)}</div>`).join("")}</div>`:""}
${gng.critical_path?.length?`<div style="padding:10px 14px;background:#FFF5F2;border-left:3px solid ${C.FR};border-radius:0 6px 6px 0"><div style="font-family:'IBM Plex Mono',monospace;font-size:7.5px;color:${C.FR};margin-bottom:4px;letter-spacing:1px">CRITICAL PATH</div>${gng.critical_path.map(c=>`<div style="font-size:11px;color:#374151;margin-bottom:2px">→ ${esc(c)}</div>`).join("")}</div>`:""}
</section>` : ""}

<!-- SECTION 1: REGULATORY FLAGS -->
${(result.product_flags||result.packaging_flags) ? `
<section>
${secH("Section 1 — Regulatory Compliance Flags",C.FR)}
${(result.product_flags||[]).length?`<div style="font-family:'IBM Plex Mono',monospace;font-size:7.5px;color:#6B7280;letter-spacing:1px;margin-bottom:8px">PRODUCT FLAGS (${result.product_flags.length})</div>${result.product_flags.map(f=>flagCard(f,C.FR)).join("")}`:""}
${(result.packaging_flags||[]).length?`<div style="font-family:'IBM Plex Mono',monospace;font-size:7.5px;color:#6B7280;letter-spacing:1px;margin:12px 0 8px">PACKAGING FLAGS (${result.packaging_flags.length})</div>${result.packaging_flags.map(f=>flagCard(f,"#7C3AED")).join("")}`:""}
</section>` : ""}

<!-- PACKAGING LANDSCAPE -->
${(result.packaging_landscape) ? (() => {
  const pkg = result.packaging_landscape;
  const cats = [
    {k:"epr",l:"EPR / Producer Responsibility",c:"#059669"},
    {k:"labelling",l:"Mandatory Labelling",c:"#3B82F6"},
    {k:"recycled_content",l:"Recycled Content Requirements",c:"#7C3AED"},
    {k:"plastic_levies",l:"Plastic Taxes & Levies",c:"#D97706"},
    {k:"material_restrictions",l:"Material Restrictions",c:"#EF4444"},
  ].filter(r=>pkg[r.k]?.length);
  if (!cats.length) return "";
  return `<section>
${secH("Packaging Regulatory Landscape","#7C3AED")}
<table style="${tbl}"><colgroup><col style="width:28%"><col style="width:72%"></colgroup>
<tbody>
${cats.map((r,i)=>`<tr style="background:${i%2===0?"#fff":"#F9FAFB"}">
  <td style="${tdS};border-left:3px solid ${r.c}"><span style="font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;color:${r.c}">${esc(r.l)}</span></td>
  <td style="${tdS}">${(pkg[r.k]||[]).map(item=>`<div style="font-size:11px;color:#374151;margin-bottom:2px">• ${esc(item)}</div>`).join("")}</td>
</tr>`).join("")}
</tbody>
</table>
</section>`;
})() : ""}

<!-- SECTION 2: EMS ASPECTS -->
${(result.ems_aspects||[]).length ? `
<section>
${secH("Section 2 — ISO 14001:2026 Environmental Management Pre-Screen",C.FE)}
<p style="font-size:11px;color:#374151;line-height:1.65;margin-bottom:10px">Preliminary environmental aspects identification and risks/opportunities screening based on BOM and target markets. This is a <strong>screening input</strong> to your EMS — not a substitute for the formal Aspects &amp; Impacts Register (Cl.6.1.2) or Risks &amp; Opportunities Register (Cl.6.1.4).</p>
<div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:${C.FE};font-weight:700;letter-spacing:1px;margin-bottom:6px">2.1 PRELIMINARY ASPECTS IDENTIFICATION — Cl.6.1.2</div>
<table style="${tbl}">
<colgroup><col style="width:18%"><col style="width:16%"><col style="width:17%"><col style="width:14%"><col style="width:10%"><col style="width:25%"></colgroup>
<thead><tr style="background:${C.FE}">
  <th style="${thS(C.FE)}">Material / Activity</th>
  <th style="${thS(C.FE)}">Environmental Aspect</th>
  <th style="${thS(C.FE)}">Potential Impact</th>
  <th style="${thS(C.FE)}">Life Cycle Stages</th>
  <th style="${thS(C.FE)}">Significance</th>
  <th style="${thS(C.FE)}">Compliance Obligation</th>
</tr></thead>
<tbody>
${(result.ems_aspects||[]).map((a,i)=>`<tr style="background:${i%2===0?"#fff":"#F9FAFB"}">
  <td style="${tdS};font-weight:600;color:#1F2A44;font-size:10.5px">${esc(a.material)}</td>
  <td style="${tdS};font-size:10.5px">${esc(a.aspect)}</td>
  <td style="${tdS};font-size:10px;color:#6B7280">${esc(a.impact)}</td>
  <td style="${tdS};font-family:'IBM Plex Mono',monospace;font-size:8.5px;color:#6B7280">${esc(a.lifecycle_stages)}</td>
  <td style="${tdS}">${sevBadge(a.significance)}</td>
  <td style="${tdS};font-size:10px">${esc(a.obligation)}</td>
</tr>`).join("")}
</tbody>
</table>
</section>` : ""}

<!-- EMS R&O -->
${(result.ems_ro||[]).length ? `
<section>
<div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:${C.FE};font-weight:700;letter-spacing:1px;margin:14px 0 6px">2.2 RISKS &amp; OPPORTUNITIES REGISTER — Cl.6.1.4 (NEW IN ISO 14001:2026)</div>
<table style="${tbl}">
<colgroup><col style="width:11%"><col style="width:38%"><col style="width:12%"><col style="width:39%"></colgroup>
<thead><tr style="background:${C.FE}">
  <th style="${thS(C.FE)}">Type</th>
  <th style="${thS(C.FE)}">Risk / Opportunity Description</th>
  <th style="${thS(C.FE)}">Clause</th>
  <th style="${thS(C.FE)}">Recommended Action</th>
</tr></thead>
<tbody>
${(result.ems_ro||[]).map((r,i)=>`<tr style="background:${i%2===0?"#fff":"#F9FAFB"}">
  <td style="${tdS};font-weight:700;font-size:10px;color:${r.type==="Opportunity"?C.FE:C.FR}">${esc(r.type)}</td>
  <td style="${tdS};font-size:10.5px">${esc(r.description)}</td>
  <td style="${tdS};font-family:'IBM Plex Mono',monospace;font-size:8.5px;color:#6B7280">${esc(r.clause)}</td>
  <td style="${tdS};font-size:10.5px">${esc(r.action)}</td>
</tr>`).join("")}
</tbody>
</table>
</section>` : ""}

<!-- EMS Change Flags -->
${(result.ems_change_flags||[]).length ? `
<section>
<div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:${C.FE};font-weight:700;letter-spacing:1px;margin:14px 0 6px">2.3 CHANGE MANAGEMENT FLAGS — Cl.6.3 (NEW IN ISO 14001:2026)</div>
<table style="${tbl}">
<colgroup><col style="width:22%"><col style="width:33%"><col style="width:13%"><col style="width:32%"></colgroup>
<thead><tr style="background:${C.FE}">
  <th style="${thS(C.FE)}">Proposed Change</th>
  <th style="${thS(C.FE)}">Why It Triggers Cl.6.3</th>
  <th style="${thS(C.FE)}">Owner</th>
  <th style="${thS(C.FE)}">EMS Requirement</th>
</tr></thead>
<tbody>
${(result.ems_change_flags||[]).map((r,i)=>`<tr style="background:${i%2===0?"#fff":"#F9FAFB"}">
  <td style="${tdS};font-weight:600;color:#1F2A44;font-size:10.5px">${esc(r.change)}</td>
  <td style="${tdS};font-size:10.5px;color:#374151">${esc(r.why)}</td>
  <td style="${tdS};font-size:10px;color:#6B7280">${esc(r.owner)}</td>
  <td style="${tdS};font-weight:700;font-size:10px;color:${C.FE}">${esc(r.requirement)}</td>
</tr>`).join("")}
</tbody>
</table>
</section>` : ""}

<!-- SECTION 3: QMS GAPS -->
${(result.qms_gaps||[]).length ? `
<section>
${secH("Section 3 — ISO 9001:2015 Quality Management System Gaps",C.FQ)}
<table style="${tbl}">
<colgroup><col style="width:22%"><col style="width:10%"><col style="width:36%"><col style="width:32%"></colgroup>
<thead><tr style="background:${C.FQ}">
  <th style="${thS(C.FQ)}">QMS Control Area</th>
  <th style="${thS(C.FQ)}">Clause</th>
  <th style="${thS(C.FQ)}">Gap Identified</th>
  <th style="${thS(C.FQ)}">Action Required</th>
</tr></thead>
<tbody>
${(result.qms_gaps||[]).map((g,i)=>`<tr style="background:${i%2===0?"#fff":"#F9FAFB"}">
  <td style="${tdS};font-weight:600;color:#1F2A44;font-size:10.5px">${esc(g.area)}</td>
  <td style="${tdS};font-family:'IBM Plex Mono',monospace;font-size:8.5px;color:#6B7280">${esc(g.clause)}</td>
  <td style="${tdS};font-size:10.5px;color:#374151">${esc(g.gap)}</td>
  <td style="${tdS};font-weight:700;font-size:10px;color:${C.FQ}">${esc(g.action)}</td>
</tr>`).join("")}
</tbody>
</table>
</section>` : ""}

<!-- SECTION 4: OHS HAZARDS -->
${(result.ohs_hazards||[]).length ? `
<section>
${secH("Section 4 — ISO 45001:2018 Preliminary Hazard Identification",C.FO)}
<table style="${tbl}">
<colgroup><col style="width:20%"><col style="width:17%"><col style="width:14%"><col style="width:24%"><col style="width:25%"></colgroup>
<thead><tr style="background:${C.FO}">
  <th style="${thS(C.FO)}">Hazard Source</th>
  <th style="${thS(C.FO)}">Hazard Type</th>
  <th style="${thS(C.FO)}">Who Is Exposed</th>
  <th style="${thS(C.FO)}">Classification / Limit</th>
  <th style="${thS(C.FO)}">Control / Action</th>
</tr></thead>
<tbody>
${(result.ohs_hazards||[]).map((h,i)=>`<tr style="background:${i%2===0?"#fff":"#F9FAFB"}">
  <td style="${tdS};font-weight:600;color:#1F2A44;font-size:10.5px">${esc(h.source)}</td>
  <td style="${tdS};font-size:10.5px;color:#374151">${esc(h.hazard_type)}</td>
  <td style="${tdS};font-size:10px;color:#6B7280">${esc(h.exposed)}</td>
  <td style="${tdS};font-size:10px;color:#374151">${esc(h.classification)}</td>
  <td style="${tdS};font-weight:700;font-size:10px;color:${C.FO}">${esc(h.control)}</td>
</tr>`).join("")}
</tbody>
</table>
</section>` : ""}

<!-- STAGE 2: BOM COMPLIANCE -->
${(result.bom_compliance||[]).length ? `
<section>
${secH("BOM Compliance Review",C.FR)}
${result.bom_compliance.map(b=>{
  const sc = sevCol(b.severity);
  return `<div style="border:1px solid #E2E8F0;border-left:3px solid ${sc};border-radius:5px;margin-bottom:8px;padding:12px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-weight:700;font-size:12px;color:#1F2A44">${esc(b.material)}</span>
      ${sevBadge(b.severity)}
    </div>
    ${b.concerns?.length?`<div style="margin-bottom:5px">${b.concerns.map(c=>`<div style="font-size:11px;color:#374151;margin-bottom:2px">• ${esc(c)}</div>`).join("")}</div>`:""}
    ${b.recommendation?`<div style="font-size:10.5px;font-weight:700;color:${C.FR}">→ ${esc(b.recommendation)}</div>`:""}
    ${b.alternative?`<div style="font-size:10px;color:#059669;font-weight:600;margin-top:3px">💡 ${esc(b.alternative)}</div>`:""}
  </div>`;
}).join("")}
</section>` : ""}

<!-- PRODUCT CHECKLIST (stage 2) -->
${(result.product_checklist||[]).length ? `
<section>
${secH("Product Compliance Checklist",C.FR)}
<table style="${tbl}">
<colgroup><col style="width:9%"><col style="width:22%"><col style="width:10%"><col style="width:14%"><col style="width:25%"><col style="width:20%"></colgroup>
<thead><tr style="background:${C.navy}">
  <th style="${thS()}">Status</th><th style="${thS()}">Regulation</th>
  <th style="${thS()}">Area</th><th style="${thS()}">Markets</th>
  <th style="${thS()}">Finding</th><th style="${thS()}">Action</th>
</tr></thead>
<tbody>
${result.product_checklist.map((r,i)=>`<tr style="background:${i%2===0?"#fff":"#F9FAFB"}">
  <td style="${tdS}">${statusBadge(r.status)}</td>
  <td style="${tdS};font-weight:600;color:#1F2A44;font-size:10.5px">${esc(r.regulation)}</td>
  <td style="${tdS}"><span style="font-size:8px;background:#F5F0E8;color:#6B7A99;border-radius:3px;padding:1px 5px;font-family:'IBM Plex Mono',monospace;white-space:nowrap">${esc(r.area)}</span></td>
  <td style="${tdS};font-size:10px;color:#94A3B8">${esc((r.markets||[]).join(", "))}</td>
  <td style="${tdS};font-size:10.5px;color:#374151">${esc(r.finding)}</td>
  <td style="${tdS};font-size:10.5px;font-weight:600;color:#374151">${r.action?esc(r.action):"—"}</td>
</tr>`).join("")}
</tbody>
</table>
</section>` : ""}

<!-- PACKAGING CHECKLIST (stage 2) -->
${(result.packaging_checklist||[]).length ? `
<section>
${secH("Packaging Compliance Checklist","#7C3AED")}
<table style="${tbl}">
<colgroup><col style="width:9%"><col style="width:20%"><col style="width:9%"><col style="width:13%"><col style="width:25%"><col style="width:14%"><col style="width:10%"></colgroup>
<thead><tr style="background:#7C3AED">
  <th style="${thS("#7C3AED")}">Status</th><th style="${thS("#7C3AED")}">Requirement</th>
  <th style="${thS("#7C3AED")}">Type</th><th style="${thS("#7C3AED")}">Markets</th>
  <th style="${thS("#7C3AED")}">Detail</th><th style="${thS("#7C3AED")}">Action</th>
  <th style="${thS("#7C3AED")}">Deadline</th>
</tr></thead>
<tbody>
${result.packaging_checklist.map((r,i)=>`<tr style="background:${i%2===0?"#fff":"#F9FAFB"}">
  <td style="${tdS}">${statusBadge(r.status)}</td>
  <td style="${tdS};font-weight:600;color:#1F2A44;font-size:10.5px">${esc(r.requirement)}</td>
  <td style="${tdS}"><span style="font-size:8px;background:#EDE9FE;color:#7C3AED;border-radius:3px;padding:1px 5px;font-family:'IBM Plex Mono',monospace;white-space:nowrap">${esc(r.type)}</span></td>
  <td style="${tdS};font-size:10px;color:#94A3B8">${esc((r.markets||[]).join(", "))}</td>
  <td style="${tdS};font-size:10.5px;color:#374151">${esc(r.detail)}</td>
  <td style="${tdS};font-size:10.5px;font-weight:600;color:#7C3AED">${r.action?esc(r.action):"—"}</td>
  <td style="${tdS};font-size:9.5px;font-family:'IBM Plex Mono',monospace;color:#D97706;white-space:nowrap">${esc(r.deadline)}</td>
</tr>`).join("")}
</tbody>
</table>
</section>` : ""}

<!-- MARKET READINESS — 4 DIMENSIONS -->
${Object.keys(result.market_readiness||{}).length ? `
<section>
${secH("Market Readiness Overview — Four Dimensions",C.navy)}
<p style="font-size:9.5px;color:#6B7280;margin-bottom:8px">REG = Regulatory (product + packaging) | EMS = ISO 14001:2026 aspects &amp; legal obligations | QMS = ISO 9001 design controls | OHS = ISO 45001 hazard identification &amp; supplier controls</p>
<table style="${tbl}">
<colgroup><col style="width:16%"><col style="width:11%"><col style="width:12%"><col style="width:10%"><col style="width:10%"><col style="width:41%"></colgroup>
<thead><tr style="background:${C.navy}">
  <th style="${thS()}">Market</th>
  <th style="${thS()}">REG Product</th>
  <th style="${thS()}">REG Packaging</th>
  <th style="${thS()}">QMS</th>
  <th style="${thS()}">OHS</th>
  <th style="${thS()}">Key Blockers / Notes</th>
</tr></thead>
<tbody>
${Object.entries(result.market_readiness||{}).map(([market,data],i)=>`<tr style="background:${i%2===0?"#fff":"#F9FAFB"}">
  <td style="${tdS};font-weight:600;font-size:10.5px;color:#1F2A44">${esc(market)}</td>
  ${mrCell(data.reg_product)}
  ${mrCell(data.reg_packaging)}
  ${mrCell(data.qms)}
  ${mrCell(data.ohs)}
  <td style="${tdS};font-size:10px;color:#374151">${esc(data.notes)}</td>
</tr>`).join("")}
</tbody>
</table>
</section>` : ""}

<!-- INTEGRATED ACTION PLAN -->
${(result.actions||[]).length ? `
<section>
${secH("Integrated Action Plan — All Frameworks",C.FR)}
<p style="font-size:9.5px;color:#6B7280;margin-bottom:8px">Priority-ordered actions across all four frameworks. Each action includes framework tags and names the downstream system or process it feeds into.</p>
<table style="${tbl}">
<colgroup><col style="width:5%"><col style="width:23%"><col style="width:13%"><col style="width:14%"><col style="width:45%"></colgroup>
<thead><tr style="background:${C.navy}">
  <th style="${thS()}">#</th>
  <th style="${thS()}">Action + Frameworks</th>
  <th style="${thS()}">Owner</th>
  <th style="${thS()}">Timeline</th>
  <th style="${thS()}">What to Do / Triggers</th>
</tr></thead>
<tbody>
${[...result.actions].sort((a,b)=>a.priority-b.priority).map((a,i)=>`<tr style="background:${i%2===0?"#fff":"#F9FAFB"}">
  <td style="${tdS};text-align:center;font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:13px;color:${C.FR}">${esc(a.priority)}</td>
  <td style="${tdS}"><div style="font-weight:700;font-size:11px;color:#1F2A44;margin-bottom:3px">${esc(a.action)}</div><div>${(a.fws||[]).map(fwTag).join("")}</div></td>
  <td style="${tdS};font-size:10px;color:#6B7280">${esc(a.owner)}</td>
  <td style="${tdS};font-weight:700;font-size:10px;color:#3B82F6">${esc(a.timeline)}</td>
  <td style="${tdS};font-size:10.5px;color:#374151">${esc(a.detail)}</td>
</tr>`).join("")}
</tbody>
</table>
</section>` : ""}

<!-- SOURCES -->
${(result.sources_searched||[]).length?`<div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:4px;align-items:center"><span style="font-size:8px;color:#94A3B8;font-family:'IBM Plex Mono',monospace;margin-right:4px">SOURCES SEARCHED:</span>${result.sources_searched.slice(0,8).map(s=>`<span style="font-size:8px;background:#F1F5F9;color:#475569;border-radius:3px;padding:1px 6px;font-family:'IBM Plex Mono',monospace">${esc(s)}</span>`).join("")}</div>`:""}

<!-- FOOTER -->
<div style="margin-top:40px;padding:16px 0;border-top:1px solid #E2E8F0">
  <p style="font-size:9.5px;color:#94A3B8;line-height:1.5;text-align:center">Generated by NPD IMS Compliance Engine · ${today}</p>
</div>

<!-- DISCLAIMER -->
<div style="margin-top:12px;padding:12px 0;border-top:1px solid #E2E8F0">
  <p style="font-size:8.5px;color:#94A3B8;line-height:1.6;text-align:center">SCREENING DOCUMENT DISCLAIMER: This report is a point-in-time screening document intended to identify compliance flags and IMS system gaps to inform NPD decision-making. It does not constitute legal advice, a formal EMS Aspects &amp; Impacts Register, a Risks &amp; Opportunities Register, a QMS Control Plan, or a HIRA under ISO 45001:2018. All findings must be verified with qualified regulatory counsel, your EHS team, and your Quality Manager before design freeze and market entry. ISO 14001:2026 published April 2026 — transition deadline May 2029. ISO 9001:2026 expected September 2026. ISO 45001:2018 is the current standard. Regulatory requirements change frequently.<br>No data entered into this tool is stored or used for model training.</p>
</div>

</div><!-- /body -->
</div><!-- /wrap -->
</body>
</html>`;
}

/* ── Export helpers ──────────────────────────────────────────────────────── */
function exportPDF(html) {
  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const w    = window.open(url, "_blank");
  if (!w || w.closed || typeof w.closed === "undefined") {
    // Popup blocked — fall back to a download.
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    const blob2 = new Blob([html], { type: "text/html" });
    a.href = URL.createObjectURL(blob2);
    a.download = "IMS_Compliance_Report.html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    alert("Pop-ups are blocked. Downloaded the report as HTML — open it and use Ctrl/Cmd+P to print to PDF.");
    return;
  }
  // Give fonts and layout time to settle, then trigger print.
  const printWhenReady = () => {
    try { w.focus(); w.print(); } catch { /* ignore */ }
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  if (w.document.readyState === "complete") {
    setTimeout(printWhenReady, 500);
  } else {
    w.addEventListener?.("load", () => setTimeout(printWhenReady, 500));
    setTimeout(printWhenReady, 1500); // fallback
  }
}
function exportCSV(result) {
  const rows = [["NPD IMS Compliance Report"],["Product:",result.productName||""],["Category:",result.category||""],["Overall Risk:",(result.overall_risk||"").toUpperCase()],[]];
  rows.push(["IMS FINDINGS","","","",""]);
  rows.push(["Finding","Severity","Framework","Clause","Action"]);
  (result.ims_findings||[]).forEach(f=>rows.push([f.finding||"",(f.severity||"").toUpperCase(),f.framework||"",f.clause_ref||"",f.action_required||""]));
  rows.push([]);
  rows.push(["ACTIONS","","","",""]);
  rows.push(["#","Action","Owner","Timeline","Detail"]);
  (result.actions||[]).forEach(a=>rows.push([a.priority,a.action||"",a.owner||"",a.timeline||"",a.detail||""]));
  const csv = rows.map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = `IMS_Report_${(result.productName||"Untitled").replace(/\s+/g,"_")}.csv`;
  a.click();
}
function exportDoc(result, html) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([html],{type:"application/msword"}));
  a.download = `IMS_Report_${(result.productName||"Untitled").replace(/\s+/g,"_")}.doc`;
  a.click();
}

/* ── Collapsible ─────────────────────────────────────────────────────────── */
function Collapsible({title,count,accentColor=C.coral,defaultOpen=true,children}) {
  const [open,setOpen] = useState(defaultOpen);
  return (
    <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",marginBottom:8}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:C.sandL,border:"none",cursor:"pointer",textAlign:"left"}}>
        <span style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:10,color:C.navy,letterSpacing:"0.05em"}}>{title}</span>
          {count!==undefined&&<span style={{background:accentColor,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:9,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>{count}</span>}
        </span>
        <span style={{color:C.slateL,fontSize:14,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
      </button>
      {open&&<div style={{padding:12,background:"#fff"}}>{children}</div>}
    </div>
  );
}

/* ══ MAIN APP ════════════════════════════════════════════════════════════════ */
export default function App() {
  const [stage,setStage]       = useState("brief");
  const [loading,setLoading]   = useState(false);
  const [loadMsg,setLoadMsg]   = useState("");
  const [error,setError]       = useState(null);
  const [result,setResult]     = useState(null);
  const [htmlReport,setHtml]   = useState(null);
  const [viewMode,setViewMode] = useState("report");

  const [productName,setProductName] = useState("");
  const [category,setCategory]       = useState("");
  const [description,setDesc]        = useState("");
  const [countries,setCountries]     = useState([]);
  const [materials,setMaterials]     = useState("");
  const [notes,setNotes]             = useState("");
  const [files,setFiles]             = useState([]);
  const [ctrySearch,setCtrySearch]   = useState("");
  const [dragging,setDragging]       = useState(false);

  const fileRef = useRef();
  const mainRef = useRef();
  const dragDepth = useRef(0);
  const abortRef = useRef(null);

  const filteredCtry = COUNTRIES.filter(c=>c.toLowerCase().includes(ctrySearch.toLowerCase()));
  const toggleCtry = c => {
    setCountries(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
    if (error) setError(null);
  };
  const toggleRegion = rg => {
    const rc = REGIONS[rg]||[];
    const allSel = rc.every(c=>countries.includes(c));
    setCountries(p=>allSel?p.filter(c=>!rc.includes(c)):[...new Set([...p,...rc])]);
  };

  // Reject files larger than ~3 MB so we stay under the 4 MB API body limit
  // even after base64-ish text extraction.
  const MAX_FILE_BYTES = 3 * 1024 * 1024;
  const addFiles = useCallback(incoming => {
    const arr = Array.from(incoming || []);
    const tooBig = arr.filter(f => f.size > MAX_FILE_BYTES).map(f => f.name);
    const ok = arr.filter(f => f.size <= MAX_FILE_BYTES);
    if (tooBig.length) setError(`Skipped (over 3 MB): ${tooBig.join(", ")}`);
    if (ok.length) setFiles(p => [...p, ...ok]);
  }, []);

  const handleDrop = useCallback(e => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    addFiles(e.dataTransfer?.files);
  }, [addFiles]);

  const handleDragEnter = e => {
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };
  const handleDragLeave = e => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const run = async () => {
    if (!category || countries.length === 0) {
      setError("Select a Product Category and at least one Target Market before running.");
      return;
    }
    setError(null); setLoading(true); setResult(null); setHtml(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setLoadMsg("📄 Reading uploaded documents...");
      const fileContents = await Promise.all(
        files.map(async f => ({ name: f.name, content: await extractText(f) }))
      );
      setLoadMsg(`🌐 Searching regulations for ${countries.length} market${countries.length===1?"":"s"}...`);
      await new Promise(r => setTimeout(r, 200));
      setLoadMsg("⚖️ Running IMS compliance analysis with live data...");

      // Call our secure API route — API key never leaves the server.
      const apiRes = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage, productName, category, description,
          targetCountries: countries, materials, notes, fileContents,
        }),
        signal: controller.signal,
      });

      if (!apiRes.ok) {
        let msg = `API error ${apiRes.status}`;
        try {
          const err = await apiRes.json();
          msg = err.error || err.detail || msg;
        } catch {
          const text = await apiRes.text().catch(() => "");
          if (text) msg = text.slice(0, 300);
        }
        throw new Error(msg);
      }

      const parsed = await apiRes.json();
      const html   = buildHTMLReport(parsed, stage);
      setResult(parsed); setHtml(html); setViewMode("report");
      setTimeout(() => mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      if (e?.name === "AbortError") {
        setError("Analysis cancelled.");
      } else {
        setError(`Analysis error: ${e.message}`);
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
      setLoadMsg("");
    }
  };

  const riskC = riskCol(result?.overall_risk);
  const catLabel = CATEGORIES.find(c=>c.id===category)?.label||"";

  return (
    <div style={{minHeight:"100vh",background:"#F0EDE8",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *{box-sizing:border-box}
        input,select,textarea{font-family:'DM Sans',sans-serif}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#E5E7EB}
        ::-webkit-scrollbar-thumb{background:#9CA3AF;border-radius:3px}
        .inp{width:100%;background:#fff;border:1.5px solid #E2E8F0;border-radius:7px;padding:9px 12px;color:#0D1520;font-size:13px;outline:none;transition:border-color 0.15s}
        .inp:focus{border-color:#E8512A}
        .ctry-row:hover{background:#F5F0E8!important}
        .ctry-row:focus-visible{outline:2px solid #E8512A;outline-offset:-2px}
        .run-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 22px rgba(232,81,42,0.35)!important}
        .exp-btn:hover{background:#253354!important}
        .stg-btn:hover{opacity:0.85}
        .tab-btn:hover{background:#EDE5D8!important}
        button:focus-visible,a:focus-visible{outline:2px solid #E8512A;outline-offset:2px}
        .form-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
        @media (max-width:1100px){
          .form-grid{grid-template-columns:1fr 1fr}
        }
        @media (max-width:720px){
          .form-grid{grid-template-columns:1fr}
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{background:C.navy,borderBottom:`3px solid ${C.coral}`,position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:1400,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,gap:16,flexWrap:"wrap"}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:13,color:C.white,letterSpacing:"0.04em",whiteSpace:"nowrap"}}>
            NPD IMS Compliance Engine
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:C.slate,letterSpacing:"0.1em",whiteSpace:"nowrap"}}>REG · EMS · QMS · OHS</div>
            <div style={{display:"flex",background:C.navyD,borderRadius:7,padding:3,gap:2,border:`1px solid ${C.navyL}`}}>
              {[["brief","📋 STAGE 1","Concept Pre-Screen"],["prototype","🔬 STAGE 2","BOM & Design Review"]].map(([k,label])=>(
                <button key={k} className="stg-btn" onClick={()=>{setStage(k);setResult(null);setError(null);}} style={{
                  padding:"6px 14px",borderRadius:5,border:"none",cursor:"pointer",
                  fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:9.5,letterSpacing:"0.05em",
                  transition:"all 0.15s",background:stage===k?C.coral:"transparent",color:stage===k?"#fff":C.slateL,
                }}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div style={{maxWidth:1400,margin:"0 auto",padding:"20px 24px 40px"}}>

        {/* ── INPUT CARD ── */}
        <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",marginBottom:20}}>
          <div style={{background:C.navy,padding:"14px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:C.coral,letterSpacing:"0.12em",marginBottom:2}}>
                {stage==="brief"?"STAGE 1 — CONCEPT PRE-SCREEN":"STAGE 2 — BOM & DESIGN REVIEW"}
              </div>
              <div style={{fontSize:12,color:C.slateXL,lineHeight:1.4}}>
                {stage==="brief"
                  ?"Upload a brief or fill in product details for a live IMS regulatory pre-screen across 75 markets — product, packaging, EMS, QMS & OHS."
                  :"Upload your BOM and design docs for a full IMS compliance review with chemical screening, ISO 14001/9001/45001 gap analysis, and testing plan."}
              </div>
            </div>
          </div>

          <div className="form-grid" style={{padding:"18px 20px"}}>

            {/* Col 1 */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={{display:"block",fontSize:10,fontFamily:"'IBM Plex Mono',monospace",color:C.slate,marginBottom:5,letterSpacing:"0.08em"}}>
                  {stage==="brief"?"UPLOAD BRIEF (PDF / DOCX / TXT)":"UPLOAD BOM & DESIGN DOCS"}
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload brief or supporting documents"
                  onDragOver={e=>{e.preventDefault()}}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={()=>fileRef.current?.click()}
                  onKeyDown={e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); fileRef.current?.click(); } }}
                  style={{border:`2px dashed ${dragging?C.coral:C.borderD}`,borderRadius:8,padding:"14px 12px",cursor:"pointer",textAlign:"center",background:dragging?C.coral+"08":C.sandL,transition:"all 0.15s"}}
                >
                  <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt,.md,.csv" style={{display:"none"}}
                    onChange={e=>{ addFiles(e.target.files); e.target.value=""; }} />
                  <div style={{fontSize:20,marginBottom:3}}>📎</div>
                  <div style={{fontSize:11,color:C.slate,lineHeight:1.4}}>
                    Drop files or <span style={{color:C.coral,fontWeight:700}}>browse</span>
                    <br/><span style={{fontSize:9,color:C.slateL}}>PDF · DOCX · TXT · MD · CSV — max 3 MB each</span>
                    <br/><span style={{fontSize:9,color:C.slateL,fontStyle:"italic"}}>PDFs are read as plain text — for best results upload DOCX or TXT</span>
                  </div>
                </div>
                {files.length>0&&(
                  <div style={{marginTop:5,display:"flex",flexWrap:"wrap",gap:3}}>
                    {files.map((f,i)=>(
                      <span key={i} style={{fontSize:9,background:C.sandD,color:C.slate,borderRadius:4,padding:"2px 7px",display:"flex",alignItems:"center",gap:4,fontFamily:"'IBM Plex Mono',monospace"}}>
                        📄 {f.name.length>18?f.name.slice(0,16)+"…":f.name}
                        <button onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.coral,cursor:"pointer",fontSize:10,padding:0}}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={{display:"block",fontSize:10,fontFamily:"'IBM Plex Mono',monospace",color:C.slate,marginBottom:5,letterSpacing:"0.08em"}}>PRODUCT NAME</label>
                <input className="inp" value={productName} onChange={e=>setProductName(e.target.value)} placeholder="e.g. Spark SP3 Sleeping Bag 850fp" />
              </div>
              <div>
                <label style={{display:"block",fontSize:10,fontFamily:"'IBM Plex Mono',monospace",color:C.slate,marginBottom:5,letterSpacing:"0.08em"}}>PRODUCT CATEGORY *</label>
                <select className="inp" value={category} onChange={e=>{setCategory(e.target.value); if(error) setError(null);}} style={{color:category?C.ink:C.slateL}}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Col 2 */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={{display:"block",fontSize:10,fontFamily:"'IBM Plex Mono',monospace",color:C.slate,marginBottom:5,letterSpacing:"0.08em"}}>PRODUCT DESCRIPTION</label>
                <textarea className="inp" value={description} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Key features, intended use, performance claims, target consumer..." style={{resize:"vertical",lineHeight:1.5}} />
              </div>
              <div>
                <label style={{display:"block",fontSize:10,fontFamily:"'IBM Plex Mono',monospace",color:C.slate,marginBottom:5,letterSpacing:"0.08em"}}>
                  {stage==="prototype"?"BILL OF MATERIALS (one per line)":"PLANNED MATERIALS (optional)"}
                </label>
                <textarea className="inp" value={materials} onChange={e=>setMaterials(e.target.value)} rows={4} placeholder={"e.g.\nNylon 6.6 face fabric\nGoose down 850fp\nYKK zippers\nTPU DWR coating"} style={{resize:"vertical",lineHeight:1.6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11}} />
              </div>
              <div>
                <label style={{display:"block",fontSize:10,fontFamily:"'IBM Plex Mono',monospace",color:C.slate,marginBottom:5,letterSpacing:"0.08em"}}>ADDITIONAL NOTES</label>
                <textarea className="inp" value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Certifications already planned, sustainability goals, known concerns..." style={{resize:"vertical",lineHeight:1.5,fontSize:12}} />
              </div>
            </div>

            {/* Col 3: Countries */}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
                <label style={{fontSize:10,fontFamily:"'IBM Plex Mono',monospace",color:C.slate,letterSpacing:"0.08em"}}>TARGET MARKETS * — <strong style={{color:C.coral}}>{countries.length}</strong> selected</label>
                <div style={{display:"flex",gap:3}}>
                  <button onClick={()=>setCountries([...COUNTRIES])} style={{fontSize:8.5,padding:"2px 7px",background:C.sandD,border:`1px solid ${C.border}`,borderRadius:3,color:C.slate,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>ALL</button>
                  <button onClick={()=>setCountries([])} style={{fontSize:8.5,padding:"2px 7px",background:C.sandD,border:`1px solid ${C.border}`,borderRadius:3,color:C.slate,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>CLEAR</button>
                </div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                {Object.keys(REGIONS).map(rg=>{
                  const sel=REGIONS[rg].every(c=>countries.includes(c));
                  return <button key={rg} onClick={()=>toggleRegion(rg)} style={{fontSize:8,padding:"2px 7px",borderRadius:3,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",background:sel?C.coral+"20":C.sandD,border:`1px solid ${sel?C.coral:C.border}`,color:sel?C.coral:C.slate,transition:"all 0.12s"}}>{rg}</button>;
                })}
              </div>
              <input className="inp" value={ctrySearch} onChange={e=>setCtrySearch(e.target.value)} placeholder="Search countries..." style={{fontSize:11}} />
              <div role="listbox" aria-multiselectable="true" aria-label="Target markets" style={{flex:1,minHeight:160,maxHeight:200,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:8}}>
                {filteredCtry.length === 0 ? (
                  <div style={{padding:"18px 12px",textAlign:"center",fontSize:11,color:C.slateL,fontFamily:"'IBM Plex Mono',monospace"}}>
                    No markets match &ldquo;{ctrySearch}&rdquo;
                  </div>
                ) : filteredCtry.map(c => {
                  const sel = countries.includes(c);
                  return (
                    <div key={c} className="ctry-row"
                      role="option"
                      aria-selected={sel}
                      tabIndex={0}
                      onClick={() => toggleCtry(c)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleCtry(c); } }}
                      style={{padding:"5px 10px",cursor:"pointer",fontSize:11.5,display:"flex",alignItems:"center",gap:7,borderBottom:`1px solid ${C.sandD}`,background:sel?C.sandD:"transparent",transition:"background 0.08s"}}>
                      <span aria-hidden="true" style={{width:13,height:13,border:`1.5px solid ${sel?C.coral:C.borderD}`,borderRadius:3,background:sel?C.coral:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",flexShrink:0}}>
                        {sel?"✓":""}
                      </span>
                      <span style={{color:sel?C.ink:C.slate}}>{c}</span>
                    </div>
                  );
                })}
              </div>
              {countries.length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                  {countries.slice(0,6).map(c=>(
                    <span key={c} onClick={()=>toggleCtry(c)} style={{fontSize:9,background:C.coral+"18",color:C.coral,border:`1px solid ${C.coral}30`,borderRadius:3,padding:"1px 6px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>{c} ×</span>
                  ))}
                  {countries.length>6&&<span style={{fontSize:9,color:C.slateL,padding:"1px 4px"}}>+{countries.length-6} more</span>}
                </div>
              )}

              {error&&<div role="alert" style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:6,padding:"8px 11px",fontSize:11.5,color:"#DC2626"}}>{error}</div>}

              <button
                className="run-btn"
                onClick={run}
                disabled={loading}
                aria-busy={loading}
                aria-label={loading ? "Analysing — please wait" : (stage==="brief" ? "Run IMS Pre-Screen" : "Run BOM Review")}
                style={{
                  width:"100%",padding:"12px",borderRadius:8,border:"none",cursor:loading?"not-allowed":"pointer",
                  background:loading?C.sandD:`linear-gradient(135deg,${C.coral},${C.coralL})`,
                  color:loading?C.slate:"#fff",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:11,
                  letterSpacing:"0.07em",transition:"all 0.18s",boxShadow:loading?"none":"0 3px 12px rgba(232,81,42,0.3)",
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
                }}
              >
                {loading?"⏳ ANALYSING…":(stage==="brief"?"📋 RUN IMS PRE-SCREEN":"🔬 RUN BOM REVIEW")}
              </button>
              {loading && (
                <button onClick={cancel} style={{padding:"6px 10px",background:"transparent",border:`1px solid ${C.borderD}`,borderRadius:6,color:C.slate,cursor:"pointer",fontSize:10,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.05em"}}>
                  ✕ CANCEL
                </button>
              )}
              <div style={{textAlign:"center",fontSize:8,color:C.slateL,fontFamily:"'IBM Plex Mono',monospace",lineHeight:1.6}}>
                🌐 LIVE WEB SEARCH · 75 JURISDICTIONS<br/>REG + ISO 14001:2026 + ISO 9001 + ISO 45001<br/>🔒 NO DATA STORED · NOT USED FOR TRAINING
              </div>
            </div>
          </div>
        </div>

        {/* ── RESULTS ── */}
        <div ref={mainRef}>
          {!result&&!loading&&(
            <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:"48px 40px",textAlign:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              <div style={{fontSize:36,marginBottom:14}} aria-hidden="true">📋</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:700,color:C.navy,marginBottom:8,letterSpacing:"0.08em"}}>READY TO SCREEN</div>
              <div style={{fontSize:13,color:C.slate,lineHeight:1.8,maxWidth:520,margin:"0 auto 24px"}}>
                Fill in the form above and click Run. The engine uses live web search to check current regulations and IMS system requirements across all 75 markets simultaneously.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,maxWidth:600,margin:"0 auto"}}>
                {[
                  {icon:"⚗️",t:"Chemical compliance",d:"REACH, RoHS, PFAS, Prop 65, restricted substances"},
                  {icon:"📦",t:"Packaging regulations",d:"EPR, plastic levies, Triman, recycled content mandates"},
                  {icon:"🌱",t:"ISO 14001:2026 EMS",d:"Aspects register, R&O, Cl.6.3 change management"},
                  {icon:"✅",t:"ISO 9001:2015 QMS",d:"Design controls, supplier qualification, ITP gaps"},
                  {icon:"🦺",t:"ISO 45001:2018 OHS",d:"Preliminary hazard identification, supplier HIRA"},
                  {icon:"🌐",t:"Live regulatory data",d:"Web search for current rules across all 75 jurisdictions"},
                ].map((card,i)=>(
                  <div key={i} style={{background:C.sandL,border:`1px solid ${C.sandD}`,borderRadius:8,padding:14,textAlign:"left"}}>
                    <div style={{fontSize:20,marginBottom:5}}>{card.icon}</div>
                    <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:3}}>{card.t}</div>
                    <div style={{fontSize:10,color:C.slate,lineHeight:1.5}}>{card.d}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading&&(
            <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:"60px 40px",textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="26" fill="none" stroke={C.sandD} strokeWidth="4"/>
                  <circle cx="30" cy="30" r="26" fill="none" stroke={C.coral} strokeWidth="4" strokeDasharray="41 123" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 30 30" to="360 30 30" dur="1s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              </div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:11.5,color:C.coral,marginBottom:6,letterSpacing:"0.1em"}}>
                {stage==="brief"?"RUNNING IMS PRE-SCREEN":"RUNNING BOM REVIEW"}
              </div>
              <div style={{fontSize:12,color:C.slate,lineHeight:2,fontFamily:"'IBM Plex Mono',monospace"}}>{loadMsg}</div>
              <div style={{marginTop:12,display:"flex",justifyContent:"center",gap:4,flexWrap:"wrap"}}>
                {countries.slice(0,12).map(c=><span key={c} style={{fontSize:8,background:C.sandL,border:`1px solid ${C.border}`,borderRadius:3,padding:"1px 5px",color:C.slate,fontFamily:"'IBM Plex Mono',monospace"}}>{c}</span>)}
                {countries.length>12&&<span style={{fontSize:9,color:C.slateL}}>+{countries.length-12}</span>}
              </div>
            </div>
          )}

          {result&&htmlReport&&!loading&&(
            <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              {/* Toolbar */}
              <div style={{background:C.navy,padding:"11px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:C.white}}>{result.productName||catLabel||"IMS Compliance Report"}</div>
                    <div style={{fontSize:9.5,color:C.slateL,fontFamily:"'IBM Plex Mono',monospace",display:"flex",alignItems:"center",gap:6}}>
                      {result.stage}
                      {result.overall_risk&&<><span>·</span><span style={{color:riskC}}>● {result.overall_risk.toUpperCase()} RISK</span></>}
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{display:"flex",background:C.navyD,borderRadius:6,padding:2,gap:1}}>
                    {[["report","📊 Report"],["html","</> HTML"]].map(([v,l])=>(
                      <button key={v} className="tab-btn" onClick={()=>setViewMode(v)} style={{padding:"5px 10px",borderRadius:4,border:"none",cursor:"pointer",fontSize:9.5,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,background:viewMode===v?C.coral:"transparent",color:viewMode===v?"#fff":C.slateL,transition:"all 0.12s"}}>{l}</button>
                    ))}
                  </div>
                  {[
                    {l:"PDF", i:"📄", fn:()=>exportPDF(htmlReport)},
                    {l:"CSV", i:"📊", fn:()=>exportCSV(result)},
                    {l:"DOC", i:"📝", fn:()=>exportDoc(result,htmlReport)},
                  ].map(({l,i,fn})=>(
                    <button key={l} className="exp-btn" onClick={fn} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${C.navyL}`,background:C.navyM,color:C.slateXL,cursor:"pointer",fontSize:9.5,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,display:"flex",alignItems:"center",gap:4,transition:"background 0.12s"}}>
                      {i} {l}
                    </button>
                  ))}
                  <button onClick={()=>setResult(null)} style={{padding:"5px 10px",background:"transparent",border:`1px solid ${C.navyL}`,borderRadius:6,color:C.slateL,cursor:"pointer",fontSize:9.5,fontFamily:"'IBM Plex Mono',monospace"}}>← New</button>
                </div>
              </div>

              {viewMode==="report"&&(
                <iframe srcDoc={htmlReport} style={{width:"100%",height:"82vh",border:"none",display:"block"}} title="IMS Compliance Report" sandbox="allow-same-origin" />
              )}
              {viewMode==="html"&&(
                <div style={{padding:16,background:C.navyD}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:C.coral,letterSpacing:"0.1em"}}>HTML SOURCE</span>
                    <button
                      onClick={async () => {
                        try {
                          if (!navigator.clipboard) throw new Error("Clipboard not available");
                          await navigator.clipboard.writeText(htmlReport);
                          setError(null);
                          alert("HTML copied to clipboard.");
                        } catch {
                          alert("Couldn't copy automatically — select the text below and copy manually (Ctrl/Cmd+C).");
                        }
                      }}
                      style={{padding:"4px 12px",background:C.coral,border:"none",borderRadius:5,color:"#fff",cursor:"pointer",fontSize:9.5,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}
                    >📋 COPY</button>
                  </div>
                  <pre style={{background:C.navyM,borderRadius:8,padding:14,overflowX:"auto",fontSize:9,color:C.slateXL,fontFamily:"'IBM Plex Mono',monospace",lineHeight:1.6,maxHeight:"75vh",overflowY:"auto"}}>
                    {htmlReport}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
