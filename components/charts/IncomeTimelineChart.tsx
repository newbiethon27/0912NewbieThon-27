'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatAxisKRW } from '@/lib/format';
import type { IncomePoint } from '@/types';
import { ChartLegend, ChartTooltip } from './ChartTooltip';
import {
  ACTIVE_DOT_PROPS,
  AXIS_PROPS,
  CHART_INK,
  CHART_MARGIN,
  LINE_PROPS,
  SERIES,
  X_AXIS_PROPS,
  Y_AXIS_WIDTH,
} from './chartTheme';

const LEGEND = [
  { label: '세전 연봉', color: SERIES.primary },
  { label: '추정 세후 소득', color: SERIES.secondary, dashed: true },
] as const;

/**
 * 그래프 1 — 예상 연봉 변화.
 *
 * 세전(입력값에서 직접 유도)과 세후(가정이 섞인 추정값)를 한 축에 함께 그린다.
 * 신뢰도가 다른 두 값이라 선 모양으로도 구분한다(세후는 점선).
 */
export function IncomeTimelineChart({ data }: { data: IncomePoint[] }) {
  return (
    <div>
      <ChartLegend items={LEGEND} />

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={CHART_MARGIN}>
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
              content={
                <ChartTooltip labelFormatter={(label) => `${label}세`} />
              }
            />
            <Line
              {...LINE_PROPS}
              type="monotone"
              dataKey="gross"
              name="세전 연봉"
              stroke={SERIES.primary}
              activeDot={{ ...ACTIVE_DOT_PROPS, fill: SERIES.primary }}
            />
            <Line
              {...LINE_PROPS}
              type="monotone"
              dataKey="net"
              name="추정 세후 소득"
              stroke={SERIES.secondary}
              strokeDasharray="5 4"
              activeDot={{ ...ACTIVE_DOT_PROPS, fill: SERIES.secondary }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
