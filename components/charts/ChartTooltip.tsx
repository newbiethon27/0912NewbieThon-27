'use client';

import { formatKRW } from '@/lib/format';

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  /** X축 값을 사람이 읽는 문구로 (예: 32 → "32세") */
  labelFormatter?: (label: string | number) => string;
}

/**
 * 선 차트 공용 툴팁.
 *
 * 값은 text 토큰으로 쓰고, 계열 신원은 왼쪽의 색 점이 전달한다(글자에 계열 색을 입히지 않는다).
 */
export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-popover min-w-40 rounded-lg border px-3 py-2 shadow-md">
      {label !== undefined && (
        <p className="text-muted-foreground mb-1.5 text-xs">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li
            key={String(entry.dataKey ?? entry.name)}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground text-xs">
                {entry.name}
              </span>
            </span>
            <span className="font-medium tabular-nums">
              {typeof entry.value === 'number'
                ? formatKRW(entry.value)
                : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 범례: 색 마크 + text 토큰 라벨 */
export function ChartLegend({
  items,
}: {
  items: ReadonlyArray<{ label: string; color: string; dashed?: boolean }>;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-0.5 w-4 shrink-0 rounded-full"
            style={{
              backgroundColor: item.dashed ? 'transparent' : item.color,
              backgroundImage: item.dashed
                ? `repeating-linear-gradient(90deg, ${item.color} 0 4px, transparent 4px 7px)`
                : undefined,
            }}
          />
          <span className="text-muted-foreground text-xs">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
