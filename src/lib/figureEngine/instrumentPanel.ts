/**
 * Deterministic six-pack instrument-panel figure — second figure type in Tarmac's
 * figure pipeline (see types.ts). Pairs with the flight_instruments_pitot_static
 * concept (PPL, Flight Instruments). Same rule as vor.ts: every number on the panel
 * is computed from a locked InstrumentScenario, never invented by a model.
 *
 * Rule encoded here (matches concepts.ts's flight_instruments_pitot_static
 * rule_summary):
 * - Blocked PITOT tube (static system still open): the ASI behaves like an altimeter
 *   — indicated airspeed rises during a climb and falls during a descent, regardless
 *   of true airspeed. Altimeter and VSI are unaffected (they're static-only).
 * - Blocked STATIC port: altimeter freezes at the altitude it read at the moment of
 *   blockage, VSI freezes at zero, and the ASI becomes unreliable — all three
 *   simultaneously, since they share the static source. Attitude indicator, heading
 *   indicator, and turn coordinator are gyroscopic, not static-driven, and are
 *   unaffected by either fault — shown level/normal here on purpose, since noticing
 *   THAT is part of correctly diagnosing a pitot-static fault rather than a gyro one.
 */

export type InstrumentFault = 'blocked_pitot' | 'blocked_static'
export type FlightPhase = 'climb' | 'descent'

export interface InstrumentScenario {
  fault: InstrumentFault
  phase: FlightPhase
  trueAirspeedKts: number
  trueAltitudeFt: number
  /** Altitude the static port froze at (blocked_static only) — always different from
   *  trueAltitudeFt by the amount already climbed/descended since the blockage. */
  frozenAltitudeFt: number
  headingDeg: number
  /** What the ASI actually indicates, given the fault. */
  indicatedAirspeedKts: number
  /** What the altimeter actually indicates, given the fault. */
  indicatedAltitudeFt: number
  /** What the VSI actually indicates, given the fault (fpm). */
  indicatedVsiFpm: number
}

function rand(n: number): number {
  return Math.floor(Math.random() * n)
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step
}

export function generateInstrumentScenario(): InstrumentScenario {
  const fault: InstrumentFault = rand(2) === 0 ? 'blocked_pitot' : 'blocked_static'
  const phase: FlightPhase = rand(2) === 0 ? 'climb' : 'descent'
  const trueAirspeedKts = roundTo(90 + rand(50), 5)
  const trueAltitudeFt = roundTo(2500 + rand(60) * 100, 100)
  const headingDeg = roundTo(rand(36) * 10, 10)
  const trueVsiFpm = phase === 'climb' ? 500 + rand(4) * 100 : -(500 + rand(4) * 100)

  let indicatedAirspeedKts = trueAirspeedKts
  let indicatedAltitudeFt = trueAltitudeFt
  let indicatedVsiFpm = trueVsiFpm
  let frozenAltitudeFt = trueAltitudeFt

  if (fault === 'blocked_pitot') {
    // Acts like an altimeter: indicated airspeed rises in a climb, falls in a
    // descent, regardless of true airspeed. Drift large enough to read as clearly
    // abnormal on the gauge, not a subtle few-knot difference.
    const drift = 35 + rand(20)
    indicatedAirspeedKts = phase === 'climb' ? trueAirspeedKts + drift : Math.max(20, trueAirspeedKts - drift)
    // Altimeter and VSI are static-only — unaffected by a pitot blockage.
  } else {
    // Blocked static: altimeter frozen at whatever it read when the blockage
    // occurred (some altitude already climbed/descended past that point), VSI
    // frozen at zero. The amount already flown past the freeze point is the "tell."
    const flownSinceBlockageFt = 200 + rand(6) * 100
    frozenAltitudeFt = phase === 'climb' ? trueAltitudeFt - flownSinceBlockageFt : trueAltitudeFt + flownSinceBlockageFt
    indicatedAltitudeFt = frozenAltitudeFt
    indicatedVsiFpm = 0
    // ASI becomes unreliable — shown mildly erratic rather than a clean derivable
    // value (the rule summary doesn't give a precise direction for this one, unlike
    // the pitot case), so it's not part of the graded signal.
    indicatedAirspeedKts = trueAirspeedKts + (rand(2) === 0 ? 10 : -10)
  }

  return { fault, phase, trueAirspeedKts, trueAltitudeFt, frozenAltitudeFt, headingDeg, indicatedAirspeedKts, indicatedAltitudeFt, indicatedVsiFpm }
}

export interface InstrumentAnswerOption {
  letter: 'A' | 'B' | 'C' | 'D'
  label: string
  isCorrect: boolean
}

const FAULT_LABELS: Record<InstrumentFault, string> = {
  blocked_pitot: 'Blocked pitot tube',
  blocked_static: 'Blocked static port',
}

/** Always the same 4 choices — the two real pitot-static faults plus the two gyro
 *  failures a student should be able to rule out because the AI/HI/TC are shown
 *  reading normally (gyro instruments aren't affected by a pitot-static problem). */
