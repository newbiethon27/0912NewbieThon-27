# LifePath

> 해커톤 MVP 프로젝트. 이 문서는 Claude Code가 이 저장소에서 작업할 때 따르는 단일 기준이다.
> 판단이 애매하면 **"P0 데모 흐름이 끊기지 않는 쪽"** 을 선택한다.

---

## 1. Product Overview

LifePath는 사용자의 **현재 직장 · 연봉 · 자산 · 지출 · 저축** 데이터를 입력받아,
**현재 커리어를 유지했을 때의 미래**와 **다른 회사로 이직했을 때의 미래**를 비교해주는 시뮬레이션 서비스다.

핵심 메시지:

> "당신의 커리어 선택이 미래의 돈과 시간을 어떻게 바꾸는지 보여줍니다."

재무관리 앱도, 연봉 비교 사이트도 아니다. 사용자가 답을 얻고 싶어하는 질문은 다음과 같다.

- 지금 회사에 계속 다니면 5년 / 10년 뒤 나는 어떤 상태인가?
- 이직하면 미래가 어떻게 달라지는가?
- 연봉이 더 높은 회사가 **실제로도** 경제적으로 유리한가?
- 통근시간과 교통비까지 포함하면 어떤 선택이 나은가?
- 지금 저축 패턴으로 목표 자산을 언제 달성하는가?
- 같은 연령대/직군과 비교했을 때 나는 어느 위치인가?

**절대 "예측(prediction)"이라 표현하지 않는다.** 모든 결과는 입력값과 명시된 가정에 기반한
**시뮬레이션(simulation) / 시나리오(scenario)** 이며, UI에 항상 그렇게 표기한다.

---

## 2. MVP Goal

아래 한 문장을 **처음부터 끝까지 실제로 동작**시키는 것이 유일한 목표다.

> 사용자가 가입 → 자기 정보 입력 → 현재 회사 기준 10년 소득/순자산 그래프 확인 →
> 다른 회사 선택 및 조건 입력 → 두 시나리오 비교 결과 확인.

기능 개수를 늘리는 것보다 이 흐름의 **완결성과 안정성**이 우선한다.
멋진 기능 3개보다, 끊기지 않는 흐름 1개가 낫다.

---

## 3. Core User Flow

```
/            Landing Page (핵심 카피 + CTA)
  ↓
/signup      회원가입 (Supabase Auth)
/login       로그인
  ↓
/onboarding  최초 정보 입력 (프로필 없으면 강제 리다이렉트)
  ↓
/dashboard   My Future Report (Summary Cards + 그래프 1,2)
  ↓
/compare     회사 검색/선택 → 조건 입력 → 현재 vs 이직 시나리오 비교 (그래프 3)
  ↓
목표 자산 달성 시점 비교
```

라우팅 규칙:

- 미인증 사용자가 `/dashboard`, `/compare`, `/settings`, `/onboarding` 접근 → `/login`
- 인증됐지만 `UserProfile`이 없는 사용자 → `/onboarding` 강제 이동
- 온보딩 완료 사용자가 `/onboarding` 재접근 → `/dashboard` (또는 수정 모드 허용)

---

## 4. Tech Stack

해커톤 개발 속도가 최우선 기준이다. 아래 스택을 벗어나지 않는다.

| 영역 | 선택 |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Auth / DB | Supabase (Supabase Auth + PostgreSQL) |
| Charts | Recharts |
| Validation | Zod |
| Forms | React Hook Form |
| Test | Vitest (계산 함수 단위 테스트 전용) |
| API | Next.js Route Handler |
| External Data | OpenDART API |

**금지 / 주의**

- 전역 상태관리 라이브러리(Redux, Zustand, Jotai 등)를 도입하지 않는다.
  → React state, Server Component, URL search params, form state로 해결한다.
- 위 표에 없는 라이브러리는 추가하지 않는다. 꼭 필요하면 왜 필요한지 먼저 설명한다.
- 별도 ORM(Prisma 등)을 추가하지 않는다. Supabase client를 직접 사용한다.

---

## 5. Architecture

### 계층 분리 원칙

```
UI Component                   → 렌더링과 사용자 입력 처리만
Server Action / Route Handler  → 인증, DB I/O, 외부 API 호출
lib/simulation                 → 순수 계산 로직 (pure function, 부수효과 없음)
lib/constants                  → 모든 시뮬레이션 가정값
```

