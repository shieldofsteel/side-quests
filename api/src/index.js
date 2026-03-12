// Licenses Intelligence API
// Cloudflare Worker + KV — global edge, sub-50ms responses
// Endpoints: REST + MCP-compatible tool interface

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...headers },
  })
}

function err(message, status = 400) {
  return json({ error: message }, status)
}

// --- Data Loading (cached in-memory per isolate) ---
let _cache = {}

async function getData(kv, key) {
  if (_cache[key]) return _cache[key]
  const raw = await kv.get(key, 'text')
  if (!raw) return null
  const parsed = JSON.parse(raw)
  _cache[key] = parsed
  return parsed
}

// --- Search Engine ---
function search(licenses, index, query, filters = {}) {
  const q = (query || '').toLowerCase().trim()
  const tokens = q.split(/\s+/).filter(Boolean)

  let results = licenses

  // Category filter
  if (filters.category && filters.category !== 'all') {
    results = results.filter(l => l.category === filters.category)
  }

  // Online filter
  if (filters.online === true || filters.online === 'true') {
    results = results.filter(l => l.online === true)
  }

  // Difficulty filter
  if (filters.difficulty) {
    const d = parseInt(filters.difficulty)
    if (d >= 1 && d <= 5) {
      results = results.filter(l => l.difficulty === d)
    }
  }

  // Difficulty range
  if (filters.minDifficulty || filters.maxDifficulty) {
    const min = parseInt(filters.minDifficulty) || 1
    const max = parseInt(filters.maxDifficulty) || 5
    results = results.filter(l => l.difficulty >= min && l.difficulty <= max)
  }

  // Cost filter (max budget)
  if (filters.maxCost) {
    const budget = parseInt(filters.maxCost)
    results = results.filter(l => {
      const match = l.cost.match(/\$?([\d,]+)/)
      if (!match) return true
      return parseInt(match[1].replace(',', '')) <= budget
    })
  }

  // Issuing body filter
  if (filters.issuingBody) {
    const ib = filters.issuingBody.toLowerCase()
    results = results.filter(l => l.issuingBody.toLowerCase().includes(ib))
  }

  // Text search with relevance scoring
  if (tokens.length > 0) {
    const scored = results.map(l => {
      const idx = index.find(i => i.id === l.id)
      const text = idx ? idx.text : ''
      const nameL = l.name.toLowerCase()
      const descL = (l.description || '').toLowerCase()

      let score = 0
      for (const t of tokens) {
        if (nameL.includes(t)) score += 10
        if (nameL.startsWith(t)) score += 5
        if (text.includes(t)) score += 3
        if (descL.includes(t)) score += 1
        if (l.tags && l.tags.some(tag => tag.toLowerCase().includes(t))) score += 4
      }
      return { license: l, score }
    }).filter(s => s.score > 0)

    scored.sort((a, b) => b.score - a.score)
    results = scored.map(s => s.license)
  }

  // Sort
  const sort = filters.sort || 'relevance'
  if (sort === 'name') results.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort === 'difficulty-asc') results.sort((a, b) => a.difficulty - b.difficulty)
  else if (sort === 'difficulty-desc') results.sort((a, b) => b.difficulty - a.difficulty)
  else if (sort === 'cost-asc') results.sort((a, b) => parseCost(a.cost) - parseCost(b.cost))
  else if (sort === 'cost-desc') results.sort((a, b) => parseCost(b.cost) - parseCost(a.cost))

  return results
}

function parseCost(cost) {
  const match = cost.match(/\$?([\d,]+)/)
  return match ? parseInt(match[1].replace(',', '')) : 0
}

