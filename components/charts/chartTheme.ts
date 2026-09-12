/**
 * 차트 공용 토큰.
 *
 * 계열 색은 검증된 categorical 팔레트의 슬롯 1(blue) / 슬롯 2(orange)다.
 * 두 색 조합은 색각 이상 분리도 ΔE 24.7(목표 8 이상), 일반 시야 ΔE 33.6(기준 15 이상),
 * 표면 대비 3:1 이상을 모두 통과했다.
 *
 * 규칙:
 * - 계열 색은 "현재"가 항상 blue, "이직/비교 대상"이 항상 orange다.
 *   필터나 순서가 바뀌어도 같은 대상은 같은 색을 유지한다.
 * - 글자는 절대 계열 색을 입지 않는다. 축·범례·값은 text 토큰을 쓰고,
 *   신원은 글자 옆의 색 마크가 전달한다.
 */

export const SERIES = {
  /** 현재 회사 유지 / 세전 연봉 */
  primary: '#2a78d6',
  /** 이직 시나리오 / 추정 세후 소득 */
  secondary: '#eb6834',
} as const;

export const CHART_INK = {
  /** 축 라벨 (text-secondary) */
  axis: '#52514e',
  /** 그리드: 표면에서 한 단계만 떨어진 회색, 1px 실선 */
  grid: '#e8e8e6',
  /** 마커 링과 마크 사이 간격에 쓰는 표면색 */
  surface: '#ffffff',
  /** 목표선 등 참조선 */
  reference: '#a3a29e',
} as const;

/**
 * 선 마크 공통 사양: 2px, 둥근 join/cap.
 *
 * 진입 애니메이션은 끈다. 1.5초 동안 선이 잘린 채로 보여서
 * 첫인상이 "데이터가 비어 있다"로 읽히고, 금융 서비스의 신뢰감 있는 톤과도 맞지 않는다.
 */
export const LINE_PROPS = {
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  dot: false,
  isAnimationActive: false,
} as const;

/** 호버 시 강조 점: 지름 8px 이상 + 2px 표면 링 */
export const ACTIVE_DOT_PROPS = {
  r: 4,
  strokeWidth: 2,
  stroke: CHART_INK.surface,
} as const;

export const AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tick: { fill: CHART_INK.axis, fontSize: 12 },
} as const;

/**
 * X축 라벨을 아래로 띄워 원점에서 Y축 "0"과 겹치지 않게 한다.
 * (Y축에 같은 여백을 주면 라벨이 축 너비 밖으로 밀려 잘린다 — X축에만 적용할 것)
 */
export const X_AXIS_PROPS = {
  ...AXIS_PROPS,
  tickMargin: 10,
} as const;

/** Y축 너비. "8,000만" 같은 긴 라벨이 잘리지 않을 만큼은 준다 */
export const Y_AXIS_WIDTH = 60;

export const CHART_MARGIN = { top: 8, right: 16, bottom: 0, left: 4 } as const;