**절대 규칙: 계산 로직을 컴포넌트 안에 작성하지 않는다.**
차트 컴포넌트는 이미 계산이 끝난 배열을 props로 받기만 한다.

### 데이터 흐름

1. Server Component에서 Supabase로 `UserProfile` / `FinancialGoal` 조회
2. `lib/simulation` 함수에 넘겨 timeline 계산
3. 결과를 Client Component(차트)에 props로 전달
4. `/compare`의 사용자 조정 입력(예상 연봉 등)은 클라이언트 state → 같은 계산 함수를 재호출

계산 함수는 서버/클라이언트 어디서든 동일하게 호출 가능해야 한다. (DB나 fetch에 의존 금지)

### 시크릿 취급

- OpenDART API 키, Supabase service role 키는 **서버에서만** 사용한다.
- 클라이언트에서 외부 API를 직접 호출하지 않는다. 반드시 Route Handler를 경유한다.
- `NEXT_PUBLIC_` 접두사는 공개해도 안전한 값에만 붙인다.

---

## 6. Directory Structure

```
proxy.ts                      # 세션 갱신 + 낙관적 리다이렉트 (Next 16: middleware 아님)
supabase/schema.sql           # 테이블 · RLS · mock 시드 (대시보드 SQL Editor에 붙여넣기)

app/
  layout.tsx
  page.tsx                    # Landing
  login/page.tsx
  signup/page.tsx
  onboarding/page.tsx         # 4단계 폼
  dashboard/page.tsx
  dashboard/loading.tsx
  compare/page.tsx
  settings/page.tsx           # 온보딩 폼 재사용
  api/companies/route.ts      # 회사 검색 (DART → DB → mock)

components/
  ui/                         # shadcn/ui 생성물 (Base UI 기반)
  charts/
    chartTheme.ts             # ★ 검증된 계열 색 · 마크 사양
    ChartTooltip.tsx          # 공용 툴팁 + 범례
    IncomeTimelineChart.tsx   # 그래프 1
    NetWorthTimelineChart.tsx # 그래프 2
    ScenarioCompareChart.tsx  # 그래프 3
  dashboard/SummaryCard.tsx   # SummaryCard + SummaryCardGrid
  compare/
    CompareView.tsx           # 비교 화면 전체 (클라이언트 재계산)
    ScenarioInputForm.tsx
    ScenarioResultCard.tsx
    ScenarioDiffSummary.tsx
  companies/
    CompanySearch.tsx         # 온보딩·비교 공용
    CompanyInfoCard.tsx       # 평균급여 + 주의 문구
  onboarding/
    OnboardingForm.tsx        # 단계 관리 + 제출
    StepBasicInfo.tsx / StepJobInfo.tsx / StepExpenses.tsx / StepGoal.tsx
  forms/fields.tsx            # TextField / NumberField / MoneyField
  auth/AuthForm.tsx
  layout/AppHeader.tsx
  common/
    SimulationDisclaimer.tsx  # 면책 문구 (모든 결과 화면 필수)
    MockDataBadge.tsx         # mock 데이터 배지
    SetupRequired.tsx         # Supabase 미설정 안내

lib/
  simulation/                 # ★ 전부 pure function
    index.ts                  # 공개 API
    income.ts                 # 소득 / 세후 추정
    expenses.ts               # 지출
    networth.ts               # 순자산 timeline (자산·부채 분리)
    commute.ts                # 통근시간 / 교통비
    goal.ts                   # 목표 달성 시점
    compare.ts                # 시나리오 비교 + 요약 문장
    series.ts                 # 차트용 계열 병합
    simulate.ts               # runSimulation
    utils.ts                  # 유한수 보정
    simulation.test.ts        # 계산 테스트
  constants/assumptions.ts    # ★ 모든 가정값 · 고정 UI 문구
  auth/
    dal.ts                    # ★ 실제 인증 검사 (requireUser / requireProfile)
    actions.ts                # signIn / signUp / signOut
  profile/
    transform.ts              # 폼 ↔ 시뮬레이션 입력 ↔ DB row 변환
    actions.ts                # saveOnboarding
  supabase/
    env.ts / client.ts / server.ts / mappers.ts
  companies/
    index.ts                  # 데이터 소스 선택 (fallback 포함)
    dart.ts                   # OpenDART (스텁)
    mock.ts                   # mock dataset
  validation/schemas.ts       # Zod 스키마
  format.ts                   # 금액/시간/목표 표시 포맷

types/index.ts                # 도메인 타입 정의
```

