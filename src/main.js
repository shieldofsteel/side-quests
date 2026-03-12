import './style.css'
import { licenses, categories } from './data/licenses.js'
import { icon } from './icons.js'

// --- State ---
let state = {
  category: 'all',
  search: '',
  sort: 'name',
  onlineOnly: false,
  modal: null,
  visibleCount: 60,
}

const app = document.getElementById('app')

// --- Difficulty labels & colors ---
const difficultyMeta = {
  1: { label: 'Easy', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  2: { label: 'Moderate', color: '#84cc16', bg: 'rgba(132,204,22,0.08)' },
  3: { label: 'Challenging', color: '#eab308', bg: 'rgba(234,179,8,0.08)' },
  4: { label: 'Hard', color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  5: { label: 'Expert', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
}

// --- Parse timeframe into rough weeks for sorting ---
function parseTimeframeWeeks(tf) {
  if (!tf) return 999
  const lower = tf.toLowerCase()
  // Extract the first number
  const match = lower.match(/([\d.]+)/)
  if (!match) return 999
  const num = parseFloat(match[1])

  if (lower.includes('day')) return num / 7
  if (lower.includes('week')) return num
  if (lower.includes('month')) return num * 4.3
  if (lower.includes('year')) return num * 52
  // Default: assume months
  return num * 4.3
}

// Online field is explicit on every entry — no guessing

// --- Filtering & Sorting ---
function getFiltered() {
  const q = state.search.toLowerCase().trim()
  let results = licenses.filter(l => {
    const catMatch = state.category === 'all' || l.category === state.category
    const onlineMatch = !state.onlineOnly || l.online
    if (!catMatch || !onlineMatch) return false
    if (!q) return true
    return (
      l.name.toLowerCase().includes(q) ||
      l.tagline.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.tags.some(t => t.toLowerCase().includes(q))
    )
  })

  results.sort((a, b) => {
    switch (state.sort) {
      case 'difficulty-asc': return a.difficulty - b.difficulty
      case 'difficulty-desc': return b.difficulty - a.difficulty
      case 'time-asc': return parseTimeframeWeeks(a.timeframe) - parseTimeframeWeeks(b.timeframe)
      case 'time-desc': return parseTimeframeWeeks(b.timeframe) - parseTimeframeWeeks(a.timeframe)
      case 'name': return a.name.localeCompare(b.name)
      default: return 0
    }
  })

  return results
}

// --- Category helpers ---
function getCatIcon(catId) {
  return catId
}
function getCatName(catId) {
  return categories.find(c => c.id === catId)?.name || catId
}

// --- Difficulty pips ---
function renderPips(level) {
  const meta = difficultyMeta[level] || difficultyMeta[3]
  let html = ''
  for (let i = 1; i <= 5; i++) {
    html += `<span class="pip ${i <= level ? 'pip-filled' : 'pip-empty'}" style="background-color:${i <= level ? meta.color : ''}"></span> `
  }
  return `<div class="flex items-center gap-1" title="${meta.label}">${html}<span class="text-xs ml-1" style="color:${meta.color}">${meta.label}</span></div>`
}

// --- Render Functions ---
function renderHeader() {
  return `
    <header class="sticky top-0 z-40 bg-stone-50/80 backdrop-blur-xl border-b border-stone-200/60">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2.5 group">
          ${icon('compass', 'w-6 h-6 text-amber-600')}
          <span class="font-display font-bold text-lg tracking-tight" style="font-family:var(--font-display)">sidequests</span>
        </a>
        <div class="flex items-center gap-3 text-sm text-stone-500">
          <span class="hidden sm:inline font-mono text-xs" style="font-family:var(--font-mono)">${licenses.length} quests</span>
          <a href="https://github.com/shieldofsteel/side-quests" target="_blank" rel="noopener" class="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800 transition-colors">
            ${icon('github', 'w-4 h-4')}
            <span class="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  `
}

function renderHero() {
  const filtered = getFiltered()
  const catCounts = {}
  licenses.forEach(l => { catCounts[l.category] = (catCounts[l.category] || 0) + 1 })
  const activeCats = Object.keys(catCounts).length

  return `
    <section class="pt-12 pb-6 sm:pt-20 sm:pb-10 px-4 sm:px-6">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-4xl sm:text-6xl font-bold tracking-tight mb-4" style="font-family:var(--font-display)">
          Life's got <span class="text-amber-600">side quests</span>
        </h1>
        <p class="text-stone-500 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
          Hundreds of real-world licenses, certifications, and skills you can unlock as an adult. No main quest required.
        </p>
        
        <div class="relative max-w-xl mx-auto">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">${icon('search', 'w-5 h-5')}</span>
          <input 
            type="text" 
            id="search-input"
            placeholder="Search quests... try 'pilot', 'welding', 'food'" 
            class="search-input w-full pl-12 pr-10 py-3.5 bg-white border border-stone-200 rounded-2xl text-base placeholder:text-stone-400"
          />
          <button id="clear-search" class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1 hidden">${icon('x', 'w-4 h-4')}</button>
        </div>

        <div id="stats-bar" class="flex items-center justify-center gap-6 mt-6 text-sm text-stone-500">
          <div class="flex items-center gap-1.5">
            <span class="font-mono font-medium text-stone-900" style="font-family:var(--font-mono)">${licenses.length}</span>
            <span>quests</span>
          </div>
          <div class="w-px h-4 bg-stone-200"></div>
          <div class="flex items-center gap-1.5">
            <span class="font-mono font-medium text-stone-900" style="font-family:var(--font-mono)">${activeCats}</span>
            <span>categories</span>
          </div>
          <div class="w-px h-4 bg-stone-200"></div>
          <div class="flex items-center gap-1.5">
            <span class="font-mono font-medium text-stone-900" style="font-family:var(--font-mono)" id="showing-count">${filtered.length}</span>
            <span>showing</span>
          </div>
        </div>
      </div>
    </section>
  `
}

function renderFilters() {
  const catCounts = {}
  const q = state.search.toLowerCase().trim()
  licenses.forEach(l => {
    if (q) {
      const matches = l.name.toLowerCase().includes(q) || l.tagline.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.tags.some(t => t.toLowerCase().includes(q))
      if (!matches) return
    }
    catCounts[l.category] = (catCounts[l.category] || 0) + 1
  })

  return `
    <div class="filter-bar sticky top-[57px] z-30 bg-stone-50/90 backdrop-blur-xl border-b border-stone-200/40 py-3">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex items-center gap-4">
          <div id="filter-pills" class="filter-pills flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
            <button data-cat="all" class="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${state.category === 'all' ? 'pill-active' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'}">
              All
            </button>
            ${categories
              .filter(c => catCounts[c.id] > 0 || !q)
              .map(c => `
                <button data-cat="${c.id}" class="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${state.category === c.id ? 'pill-active' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'}">
                  ${icon(getCatIcon(c.id), 'w-3.5 h-3.5')} ${c.name.split(' & ')[0]}${catCounts[c.id] ? ` <span class="text-xs opacity-60">${catCounts[c.id]}</span>` : ''}
                </button>
              `).join('')}
          </div>
          <label class="shrink-0 flex items-center gap-2 text-sm text-stone-600 cursor-pointer select-none">
            <input type="checkbox" id="online-toggle" class="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500" ${state.onlineOnly ? 'checked' : ''}>
            <span class="hidden sm:inline">Online only</span>
          </label>
          <select id="sort-select" class="shrink-0 text-sm bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-stone-600 cursor-pointer">
            <option value="name" ${state.sort === 'name' ? 'selected' : ''}>A-Z</option>
            <option value="difficulty-asc" ${state.sort === 'difficulty-asc' ? 'selected' : ''}>Easiest first</option>
            <option value="difficulty-desc" ${state.sort === 'difficulty-desc' ? 'selected' : ''}>Hardest first</option>
            <option value="time-asc" ${state.sort === 'time-asc' ? 'selected' : ''}>Fastest first</option>
            <option value="time-desc" ${state.sort === 'time-desc' ? 'selected' : ''}>Longest first</option>
          </select>
        </div>
      </div>
    </div>
  `
}

function renderCard(license) {
  const meta = difficultyMeta[license.difficulty] || difficultyMeta[3]
  return `
    <button data-id="${license.id}" class="quest-card bg-white rounded-2xl border border-stone-200/80 p-5 text-left cursor-pointer w-full group">
      <div class="flex items-start justify-between mb-3">
        <span class="text-amber-700/80">${icon(getCatIcon(license.category), 'w-6 h-6')}</span>
        <span class="text-xs font-medium px-2 py-0.5 rounded-full" style="background:${meta.bg};color:${meta.color}">${meta.label}</span>
      </div>
      <h3 class="font-semibold text-base mb-1 group-hover:text-amber-700 transition-colors" style="font-family:var(--font-display)">${license.name}</h3>
      <p class="text-sm text-stone-500 mb-4 line-clamp-2">${license.tagline}</p>
      <div class="flex items-center justify-between text-xs text-stone-400">
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1" title="Cost">${icon('dollar', 'w-3.5 h-3.5')} ${license.cost.split(' - ')[0]}</span>
          <span class="flex items-center gap-1" title="Time">${icon('clock', 'w-3.5 h-3.5')} ${license.timeframe.split(' - ')[0]}</span>
        </div>
        <div class="flex items-center gap-2">
          ${license.online ? '<span class="text-emerald-600 text-[10px] font-medium px-1.5 py-0.5 bg-emerald-50 rounded" title="Available online">online</span>' : ''}
          ${renderPips(license.difficulty)}
        </div>
      </div>
    </button>
  `
}

function renderGrid() {
  const filtered = getFiltered()
  const visible = filtered.slice(0, state.visibleCount)
  const hasMore = filtered.length > state.visibleCount

  if (filtered.length === 0) {
    return `
      <section id="grid-section" class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div class="text-center py-20">
          <span class="text-stone-300 flex justify-center">${icon('search', 'w-12 h-12')}</span>
          <h3 class="text-lg font-semibold text-stone-700 mb-2 mt-4" style="font-family:var(--font-display)">No quests found</h3>
          <p class="text-stone-500">Try a different search term or category</p>
        </div>
      </section>
    `
  }

  return `
    <section id="grid-section" class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${visible.map(l => renderCard(l)).join('')}
      </div>
      ${hasMore ? `
        <div class="text-center mt-8">
          <button id="load-more" class="px-6 py-2.5 bg-white border border-stone-200 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">
            Show more (${filtered.length - state.visibleCount} remaining)
          </button>
        </div>
      ` : ''}
    </section>
  `
}

function renderModal() {
  if (!state.modal) return ''
  const l = licenses.find(x => x.id === state.modal)
  if (!l) return ''
  const meta = difficultyMeta[l.difficulty] || difficultyMeta[3]

  return `
    <div class="modal-overlay active" id="modal-overlay">
      <div class="modal-content">
        <div class="p-6 sm:p-8">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-amber-700">${icon(getCatIcon(l.category), 'w-8 h-8')}</span>
              <div>
                <h2 class="text-xl font-bold" style="font-family:var(--font-display)">${l.name}</h2>
                <p class="text-sm text-stone-500">${getCatName(l.category)}</p>
              </div>
            </div>
            <button id="modal-close" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">${icon('x', 'w-5 h-5')}</button>
          </div>

          <p class="text-amber-700 font-medium mb-3" style="font-family:var(--font-display)">${l.tagline}</p>
          <p class="text-stone-600 leading-relaxed mb-6">${l.description}</p>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div class="bg-stone-50 rounded-xl p-3 text-center">
              <div class="text-xs text-stone-400 mb-1 flex items-center justify-center gap-1">${icon('dollar', 'w-3 h-3')} Cost</div>
              <div class="text-sm font-semibold text-stone-900">${l.cost}</div>
            </div>
            <div class="bg-stone-50 rounded-xl p-3 text-center">
              <div class="text-xs text-stone-400 mb-1 flex items-center justify-center gap-1">${icon('clock', 'w-3 h-3')} Time</div>
              <div class="text-sm font-semibold text-stone-900">${l.timeframe}</div>
            </div>
            <div class="bg-stone-50 rounded-xl p-3 text-center">
              <div class="text-xs text-stone-400 mb-1">Difficulty</div>
              <div class="text-sm font-semibold" style="color:${meta.color}">${meta.label}</div>
            </div>
            <div class="bg-stone-50 rounded-xl p-3 text-center">
              <div class="text-xs text-stone-400 mb-1">Region</div>
              <div class="text-sm font-semibold text-stone-900">${l.region}</div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-sm font-semibold text-stone-900 mb-2 uppercase tracking-wider" style="font-family:var(--font-display)">Requirements</h3>
            <ul class="space-y-1.5">
              ${l.requirements.map(r => `<li class="text-sm text-stone-600 flex items-start gap-2"><span class="text-amber-500 mt-1 shrink-0">${icon('dot', 'w-2.5 h-2.5')}</span>${r}</li>`).join('')}
            </ul>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span class="text-stone-400">Issued by:</span>
              <span class="text-stone-700 font-medium ml-1">${l.issuingBody}</span>
            </div>
            <div>
              <span class="text-stone-400">Renewal:</span>
              <span class="text-stone-700 font-medium ml-1">${l.renewalInfo}</span>
            </div>
          </div>

          <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
            <div class="flex items-start gap-2.5">
              <span class="text-amber-600 shrink-0 mt-0.5">${icon('lightbulb', 'w-4 h-4')}</span>
              <p class="text-sm text-amber-900">${l.funFact}</p>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex flex-wrap gap-1.5">
              ${l.tags.map(t => `<span class="tag-chip">${t}</span>`).join('')}
            </div>
            <a href="${l.officialUrl}" target="_blank" rel="noopener" class="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-full hover:bg-stone-800 transition-colors">
              Official site
              ${icon('externalLink', 'w-3.5 h-3.5')}
            </a>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderFooter() {
  return `
    <footer class="border-t border-stone-200 mt-16 py-8 px-4 sm:px-6">
      <div class="max-w-7xl mx-auto text-center text-sm text-stone-400">
        <p class="mb-2">Built for the curious. Not affiliated with any licensing body.</p>
        <p>Information is for reference only. Always verify with the official issuing organization.</p>
      </div>
    </footer>
  `
}

// --- Targeted Update Functions (no full re-render) ---
function updateGrid() {
  const gridSection = document.getElementById('grid-section')
  if (!gridSection) return fullRender()
  
  const scrollY = window.scrollY
  
  const tmp = document.createElement('div')
  tmp.innerHTML = renderGrid()
  const newSection = tmp.firstElementChild
  
  if (newSection) {
    gridSection.replaceWith(newSection)
  }

  // Update showing count
  const showingEl = document.getElementById('showing-count')
  if (showingEl) showingEl.textContent = getFiltered().length

  // Update clear button visibility
  const clearBtn = document.getElementById('clear-search')
  if (clearBtn) clearBtn.classList.toggle('hidden', !state.search)

  bindGridEvents()
  window.scrollTo(0, scrollY)
}

function updateFiltersAndGrid() {
  const filterPills = document.getElementById('filter-pills')
  const filterScroll = filterPills?.scrollLeft || 0

  const filterBar = document.querySelector('.filter-bar')
  if (filterBar) {
    const tmp = document.createElement('div')
    tmp.innerHTML = renderFilters()
    filterBar.replaceWith(tmp.firstElementChild)
  }
  
  const newPills = document.getElementById('filter-pills')
  if (newPills) newPills.scrollLeft = filterScroll

  bindFilterEvents()
  updateGrid()
}

// --- Full Render (initial only) ---
function fullRender() {
  app.innerHTML = renderHeader() + renderHero() + renderFilters() + renderGrid() + renderModal() + renderFooter()
  bindAllEvents()
}

// --- Event Binding ---
function bindSearchEvents() {
  const searchInput = document.getElementById('search-input')
  if (!searchInput) return

  searchInput.addEventListener('input', e => {
    state.search = e.target.value
    state.visibleCount = 60
    
    clearTimeout(searchInput._debounce)
    searchInput._debounce = setTimeout(() => {
      updateFiltersAndGrid()
    }, 150)
  })

  const clearBtn = document.getElementById('clear-search')
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.search = ''
      searchInput.value = ''
      clearBtn.classList.add('hidden')
      state.visibleCount = 60
      updateFiltersAndGrid()
      searchInput.focus()
    })
  }
}

function bindFilterEvents() {
  document.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.category === btn.dataset.cat) return
      state.category = btn.dataset.cat
      state.visibleCount = 60
      
      const pills = document.getElementById('filter-pills')
      const scrollPos = pills?.scrollLeft || 0
      
      document.querySelectorAll('[data-cat]').forEach(b => {
        if (b.dataset.cat === state.category) {
          b.className = b.className.replace(/bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/g, '')
          b.classList.add('pill-active')
        } else {
          b.classList.remove('pill-active')
          if (!b.className.includes('bg-white')) {
            b.className += ' bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }
        }
      })
      
      if (pills) pills.scrollLeft = scrollPos
      updateGrid()
    })
  })

  document.getElementById('sort-select')?.addEventListener('change', e => {
    state.sort = e.target.value
    updateGrid()
  })

  document.getElementById('online-toggle')?.addEventListener('change', e => {
    state.onlineOnly = e.target.checked
    updateGrid()
  })
}

function bindGridEvents() {
  document.querySelectorAll('[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      state.modal = card.dataset.id
      const existing = document.getElementById('modal-overlay')
      if (existing) existing.remove()
      document.body.insertAdjacentHTML('beforeend', renderModal())
      document.body.style.overflow = 'hidden'
      bindModalEvents()
    })
  })

  document.getElementById('load-more')?.addEventListener('click', () => {
    state.visibleCount += 60
    updateGrid()
  })
}

function bindModalEvents() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal)
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal()
  })
}

function bindAllEvents() {
  bindSearchEvents()
  bindFilterEvents()
  bindGridEvents()
  
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.modal) closeModal()
  })
}

function closeModal() {
  state.modal = null
  document.body.style.overflow = ''
  const overlay = document.getElementById('modal-overlay')
  if (overlay) overlay.remove()
}

// --- Init ---
fullRender()
