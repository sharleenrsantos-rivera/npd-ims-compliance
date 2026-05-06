# STS NPD IMS Compliance Engine

Sea to Summit NPD IMS Pre-Assessment Compliance Engine.

Covers: Regulatory (75 markets) + ISO 14001:2026 EMS + ISO 9001:2015 QMS + ISO 45001:2018 OHS

---

## Privacy & Data

- **No data is stored.** All analysis runs in real-time via the Anthropic API and is returned directly to your browser.
- **No training.** Data submitted through this tool is not used for model training.
- The API key is held server-side in Vercel environment variables and is never exposed to the browser.

---

## Deployment to Vercel

### 1. Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Vercel account](https://vercel.com)
- Anthropic API key with access to `claude-opus-4-5` and `web_search_20250305` beta

### 2. Add your logo

Replace the placeholder base64 strings in `pages/index.jsx`:

```js
const LOGO_WHITE = "data:image/png;base64,<YOUR_WHITE_LOGO_BASE64>";
const LOGO_BLACK = "data:image/png;base64,<YOUR_BLACK_LOGO_BASE64>";
```

To get the base64 strings, open your original `sts-compliance-final.jsx` and copy the `LOGO_WHITE` and `LOGO_BLACK` values.

### 3. Install dependencies

```bash
npm install
```

### 4. Set up local environment

```bash
cp .env.example .env.local
# Edit .env.local and set ANTHROPIC_API_KEY=your_key_here
```

### 5. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 6. Deploy to Vercel

**Option A — Vercel CLI:**
```bash
npm install -g vercel
vercel
# Follow the prompts
# When asked for environment variables, set ANTHROPIC_API_KEY
```

**Option B — Vercel Dashboard:**
1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your API key
5. Click Deploy

### 7. Verify the deployment

After deployment, test with:
- Product: `Spark SP3 Sleeping Bag`
- Category: `Sleeping Bags & Quilts`
- Markets: `Australia`, `Germany`, `USA`
- Click `RUN IMS PRE-SCREEN`

Expected: Full IMS report with Executive Summary, IMS Dashboard, Findings Register, all four ISO sections, Market Readiness, and Action Plan.

---

## Project Structure

```
sts-compliance-app/
├── pages/
│   ├── _app.jsx          # Next.js app wrapper
│   ├── index.jsx         # Main app + HTML report builder
│   └── api/
│       └── analyse.js    # Serverless API route (holds API key)
├── styles/
│   └── globals.css
├── public/               # Static assets
├── package.json
├── next.config.js
├── .env.example          # Template — copy to .env.local
├── .gitignore
└── README.md
```

---

## Report Structure

The HTML report output matches the IMS PDF sample:

| Section | Content |
|---------|---------|
| Cover | Logo, product name, 4 framework badges, metadata grid |
| Executive Summary | 3-4 sentence cross-framework narrative |
| IMS Dashboard | 4-panel risk summary (REG / EMS / QMS / OHS) |
| IMS Findings Register | Consolidated single table, all frameworks |
| Section 1 | Regulatory compliance flags (product + packaging) |
| Packaging Landscape | EPR, labelling, recycled content, plastic levies |
| Section 2 | ISO 14001:2026 — Aspects, R&O Register, Change Flags |
| Section 3 | ISO 9001:2015 — QMS control gaps |
| Section 4 | ISO 45001:2018 — Preliminary hazard identification |
| Market Readiness | 4-dimension grid (REG/EMS/QMS/OHS per market) |
| Action Plan | Priority-ordered, framework-tagged actions |
| Disclaimer | Screening document disclaimer + privacy notice |

---

## IT Acceptable Use

This tool accesses the Anthropic API. Use is subject to the Sea to Summit IT Acceptable Use & Cybersecurity Policy. Do not enter personal data, customer data, or confidential supplier information beyond what is required for the NPD compliance assessment. API calls are logged by Anthropic in accordance with their data processing agreement.
