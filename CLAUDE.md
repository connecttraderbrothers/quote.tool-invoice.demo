# CLAUDE.md — OMEGA Business Tools

## Project Overview

**OMEGA** is a client-side Progressive Web App (PWA) for Trader Brothers Ltd that generates professional quotations and invoices with PDF export. It is a pure static web application — no build step, no backend, no package manager.

- **App title:** OMEGA – Professional Business Tools
- **Company:** Trader Brothers Ltd, Edinburgh
- **PWA short name:** TB Quotes

---

## Repository Structure

```
quote.tool-invoice.demo/
├── index.html           # Single HTML entry point; all four screens live here
├── navigation.js        # Screen switching logic (splash → dashboard → tools)
├── script.js            # Quotation tool: state, trade rates, item management
├── invoice.js           # Invoice tool: state, trade rates, item management
├── pdf_generator.js     # Quotation PDF generation via PDFShift API
├── invoice_pdfgen.js    # Invoice PDF generation via PDFShift API
├── styles.css           # Quotation/invoice screen styles
├── dashboard.css        # Dashboard screen styles
├── splash.css           # Splash screen & matrix animation styles
├── manifest.json        # PWA manifest
└── README.md            # Minimal stub
```

**No subdirectories.** All source is at the root level.

---

## Technology Stack

| Concern | Technology |
|---|---|
| Markup | HTML5 |
| Logic | Vanilla JavaScript (ES5 — `var`, no modules) |
| Styling | CSS3 (flexbox, grid, custom properties) |
| Animation | Canvas 2D API (matrix rain effect) |
| PDF export | PDFShift REST API |
| Persistence | Browser `localStorage` (counters only) |
| Distribution | Static file hosting (no server required) |

**No frameworks, no bundlers, no transpilation, no npm/node.**

---

## Application Architecture

### Screen Model

The app is a single HTML file with four mutually-exclusive `<div>` screens toggled via `display` style:

| Screen ID | Purpose | Controlled by |
|---|---|---|
| `#splashScreen` | Animated splash with matrix background | `navigation.js` |
| `#dashboardScreen` | Tool selection grid | `navigation.js` |
| `#quotationScreen` | Quotation form + item list | `script.js` / `navigation.js` |
| `#invoiceScreen` | Invoice form + item list | `invoice.js` / `navigation.js` |

Navigation flow: **Splash → Dashboard → Quotation Tool or Invoice Tool → Dashboard**

### Navigation Functions (navigation.js)

```
enterMatrix()        → Splash to Dashboard (with fade animation)
showDashboard()      → Any screen → Dashboard
showQuotationTool()  → Dashboard → Quotation screen
showInvoiceTool()    → Dashboard → Invoice screen
showSplash()         → Reset to Splash (utility)
```

### Global State Pattern

Both tools use module-level `var` globals — no encapsulation:

**Quotation tool (script.js):**
- `items[]` — array of line item objects
- `currentRateType` — `'hourly'` | `'daily'` | `'job'` | `'custom'`
- `estimateNumber` — auto-incremented, persisted to localStorage
- `editingIndex` — `-1` when adding, index when editing

**Invoice tool (invoice.js):**
- `invoiceItems[]` — array of line item objects
- `currentInvoiceRateType` — same type options as above
- `invoiceNumber` — auto-incremented, persisted to localStorage
- `editingInvoiceIndex` — same edit pattern

### Line Item Object Shape

```javascript
{
    category:    'Carpentry',       // string — key from categoryOrder
    description: 'Door installation',
    quantity:    2,
    unit:        'job',             // rate type used
    unitPrice:   150,               // numeric, GBP
    lineTotal:   300                // quantity × unitPrice
}
```

---

## Key Data: Trade Rates & Categories

Both `script.js` and `invoice.js` define identical rate tables (Edinburgh 2025 standard rates). **When updating rates, edit both files.**

`categoryOrder[]` defines display sort order. `tradeRates` / `invoiceTradeRates` map category → `{ hourly, daily, job }` prices in GBP.

Selected rates for reference:

| Category | Hourly | Daily | Job |
|---|---|---|---|
| Carpentry / Joinery | £32 | £240 | — |
| Electrical / Electricals | £45 | £320 | £200 |
| Plumbing | £45 | £300 | £200 |
| Gas work/Plumbing | £50 | £340 | £250 |
| Kitchen Fitting | £32 | £250 | £3,000 |
| Bathroom Fitting / Bathrooms | £32 | £250 | £2,200 |
| Materials | — | — | — |

`job: 0` means no standard job rate for that category; users enter a custom price.

---

## Financial Calculations