디렉터리를 미리 과하게 만들지 않는다. 필요할 때 만든다.

---

## 7. Data Model

Supabase(PostgreSQL) 테이블. 컬럼은 snake_case, TypeScript 타입은 camelCase로 매핑한다.

### `user_profiles`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | auth.users FK, unique |
| age | int | 필수 |
| residence | text | 필수 |
| current_assets | bigint | 원 단위, 필수 |
| current_debt | bigint | 원 단위, 필수 |
| household_type | text | 선택 |
| current_company_id | uuid | nullable |
| job_role | text | |
| annual_salary | bigint | 세전 연봉(원) |
| years_at_company | numeric | |
| work_location | text | |
| office_days_per_week | int | 0~7 |
| commute_minutes_per_day | int | **왕복** 분 |
| housing_cost_monthly | int | |
| living_cost_monthly | int | |
| transportation_cost_monthly | int | |
| insurance_cost_monthly | int | |
| debt_payment_monthly | int | |
| savings_monthly | int | |

### `companies`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid PK | |
| name | text | |
| dart_corp_code | text | nullable |
| average_salary | bigint | **회사 전체 직원 평균.** 개인 예상연봉으로 쓰지 말 것 |
| average_tenure | numeric | 평균 근속연수(년) |
| employee_count | int | |
| data_year | int | 공시 기준 연도 |
| is_mock | boolean | **필수.** mock 데이터 식별용 |

### `financial_goals`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| target_age | int | 예: 30 |
| target_net_worth | bigint | 예: 100000000 |

MVP에서는 "나이 + 목표 순자산" 형태로 단순화한다. 최소 1개를 입력받는다.

### `scenarios`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| name | text | 예: "회사 B로 이직" |
| company_id | uuid | |
| annual_salary | bigint | 사용자가 직접 입력/수정한 값 |
| office_days_per_week | int | |
| commute_minutes_per_day | int | |
| transportation_cost_monthly | int | |
| salary_growth_rate | numeric | nullable → 기본값 사용 |

### 규칙

- 모든 금액은 **원(KRW) 정수**로 저장한다. 만원/억 단위 변환은 표시 시점에만 한다.
- 모든 사용자 데이터 테이블에 **RLS를 활성화**하고 `user_id = auth.uid()` 정책을 건다.
- 구현 중 스키마를 단순화해도 좋다. 단, 단순화했으면 이 문서를 함께 갱신한다.
- P0 단계에서 `scenarios` 테이블 영속화는 선택이다. 비교는 메모리/URL state만으로도 가능하다.

---

## 8. Simulation Rules

### 8.1 배치 원칙

- 모든 계산은 `lib/simulation/*`의 **pure function**으로 작성한다.
- 입출력 타입을 명시한다. 함수 내부에서 fetch / DB / `Date.now()` 등 부수효과를 쓰지 않는다
  (기준 시점이 필요하면 인자로 받는다).
- **모든 가정값은 `lib/constants/assumptions.ts` 한 파일에만 존재한다.** 매직넘버 금지.

### 8.2 기본 가정값 (assumptions.ts)

```ts
DEFAULT_SALARY_GROWTH_RATE   // 연 3% (0.03)
DEFAULT_INVESTMENT_RETURN    // 0 (기본 미사용). 사용 시 UI에 가정 표시 필수
SIMULATION_YEARS             // 10
WORKING_WEEKS_PER_YEAR       // 통근 계산용 (예: 48)
```

### 8.3 요구 함수 시그니처

```ts
calculateAnnualIncome()          // 세전 연봉 → 추정 세후 소득
calculateAnnualExpenses()        // 월 지출 항목 합 × 12
calculateIncomeTimeline()        // 연도별 소득 배열
calculateNetWorthTimeline()      // 연도별 순자산 배열
calculateCommuteHours()          // 연간 / 누적 통근시간
calculateCommuteCost()           // 연간 / 누적 교통비
calculateGoalAchievementAge()    // 목표 달성 나이 (년 + 월)
compareScenarios()               // 두 시나리오 diff
```

### 8.4 계산 모델 (MVP)

**시간축 규약 — 모든 계산의 기준**

```
t = 0 .. SIMULATION_YEARS   (차트 포인트 11개)
t = 0  → "현재". 나이 = age, 순자산 = current_assets - current_debt
t ≥ 1  → "앞으로 t번째 해". 차트 X축 나이 = age + t
```

