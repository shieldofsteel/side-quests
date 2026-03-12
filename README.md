# Side Quests — Professional Licenses & Certifications Database

> **1,419 professional licenses and certifications** across 20 categories, with an intelligent API and MCP server for AI agents.

🔗 **Website:** [side.jr.al](https://side.jr.al)  
🔗 **API:** [licenses-api.jr.al](https://licenses-api.jr.al)  
📖 **License:** MIT

![Side Quests](https://img.shields.io/badge/licenses-1%2C419-amber)
![Categories](https://img.shields.io/badge/categories-20-blue)
![API](https://img.shields.io/badge/API-live-green)
![MCP](https://img.shields.io/badge/MCP-enabled-purple)

---

## What Is This?

A comprehensive, searchable database of professional licenses and certifications available in the United States, with a focus on practical information: cost, timeframe, difficulty, online availability, and official URLs.

**Data sources:**
- DoD COOL (Credentialing Opportunities On-Line) — army, USMC, and Coast Guard credential databases
- Manual research and verification for 300+ hand-curated entries
- Community contributions welcome

## Features

### Website (`side.jr.al`)
- **Search** — full-text search across names, descriptions, tags
- **Filter** — by category, online availability, difficulty
- **Sort** — A-Z, easiest/hardest first, fastest/longest first
- **Cards** — clean card grid with difficulty pips, cost, time, online badge
- **Modal** — detailed view with requirements, fun facts, official links
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
| `online` | boolean | Only online-available certs |
| `difficulty` | integer | Exact difficulty (1-5) |
| `minDifficulty` | integer | Minimum difficulty |
| `maxDifficulty` | integer | Maximum difficulty |
| `maxCost` | integer | Maximum cost in dollars |
| `issuingBody` | string | Filter by issuing organization |
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
  tagline: string         // One-line description (max 80 chars)
  description: string     // 2-3 sentence description
  requirements: string[]  // 3-5 requirements
  cost: string            // Cost range (e.g., "$100 - $500")
  timeframe: string       // Time to obtain (e.g., "3 - 6 months")
  difficulty: number      // 1 (easiest) to 5 (hardest)
  issuingBody: string     // Organization that issues the cert
  region: string          // Geographic availability
  renewalInfo: string     // Renewal requirements
  funFact: string         // Interesting fact about the cert
  officialUrl: string     // Official website
  online: boolean         // Can be obtained fully online
  tags: string[]          // 3-5 searchable tags
}
```

## Categories

| Category | Count | Online % | Description |
|----------|-------|----------|-------------|
| Health & Medical | 476 | 78% | Medical board certifications, nursing, pharmacy |
| Construction & Building | 291 | 90% | ICC inspections, ACI concrete, NCCER trades |
| Online & Digital | 94 | 93% | Cloud, cybersecurity, web development |
| Education & Teaching | 91 | 75% | NBPTS board certs, teaching credentials |
| Aviation & Aerospace | 82 | 6% | FAA pilot, mechanic, dispatcher certs |
| Finance & Banking | 67 | 94% | CPA, CFA, financial planning |
| Skilled Trades | 65 | 60% | HVAC, welding, electrical, plumbing |
| Legal & Compliance | 40 | 85% | Paralegal, notary, compliance |
| Technology & IT | 34 | 59% | CompTIA, Cisco, AWS, cybersecurity |
| Government & Public Service | 32 | 75% | Government finance, intelligence, public works |
| Science & Lab | 28 | 93% | Laboratory, environmental, geospatial |
| Maritime & Diving | 26 | 8% | USCG licenses, PADI diving, sailing |
| Outdoor & Recreation | 20 | 45% | Hunting, fishing, forestry, wilderness |
| Emergency & First Response | 16 | 44% | EMT, paramedic, CPR, CERT |
| Food & Beverage | 15 | 93% | Food handler, sommelier, culinary |
| Sports & Fitness | 14 | 21% | Personal trainer, coaching, referee |
| Driving & CDL | 10 | 0% | CDL Class A/B, endorsements |
| Creative & Media | 8 | 50% | Adobe, photography, media production |
| Agriculture & Farming | 6 | 50% | Pesticide, organic, soil science |
| Firearms & Weapons | 4 | 0% | FFL, concealed carry, ATF |

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
4. Ensure `online` field accurately reflects whether the cert can be obtained fully online
5. Submit a PR with sources for any new data

## License

MIT - see [LICENSE](LICENSE) for details.

Built by [Shield of Steel](https://shieldofsteel.com).