- **VAT rate:** 20% (hardcoded)
- **Default deposit:** 30% (user-adjustable per quote/invoice)
- **Subtotal** = sum of all `lineTotal` values
- **VAT amount** = subtotal × 0.20
- **Total** = subtotal + VAT
- **Deposit due** = total × (depositPercent / 100)
- **Invoice deductions** — applied after VAT (credits/discounts field in invoice tool)

---

## PDF Generation

Both `pdf_generator.js` and `invoice_pdfgen.js` follow the same pattern:

1. Collect all form field values and the items array
2. Sort items by `categoryOrder` index
3. Build a complete self-contained HTML string (`generateCompleteHTML()`)
4. POST to PDFShift API with the HTML payload
5. Receive binary PDF response
6. Trigger browser download via Blob URL

**PDFShift API key** is hardcoded at the top of each PDF generator file. This is intentional for the current deployment (client-side only app with no secrets infrastructure), but represents a known security trade-off.

---

## localStorage Keys

| Key | Purpose | Used in |
|---|---|---|
| `traderBrosEstimateCount` | Last used estimate number | `script.js` |
| `traderBrosInvoiceCount` | Last used invoice number | `invoice.js` |

Numbers are read on load, incremented by 1, and saved on PDF download. Format: zero-padded 4 digits (e.g. `#0042`).

---

## Company Configuration (Hardcoded)

All company details are embedded directly in the PDF generator files. To update:

| Detail | Location |
|---|---|
| Company name | `pdf_generator.js`, `invoice_pdfgen.js` |
| Address | `pdf_generator.js`, `invoice_pdfgen.js` |
| Phone | `pdf_generator.js`, `invoice_pdfgen.js` |
| Email | `pdf_generator.js`, `invoice_pdfgen.js` |
| Logo URL | `index.html`, `manifest.json` (GitHub raw image) |

---

## Development Workflow

### Running Locally

No install or build step needed. Serve the root directory with any static file server:

```bash
# Python (built-in)
python3 -m http.server 8000

# Node (if available)
npx http-server . -p 8000
```

Then open `http://localhost:8000` in a browser.

### Making Changes

1. Edit the relevant file(s) directly
2. Reload the browser — no compilation required
3. Test manually in browser (there are no automated tests)
4. Use browser DevTools console for debugging

### Testing

There is **no automated test suite**. Manual testing checklist:
- Splash → Dashboard transition renders correctly
- Quotation tool: add items, change rate types, preview, download PDF
- Invoice tool: add items, set payment terms/status, download PDF
- Counter increments and persists across page reloads
- PDF output renders correctly with correct totals

---

## Coding Conventions

- **ES5 only** — use `var`, function declarations, no arrow functions, no `const`/`let`, no template literals, no modules
- **Global functions** — all functions on `window` (implicit); no IIFE or modules
- **Inline event handlers** — `onclick="functionName()"` pattern used throughout HTML
- **String concatenation** — HTML is built with `+` concatenation, not template literals
- **No external JS libraries** — zero dependencies, everything native browser APIs
- **CSS naming** — BEM-style class names where applicable (`.tool-card`, `.tool-title`, etc.)
- **Dark theme** — primary color `#fbbf24` (amber), background `#1a1a1a` (near-black)

When adding features, follow ES5 patterns to stay consistent with existing code.

---

## Dashboard Tool Cards

Six cards are defined in `index.html`. Two are active:

| Tool | Status | Activates |
|---|---|---|
| Quotation Tool | Active | `showQuotationTool()` |
| Invoice Manager | Active | `showInvoiceTool()` |
| Job Scheduler | Coming Soon | — |
| Expense Tracker | Coming Soon | — |
| Inventory Manager | Coming Soon | — |
| Client Portal | Coming Soon | — |

Active cards have class `tool-card active`; coming-soon cards have class `tool-card coming-soon`.

---

## PWA Configuration

- **manifest.json** enables "Add to Home Screen" on mobile
- Icons hosted externally on GitHub (`connecttraderbrothers/omega.app.icon` repo)
- No service worker — offline mode not supported

---

## Known Limitations & Technical Debt

1. **Duplicate trade rate data** — `tradeRates` and `invoiceTradeRates` are identical objects in two files; changes must be made in both
2. **No data persistence** — all entered quote/invoice data is lost on page refresh; only the counter survives
3. **No input sanitization** — user input is injected directly into HTML strings sent to PDFShift; no XSS protection
4. **ES5 only** — limits modern syntax; consider migrating if codebase grows significantly
5. **Hardcoded API key** — PDFShift key is visible in source; acceptable for client-only app but should be proxied if moved to a shared/public environment
6. **External image dependency** — logos loaded from GitHub; broken if that repo changes

---

## Git Workflow

- Default development branch: `master`
- Feature/AI branches follow: `claude/<descriptor>-<session-id>` pattern
- Commit messages use imperative present tense (e.g., `Update invoice_pdfgen.js`)
- No CI/CD pipeline configured
