# Side Quests — Professional Licenses & Certifications Database

> **2,551 professional licenses and certifications** across 20 categories, 100% verified for exam delivery method. Includes an intelligent API and MCP server for AI agents.

🔗 **Website:** [side.jr.al](https://side.jr.al)  
🔗 **API:** [licenses-api.jr.al](https://licenses-api.jr.al)  
📖 **License:** MIT

![Side Quests](https://img.shields.io/badge/certifications-2%2C551-amber)
![Categories](https://img.shields.io/badge/categories-20-blue)
![Verified](https://img.shields.io/badge/verified-100%25-green)
![API](https://img.shields.io/badge/API-live-green)
![MCP](https://img.shields.io/badge/MCP-enabled-purple)

---

## What Is This?

A comprehensive, searchable database of professional licenses and certifications available in the United States, with verified exam delivery information: whether it's fully online, exam-online-only, or requires in-person attendance.

**Data sources:**
- DoD COOL (Credentialing Opportunities On-Line) — army, USMC, and Coast Guard credential databases (2,213 entries)
- Manual research and verification for 338 hand-curated entries
- Issuer-level verification of exam delivery methods for all 675 issuing bodies

## Verification Process

Every entry has been verified at the **issuing body level** for exam delivery method:

- **675 unique issuing bodies** were researched
- **8 AI research agents** ran in parallel, each verifying ~85 issuers
- Results were mapped back to all 2,551 individual certifications
- Key distinctions: "exam is online" ≠ "entire certification is online"
  - e.g., Pearson VUE center-only → `online: false`
  - e.g., Pearson VUE with OnVUE remote → `examOnline: true`
  - e.g., Cert requires clinical hours → `online: false` regardless of exam format

## Features

### Website (`side.jr.al`)
- **Search** — full-text search across names, descriptions, tags
- **Filter** — by category, online availability, difficulty
- **Sort** — A-Z, easiest/hardest first, fastest/longest first
- **Cards** — clean card grid with difficulty pips, cost, time, online/exam-online badges
- **Modal** — detailed view with exam delivery method, verification status, requirements, fun facts
- **Mobile** — fully responsive, works on any device

### API (`licenses-api.jr.al`)
- **Search & filter** — `GET /licenses?q=cybersecurity&online=true&maxCost=500`
- **Full details** — `GET /licenses/:id`
- **Related certs** — `GET /licenses/:id/related`
- **Path builder** — `GET /path?goal=cloud+engineer&budget=5000&onlineOnly=true`
- **Categories** — `GET /categories`
- **Statistics** — `GET /stats`
- **Random** — `GET /random`

### MCP Server (for AI agents)
- **Endpoint:** `POST /mcp` (JSON-RPC 2.0)
- **7 tools:** `search_certifications`, `get_certification`, `build_path`, `find_related`, `list_categories`, `get_stats`, `random_certification`

---

## Quick Start

### Run Locally

```bash
# Clone
git clone https://github.com/shieldofsteel/side-quests.git
cd side-quests

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Deploy

```bash
# Build
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist/ --project-name=side-quests
```

### API Development

```bash
cd api/

# Install
npm install

# Run locally
npx wrangler dev

# Deploy
npx wrangler deploy
```

---

## API Reference

### Search Certifications

```
GET /licenses?q=<query>&category=<cat>&online=<bool>&difficulty=<1-5>&maxCost=<num>&sort=<field>&limit=<n>&offset=<n>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `category` | string | Filter by category |
| `online` | boolean | Only fully-online certs (entire process) |
| `examOnline` | boolean | Certs where exam has remote proctoring option |
| `difficulty` | integer | Exact difficulty (1-5) |
| `minDifficulty` | integer | Minimum difficulty |
| `maxDifficulty` | integer | Maximum difficulty |
| `maxCost` | integer | Maximum cost in dollars |
| `issuingBody` | string | Filter by issuing organization |
| `examDelivery` | string | Filter by delivery: `online-proctored`, `testing-center`, `in-person-practical`, `online-self-paced`, `hybrid`, `varies` |
| `sort` | string | `name`, `difficulty-asc`, `difficulty-desc`, `cost-asc`, `cost-desc` |
| `limit` | integer | Results per page (max 100) |
| `offset` | integer | Pagination offset |

### Build Certification Path

```
GET /path?goal=<career>&budget=<num>&timeMonths=<num>&maxDifficulty=<1-5>&onlineOnly=<bool>&count=<n>
```

Returns an ordered sequence of certifications with progressive difficulty, optimized for the career goal and budget constraints.

### MCP Protocol

```bash
# List available tools
curl -X POST https://licenses-api.jr.al/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Search for certifications
curl -X POST https://licenses-api.jr.al/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_certifications","arguments":{"query":"cybersecurity","online":true,"limit":5}}}'

# Build a career path
curl -X POST https://licenses-api.jr.al/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"build_path","arguments":{"goal":"cloud security engineer","budget":5000,"onlineOnly":true}}}'
```

---

## Data Schema

Each entry follows this schema:

```typescript
interface License {
  id: string              // Unique kebab-case identifier
  name: string            // Full certification name
  category: string        // One of 20 categories
  tagline: string         // One-line description
  description: string     // 2-3 sentence description
  requirements: string[]  // Requirements list
  cost: string            // Cost range (e.g., "$100 - $500")
  timeframe: string       // Time to obtain (e.g., "3 - 6 months")
  difficulty: number      // 1 (weekend project) to 5 (years of commitment)
  issuingBody: string     // Organization that issues the cert
  region: string          // Geographic availability
  renewalInfo: string     // Renewal requirements
  funFact: string         // Interesting fact
  officialUrl: string     // Official website
  online: boolean         // TRUE only if entire process is fully online
  examOnline: boolean     // TRUE if exam has remote proctoring option
  examDelivery: string    // How the exam is delivered (see below)
  verified: boolean       // Has been verified at issuer level
  tags: string[]          // Searchable tags
}
```

### Exam Delivery Types

| Value | Meaning | Example |
|-------|---------|---------|
| `online-proctored` | Exam taken from home with live proctor | CompTIA via OnVUE, GIAC via ProctorU |
| `testing-center` | Must go to Pearson VUE / Prometric / PSI center | CPA exam, NCLEX, bar exam |
| `in-person-practical` | Hands-on skills assessment required | FAA checkride, welding test, CPR skills |
| `online-self-paced` | Unproctored online exam/assessment | Google via Coursera, HubSpot Academy |
| `hybrid` | Mix of online and in-person components | NBPTS (portfolio + exam), some ETA certs |
| `varies` | Differs by specific certification or jurisdiction | State licenses, FCC (depends on license class) |

### Understanding Online Fields

- **`online: true`** = You can complete the ENTIRE certification without going anywhere in person. No testing center, no clinical hours, no field work.
- **`examOnline: true`** = The exam itself can be taken remotely (e.g., OnVUE, PSI Bridge), but the certification may still require in-person clinical hours, supervised practice, or other requirements.
- **`online: false` + `examOnline: false`** = You must appear in person for the exam AND potentially other requirements.

## Categories

| Category | Count | Fully Online | Exam Online | Description |
|----------|-------|-------------|-------------|-------------|
| Health & Medical | 771 | 178 (23%) | 297 (39%) | Medical board certs, nursing, pharmacy |
| Online & Digital | 541 | 354 (65%) | 397 (73%) | Cloud, cybersecurity, web development |
| Construction | 381 | 132 (35%) | 253 (66%) | ICC inspections, ACI concrete, NCCER |
| Skilled Trades | 131 | 14 (11%) | 27 (21%) | HVAC, welding, electrical, plumbing |
| Maritime & Diving | 124 | 4 (3%) | 4 (3%) | USCG licenses, PADI diving, sailing |
| Aviation | 111 | 2 (2%) | 24 (22%) | FAA pilot, mechanic, dispatcher |
| Education | 103 | 54 (52%) | 73 (71%) | NBPTS board certs, teaching credentials |
| Finance & Banking | 75 | 51 (68%) | 55 (73%) | CPA, CFA, financial planning |
| Government | 72 | 51 (71%) | 54 (75%) | Government finance, intelligence |
| Technology | 70 | 24 (34%) | 61 (87%) | CompTIA, Cisco, AWS |
| Legal | 40 | 16 (40%) | 17 (43%) | Paralegal, notary, compliance |
| Science & Lab | 28 | 17 (61%) | 21 (75%) | Laboratory, environmental |
| Emergency | 22 | 2 (9%) | 2 (9%) | EMT, paramedic, CPR |
| Outdoor | 20 | 4 (20%) | 4 (20%) | Hunting, fishing, forestry |
| Food & Beverage | 15 | 3 (20%) | 3 (20%) | Food handler, sommelier |
| Driving & CDL | 15 | 1 (7%) | 1 (7%) | CDL Class A/B, endorsements |
| Sports & Fitness | 14 | 1 (7%) | 2 (14%) | Personal trainer, coaching |
| Creative & Media | 8 | 1 (13%) | 1 (13%) | Adobe, photography |
| Agriculture | 6 | 2 (33%) | 2 (33%) | Pesticide, organic, soil |
| Firearms | 4 | 0 (0%) | 0 (0%) | FFL, concealed carry, ATF |

**Totals:** 825 fully online (32%) · 1,223 exam online (48%) · 2,551 total

---

## Tech Stack

- **Frontend:** Vite + vanilla JS + Tailwind CSS v4
- **API:** Cloudflare Workers + KV
- **Hosting:** Cloudflare Pages (frontend) + Cloudflare Workers (API)
- **Icons:** Lucide (`lucide-static`)
- **Fonts:** Space Grotesk (headings) + Inter (body)

## Contributing

Contributions welcome! To add or correct a certification:

1. Fork this repo
2. Edit `src/data/licenses.js`
3. Follow the data schema above
4. Ensure `online` is TRUE only if the entire certification process is fully online
5. Set `examOnline` if the exam has a remote proctoring option
6. Set `examDelivery` to the appropriate delivery type
7. Submit a PR with sources for any new data

## License

MIT — see [LICENSE](LICENSE) for details.

Built by [Shield of Steel](https://shieldofsteel.com).