// --- Path Builder ---
function buildPath(licenses, params) {
  const { goal, budget, timeMonths, maxDifficulty, categories: cats, onlineOnly, count } = params
  const max = Math.min(parseInt(count) || 8, 20)
  const maxDiff = parseInt(maxDifficulty) || 5
  const budgetNum = parseInt(budget) || 999999
  const timeMax = parseInt(timeMonths) || 999

  let pool = [...licenses]

  // Filter by constraints
  if (onlineOnly === true || onlineOnly === 'true') {
    pool = pool.filter(l => l.online === true)
  }
  if (cats) {
    const catList = Array.isArray(cats) ? cats : cats.split(',')
    pool = pool.filter(l => catList.includes(l.category))
  }
  pool = pool.filter(l => l.difficulty <= maxDiff)

  // If goal provided, score by relevance
  if (goal) {
    const goalTokens = goal.toLowerCase().split(/\s+/)
    pool = pool.map(l => {
      let score = 0
      const text = [l.name, l.tagline, l.category, l.issuingBody, ...(l.tags || [])].join(' ').toLowerCase()
      for (const t of goalTokens) {
        if (text.includes(t)) score += 1
        if (l.name.toLowerCase().includes(t)) score += 3
        if (l.tags && l.tags.some(tag => tag.includes(t))) score += 2
      }
      return { ...l, _score: score }
    }).filter(l => l._score > 0)
    pool.sort((a, b) => b._score - a._score)
  }

  // Build progressive path (easiest first, then harder)
  pool.sort((a, b) => {
    // Primary: difficulty ascending (start easy)
    if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty
    // Secondary: relevance score descending
    return (b._score || 0) - (a._score || 0)
  })

  // Select diverse path (avoid too many from same issuer)
  const path = []
  const issuerCount = {}
  let totalCost = 0
  let totalMonths = 0

  for (const l of pool) {
    if (path.length >= max) break

    const cost = parseCost(l.cost)
    if (totalCost + cost > budgetNum) continue

    const months = parseTimeMonths(l.timeframe)
    if (totalMonths + months > timeMax) continue

    // Limit per issuer to keep diversity
    const issuer = l.issuingBody
    if ((issuerCount[issuer] || 0) >= 3) continue

    const { _score, ...clean } = l
    path.push({
      step: path.length + 1,
      ...clean,
      estimatedCostNum: cost,
      estimatedMonths: months,
    })

    issuerCount[issuer] = (issuerCount[issuer] || 0) + 1
    totalCost += cost
    totalMonths += months
  }

  return {
    goal: goal || 'General professional development',
    constraints: {
      budget: budgetNum < 999999 ? `$${budgetNum}` : 'unlimited',
      timeframe: timeMax < 999 ? `${timeMax} months` : 'unlimited',
      maxDifficulty: maxDiff,
      onlineOnly: onlineOnly === true || onlineOnly === 'true',
    },
    path,
    summary: {
      totalSteps: path.length,
      estimatedTotalCost: `$${totalCost.toLocaleString()}`,
      estimatedTotalMonths: totalMonths,
      categoriesCovered: [...new Set(path.map(p => p.category))],
      difficultyProgression: path.map(p => p.difficulty),
    },
  }
}

function parseTimeMonths(tf) {
  if (!tf) return 3
  const lower = tf.toLowerCase()
  const match = lower.match(/([\d.]+)/)
  if (!match) return 3
  const num = parseFloat(match[1])
  if (lower.includes('week')) return Math.ceil(num / 4.3)
  if (lower.includes('day')) return 1
  if (lower.includes('year')) return num * 12
  return num // assume months
}

