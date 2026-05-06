/**
 * Builds a real .docx (Office Open XML) document from a compliance-engine result
 * and returns a Blob. Designed to be loaded only when the user clicks "Export DOC"
 * (the docx package is large; dynamic-import to keep initial bundle small).
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
} from "docx";

// Hex without the leading '#'.
const C = {
  navy: "1F2A44",
  coral: "E8512A",
  green: "059669",
  blue: "3B82F6",
  amber: "D97706",
  red: "DC2626",
  purple: "7C3AED",
  grey: "6B7280",
  greyD: "374151",
  greyL: "94A3B8",
  border: "E2E8F0",
};

const FW = { REG: "E8512A", EMS: "059669", QMS: "1F2A44", OHS: "D97706" };

const sevColor = (s) => ({
  critical: "DC2626", high: "F97316", medium: "F59E0B", low: "10B981",
}[String(s || "").toLowerCase()] || C.grey);

const stColor = (s) => ({
  pass: "10B981", compliant: "10B981",
  review: "F59E0B", action_needed: "F59E0B",
  fail: "DC2626",
  tbd: C.greyL, not_assessed: C.greyL,
}[s] || C.grey);

const stLabel = (s) => ({
  pass: "PASS", compliant: "COMPLIANT",
  review: "REVIEW", action_needed: "ACTION",
  fail: "FAIL", tbd: "TBD", not_assessed: "N/A",
}[s] || String(s || "").toUpperCase());

const t = (s) => String(s == null ? "" : s);

// ─── Building blocks ────────────────────────────────────────────────────────

const run = (text, opts = {}) => new TextRun({ text: t(text), ...opts });

const para = (children, opts = {}) => new Paragraph({
  spacing: { after: 80, ...opts.spacing },
  alignment: opts.alignment,
  border: opts.border,
  children: Array.isArray(children) ? children : [run(children, opts)],
});

const heading = (text, color = C.navy) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 320, after: 120 },
  border: { top: { color, space: 4, style: BorderStyle.SINGLE, size: 8 } },
  children: [run(text.toUpperCase(), { bold: true, color, size: 16 })],
});

const subHeading = (text, color = C.greyD) => new Paragraph({
  spacing: { before: 200, after: 80 },
  children: [run(text, { bold: true, color, size: 16 })],
});

const cell = ({ text = "", bold, color, italics, bg, width, size = 18, runs }) => new TableCell({
  width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  shading: bg ? { type: ShadingType.SOLID, fill: bg, color: "auto" } : undefined,
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
  children: [new Paragraph({
    spacing: { after: 0 },
    children: runs || [run(text, { bold, color, italics, size })],
  })],
});

// Build a rectangular table from header definitions + pre-built data rows.
const buildTable = (headers, dataRows, headerBg = C.navy) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      tableHeader: true,
      children: headers.map(h => cell({
        text: h.label, bold: true, color: "FFFFFF", size: 14, width: h.width, bg: headerBg,
      })),
    }),
    ...dataRows,
  ],
  borders: {
    top:              { style: BorderStyle.SINGLE, size: 4, color: C.border },
    bottom:           { style: BorderStyle.SINGLE, size: 4, color: C.border },
    left:             { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" },
    right:            { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: C.border },
    insideVertical:   { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" },
  },
});

// ─── Main builder ───────────────────────────────────────────────────────────

export async function buildDocxBlob(result, stage) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const gng = result.go_no_go || {};
  const pkg = result.packaging_landscape || {};
  const mr  = result.market_readiness || {};

  const children = [];

  // ─── Cover ───
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [run("NPD IMS PRE-ASSESSMENT SCREENING REPORT", {
      bold: true, color: C.coral, size: 14,
    })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [run(result.productName || "Product", {
      bold: true, color: C.navy, size: 44,
    })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [run(`${t(result.category)} · ${t(result.stage)}`, {
      color: C.grey, size: 22,
    })],
  }));

  // ─── Metadata grid ───
  const metaRows = [
    [
      ["STAGE",            t(result.stage || "Stage 1 — Concept Pre-Screen"), C.navy],
      ["OVERALL RISK",     String(result.overall_risk || "").toUpperCase(),    sevColor(result.overall_risk)],
      ["DATE PREPARED",    today,                                              C.navy],
      ["CLASSIFICATION",   "CONFIDENTIAL",                                     C.coral],
    ],
    [
      ["TARGET MARKETS",   Object.keys(mr).join(" · ") || "—",                 C.navy],
      ["PRODUCT CATEGORY", t(result.category),                                 C.navy],
      ["REVISION",         "Draft 1.0",                                        C.navy],
      ["PREPARED BY",      "NPD IMS Compliance Engine",                        C.navy],
    ],
  ];
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: metaRows.map(rowCells => new TableRow({
      children: rowCells.map(([label, value, color]) => new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [
          new Paragraph({
            spacing: { after: 40 },
            children: [run(label, { bold: true, color: C.greyL, size: 12 })],
          }),
          new Paragraph({
            spacing: { after: 0 },
            children: [run(value, { bold: true, color, size: 16 })],
          }),
        ],
      })),
    })),
    borders: {
      top:              { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" },
      bottom:           { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" },
      left:             { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" },
      right:            { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: C.border },
      insideVertical:   { style: BorderStyle.SINGLE, size: 4, color: C.border },
    },
  }));

  // ─── Executive Summary ───
  if (result.executive_summary) {
    children.push(heading("Executive Summary", C.coral));
    children.push(para(result.executive_summary, { spacing: { after: 120 } }));
  }

  // ─── IMS Findings Register ───
  if ((result.ims_findings || []).length) {
    children.push(heading("IMS Findings Register", C.navy));
    children.push(buildTable(
      [
        { label: "Finding",         width: 26 },
        { label: "Severity",        width: 10 },
        { label: "Framework",       width: 10 },
        { label: "Clause",          width: 14 },
        { label: "Action Required", width: 40 },
      ],
      result.ims_findings.map(f => new TableRow({
        children: [
          cell({ text: f.finding,    bold: true, color: C.navy }),
          cell({ text: String(f.severity || "").toUpperCase(), bold: true, color: sevColor(f.severity) }),
          cell({ text: f.framework,  bold: true, color: FW[f.framework] || C.grey }),
          cell({ text: f.clause_ref, color: C.grey }),
          cell({ text: f.action_required }),
        ],
      })),
    ));
  }

  // ─── Recommendation (Stage 2) ───
  if (gng.recommendation) {
    children.push(heading("Recommendation", C.coral));
    const recColor = gng.recommendation === "GO" ? "10B981"
                   : gng.recommendation === "NO GO" ? C.red : "F59E0B";
    children.push(para([
      run("GO / NO-GO: ", { bold: true, color: C.grey, size: 14 }),
      run(gng.recommendation, { bold: true, size: 22, color: recColor }),
    ]));
    if (gng.conditions?.length) {
      children.push(subHeading("Conditions", C.amber));
      gng.conditions.forEach(c => children.push(para(`• ${t(c)}`)));
    }
    if (gng.critical_path?.length) {
      children.push(subHeading("Critical Path", C.coral));
      gng.critical_path.forEach(c => children.push(para(`→ ${t(c)}`, { color: C.coral })));
    }
  }

  // ─── Section 1: Regulatory Flags ───
  const productFlags  = result.product_flags || [];
  const packagingFlags = result.packaging_flags || [];
  if (productFlags.length || packagingFlags.length) {
    children.push(heading("Section 1 — Regulatory Compliance Flags", C.coral));
  }
  if (productFlags.length) {
    children.push(subHeading(`Product Flags (${productFlags.length})`, C.coral));
    productFlags.forEach(f => {
      children.push(para([
        run(t(f.flag || f.title), { bold: true, size: 20, color: C.navy }),
        run(`  [${String(f.severity || "").toUpperCase()}]`, {
          bold: true, color: sevColor(f.severity), size: 16,
        }),
      ]));
      if (f.regulation)     children.push(para(t(f.regulation), { color: C.greyL, size: 14 }));
      if (f.markets?.length) children.push(para(`Markets: ${f.markets.join(", ")}`, { color: C.grey, size: 14 }));
      if (f.detail)          children.push(para(t(f.detail), { color: C.greyD }));
      if (f.action)          children.push(para(`→ ${t(f.action)}`, { bold: true, color: C.coral, size: 16 }));
      if (f.alternative)     children.push(para(`💡 Alternative: ${t(f.alternative)}`, { color: C.green, italics: true, size: 14 }));
    });
  }
  if (packagingFlags.length) {
    children.push(subHeading(`Packaging Flags (${packagingFlags.length})`, C.purple));
    packagingFlags.forEach(f => {
      children.push(para([
        run(t(f.flag || f.title), { bold: true, size: 20, color: C.navy }),
        run(`  [${String(f.severity || "").toUpperCase()}]`, {
          bold: true, color: sevColor(f.severity), size: 16,
        }),
      ]));
      if (f.regulation)     children.push(para(t(f.regulation), { color: C.greyL, size: 14 }));
      if (f.markets?.length) children.push(para(`Markets: ${f.markets.join(", ")}`, { color: C.grey, size: 14 }));
      if (f.detail)          children.push(para(t(f.detail), { color: C.greyD }));
      if (f.action)          children.push(para(`→ ${t(f.action)}`, { bold: true, color: C.purple, size: 16 }));
    });
  }

  // ─── Packaging Landscape ───
  const pkgCats = [
    { k: "epr",                   l: "EPR / Producer Responsibility" },
    { k: "labelling",             l: "Mandatory Labelling" },
    { k: "recycled_content",      l: "Recycled Content Requirements" },
    { k: "plastic_levies",        l: "Plastic Taxes & Levies" },
    { k: "material_restrictions", l: "Material Restrictions" },
  ].filter(r => pkg[r.k]?.length);
  if (pkgCats.length) {
    children.push(heading("Packaging Regulatory Landscape", C.purple));
    pkgCats.forEach(cat => {
      children.push(para(cat.l, { bold: true, size: 16, color: C.purple }));
      pkg[cat.k].forEach(item => children.push(para(`• ${t(item)}`, { color: C.greyD })));
    });
  }

  // ─── Section 2: EMS ───
  if ((result.ems_aspects || []).length) {
    children.push(heading("Section 2 — ISO 14001:2026 Environmental Pre-Screen", C.green));
    children.push(subHeading("2.1 Preliminary Aspects Identification (Cl.6.1.2)", C.green));
    children.push(buildTable(
      [
        { label: "Material/Activity", width: 18 },
        { label: "Aspect",            width: 18 },
        { label: "Impact",            width: 17 },
        { label: "Lifecycle",         width: 12 },
        { label: "Significance",      width: 10 },
        { label: "Obligation",        width: 25 },
      ],
      result.ems_aspects.map(a => new TableRow({
        children: [
          cell({ text: a.material,         bold: true, color: C.navy }),
          cell({ text: a.aspect }),
          cell({ text: a.impact,           color: C.grey }),
          cell({ text: a.lifecycle_stages, color: C.grey }),
          cell({ text: String(a.significance || "").toUpperCase(), bold: true, color: sevColor(a.significance) }),
          cell({ text: a.obligation }),
        ],
      })),
      C.green,
    ));
  }
  if ((result.ems_ro || []).length) {
    children.push(subHeading("2.2 Risks & Opportunities Register (Cl.6.1.4)", C.green));
    children.push(buildTable(
      [
        { label: "Type",        width: 10 },
        { label: "Description", width: 38 },
        { label: "Clause",      width: 12 },
        { label: "Action",      width: 40 },
      ],
      result.ems_ro.map(r => new TableRow({
        children: [
          cell({ text: r.type, bold: true, color: r.type === "Opportunity" ? C.green : C.coral }),
          cell({ text: r.description }),
          cell({ text: r.clause, color: C.grey }),
          cell({ text: r.action }),
        ],
      })),
      C.green,
    ));
  }
  if ((result.ems_change_flags || []).length) {
    children.push(subHeading("2.3 Change Management Flags (Cl.6.3)", C.green));
    children.push(buildTable(
      [
        { label: "Change",         width: 22 },
        { label: "Why It Triggers", width: 33 },
        { label: "Owner",          width: 13 },
        { label: "Requirement",    width: 32 },
      ],
      result.ems_change_flags.map(r => new TableRow({
        children: [
          cell({ text: r.change,      bold: true, color: C.navy }),
          cell({ text: r.why }),
          cell({ text: r.owner,       color: C.grey }),
          cell({ text: r.requirement, bold: true, color: C.green }),
        ],
      })),
      C.green,
    ));
  }

  // ─── Section 3: QMS ───
  if ((result.qms_gaps || []).length) {
    children.push(heading("Section 3 — ISO 9001:2015 Quality Management Gaps", C.navy));
    children.push(buildTable(
      [
        { label: "Control Area", width: 22 },
        { label: "Clause",       width: 10 },
        { label: "Gap",          width: 36 },
        { label: "Action",       width: 32 },
      ],
      result.qms_gaps.map(g => new TableRow({
        children: [
          cell({ text: g.area,   bold: true, color: C.navy }),
          cell({ text: g.clause, color: C.grey }),
          cell({ text: g.gap }),
          cell({ text: g.action, bold: true, color: C.navy }),
        ],
      })),
    ));
  }

  // ─── Section 4: OHS ───
  if ((result.ohs_hazards || []).length) {
    children.push(heading("Section 4 — ISO 45001:2018 Preliminary Hazard ID", C.amber));
    children.push(buildTable(
      [
        { label: "Source",         width: 20 },
        { label: "Type",           width: 17 },
        { label: "Exposed",        width: 14 },
        { label: "Classification", width: 24 },
        { label: "Control",        width: 25 },
      ],
      result.ohs_hazards.map(h => new TableRow({
        children: [
          cell({ text: h.source,         bold: true, color: C.navy }),
          cell({ text: h.hazard_type }),
          cell({ text: h.exposed,        color: C.grey }),
          cell({ text: h.classification }),
          cell({ text: h.control,        bold: true, color: C.amber }),
        ],
      })),
      C.amber,
    ));
  }

  // ─── Stage 2: BOM Compliance ───
  if ((result.bom_compliance || []).length) {
    children.push(heading("BOM Compliance Review", C.coral));
    result.bom_compliance.forEach(b => {
      children.push(para([
        run(t(b.material), { bold: true, size: 22, color: C.navy }),
        run(`  [${String(b.severity || "").toUpperCase()}]`, {
          bold: true, color: sevColor(b.severity), size: 16,
        }),
      ]));
      (b.concerns || []).forEach(c => children.push(para(`• ${t(c)}`)));
      if (b.recommendation) children.push(para(`→ ${t(b.recommendation)}`, { bold: true, color: C.coral }));
      if (b.alternative)    children.push(para(`💡 ${t(b.alternative)}`, { color: C.green, italics: true }));
    });
  }

  // ─── Stage 2: Product Checklist ───
  if ((result.product_checklist || []).length) {
    children.push(heading("Product Compliance Checklist", C.coral));
    children.push(buildTable(
      [
        { label: "Status",     width:  9 },
        { label: "Regulation", width: 22 },
        { label: "Area",       width: 10 },
        { label: "Markets",    width: 14 },
        { label: "Finding",    width: 25 },
        { label: "Action",     width: 20 },
      ],
      result.product_checklist.map(r => new TableRow({
        children: [
          cell({ text: stLabel(r.status),       bold: true, color: stColor(r.status) }),
          cell({ text: r.regulation,            bold: true, color: C.navy }),
          cell({ text: r.area,                  color: C.grey,  size: 14 }),
          cell({ text: (r.markets || []).join(", "), color: C.greyL, size: 14 }),
          cell({ text: r.finding }),
          cell({ text: r.action || "—",         bold: true }),
        ],
      })),
    ));
  }

  // ─── Stage 2: Packaging Checklist ───
  if ((result.packaging_checklist || []).length) {
    children.push(heading("Packaging Compliance Checklist", C.purple));
    children.push(buildTable(
      [
        { label: "Status",      width:  9 },
        { label: "Requirement", width: 20 },
        { label: "Type",        width:  9 },
        { label: "Markets",     width: 13 },
        { label: "Detail",      width: 25 },
        { label: "Action",      width: 14 },
        { label: "Deadline",    width: 10 },
      ],
      result.packaging_checklist.map(r => new TableRow({
        children: [
          cell({ text: stLabel(r.status),       bold: true, color: stColor(r.status) }),
          cell({ text: r.requirement,           bold: true, color: C.navy }),
          cell({ text: r.type,                  color: C.purple, size: 14 }),
          cell({ text: (r.markets || []).join(", "), color: C.greyL, size: 14 }),
          cell({ text: r.detail }),
          cell({ text: r.action || "—",         bold: true, color: C.purple }),
          cell({ text: r.deadline,              color: C.amber, size: 14 }),
        ],
      })),
      C.purple,
    ));
  }

  // ─── Market Readiness ───
  if (Object.keys(mr).length) {
    children.push(heading("Market Readiness — Four Dimensions", C.navy));
    const mrCell = (status) => cell({
      text: status === "READY" ? "✓ READY" : "✗ ACTION",
      bold: true,
      color: status === "READY" ? "10B981" : C.red,
    });
    children.push(buildTable(
      [
        { label: "Market",        width: 16 },
        { label: "REG Product",   width: 12 },
        { label: "REG Packaging", width: 12 },
        { label: "QMS",           width: 10 },
        { label: "OHS",           width: 10 },
        { label: "Notes",         width: 40 },
      ],
      Object.entries(mr).map(([market, data]) => new TableRow({
        children: [
          cell({ text: market, bold: true, color: C.navy }),
          mrCell(data.reg_product),
          mrCell(data.reg_packaging),
          mrCell(data.qms),
          mrCell(data.ohs),
          cell({ text: data.notes }),
        ],
      })),
    ));
  }

  // ─── Action Plan ───
  if ((result.actions || []).length) {
    children.push(heading("Integrated Action Plan — All Frameworks", C.coral));
    const sorted = [...result.actions].sort((a, b) => (a.priority || 999) - (b.priority || 999));
    children.push(buildTable(
      [
        { label: "#",        width:  5 },
        { label: "Action",   width: 30 },
        { label: "Owner",    width: 13 },
        { label: "Timeline", width: 14 },
        { label: "Detail",   width: 38 },
      ],
      sorted.map(a => new TableRow({
        children: [
          cell({ text: String(a.priority || ""), bold: true, color: C.coral }),
          cell({
            runs: [
              run(t(a.action), { bold: true, color: C.navy }),
              run(`  ${(a.fws || []).join(" ")}`, { color: C.greyL, size: 12 }),
            ],
          }),
          cell({ text: a.owner,    color: C.grey }),
          cell({ text: a.timeline, bold: true, color: C.blue }),
          cell({ text: a.detail }),
        ],
      })),
    ));
  }

  // ─── Sources ───
  if ((result.sources_searched || []).length) {
    children.push(subHeading("Sources Searched", C.greyL));
    children.push(para(result.sources_searched.slice(0, 12).join("  ·  "), {
      color: C.grey, size: 14,
    }));
  }

  // ─── Footer + disclaimer ───
  children.push(new Paragraph({
    spacing: { before: 480, after: 80 },
    border: { top: { color: C.border, space: 4, style: BorderStyle.SINGLE, size: 6 } },
    alignment: AlignmentType.CENTER,
    children: [run(`Generated by NPD IMS Compliance Engine · ${today}`, {
      color: C.greyL, size: 14, italics: true,
    })],
  }));
  children.push(new Paragraph({
    spacing: { after: 0 },
    alignment: AlignmentType.CENTER,
    children: [run(
      "SCREENING DOCUMENT DISCLAIMER: This report is a point-in-time screening document intended to identify compliance flags and IMS system gaps to inform NPD decision-making. It does not constitute legal advice, a formal EMS Aspects & Impacts Register, a Risks & Opportunities Register, a QMS Control Plan, or a HIRA under ISO 45001:2018. All findings must be verified with qualified regulatory counsel, your EHS team, and your Quality Manager before design freeze and market entry. Regulatory requirements change frequently. No data entered into this tool is stored or used for model training.",
      { color: C.greyL, size: 12, italics: true },
    )],
  }));

  const doc = new Document({
    creator:     "NPD IMS Compliance Engine",
    title:       `Compliance Report — ${result.productName || "Product"}`,
    description: "NPD IMS Pre-Assessment Compliance Report",
    styles: {
      default: {
        document: {
          run:       { font: "Calibri", size: 18 },
          paragraph: { spacing: { line: 280 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 in
        },
      },
      children,
    }],
  });

  return await Packer.toBlob(doc);
}
