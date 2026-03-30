/**
 * Proporcje boiska piłkarskiego (FIFA): długość 105 m, szerokość 68 m.
 * viewBox: width x height (pionowo: bramki góra/dół).
 * y=0 to górna linia bramkowa, y=height to dolna (bramkarz na dole przy odwróconym Y).
 */

export const PITCH_RATIO_WIDTH_HEIGHT = 68 / 105; // width/height

/** Współrzędne w przestrzeni 0–100 (x,y). Długość boiska = 100, szerokość = 100*68/105 ≈ 64.76. */
export const PITCH_NORM = {
  /** Głębokość pola karnego (16.5m / 105m) */
  penaltyDepth: (16.5 / 105) * 100,
  /** Szerokość pola karnego (40.32m / 68m) w % szerokości */
  penaltyWidthPercent: (40.32 / 68) * 100,
  /** Głębokość pola bramkowego (5.5m / 105m) */
  goalAreaDepth: (5.5 / 105) * 100,
  /** Szerokość pola bramkowego (18.32m / 68m) w % szerokości */
  goalAreaWidthPercent: (18.32 / 68) * 100,
  /** Promień koła środkowego (9.15m / 105m) w % długości */
  centerCircleRadiusPercent: (9.15 / 105) * 100,
  /** Odległość punktu karnego od linii bramkowej (11m / 105m) */
  penaltySpotFromGoalPercent: (11 / 105) * 100,
};

/** Dla viewBox (width, height) zwraca wartości w pikselach (pionowo: górna bramka y=0). */
export function getPitchMarkings(viewWidth: number, viewHeight: number) {
  const w = viewWidth;
  const h = viewHeight;
  const half = h / 2;
  const penDepth = (PITCH_NORM.penaltyDepth / 100) * h;
  const penWidth = (PITCH_NORM.penaltyWidthPercent / 100) * w;
  const penLeft = (w - penWidth) / 2;
  const goalDepth = (PITCH_NORM.goalAreaDepth / 100) * h;
  const goalWidth = (PITCH_NORM.goalAreaWidthPercent / 100) * w;
  const goalLeft = (w - goalWidth) / 2;
  const centerR = (PITCH_NORM.centerCircleRadiusPercent / 100) * h;
  const penaltySpotY = (PITCH_NORM.penaltySpotFromGoalPercent / 100) * h;
  const goalSymbolWidth = Math.min(w * 0.12, 50);
  const goalSymbolHeight = Math.min(h * 0.01, 6);

  return {
    halfwayY: half,
    centerCircleR: centerR,
    penaltyTop: { x: penLeft, y: 0, width: penWidth, height: penDepth },
    penaltyBottom: { x: penLeft, y: h - penDepth, width: penWidth, height: penDepth },
    goalAreaTop: { x: goalLeft, y: 0, width: goalWidth, height: goalDepth },
    goalAreaBottom: { x: goalLeft, y: h - goalDepth, width: goalWidth, height: goalDepth },
    penaltySpotTopY: penaltySpotY,
    penaltySpotBottomY: h - penaltySpotY,
    centerX: w / 2,
    goalSymbolWidth,
    goalSymbolHeight,
  };
}