누적 소득은 **t=1..N의 합**이다. t=0은 이미 지난 시점이라 포함하지 않는다(포함하면 11년치가 된다).

**계산식**

```
세전연봉(t)      = 현재연봉 × (1 + 상승률)^(t-1)     # t≥1. 1년차는 아직 인상 없음
세후소득(t)      = 한계 공제율 누진 추정 (정교한 세법 구현 금지, UI에 "추정값" 표기)

debtPaid(t)      = min(월 대출상환액 × 12, 잔여부채)  # 잔여 부채를 넘겨 갚지 않음
연간 총지출(t)   = (주거비 + 생활비 + 교통비 + 보험료) × 12 + debtPaid(t)
잉여현금(t)      = 세후소득(t) - 연간 총지출(t)       # 음수 허용, 0으로 막지 않음

assets(t)        = assets(t-1) + 잉여현금(t)
debt(t)          = debt(t-1) - debtPaid(t)
순자산(t)        = assets(t) - debt(t)

저축률           = 월 저축액 / 월 추정 세후소득       # 분모 0이면 null → "계산 불가"
연간 통근시간    = commute_minutes_per_day × office_days_per_week × WORKING_WEEKS_PER_YEAR / 60
```

**왜 이렇게 되어 있는가**

- **연봉 상승 지수가 `(t-1)`인 이유**: 가입 즉시 유령 인상이 붙는 것을 막는다. 1년차에는 현재 연봉 그대로다.
- **세후 추정이 "한계 누진"인 이유**: 구간별 정액 세율을 쓰면 경계에서 실수령액이 역전된다
  (3,000만원 → 2,670만원인데 3,000만 1원 → 2,550만원). 각 구간에 속한 금액분만 공제율을
  적용하면 단조 증가가 보장된다. 단일 고정 세율은 고연봉의 세부담 증가를 전혀 못 보여줘서 배제.
- **자산과 부채를 분리하는 이유**: 상환액을 지출로만 빼고 부채를 고정하면 10년을 갚아도
  부채가 그대로 남아 순자산이 이중으로 깎인다. 상환액 x는 현금 −x·부채 −x라
  **순자산에 회계적으로 중립**이며, 부채가 소진된 해부터 상환액이 잉여현금으로 전환되어
  곡선에 의미 있는 변곡점이 생긴다. 이자는 반영하지 않으므로 UI에 그 가정을 명시한다.
- **`savings_monthly`를 순자산에 더하지 않는 이유**: 잉여현금과 이중 계산이 된다.
  순자산 축적의 유일한 기준은 잉여현금이다. 연봉이 바뀌면 저축도 따라 바뀌어야
  이직 비교가 성립하기 때문이기도 하다. `savings_monthly`의 용도는 **저축률 표시**와
  **온보딩 Step 3 정합성 경고** 두 가지뿐이다.
- **교통비의 단일 출처는 `transportation_cost_monthly`**다. `calculateCommuteCost()`는
  같은 필드를 읽는 표시용 파생 지표이며, 지출에 다시 더하면 중복 차감이 된다.

**기타 규칙**

- 투자수익률은 기본 0. 사용할 경우 반드시 UI에 "연 N% 수익 가정"을 노출한다.
- 목표 달성 시점은 연 단위 timeline을 **월 단위로 선형 보간**해 "31세 4개월" 형태로 표시한다.
  순자산이 감소하는 구간에서 0으로 나누지 않도록 방어한다.
- 목표를 시뮬레이션 기간 내 달성하지 못하면 임의 외삽하지 말고 "기간 내 미달성"으로 표시한다.
- 잉여현금·순자산이 음수여도 0으로 클램프하지 않는다. 줄어드는 것을 그대로 보여주되 경고를 띄운다.
- 모든 계산 반환값은 유한수여야 한다. NaN/Infinity가 차트에 들어가지 않게 경계에서 막는다.

### 8.5 비교 지표 (Compare)

두 시나리오에 대해 다음을 계산한다.

- 5년 / 10년 **누적 소득**
- 5년 / 10년 **예상 순자산**
- 누적 통근시간
- 누적 교통비
- 목표 자산 달성 시점

차이 요약 문장은 **deterministic 계산 결과로 생성**한다. LLM은 MVP에 필수가 아니다.

> 예: "이직 시 10년 동안 약 2,500만원의 추가 자산을 확보할 수 있지만, 약 900시간을 더 통근하게 됩니다."

