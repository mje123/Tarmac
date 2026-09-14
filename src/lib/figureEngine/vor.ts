/**
 * Deterministic VOR navigation figure — the first figure type in Tarmac's figure
 * pipeline (see src/lib/figures/types.ts for the FigureGenerator abstraction this
 * plugs into). Everything here is pure math: no AI call, no aviation fact is ever
 * invented by a model. The scenario IS the source of truth — the question text, the
 * correct answer, and the rendered SVG are all derived from the same VorScenario
 * object, so they can never contradict each other (see generateVorQuestions.mts,
 * which is the only caller that turns a scenario into an actual question row).
 *
 * Rule encoded here (matches concepts.ts's vor_radial_interpretation rule_summary):
 * centering the CDI with a FROM indication on a given selected course means the
 * aircraft is physically on that radial outbound from the station; a TO indication
 * means the aircraft is on the reciprocal (selectedCourse + 180) radial instead.
 */

export interface VorScenario {
  station: string
  /** OBS-selected course on the CDI, 0-359 in 10° steps. */
  selectedCourse: number
  toFrom: 'TO' | 'FROM'
  /** Aircraft's magnetic heading — cosmetic/plausibility only, not part of the answer. */
  aircraftHeading: number
  /** The radial the aircraft is actually on (bearing FROM the station to the aircraft)
   *  — derived from selectedCourse + toFrom, never generated independently. This is
   *  the correct answer to "which radial is the aircraft on?" */
  radialFromStation: number
}

const STATION_IDENTS = ['DAG', 'PXR', 'HKY', 'SJC', 'ABQ', 'TUL', 'BIL', 'FAR', 'GRB', 'MSN']

function rand(n: number): number {
  return Math.floor(Math.random() * n)
}

function roundTo10(n: number): number {
  return (Math.round(n / 10) * 10 + 360) % 360
}

export function generateVorScenario(): VorScenario {
  const station = STATION_IDENTS[rand(STATION_IDENTS.length)]
  const selectedCourse = roundTo10(rand(36) * 10)
  const toFrom: 'TO' | 'FROM' = rand(2) === 0 ? 'FROM' : 'TO'
  const radialFromStation = toFrom === 'FROM' ? selectedCourse : (selectedCourse + 180) % 360
  // Heading roughly aligned with the course of flight (inbound if TO, outbound if
  // FROM) with some realistic scatter — never used to derive the answer, only drawn.
  const flightCourse = toFrom === 'TO' ? scenarioReciprocal(radialFromStation) : radialFromStation
  const aircraftHeading = roundTo10((flightCourse + (rand(5) - 2) * 10 + 360) % 360)
  return { station, selectedCourse, toFrom, aircraftHeading, radialFromStation }
}

function scenarioReciprocal(deg: number): number {
  return (deg + 180) % 360
}

export interface VorAnswerOption {
  letter: 'A' | 'B' | 'C' | 'D'
  value: number
  isCorrect: boolean
}

/** Builds exactly 4 unique answer options — the correct radial plus the concept's
 *  own documented misconceptions (confusing selected course for the radial, flying
 *  the wrong reciprocal) wherever those differ from the correct value, padded out
 *  with plausible offsets if a collision leaves fewer than 4 unique candidates. */
export function vorAnswerOptions(scenario: VorScenario): VorAnswerOption[] {
  const correct = scenario.radialFromStation
  const reciprocal = scenarioReciprocal(correct)
  const pool = Array.from(new Set([correct, reciprocal, scenario.selectedCourse, scenario.aircraftHeading]))

  let offset = 30
  while (pool.length < 4) {
    const candidate = (correct + offset) % 360
    if (!pool.includes(candidate)) pool.push(candidate)
    offset += 30
  }
  const four = pool.slice(0, 4)
  for (let i = four.length - 1; i > 0; i--) {
    const j = rand(i + 1)
    ;[four[i], four[j]] = [four[j], four[i]]
  }
  const letters: VorAnswerOption['letter'][] = ['A', 'B', 'C', 'D']
  return four.map((value, i) => ({ letter: letters[i], value, isCorrect: value === correct }))
}

function polar(cx: number, cy: number, r: number, bearingDeg: number): { x: number; y: number } {
  const rad = (bearingDeg * Math.PI) / 180
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
}

/** Renders the compass-rose VOR diagram as a self-contained SVG string. The VOR
 *  ground station sits at the center (standard training-diagram convention); the
 *  aircraft is drawn at its true bearing from the station (radialFromStation) so a
 *  student who can read the diagram can derive the same answer the scenario encodes
 *  — the figure and the correct answer are mechanically the same computation. */
