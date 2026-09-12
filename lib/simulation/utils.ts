/**
 * 계산 내부 공용 헬퍼.
 * NaN/Infinity가 차트나 화면에 새어나가지 않도록 경계에서 막는다.
 */

/** 유한한 정수로 강제. 비유한값은 0 */
export function toFiniteInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

/** 유한한 실수로 강제. 비유한값은 0 */
export function toFiniteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