---

## 9. External APIs

### OpenDART (직원 현황)

가져올 수 있는 값: 회사명, 직원 수, 평균 근속연수, 연간 급여총액, **1인 평균 급여액**

규칙:

1. API 키는 `.env.local`의 서버 전용 환경변수(`DART_API_KEY`)로만 사용한다. 하드코딩 금지.
2. 클라이언트에서 직접 호출하지 않는다. `app/api/companies/*` Route Handler를 경유한다.
3. **API 키가 없거나 호출이 실패해도 앱은 정상 동작해야 한다.**
   `lib/companies/index.ts`에서 mock dataset으로 fallback 한다.
4. mock dataset(`lib/companies/mock.ts`)은 `is_mock: true`로 표시하고, UI에 `MockDataBadge`를 노출한다.
   - 포함 회사: 삼성전자, NAVER, 카카오, SK하이닉스, 현대자동차, LG전자, 삼성SDS, 크래프톤, 엔씨소프트
5. 평균급여를 화면에 노출할 때는 **항상** 다음 설명을 함께 표시한다.

   > "공시된 회사 전체 직원 평균으로, 직급·직군별 실제 급여와 차이가 있을 수 있습니다."

### 비교 회사의 예상 연봉

**OpenDART 평균급여를 개인의 예상 연봉으로 자동 사용하지 않는다.** 다음 순서로 처리한다.

1. 사용자가 예상 연봉을 직접 입력 (기본 방식)
2. 없으면 테스트용 mock 참고값을 제시하되 "참고값"임을 명시하고 수정 가능하게 한다
3. 데이터 소스는 인터페이스로 추상화해 추후 외부 데이터 연동이 가능하게 한다

비교 회사 선택 시 사용자가 수정할 수 있어야 하는 값: **예상 연봉 / 주당 출근일 / 왕복 통근시간 / 월 교통비**

---

## 10. UI / UX Guidelines

톤: **금융 서비스처럼 신뢰감 있고 정돈된 화면.** 과한 애니메이션과 장식은 넣지 않는다.

- Desktop Web 우선, 반응형 지원
- 넓은 whitespace, 카드 기반 dashboard
- 핵심 숫자는 크게, 보조 설명은 작게
- 차트는 읽기 쉽게. 축 레이블과 단위(만원/억원)를 명확히
- 현재 시나리오와 비교 시나리오는 **색과 레이블로 명확히 구분**
- 차이값은 `+` / `-` 와 색(증가/감소)으로 표시
- Dark mode는 MVP 필수 아님

### 반드시 노출해야 하는 문구

모든 시뮬레이션 결과 화면(Dashboard, Compare) 하단에:

> "본 결과는 입력한 정보와 가정에 기반한 시뮬레이션이며 실제 미래 결과를 보장하지 않습니다."

→ `components/common/SimulationDisclaimer.tsx`로 공용화한다.

### Onboarding 4단계

| Step | 내용 |
|---|---|
| 1. 기본 정보 | 나이, 거주지역, 보유 자산, 부채 (필수) / 가구 형태 (선택) |
| 2. 직업 정보 | 회사, 직군, 연봉, 근속기간, 근무 지역, 주당 출근 횟수, 하루 왕복 통근시간 |
| 3. 월 생활비 | 주거비, 생활비, 교통비, 보험료, 대출 상환액, 월 저축/투자액 |
| 4. 재무 목표 | 목표 나이 + 목표 순자산 (최소 1개) |

MVP에서는 카드사·금융계좌를 연결하지 않는다. 전부 직접 입력이다.

### Dashboard Summary Cards (우선순위 순)

1. 현재 연봉
2. 현재 순자산
3. 현재 저축률
4. 예상 5년 후 순자산
5. 예상 10년 후 순자산
6. 목표 자산 달성 예상 나이

여유가 되면: 회사 평균 연봉 대비 위치 / 예상 연간 통근시간 / 예상 연간 교통비

### 그래프 3종 (Recharts)

| # | 내용 | 형태 |
|---|---|---|
| 1 | 예상 연봉 변화 (X: 나이 또는 연도, Y: 연간 소득) | Line |
| 2 | 예상 순자산 변화 (X: 나이, Y: 순자산) | Line / Area |
| 3 | 현재 회사 vs 다른 회사 | 2개 시리즈 Line |

### Landing Page 카피