export function instrumentAnswerOptions(scenario: InstrumentScenario): InstrumentAnswerOption[] {
  const choices: { label: string; fault: InstrumentFault | null }[] = [
    { label: FAULT_LABELS.blocked_pitot, fault: 'blocked_pitot' },
    { label: FAULT_LABELS.blocked_static, fault: 'blocked_static' },
    { label: 'Vacuum pump failure (attitude/heading indicators)', fault: null },
    { label: 'Electrical failure (turn coordinator)', fault: null },
  ]
  const letters: InstrumentAnswerOption['letter'][] = ['A', 'B', 'C', 'D']
  // Fixed order — no need to shuffle for a proof-of-concept slice, and it keeps
  // manual QA of the generated rows easier to read.
  return choices.map((c, i) => ({ letter: letters[i], label: c.label, isCorrect: c.fault === scenario.fault }))
}

function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
}

/** One circular gauge: ticks every `tickStep` across [min,max] mapped to a 270°
 *  sweep (standard round-gauge convention), a needle at `value`, and a digital
 *  readout so the exact indicated value is never ambiguous to read off a small SVG. */
function renderGauge(opts: {
  cx: number; cy: number; r: number
  min: number; max: number; tickStep: number
  value: number
  label: string
  unit: string
  digits?: number
}): string {
  const { cx, cy, r, min, max, tickStep, value, label, unit } = opts
  const sweepStart = -135
  const sweepEnd = 135
  const frac = (v: number) => Math.min(1, Math.max(0, (v - min) / (max - min)))
  const angleFor = (v: number) => sweepStart + frac(v) * (sweepEnd - sweepStart)

  const ticks: string[] = []
  for (let v = min; v <= max; v += tickStep) {
    const a = angleFor(v)
    const outer = polar(cx, cy, r, a)
    const inner = polar(cx, cy, r - 8, a)
    ticks.push(`<line x1="${inner.x.toFixed(1)}" y1="${inner.y.toFixed(1)}" x2="${outer.x.toFixed(1)}" y2="${outer.y.toFixed(1)}" stroke="#8FB8DC" stroke-width="1.5" />`)
  }

  const needleAngle = angleFor(value)
  const needleTip = polar(cx, cy, r - 14, needleAngle)
  const needleTail = polar(cx, cy, 10, needleAngle + 180)

  const displayValue = Number.isInteger(opts.digits) ? value.toFixed(opts.digits) : String(Math.round(value))

  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0A1B3D" stroke="#3E92CC" stroke-width="2" />
    ${ticks.join('\n    ')}
    <line x1="${needleTail.x.toFixed(1)}" y1="${needleTail.y.toFixed(1)}" x2="${needleTip.x.toFixed(1)}" y2="${needleTip.y.toFixed(1)}" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
    <circle cx="${cx}" cy="${cy}" r="4" fill="#EF4444" />
    <text x="${cx}" y="${cy + r + 16}" fill="#FFFFFF" font-size="11" font-weight="bold" font-family="sans-serif" text-anchor="middle">${label}</text>
    <text x="${cx}" y="${cy + r * 0.55}" fill="#FFB627" font-size="13" font-weight="bold" font-family="sans-serif" text-anchor="middle">${displayValue}${unit}</text>
  </g>`
}

function renderAttitudeIndicator(cx: number, cy: number, r: number): string {
  // Always rendered level (pitch 0, bank 0) — this fault type never affects gyro
  // instruments, and showing that plainly is part of the diagnostic reasoning.
  return `<g>
    <clipPath id="ai-clip-${cx}-${cy}"><circle cx="${cx}" cy="${cy}" r="${r}" /></clipPath>
    <g clip-path="url(#ai-clip-${cx}-${cy})">
      <rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r}" fill="#3E92CC" />
      <rect x="${cx - r}" y="${cy}" width="${r * 2}" height="${r}" fill="#8B5A2B" />
      <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#FFFFFF" stroke-width="2" />
    </g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#3E92CC" stroke-width="2" />
    <path d="M ${cx - 26},${cy} L ${cx - 8},${cy} M ${cx + 8},${cy} L ${cx + 26},${cy} M ${cx},${cy - 8} L ${cx},${cy}" stroke="#FFB627" stroke-width="3" fill="none" />
    <text x="${cx}" y="${cy + r + 16}" fill="#FFFFFF" font-size="11" font-weight="bold" font-family="sans-serif" text-anchor="middle">ATTITUDE</text>
    <text x="${cx}" y="${cy + r * 0.75}" fill="#8FB8DC" font-size="10" font-family="sans-serif" text-anchor="middle">level</text>
  </g>`
}

function renderHeadingIndicator(cx: number, cy: number, r: number, headingDeg: number): string {
  const ticks: string[] = []
  for (let deg = 0; deg < 360; deg += 30) {
    // Compass card rotates with heading — the card shows headingDeg at the top (the
    // aircraft symbol always points up), so each label is drawn at (deg - heading).
    const a = deg - headingDeg
    const outer = polar(cx, cy, r - 6, a)
    const inner = polar(cx, cy, r - 14, a)
    const label = polar(cx, cy, r - 26, a)
    const text = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : String(deg / 10)
    ticks.push(`<line x1="${inner.x.toFixed(1)}" y1="${inner.y.toFixed(1)}" x2="${outer.x.toFixed(1)}" y2="${outer.y.toFixed(1)}" stroke="#8FB8DC" stroke-width="1.5" />`)
    ticks.push(`<text x="${label.x.toFixed(1)}" y="${label.y.toFixed(1)}" fill="#8FB8DC" font-size="10" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">${text}</text>`)
  }
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0A1B3D" stroke="#3E92CC" stroke-width="2" />
    ${ticks.join('\n    ')}
    <path d="M ${cx},${cy - 20} L ${cx},${cy + 16}" stroke="#FFFFFF" stroke-width="2" />
    <path d="M ${cx - 6},${cy - 10} L ${cx},${cy - 20} L ${cx + 6},${cy - 10}" fill="#FFFFFF" />
    <text x="${cx}" y="${cy + r + 16}" fill="#FFFFFF" font-size="11" font-weight="bold" font-family="sans-serif" text-anchor="middle">HEADING</text>
    <text x="${cx}" y="${cy + r * 0.55}" fill="#FFB627" font-size="13" font-weight="bold" font-family="sans-serif" text-anchor="middle">${String(headingDeg).padStart(3, '0')}°</text>
  </g>`
}

function renderTurnCoordinator(cx: number, cy: number, r: number): string {
  // Always wings-level, ball centered — not affected by this fault type.
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0A1B3D" stroke="#3E92CC" stroke-width="2" />
    <path d="M ${cx - 24},${cy} L ${cx + 24},${cy} M ${cx - 8},${cy - 6} L ${cx},${cy} L ${cx - 8},${cy + 6} M ${cx + 8},${cy - 6} L ${cx},${cy} L ${cx + 8},${cy + 6}" stroke="#FFFFFF" stroke-width="2.5" fill="none" />
    <rect x="${cx - 20}" y="${cy + r - 20}" width="40" height="12" rx="6" fill="#132C5E" stroke="#3E92CC" />
    <circle cx="${cx}" cy="${cy + r - 14}" r="4" fill="#FFFFFF" />
    <text x="${cx}" y="${cy + r + 16}" fill="#FFFFFF" font-size="11" font-weight="bold" font-family="sans-serif" text-anchor="middle">TURN COORD.</text>
  </g>`
}

