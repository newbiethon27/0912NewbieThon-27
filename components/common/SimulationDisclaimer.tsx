import { ASSUMPTION_NOTES } from '@/lib/constants/assumptions';
import { cn } from '@/lib/utils';

/**
 * 모든 시뮬레이션 결과 화면에 필수로 들어가는 면책 문구.
 * CLAUDE.md 제품 원칙 #2 / 도메인 경고 #8.
 */
export function SimulationDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn('text-muted-foreground text-xs leading-relaxed', className)}>
      {ASSUMPTION_NOTES.disclaimer}
    </p>
  );
}