- Headline: "연봉은 숫자 하나지만, 직업 선택의 결과는 10년 동안 이어집니다."
- Sub: "현재의 소득, 지출, 통근, 저축 데이터를 바탕으로 커리어 선택이 당신의 미래 자산과 시간에 어떤 변화를 만드는지 확인하세요."
- CTA: "내 미래 시뮬레이션 시작하기"

---

## 11. Coding Conventions

- TypeScript **strict mode** 유지. `any` 사용 최소화 (불가피하면 이유를 주석으로).
- 도메인 타입은 `types/index.ts`에 모으고, 계산 함수는 이 타입을 입출력으로 쓴다.
- 폼 검증은 Zod 스키마 + React Hook Form(`zodResolver`) 조합으로 통일한다.
- 컴포넌트가 커지면 분리한다. 단, **미리 추상화하지 않는다.** 2번 반복되면 그때 뽑는다.
- 기본은 Server Component. 상호작용이 필요한 곳에만 `"use client"`.
- 금액 포맷팅(원 → "4억 8,000만원")은 `lib/format.ts` 공용 유틸 하나로 처리한다.
- 실제 데이터와 mock 데이터를 코드 레벨에서 구분한다 (`is_mock` 플래그 + 배지).
- 시크릿 하드코딩 금지. `.env.local`은 `.gitignore`에 포함하고 `.env.example`을 제공한다.
- 새 기능을 붙이기 전에 **기존 P0 흐름이 깨지지 않았는지 먼저 확인**한다.
- 해커톤 기준: "완벽한 구조"보다 **"명확하고 안정적으로 작동하는 구조"**.

### Git 브랜치 규칙

**개인 브랜치에서 작업하고 `dev`로 PR을 올린다.**

```
origin/dev 최신화 → feat/… 또는 fix/… 브랜치 생성 → 커밋 → 푸시 → dev로 PR
```

- 브랜치 이름: 기능은 `feat/`, 수정은 `fix/` 접두사.
- **`dev`, `main`에 직접 커밋하지 않는다.** `dev`는 PR로만 들어가는 통합 브랜치다.
- **남의 작업 브랜치에 커밋하지 않는다.** 여러 사람이 동시에 작업하므로,
  체크아웃된 브랜치가 내 것이라고 가정하면 안 된다. 커밋 전에
  `git branch --show-current`로 확인하고, 내 브랜치가 아니면 새로 만든다.
- 새 브랜치는 현재 체크아웃된 브랜치가 아니라 **`origin/dev`에서 딴다**
  (`git switch -c fix/… origin/dev`).
- `dev` → `main` 병합은 릴리스 시점에 팀이 판단한다. 임의로 올리지 않는다.
- 이미 푸시된 공유 브랜치(`dev`, `main`)의 히스토리를 다시 쓰지 않는다.
  잘못 올렸으면 revert 커밋으로 되돌린다.

---

## 12. MVP Priorities

**P0 — 이것부터 끝낸다 (전부 완료 전엔 P2/P3 착수 금지)**

- 회원가입 / 로그인
- Onboarding 4단계 입력
- 사용자 데이터 저장 (Supabase)
- 미래 소득 timeline 계산
- 미래 순자산 timeline 계산
- Dashboard (Summary Cards)
- Recharts 시각화 (그래프 1, 2)
- 다른 회사 선택
- 현재 vs 이직 시나리오 비교 (그래프 3 + 결과 카드)

**P1**

- OpenDART API 연동
- 회사 검색
- 목표 자산 달성 시점
- 비교 결과 설명 문장 (deterministic)

**P2**

- 평균 사용자 비교 (동일 연령 평균 소득/자산/저축률, 유사 직군 평균 소득)
- AI 설명
- PDF 리포트
- 여러 Scenario 저장

**P3**

- 실제 금융계좌 / 카드 데이터 연동
- 고급 세금 계산
- 투자 포트폴리오 최적화
- 머신러닝 기반 미래 예측

---

## 13. Non-Goals

MVP에서 **하지 않는 것**. 요청받지 않았다면 먼저 만들지 않는다.

- 카드사 / 은행 계좌 연동
- 정교한 세법 기반 세금 계산
- 머신러닝 기반 연봉 예측
- 투자 포트폴리오 최적화 / 자산배분 추천
- 전역 상태관리 라이브러리 도입
- 다국어(i18n), Dark mode
- 페이지 추가 (권장 7개 페이지를 넘기지 않는다)
- 한 번에 여러 회사 동시 비교 (MVP는 현재 회사 VS 1개 회사)
- 금융·투자 조언(advice) 성격의 기능이나 문구

