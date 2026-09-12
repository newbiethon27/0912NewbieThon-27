'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatAxisKRW } from '@/lib/format';
import type { ComparisonSeriesPoint } from '@/lib/simulation/series';
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

/**
 * 그래프 3 — 현재 회사 유지 vs 이직.
 *
 * 두 시나리오를 같은 축 위에 그린다(축을 두 개 쓰지 않는다).
 * "현재"는 언제나 blue, "이직"은 언제나 orange로 고정해 두어
 * 조건을 바꿔도 같은 대상이 색을 바꾸지 않는다.
 */
export function ScenarioCompareChart({
  data,
  currentLabel,
  alternativeLabel,
}: {
  data: ComparisonSeriesPoint[];
  currentLabel: string;
  alternativeLabel: string;
}) {
  const hasNegative = data.some(
    (point) => point.current < 0 || point.alternative < 0,
  );

  return (
    <div>
      <ChartLegend
        items={[
          { label: currentLabel, color: SERIES.primary },
          { label: alternativeLabel, color: SERIES.secondary },
        ]}
      />

      <div className="mt-4 h-72 w-full">
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

            {hasNegative && (
              <ReferenceLine
                y={0}
                stroke={CHART_INK.reference}
                strokeWidth={1}
              />
            )}

            <Line
              {...LINE_PROPS}
              type="monotone"
              dataKey="current"
              name={currentLabel}
              stroke={SERIES.primary}
              activeDot={{ ...ACTIVE_DOT_PROPS, fill: SERIES.primary }}
            />
            <Line
              {...LINE_PROPS}
              type="monotone"
              dataKey="alternative"
              name={alternativeLabel}
              stroke={SERIES.secondary}
              activeDot={{ ...ACTIVE_DOT_PROPS, fill: SERIES.secondary }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
