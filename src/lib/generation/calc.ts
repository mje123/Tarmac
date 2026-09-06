// Deterministic numeric validators. The LLM proposes a calculated value inside a
// generated question/explanation; these functions independently recompute it.
// If the LLM's claimed value and the deterministic result disagree beyond tolerance,
// the question is rejected — the model's arithmetic is never trusted on its own.

export interface DensityAltitudeInputs {
  fieldElevationFt: number
  altimeterSettingInHg: number
  temperatureC: number
}

export function computePressureAltitude({ fieldElevationFt, altimeterSettingInHg }: Pick<DensityAltitudeInputs, 'fieldElevationFt' | 'altimeterSettingInHg'>): number {
  return fieldElevationFt + (29.92 - altimeterSettingInHg) * 1000
}

export function computeIsaTemp(pressureAltitudeFt: number): number {
  return 15 - 2 * (pressureAltitudeFt / 1000)
}

export function computeDensityAltitude(inputs: DensityAltitudeInputs): number {
  const pressureAltitude = computePressureAltitude(inputs)
  const isaTemp = computeIsaTemp(pressureAltitude)
  return pressureAltitude + 120 * (inputs.temperatureC - isaTemp)
}

// ─── Additional deterministic compute functions for the expanded concept set ───
// Each mirrors a standard FAA-test rule-of-thumb or formula (PHAK/AFH/IFH). These
// are looked up generically via ConceptDefinition.numeric.compute — see concepts.ts.

/** Weight & balance: CG (in. from datum) = total moment / total weight. Moment for
 *  the empty aircraft is given directly (as FAA loading tables do); moment for each
 *  loaded station is weight × arm. */
export function computeCG(inputs: {
  emptyWeightLb: number
  emptyMomentInLb: number
  pilotWeightLb: number
  pilotArmIn: number
  fuelWeightLb: number
  fuelArmIn: number
  baggageWeightLb: number
  baggageArmIn: number
}): number {
  const totalWeight = inputs.emptyWeightLb + inputs.pilotWeightLb + inputs.fuelWeightLb + inputs.baggageWeightLb
  const totalMoment =
    inputs.emptyMomentInLb +
    inputs.pilotWeightLb * inputs.pilotArmIn +
    inputs.fuelWeightLb * inputs.fuelArmIn +
    inputs.baggageWeightLb * inputs.baggageArmIn
  return totalMoment / totalWeight
}

/** Aerodynamics: load factor in a coordinated level turn = 1 / cos(bank angle). */
export function computeLoadFactor(bankAngleDeg: number): number {
  return 1 / Math.cos((bankAngleDeg * Math.PI) / 180)
}

/** Navigation (E6B): time enroute in minutes = distance / groundspeed × 60. */
export function computeTimeEnrouteMinutes(distanceNm: number, groundspeedKts: number): number {
  return (distanceNm / groundspeedKts) * 60
}

/** Weather: convective cloud base rule of thumb (°C spread / 2.5 × 1000 ft AGL). */
export function computeCloudBaseAglFt(temperatureC: number, dewpointC: number): number {
  return ((temperatureC - dewpointC) / 2.5) * 1000
}

/** Instrument approach: descent rate (fpm) for a 3° glidepath ≈ groundspeed(kts) × 5. */
export function computeGlidepathDescentRateFpm(groundspeedKts: number): number {
  return groundspeedKts * 5
}

/** SID/departure: required climb rate (fpm) = climb gradient (ft/NM) × groundspeed(kts) / 60. */
export function computeRequiredClimbRateFpm(climbGradientFtPerNm: number, groundspeedKts: number): number {
  return (climbGradientFtPerNm * groundspeedKts) / 60
}