---

## 14. Important Domain Warnings

이 항목들은 **제품 신뢰성과 직결된다. 예외 없이 지킨다.**

1. **미래를 정확히 예측한다고 주장하지 않는다.** 문구는 항상 "시뮬레이션", "예상", "가정 기반".
2. **회사 전체 평균연봉을 개인의 예상 연봉으로 직접 사용하지 않는다.**
   OpenDART 1인 평균 급여액은 전 직원 평균이며 신입/특정 직군 연봉이 아니다.
3. **평균 근속연수를 개인의 퇴사 예상 시점으로 변환하지 않는다.**
4. **AI(모델)가 숫자를 임의로 생성하지 않는다.** 모든 수치는 코드 계산 결과여야 한다.
   LLM을 쓴다면 **이미 계산된 결과를 설명하는 역할만** 맡는다.
5. **가짜 통계를 실제 통계처럼 보여주지 않는다.**
   평균 사용자 비교 기능은 신뢰 가능한 출처가 없다면 **mock임을 명시하거나 기능을 숨긴다.**
6. **금융·투자 조언 서비스처럼 표현하지 않는다.** "이 회사로 가세요" 같은 권유 문구 금지.
7. **왜 이런 결과가 나왔는지 설명 가능한 계산 구조를 유지한다.** 블랙박스 계산 금지.
8. 모든 결과 화면에 면책 문구를 노출한다.

---

## 15. Definition of Done

MVP는 아래 데모가 **막힘없이 재현될 때** 완료된 것으로 본다.

> **사용자가 회원가입 후 자신의 정보를 입력하고, 현재 회사에서 10년간 근무할 경우의
> 예상 소득/순자산 그래프를 확인한다. 이후 다른 회사를 선택하고 예상 연봉과 통근 조건을
> 입력하면 두 시나리오의 10년 소득, 순자산, 통근시간 및 목표 자산 달성 시점이 즉시 비교된다.**

체크리스트:

- [ ] 신규 계정으로 가입 → 온보딩 → 대시보드까지 리다이렉트가 정상 동작한다
- [ ] 입력한 데이터가 저장되고, 재로그인 후에도 유지된다
- [ ] Dashboard에 Summary Cards와 그래프 1·2가 실제 입력값 기반으로 렌더링된다
- [ ] `/compare`에서 회사를 검색/선택하고 예상 연봉·통근 조건을 수정할 수 있다
- [ ] 두 시나리오가 같은 차트에 그려지고, 비교 카드와 차이 요약 문장이 표시된다
- [ ] 목표 자산 달성 시점이 두 시나리오 각각에 대해 표시된다
- [ ] DART API 키 없이도(mock fallback) 전체 흐름이 동작한다
- [ ] 모든 결과 화면에 시뮬레이션 면책 문구가 있다
- [ ] mock 데이터가 실제 데이터처럼 보이지 않는다
- [ ] 타입 에러와 빌드 에러가 없다

---

## 16. 구현 메모 (실제 코드 기준)

구현 중 확정된 규약이다. 모르고 어기면 바로 깨지는 것들이라 먼저 읽는다.

### Next.js 16 (학습 데이터와 다름)

- **`middleware.ts`가 아니라 `proxy.ts`**다. 함수명도 `proxy`, 런타임은 nodejs 고정(edge 불가).
- **`cookies()`, `headers()`, `params`, `searchParams`는 전부 async**다. 동기 접근은 제거됐다.
- 페이지 props 타입은 `PageProps<'/경로'>` / `LayoutProps<'/'>`를 쓴다.
  경로를 추가하면 `npx next typegen`으로 타입을 재생성해야 타입 에러가 사라진다.
- 자세한 내용은 `node_modules/next/dist/docs/`에 번들된 공식 문서를 본다.

### 인증

- `proxy.ts`는 **세션 갱신 + 낙관적 리다이렉트**만 한다. 프리페치 포함 모든 요청에서 돌기 때문에
  여기서 DB를 조회하지 않는다.
- 실제 인증·인가는 **`lib/auth/dal.ts`(Data Access Layer) + RLS**가 담당한다.
  보호 페이지는 `requireUser()` / `requireProfile()`를 호출한다.