// --- Related Licenses ---
function findRelated(licenses, id, limit = 10) {
  const target = licenses.find(l => l.id === id)
  if (!target) return null

  const targetTags = new Set((target.tags || []).map(t => t.toLowerCase()))
  const targetCat = target.category
  const targetIssuer = target.issuingBody.toLowerCase()

  const scored = licenses
    .filter(l => l.id !== id)
    .map(l => {
      let score = 0
      // Same category
      if (l.category === targetCat) score += 3
      // Same issuer
      if (l.issuingBody.toLowerCase() === targetIssuer) score += 2
      // Overlapping tags
      const tags = (l.tags || []).map(t => t.toLowerCase())
      for (const t of tags) {
        if (targetTags.has(t)) score += 2
      }
      // Similar difficulty
      if (Math.abs(l.difficulty - target.difficulty) <= 1) score += 1
      return { license: l, score }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.license)

  return { target, related: scored }
}

// --- MCP Protocol Handler ---
const MCP_TOOLS = [
  {
    name: 'search_certifications',
    description: 'Search the certification database with filters. Returns matching certifications sorted by relevance.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "cloud security", "plumber", "FAA pilot")' },
        category: { type: 'string', description: 'Filter by category (e.g., tech, health, construction, aviation)' },
        online: { type: 'boolean', description: 'Only show certifications available fully online' },
        maxDifficulty: { type: 'integer', description: 'Maximum difficulty (1=easiest, 5=hardest)', minimum: 1, maximum: 5 },
        maxCost: { type: 'integer', description: 'Maximum cost in dollars' },
        limit: { type: 'integer', description: 'Number of results (default 10, max 50)', default: 10 },
      },
    },
  },
  {
    name: 'get_certification',
    description: 'Get full details of a specific certification by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Certification ID (e.g., "comptia-a-plus", "faa-private-pilot")' },
      },
      required: ['id'],
    },
  },
  {
    name: 'build_path',
    description: 'Generate a personalized certification path based on a career goal with progressive difficulty. Returns an ordered sequence of certifications.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'Career goal (e.g., "cybersecurity analyst", "construction manager", "data center technician")' },
        budget: { type: 'integer', description: 'Total budget in dollars' },
        timeMonths: { type: 'integer', description: 'Total time available in months' },
        maxDifficulty: { type: 'integer', description: 'Maximum difficulty level (1-5)', minimum: 1, maximum: 5 },
        onlineOnly: { type: 'boolean', description: 'Only include certifications available online' },
        categories: { type: 'string', description: 'Comma-separated category filter' },
        count: { type: 'integer', description: 'Number of steps in path (default 8, max 20)' },
      },
      required: ['goal'],
    },
  },
  {
    name: 'find_related',
    description: 'Find certifications related to a given one (same category, issuer, or tags).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Certification ID to find related items for' },
        limit: { type: 'integer', description: 'Number of related certifications (default 10)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_categories',
    description: 'List all certification categories with counts, online availability, and average difficulty.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_stats',
    description: 'Get database statistics: total certifications, categories, difficulty distribution, top issuers.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'random_certification',
    description: 'Get a random certification, optionally filtered by category or difficulty.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional category filter' },
        difficulty: { type: 'integer', description: 'Optional difficulty filter (1-5)' },
        online: { type: 'boolean', description: 'Only online certifications' },
      },
    },
  },
]

