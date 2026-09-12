import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  {
    title: '10년치 소득과 순자산',
    body: '현재 연봉, 지출, 저축을 입력하면 앞으로 10년의 소득과 순자산 변화를 연도별로 그려줍니다.',
  },
  {
    title: '이직했을 때와 나란히',
    body: '다른 회사의 예상 연봉과 통근 조건을 넣으면 두 선택의 미래를 같은 축 위에서 비교합니다.',
  },
  {
    title: '돈만이 아니라 시간도',
    body: '통근시간과 교통비까지 누적해 보여주기 때문에 연봉만으로는 보이지 않던 차이가 드러납니다.',
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">LifePath</span>
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          로그인
        </Link>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 pt-16 pb-20 sm:pt-24">
        <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.15]">
          연봉은 숫자 하나지만,
          <br />
          직업 선택의 결과는 10년 동안 이어집니다.
        </h1>

        <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed">
          현재의 소득, 지출, 통근, 저축 데이터를 바탕으로 커리어 선택이 당신의
          미래 자산과 시간에 어떤 변화를 만드는지 확인하세요.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-6 text-base')}
          >
            내 미래 시뮬레이션 시작하기
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'lg' }),
              'h-11 px-5 text-base',
            )}
          >
            이미 계정이 있어요
          </Link>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-16 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title}>
              <h2 className="text-base font-semibold">{item.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 py-10">
        <SimulationDisclaimer />
      </footer>
    </main>
  );
}