- 세션은 `getSession()`이 아니라 **`getUser()`** 로 확인한다(쿠키를 신뢰하지 않고 인증 서버에서 검증).
- **보호 페이지에는 `export const dynamic = 'force-dynamic'`이 필요하다.**
  없으면 환경변수가 비어 있는 빌드에서 "설정 필요" 화면이 정적으로 구워져 버린다.

### 폼

- **금액 입력은 화면에서 만원 단위, DB에는 원 단위**다. `manToWon()` / `wonToMan()`으로만 변환한다.
- **폼 스키마에 `z.coerce`를 쓰지 않는다.** coerce는 입력 타입이 `unknown`이라
  react-hook-form의 제네릭과 충돌한다. `register(name, { valueAsNumber: true })` +
  순수 `z.number()` 조합을 쓴다.
- 같은 이유로 폼 스키마에 `.default()`를 쓰지 않는다(입력 타입이 optional이 되어 어긋난다).
  기본값은 `useForm`의 `defaultValues`로 준다.
- 폼 값 ↔ 시뮬레이션 입력 ↔ DB row 변환은 전부 `lib/profile/transform.ts`에 있다.
  컴포넌트가 직접 단위 변환이나 산수를 하지 않는다.

### UI 라이브러리

- 이 프로젝트의 shadcn/ui는 **Radix가 아니라 Base UI** 기반이다.
  `asChild`가 없다. 링크 버튼은 `buttonVariants()`를 `<Link>`에 입히거나 `render` prop을 쓴다.
- dark 모드는 `.dark` **클래스** 기반이다. 클래스를 붙이지 않으므로 앱은 라이트 전용으로 동작한다.

### 다단계 폼 (실제로 물렸던 함정)

- **같은 위치의 버튼을 조건부로 갈아끼우지 않는다.** React가 `<button>` DOM 노드를
  재사용하기 때문에, "다음"을 누른 순간 `setStep`으로 리렌더되면 그 노드가
  `type="submit"`으로 바뀌고 브라우저가 클릭의 기본 동작을 수행해 **폼이 제출된다.**
  항상 `type="button"`으로 두고 제출은 `form.handleSubmit(...)`을 직접 호출한다.
  (`submit` 함수 안에도 마지막 단계인지 확인하는 가드를 둔다)
- **아직 건드리지 않은 필드에 에러를 띄우지 않는다.** zodResolver는 스키마 전체를
  검증하므로, 입력이 blur될 때마다 다음 단계의 빈 필드까지 에러로 잡힌다.
  그 검증은 비동기라 `clearErrors`로 지워도 뒤늦게 도착해 덮어쓴다.
  지우지 말고 **보여줄 조건을 좁힌다** — 사용자가 건드린 필드(`touchedFields`)이거나,
  그 단계에서 "다음"을 눌러 막힌 경우에만 표시한다.

### 차트

- 계열 색은 **검증된 팔레트**다(`components/charts/chartTheme.ts`).
  blue `#2a78d6` = "현재", orange `#eb6834` = "이직/비교 대상"으로 **고정**한다.
  색각 이상 분리도 ΔE 24.7 / 일반 시야 33.6 / 표면 대비 3:1을 통과한 조합이니 임의로 바꾸지 않는다.
- 규칙: 축을 두 개 쓰지 않는다 · 선 2px · 그리드는 1px 실선(점선 금지) ·
  2계열 이상이면 범례 필수(1계열은 제목이 대신함) · **글자에 계열 색을 입히지 않는다**
  (신원은 글자 옆 색 마크가 전달) · 선 차트에는 크로스헤어 + 툴팁을 기본 제공.

### 회사 데이터

- 검색 우선순위: OpenDART(미구현 스텁) → Supabase `companies` → 인메모리 mock.
  **어느 단계에서 실패해도 예외를 던지지 않는다.** 검색이 앱을 멈추게 하면 안 된다.
- mock 회사는 `is_mock = true`, `data_year = null`(실제 공시 연도처럼 보이지 않게),
  값은 눈에 띄게 반올림된 근사치만 쓴다. UI에는 `MockDataBadge`를 반드시 노출한다.
- 인메모리 mock의 id는 `mock:` 접두사라 UUID가 아니다. FK로 저장되지 않고 회사명만 기록된다.

### 검증 명령

```bash
npm test          # 계산 함수 단위 테스트 (vitest)
npm run typecheck # tsc --noEmit
npm run build     # 프로덕션 빌드
```
