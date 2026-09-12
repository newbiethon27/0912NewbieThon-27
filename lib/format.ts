/**
 * 표시 전용 포맷 유틸.
 * 저장·계산은 항상 원(KRW) 정수로 하고, 억/만원 변환은 여기서만 한다.
 */

import type { GoalResult } from '@/types';

const EOK = 100_000_000;
const MAN = 10_000;

function groupDigits(n: number): string {
  return n.toLocaleString('ko-KR');
}

/**
 * 원 단위 금액을 한국식으로 읽기 쉽게 변환한다.
 * 480_000_000 → "4억 8,000만원", 50_000_000 → "5,000만원", 5_500 → "5,500원"
 */
export function formatKRW(won: number): string {
  if (!Number.isFinite(won)) return '-';

  const sign = won < 0 ? '-' : '';
  const abs = Math.abs(Math.round(won));

  if (abs === 0) return '0원';

  // 1만원 미만은 원 단위 그대로
  if (abs < MAN) return `${sign}${groupDigits(abs)}원`;

  let eok = Math.floor(abs / EOK);
  let man = Math.round((abs % EOK) / MAN);

  // 만원 단위 반올림이 1억으로 올라가는 경우 자리올림 (예: 199,999,999)
  if (man >= EOK / MAN) {
    eok += 1;
    man -= EOK / MAN;
  }

  if (eok > 0 && man > 0) return `${sign}${groupDigits(eok)}억 ${groupDigits(man)}만원`;
  if (eok > 0) return `${sign}${groupDigits(eok)}억원`;
  return `${sign}${groupDigits(man)}만원`;
}

/** 증감 표시용. 0이 아니면 항상 부호를 붙인다 */
export function formatSignedKRW(won: number): string {
  if (!Number.isFinite(won)) return '-';
  const rounded = Math.round(won);
  if (rounded === 0) return '0원';
  return rounded > 0 ? `+${formatKRW(rounded)}` : formatKRW(rounded);
}

/** 3,200 → "3,200시간" */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return '-';
  return `${groupDigits(Math.round(hours))}시간`;
}

export function formatSignedHours(hours: number): string {
  if (!Number.isFinite(hours)) return '-';
  const rounded = Math.round(hours);
  if (rounded === 0) return '0시간';
  return rounded > 0 ? `+${formatHours(rounded)}` : `-${formatHours(Math.abs(rounded))}`;
}

/** 0.125 → "12.5%". 계산 불가(null)는 안내 문구로 */
export function formatPercent(ratio: number | null, fractionDigits = 1): string {
  if (ratio === null || !Number.isFinite(ratio)) return '계산 불가';
  return `${(ratio * 100).toFixed(fractionDigits)}%`;
}

/** 31, 4 → "31세 4개월" / 31, 0 → "31세" */
export function formatAgeMonths(age: number, months: number): string {
  if (!Number.isFinite(age)) return '-';
  return months > 0 ? `${age}세 ${months}개월` : `${age}세`;
}

/** 개월 차이를 "1년 4개월" 형태로. 부호는 호출부에서 문장으로 표현한다 */
export function formatMonthsSpan(totalMonths: number): string {
  const abs = Math.abs(Math.round(totalMonths));
  const years = Math.floor(abs / 12);
  const months = abs % 12;
  if (years > 0 && months > 0) return `${years}년 ${months}개월`;
  if (years > 0) return `${years}년`;
  return `${months}개월`;
}

/**
 * 목표 달성 결과를 화면 문구로.
 * 기간 내 미달성을 임의로 외삽하지 않고 그대로 표시한다.
 */
export function formatGoalResult(
  goal: GoalResult | null,
  simulationYears: number,
): { value: string; sub?: string } {
  if (!goal) {
    return { value: '-', sub: '목표를 설정하면 달성 시점을 계산합니다' };
  }

  if (goal.status === 'not_reached') {
    return {
      value: `${simulationYears}년 내 미달성`,
      sub: '시뮬레이션 기간 안에는 도달하지 않습니다',
    };
  }

  if (goal.status === 'already_achieved') {
    return { value: '이미 달성', sub: '현재 순자산이 목표를 넘었습니다' };
  }

  const { vsTargetMonths } = goal;
  const sub =
    vsTargetMonths === 0
      ? '목표 시점과 같습니다'
      : vsTargetMonths > 0
        ? `목표보다 ${formatMonthsSpan(vsTargetMonths)} 늦습니다`
        : `목표보다 ${formatMonthsSpan(vsTargetMonths)} 빠릅니다`;

  return { value: formatAgeMonths(goal.age, goal.months), sub };
}

/** 차트 축 라벨용 축약 표기. 480_000_000 → "4.8억" */
export function formatAxisKRW(won: number): string {
  if (!Number.isFinite(won)) return '';
  const sign = won < 0 ? '-' : '';
  const abs = Math.abs(won);

  if (abs >= EOK) {
    const eok = abs / EOK;
    return `${sign}${eok >= 10 ? Math.round(eok) : Number(eok.toFixed(1))}억`;
  }
  if (abs >= MAN) return `${sign}${Math.round(abs / MAN).toLocaleString('ko-KR')}만`;
  if (abs === 0) return '0';
  return `${sign}${groupDigits(abs)}`;
}
