import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface SummaryCardProps {
  label: string;
  value: string;
  /** 값 아래 보조 설명 (가정, 기준 시점 등) */
  sub?: string;
  tone?: 'default' | 'negative' | 'muted';
}

/**
 * Summary 카드 = stat tile.
 * 라벨은 작게, 값은 크게. 값에는 계열 색을 입히지 않는다.
 */
export function SummaryCard({
  label,
  value,
  sub,
  tone = 'default',
}: SummaryCardProps) {
  return (
    <Card className="gap-0 p-5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-semibold tracking-tight tabular-nums',
          tone === 'negative' && 'text-destructive',
          tone === 'muted' && 'text-muted-foreground',
        )}
      >
        {value}
      </p>
      {sub && <p className="text-muted-foreground mt-1.5 text-xs">{sub}</p>}
    </Card>
  );
}

export function SummaryCardGrid({ items }: { items: SummaryCardProps[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <SummaryCard key={item.label} {...item} />
      ))}
    </div>
  );
}