export function renderInstrumentPanelSvg(scenario: InstrumentScenario): string {
  const row1Y = 110
  const row2Y = 300
  const r = 75
  const colX = [110, 300, 490]

  return `<svg viewBox="0 0 600 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${instrumentAccessibilityDescription(scenario)}">
  <rect x="0" y="0" width="600" height="420" fill="#0A1B3D" />
  <text x="300" y="30" fill="#FFB627" font-size="13" font-weight="bold" font-family="sans-serif" text-anchor="middle" letter-spacing="1">${scenario.phase === 'climb' ? 'AIRCRAFT IN A CLIMB' : 'AIRCRAFT IN A DESCENT'}</text>

  ${renderGauge({ cx: colX[0], cy: row1Y, r, min: 40, max: 180, tickStep: 20, value: scenario.indicatedAirspeedKts, label: 'AIRSPEED', unit: ' kt' })}
  ${renderAttitudeIndicator(colX[1], row1Y, r)}
  ${renderGauge({ cx: colX[2], cy: row1Y, r, min: 0, max: 10000, tickStep: 1000, value: scenario.indicatedAltitudeFt, label: 'ALTIMETER', unit: '', digits: 0 })}
  <text x="${colX[2]}" y="${row1Y + r * 0.75}" fill="#8FB8DC" font-size="10" font-family="sans-serif" text-anchor="middle">${scenario.indicatedAltitudeFt.toLocaleString()} ft</text>

  ${renderTurnCoordinator(colX[0], row2Y, r)}
  ${renderHeadingIndicator(colX[1], row2Y, r, scenario.headingDeg)}
  ${renderGauge({ cx: colX[2], cy: row2Y, r, min: -2000, max: 2000, tickStep: 500, value: scenario.indicatedVsiFpm, label: 'VSI', unit: ' fpm' })}
</svg>`
}

export function instrumentAccessibilityDescription(scenario: InstrumentScenario): string {
  return `Six-pack instrument panel training diagram. The aircraft is in a ${scenario.phase}. Airspeed indicator reads ${Math.round(scenario.indicatedAirspeedKts)} knots. Altimeter reads ${scenario.indicatedAltitudeFt} feet. Vertical speed indicator reads ${scenario.indicatedVsiFpm} feet per minute. Attitude indicator, heading indicator, and turn coordinator all show normal, level indications.`
}