export function renderVorSvg(scenario: VorScenario): string {
  const cx = 220
  const cy = 220
  const compassR = 150
  const aircraft = polar(cx, cy, 120, scenario.radialFromStation)
  const radialFar = polar(cx, cy, compassR, scenario.radialFromStation)
  const acHeadingTip = polar(aircraft.x, aircraft.y, 22, scenario.aircraftHeading)

  const ticks: string[] = []
  for (let deg = 0; deg < 360; deg += 10) {
    const major = deg % 30 === 0
    const outer = polar(cx, cy, compassR, deg)
    const inner = polar(cx, cy, compassR - (major ? 14 : 7), deg)
    ticks.push(`<line x1="${inner.x.toFixed(1)}" y1="${inner.y.toFixed(1)}" x2="${outer.x.toFixed(1)}" y2="${outer.y.toFixed(1)}" stroke="#3E92CC" stroke-width="${major ? 2 : 1}" opacity="${major ? 0.8 : 0.4}" />`)
    if (major) {
      const label = polar(cx, cy, compassR - 30, deg)
      const text = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : String(deg).padStart(3, '0')
      ticks.push(`<text x="${label.x.toFixed(1)}" y="${label.y.toFixed(1)}" fill="#8FB8DC" font-size="12" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">${text}</text>`)
    }
  }

  return `<svg viewBox="0 0 440 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${vorAccessibilityDescription(scenario)}">
  <rect x="0" y="0" width="440" height="440" fill="#0A1B3D" />
  <circle cx="${cx}" cy="${cy}" r="${compassR}" fill="none" stroke="#3E92CC" stroke-width="2" opacity="0.5" />
  ${ticks.join('\n  ')}

  <!-- A radial and its reciprocal selected course are the same physical line through
       the station — drawing them as two separate lines was visually redundant (they
       always overlap exactly). One line serves both: solid where the aircraft/CDI
       needle points (toward radialFromStation), a lighter dashed continuation on the
       far side. -->
  <line x1="${cx}" y1="${cy}" x2="${radialFar.x.toFixed(1)}" y2="${radialFar.y.toFixed(1)}" stroke="#EF4444" stroke-width="3" />
  <line x1="${cx}" y1="${cy}" x2="${((radialFar.x - cx) * -1 + cx).toFixed(1)}" y2="${((radialFar.y - cy) * -1 + cy).toFixed(1)}" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.4" />
  <circle cx="${radialFar.x.toFixed(1)}" cy="${radialFar.y.toFixed(1)}" r="4" fill="#EF4444" />

  <!-- VOR station at center -->
  <circle cx="${cx}" cy="${cy}" r="10" fill="#0A1B3D" stroke="#FFFFFF" stroke-width="2" />
  <circle cx="${cx}" cy="${cy}" r="3" fill="#FFFFFF" />
  <text x="${cx}" y="${cy + 26}" fill="#FFFFFF" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">${scenario.station}</text>

  <!-- Aircraft, oriented to its heading -->
  <g transform="translate(${aircraft.x.toFixed(1)},${aircraft.y.toFixed(1)}) rotate(${scenario.aircraftHeading})">
    <path d="M 0,-14 L 8,10 L 0,5 L -8,10 Z" fill="#22C55E" stroke="#FFFFFF" stroke-width="1" />
  </g>
  <text x="${aircraft.x.toFixed(1)}" y="${(acHeadingTip.y - 10).toFixed(1)}" fill="#22C55E" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">A/C</text>

  <!-- CDI readout box -->
  <g transform="translate(20,370)">
    <rect x="0" y="0" width="180" height="55" rx="8" fill="#132C5E" stroke="#3E92CC" stroke-width="1" />
    <text x="12" y="22" fill="#8FB8DC" font-size="11" font-family="sans-serif">SELECTED COURSE</text>
    <text x="12" y="44" fill="#FFFFFF" font-size="20" font-weight="bold" font-family="sans-serif">${String(scenario.selectedCourse).padStart(3, '0')}°</text>
    <text x="130" y="33" fill="#FFB627" font-size="16" font-weight="bold" font-family="sans-serif">${scenario.toFrom}</text>
  </g>

  <!-- Legend -->
  <g transform="translate(240,385)" font-family="sans-serif" font-size="11">
    <line x1="0" y1="10" x2="20" y2="10" stroke="#EF4444" stroke-width="3" /><text x="26" y="14" fill="#8FB8DC">Radial / selected course line</text>
    <circle cx="10" cy="30" r="4" fill="#EF4444" /><text x="26" y="34" fill="#8FB8DC">Aircraft's position on that line</text>
  </g>
</svg>`
}

/** Alt-text/accessibility description — required per the figure accessibility rule
 *  (a figure is never just labeled "aviation figure"). Deliberately does NOT state
 *  the radial the aircraft is on, since that's the answer to the question. */
export function vorAccessibilityDescription(scenario: VorScenario): string {
  return `Training diagram of ${scenario.station} VOR. The CDI shows a selected course of ${String(scenario.selectedCourse).padStart(3, '0')} degrees with a ${scenario.toFrom} indication. The aircraft is shown on the compass rose flying a heading of ${String(scenario.aircraftHeading).padStart(3, '0')} degrees.`
}
