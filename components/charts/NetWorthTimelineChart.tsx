'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatAxisKRW } from '@/lib/format';
import type { NetWorthPoint } from '@/types';
import { ChartTooltip } from './ChartTooltip';
import {
  ACTIVE_DOT_PROPS,
  AXIS_PROPS,
  CHART_INK,
  CHART_MARGIN,
  SERIES,
  X_AXIS_PROPS,
  Y_AXIS_WIDTH,
} from './chartTheme';

/**
 * 그래프 2 — 예상 순자산 변화.
 *
 * 단일 계열이라 범례 상자를 두지 않는다(제목이 무엇을 그린 것인지 말해 준다).
 * 순자산이 음수로 내려갈 수 있으므로 0선을 참조선으로 표시한다.
 */
export function NetWorthTimelineChart({
  data,
  goalNetWorth,
}: {
  data: NetWorthPoint[];
  goalNetWorth?: number | null;
}) {
  const hasNegative = data.some((point) => point.netWorth < 0);
  const showGoal =
    typeof goalNetWorth === 'number' &&
    goalNetWorth > 0 &&
    // 목표선이 차트 밖으로 한참 벗어나면 축을 망가뜨리므로 그리지 않는다
    goalNetWorth <= Math.max(...data.map((point) => point.netWorth)) * 1.5;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES.primary} stopOpacity={0.16} />
              <stop
                offset="100%"
                stopColor={SERIES.primary}
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke={CHART_INK.grid}
            strokeWidth={1}
          />
          <XAxis
            dataKey="age"
            {...X_AXIS_PROPS}
            tickFormatter={(value: number) => `${value}세`}
          />
          <YAxis
            {...AXIS_PROPS}
            width={Y_AXIS_WIDTH}
            tickFormatter={(value: number) => formatAxisKRW(value)}
          />
          <Tooltip
            cursor={{ stroke: CHART_INK.reference, strokeWidth: 1 }}
            content={<ChartTooltip labelFormatter={(label) => `${label}세`} />}
          />

          {hasNegative && (
            <ReferenceLine y={0} stroke={CHART_INK.reference} strokeWidth={1} />
          )}
          {showGoal && (
            <ReferenceLine
              y={goalNetWorth}
              stroke={CHART_INK.reference}
              strokeWidth={1}
              label={{
                value: '목표',
                position: 'insideTopRight',
                fill: CHART_INK.axis,
                fontSize: 11,
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="netWorth"
            name="순자산"
            stroke={SERIES.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#netWorthFill)"
            isAnimationActive={false}
            activeDot={{ ...ACTIVE_DOT_PROPS, fill: SERIES.primary }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