async function handleMcpRequest(request, env) {
  const body = await request.json()
  const { method, params, id } = body

  // MCP protocol methods
  if (method === 'initialize') {
    return json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'licenses-api', version: '1.0.0' },
        capabilities: { tools: {} },
      },
    })
  }

  if (method === 'tools/list') {
    return json({ jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } })
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params
    const licenses = await getData(env.LICENSES_KV, 'licenses')
    const index = await getData(env.LICENSES_KV, 'index')
    const categories = await getData(env.LICENSES_KV, 'categories')

    let result

    switch (name) {
      case 'search_certifications': {
        const limit = Math.min(parseInt(args.limit) || 10, 50)
        const results = search(licenses, index, args.query, args)
        result = {
          total: results.length,
          results: results.slice(0, limit),
        }
        break
      }
      case 'get_certification': {
        const license = licenses.find(l => l.id === args.id)
        result = license || { error: 'Certification not found' }
        break
      }
      case 'build_path': {
        result = buildPath(licenses, args)
        break
      }
      case 'find_related': {
        result = findRelated(licenses, args.id, args.limit) || { error: 'Certification not found' }
        break
      }
      case 'list_categories': {
        result = categories
        break
      }
      case 'get_stats': {
        const diffDist = {}
        const issuers = {}
        licenses.forEach(l => {
          diffDist[l.difficulty] = (diffDist[l.difficulty] || 0) + 1
          issuers[l.issuingBody] = (issuers[l.issuingBody] || 0) + 1
        })
        const topIssuers = Object.entries(issuers).sort((a, b) => b[1] - a[1]).slice(0, 15)
        result = {
          total: licenses.length,
          categories: Object.keys(categories).length,
          onlineAvailable: licenses.filter(l => l.online).length,
          difficultyDistribution: diffDist,
          topIssuers: Object.fromEntries(topIssuers),
        }
        break
      }
      case 'random_certification': {
        let pool = [...licenses]
        if (args.category) pool = pool.filter(l => l.category === args.category)
        if (args.difficulty) pool = pool.filter(l => l.difficulty === parseInt(args.difficulty))
        if (args.online) pool = pool.filter(l => l.online === true)
        result = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : { error: 'No matching certifications' }
        break
      }
      default:
        return json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown tool: ${name}` } })
    }

    return json({
      jsonrpc: '2.0',
      id,
      result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
    })
  }

  return json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } })
}

// --- REST Router ---
async function handleRest(url, request, env) {
  const path = url.pathname.replace(/\/+$/, '')
  const params = Object.fromEntries(url.searchParams)

  const licenses = await getData(env.LICENSES_KV, 'licenses')
  const index = await getData(env.LICENSES_KV, 'index')
  const categories = await getData(env.LICENSES_KV, 'categories')

  if (!licenses) return err('Data not loaded', 500)

  // GET / - API info
  if (path === '' || path === '/') {
    return json({
      name: 'Licenses Intelligence API',
      version: '1.0.0',
      description: 'Search, filter, and build certification paths from 1,400+ professional licenses and certifications.',
      total: licenses.length,
      categories: Object.keys(categories).length,
      endpoints: {
        'GET /licenses': 'Search and filter licenses (params: q, category, online, difficulty, maxCost, sort, limit, offset)',
        'GET /licenses/:id': 'Get license by ID',
        'GET /licenses/:id/related': 'Find related licenses',
        'GET /categories': 'List categories with stats',
        'GET /stats': 'Database statistics',
        'GET /random': 'Random license',
        'GET /path': 'Build certification path (params: goal, budget, timeMonths, maxDifficulty, onlineOnly, categories, count)',
        'POST /mcp': 'MCP protocol endpoint for AI agents',
      },
      mcp: {
        endpoint: '/mcp',
        tools: MCP_TOOLS.map(t => t.name),
      },
    })
  }

  // GET /licenses - Search & list
  if (path === '/licenses' && request.method === 'GET') {
    const limit = Math.min(parseInt(params.limit) || 20, 100)
    const offset = parseInt(params.offset) || 0
    const results = search(licenses, index, params.q, params)
    return json({
      total: results.length,
      limit,
      offset,
      results: results.slice(offset, offset + limit),
    })
  }

  // GET /licenses/:id
  const licenseMatch = path.match(/^\/licenses\/([^/]+)$/)
  if (licenseMatch && request.method === 'GET') {
    const license = licenses.find(l => l.id === licenseMatch[1])
    if (!license) return err('License not found', 404)
    return json(license)
  }

  // GET /licenses/:id/related
  const relatedMatch = path.match(/^\/licenses\/([^/]+)\/related$/)
  if (relatedMatch && request.method === 'GET') {
    const result = findRelated(licenses, relatedMatch[1], parseInt(params.limit) || 10)
    if (!result) return err('License not found', 404)
    return json(result)
  }

  // GET /categories
  if (path === '/categories') {
    return json(categories)
  }

  // GET /stats
  if (path === '/stats') {
    const diffDist = {}
    const issuers = {}
    const onlineCount = licenses.filter(l => l.online).length
    licenses.forEach(l => {
      diffDist[l.difficulty] = (diffDist[l.difficulty] || 0) + 1
      issuers[l.issuingBody] = (issuers[l.issuingBody] || 0) + 1
    })
    const topIssuers = Object.entries(issuers).sort((a, b) => b[1] - a[1]).slice(0, 20)
    return json({
      total: licenses.length,
      categories: Object.keys(categories).length,
      onlineAvailable: onlineCount,
      inPersonOnly: licenses.length - onlineCount,
      difficultyDistribution: diffDist,
      topIssuers: Object.fromEntries(topIssuers),
    })
  }

  // GET /random
  if (path === '/random') {
    let pool = [...licenses]
    if (params.category) pool = pool.filter(l => l.category === params.category)
    if (params.difficulty) pool = pool.filter(l => l.difficulty === parseInt(params.difficulty))
    if (params.online === 'true') pool = pool.filter(l => l.online === true)
    if (pool.length === 0) return err('No matching licenses')
    return json(pool[Math.floor(Math.random() * pool.length)])
  }

  // GET /path - Build certification path
  if (path === '/path') {
    const result = buildPath(licenses, params)
    return json(result)
  }

  return err('Not found', 404)
}

// --- Main Handler ---
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)

    try {
      // MCP endpoint
      if (url.pathname === '/mcp' && request.method === 'POST') {
        return handleMcpRequest(request, env)
      }

      // REST endpoints
      return handleRest(url, request, env)
    } catch (e) {
      return err(`Internal error: ${e.message}`, 500)
    }
  },
}
