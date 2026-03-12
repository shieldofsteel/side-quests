// Lucide icons — imported as raw SVG strings via Vite ?raw
import plane from 'lucide-static/icons/plane.svg?raw'
import anchor from 'lucide-static/icons/anchor.svg?raw'
import treePine from 'lucide-static/icons/tree-pine.svg?raw'
import hammer from 'lucide-static/icons/hammer.svg?raw'
import utensils from 'lucide-static/icons/utensils.svg?raw'
import heartPulse from 'lucide-static/icons/heart-pulse.svg?raw'
import gavel from 'lucide-static/icons/gavel.svg?raw'
import radioTower from 'lucide-static/icons/radio-tower.svg?raw'
import mountain from 'lucide-static/icons/mountain.svg?raw'
import palette from 'lucide-static/icons/palette.svg?raw'
import truck from 'lucide-static/icons/truck.svg?raw'
import sprout from 'lucide-static/icons/sprout.svg?raw'
import crosshair from 'lucide-static/icons/crosshair.svg?raw'
import compass from 'lucide-static/icons/compass.svg?raw'
import search from 'lucide-static/icons/search.svg?raw'
import x from 'lucide-static/icons/x.svg?raw'
import externalLink from 'lucide-static/icons/external-link.svg?raw'
import github from 'lucide-static/icons/github.svg?raw'
import dollarSign from 'lucide-static/icons/dollar-sign.svg?raw'
import clock from 'lucide-static/icons/clock.svg?raw'
import lightbulb from 'lucide-static/icons/lightbulb.svg?raw'
import circleDot from 'lucide-static/icons/circle-dot.svg?raw'
import chevronLeft from 'lucide-static/icons/chevron-left.svg?raw'
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw'
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw'
import globe from 'lucide-static/icons/globe.svg?raw'
import banknote from 'lucide-static/icons/banknote.svg?raw'
import heartIcon from 'lucide-static/icons/heart.svg?raw'
import graduationCap from 'lucide-static/icons/graduation-cap.svg?raw'
import hardHat from 'lucide-static/icons/hard-hat.svg?raw'
import landmark from 'lucide-static/icons/landmark.svg?raw'
import flaskConical from 'lucide-static/icons/flask-conical.svg?raw'

export const icons = {
  // Category icons
  aviation: plane,
  maritime: anchor,
  outdoor: treePine,
  trades: hammer,
  food: utensils,
  emergency: heartPulse,
  legal: gavel,
  tech: radioTower,
  sports: mountain,
  creative: palette,
  driving: truck,
  agriculture: sprout,
  firearms: crosshair,

  online: globe,
  finance: banknote,
  health: heartIcon,
  education: graduationCap,
  construction: hardHat,
  government: landmark,
  science: flaskConical,

  // UI icons
  compass,
  search,
  x,
  externalLink,
  github,
  dollar: dollarSign,
  clock,
  lightbulb,
  dot: circleDot,
  chevronLeft,
  chevronRight,
  arrowUpDown,
}

// Render an icon with optional classes. Strips the outer width/height to let CSS control sizing.
export function icon(name, cls = '') {
  const svg = icons[name] || icons.compass
  // Replace width="24" height="24" so CSS controls size, add class
  const processed = svg
    .replace(/width="24"/, '')
    .replace(/height="24"/, '')
    .replace('<svg', `<svg class="${cls}"`)
  return processed
}
