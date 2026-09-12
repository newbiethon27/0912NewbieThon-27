# 시뮬레이션 알고리즘

현재 `lib/simulation/`에 구현된 계산 로직 전부를 정리한 문서다.
비교 알고리즘을 개선하기 위한 출발점이며, **지금 코드가 실제로 하는 일**만 적는다.

- 모든 함수는 pure function이다. fetch · DB · `Date.now()`에 의존하지 않는다.
- 모든 가정값은 `lib/constants/assumptions.ts` 한 곳에 있다.
- 모든 금액은 원(KRW) 정수다. 만원/억 변환은 표시 시점에만 한다.

---

## 1. 입력

`SimulationInput` (`types/index.ts`)

| 필드 | 단위 | 설명 |
|---|---|---|
| `age` | 세 | 현재 나이 |
| `currentAssets` | 원 | 현재 보유 자산 |
| `currentDebt` | 원 | 현재 부채 잔액 |
| `annualSalary` | 원 | **세전** 연봉 |
| `officeDaysPerWeek` | 일 | 주당 출근 횟수 (0~7) |
| `commuteMinutesPerDay` | 분 | 하루 **왕복** 통근시간 |
| `housingCostMonthly` | 원 | 월 주거비 |
| `livingCostMonthly` | 원 | 월 생활비 |
| `transportationCostMonthly` | 원 | 월 교통비 |
| `insuranceCostMonthly` | 원 | 월 보험료 |
| `debtPaymentMonthly` | 원 | 월 대출 상환액 |
| `savingsMonthly` | 원 | 월 저축·투자액 — **순자산 계산에 쓰지 않는다** (§4.7) |
| `salaryGrowthRate` | 소수 | 연봉 상승률 (기본 0.03) |
| `years` | 년 | 시뮬레이션 기간 (기본 10) |

## 2. 가정값

`lib/constants/assumptions.ts`

```
SIMULATION_YEARS            = 10
MILESTONE_SHORT_YEARS       = 5
MILESTONE_LONG_YEARS        = 10
DEFAULT_SALARY_GROWTH_RATE  = 0.03
DEFAULT_INVESTMENT_RETURN   = 0      // MVP 미사용
WORKING_WEEKS_PER_YEAR      = 48
MATERIAL_DIFF_THRESHOLD     = 1_000_000
```

---

## 3. 시간축 규약

모든 계산의 기준이다.

```
t = 0 .. years          차트 포인트 years+1개 (기본 11개)
t = 0   "현재"           나이 = age, 순자산 = currentAssets - currentDebt
t ≥ 1   "앞으로 t번째 해"  나이 = age + t
```

**누적값은 항상 `t = 1..N`의 합이다.** `t=0`은 이미 지난 시점이라 포함하지 않는다.
포함하면 10년 누적이 11년치가 된다.

---

## 4. 알고리즘

### 4.1 세전 연봉 — `calculateGrossSalary(input, t)`

```
t ≤ 1  →  annualSalary
t ≥ 2  →  round(annualSalary × (1 + salaryGrowthRate)^(t-1))
```

지수가 `t`가 아니라 `(t-1)`인 이유: **1년차에는 아직 인상이 없다.**
`t`를 쓰면 가입하자마자 한 번 오른 것처럼 보인다.

결과적으로 `t=0`과 `t=1`의 연봉이 같고, 차트의 첫 구간이 평평하다. 의도된 모양이다.

### 4.2 추정 세후 소득 — `estimateNetIncome(gross)`

**한계 공제율 누진** 방식이다. 각 구간에 속한 금액분에만 해당 공제율을 적용한다.

```
deduction = Σ (구간에 속한 금액 × 구간 공제율)
net       = gross - deduction
```

| 구간 (이하) | 공제율 |
|---|---|
| 3,000만원 | 12% |
| 5,000만원 | 18% |
| 8,000만원 | 24% |
| 1억 2,000만원 | 30% |
| 초과 | 35% |

소득세 + 4대보험을 합쳐 근사한 값이며 정교한 세법 계산이 아니다.

**왜 정액이 아니라 누진인가.** 구간별 정액 세율(연봉 전체에 한 세율 적용)을 쓰면
경계에서 실수령액이 역전된다. 3,000만원은 12%로 2,640만원인데
3,000만 1원은 18%가 적용돼 2,460만원이 되어, 연봉이 오르는데 손에 쥐는 돈이 줄어든다.
누진이면 단조 증가가 보장된다. 단일 고정 세율은 고연봉의 세부담 증가를
전혀 드러내지 못해 이직 비교의 설득력을 떨어뜨리므로 쓰지 않는다.

`gross ≤ 0`이면 0을 반환한다.

### 4.3 연간 지출 — `calculateAnnualExpenses(input, debtPaidThisYear)`

```
월 고정지출 = housingCost + livingCost + transportationCost + insuranceCost
연간 총지출 = 월 고정지출 × 12 + debtPaidThisYear
```

- **교통비의 단일 출처는 `transportationCostMonthly`다.** `calculateCommuteCost()`는
  같은 필드를 읽는 표시용 파생 지표이며, 지출에 다시 더하면 중복 차감이 된다.
- 대출 상환액은 연도마다 잔여 부채에 따라 달라지므로 월 고정지출에 넣지 않고
  인자로 받는다.
- **지출에는 물가상승률이 적용되지 않는다.** 10년 내내 같은 금액이다 (§6 한계).

### 4.4 순자산 — `calculateNetWorthTimeline(input)` ★ 핵심

자산과 부채를 따로 굴리고 마지막에 뺀다.

```
assets(0) = currentAssets
debt(0)   = max(0, currentDebt)
netWorth(0) = assets(0) - debt(0)

for t = 1..years:
    debtPaid(t) = min(debtPaymentMonthly × 12, debt(t-1))   // 잔여를 넘겨 갚지 않음
    net(t)      = estimateNetIncome(grossSalary(t))
    surplus(t)  = net(t) - annualExpenses(input, debtPaid(t))
    assets(t)   = assets(t-1) + surplus(t)
    debt(t)     = debt(t-1) - debtPaid(t)
    netWorth(t) = assets(t) - debt(t)
```

**대출 상환은 전액 원금 상환으로 가정한다** (이자 미반영).

이 모델의 성질:

- 상환액 x는 현금 −x, 부채 −x라 **순자산에 회계적으로 중립**이다.
- 부채가 소진된 해부터 `debtPaid = 0`이 되어 그만큼 잉여현금이 늘어난다.
  순자산 곡선에 변곡점이 생기며, 이건 사용자에게 유의미한 정보다.
- `debt`는 음수로 내려가지 않는다.
- **`surplus`가 음수여도 0으로 막지 않는다.** 자산이 줄어드는 것을 그대로 보여준다.
- 순자산도 음수를 허용한다. 차트는 0선을 참조선으로 표시한다.

**왜 자산·부채를 분리하는가.** 상환액을 지출로만 빼고 부채를 고정하면,
10년을 갚아도 부채가 그대로 남아 순자산이 이중으로 깎인다.

**투자수익률은 적용하지 않는다** (`DEFAULT_INVESTMENT_RETURN = 0`).

### 4.5 통근시간·교통비

```
연간 통근시간 = commuteMinutesPerDay × officeDaysPerWeek × WORKING_WEEKS_PER_YEAR / 60
누적 통근시간 = 연간 통근시간 × years

연간 교통비   = transportationCostMonthly × 12
누적 교통비   = 연간 교통비 × years
```

`commuteMinutesPerDay`는 **왕복** 분이다. 출근일을 바꿔도 교통비는 자동으로
조정되지 않는다 — 사용자가 직접 입력한다.

### 4.6 목표 달성 시점 — `calculateGoalAchievementAge(timeline, goal, currentAge)`

순자산 timeline에서 목표를 처음 넘어서는 지점을 찾아 **월 단위로 선형 보간**한다.

```
crossingIndex = netWorth ≥ target 인 첫 인덱스

없음        → { status: 'not_reached' }
인덱스 0    → { status: 'already_achieved', age: currentAge, months: 0 }
그 외:
    prev, cur = timeline[i-1], timeline[i]
    delta     = cur.netWorth - prev.netWorth
    fraction  = delta > 0 ? (target - prev.netWorth) / delta : 0
    age       = prev.age
    months    = round(fraction × 12)
    if months ≥ 12 → age += 1, months -= 12      // 반올림 정규화
    vsTargetMonths = (달성 개월수) - (목표 개월수)   // 양수면 목표보다 늦음
```

- `delta > 0` 가드는 순자산이 감소하는 구간에서 **0으로 나누는 것을 막는다.**
- 기간 내에 도달하지 못하면 **외삽하지 않고** `not_reached`로 표시한다.
  임의로 연장 추정하지 않는다는 제품 원칙이다.

### 4.7 저축률 — `runSimulation`

```
monthlyNet = round(net(1) / 12)
savingsRate = monthlyNet > 0 ? savingsMonthly / monthlyNet : null
```

**`savingsMonthly`는 순자산 계산에 쓰지 않는다.** 순자산 축적의 유일한 기준은
`surplus`(세후소득 − 총지출)다. 둘을 모두 더하면 이중 계산이 된다.

`savingsMonthly`의 용도는 두 가지뿐이다.
1. 저축률 카드 표시
2. 온보딩 Step 3의 정합성 경고 — `monthlySurplus < savingsMonthly`이면
   "지출과 저축의 합이 세후소득을 초과합니다" 경고를 띄운다

연봉이 바뀌면 저축도 따라 바뀌어야 이직 비교가 성립하므로, 고정된 입력값이 아니라
계산된 잉여현금을 기준으로 삼는다.

### 4.8 시나리오 비교 — `compareScenarios(current, alternative)`

모든 차이는 **`alternative − current`** 방향이다.

| 지표 | 계산 |
|---|---|
| 10년 누적 소득(세전) | `Σ gross(t=1..10)` 의 차 |
| 10년 누적 소득(세후) | `Σ net(t=1..10)` 의 차 |
| 10년 예상 순자산 | `netWorth(10)` 의 차 |
| 누적 통근시간 | 차 |
| 누적 교통비 | 차 |
| 목표 달성 시점 | 개월 차. **한쪽이라도 `not_reached`면 `null`** |

이직 시나리오에서 **달라지는 값은 4개뿐**이다: 연봉, 주당 출근일, 왕복 통근시간, 월 교통비.
주거비·생활비·보험료·대출상환액·연봉 상승률은 현재와 동일하다고 가정한다.

### 4.9 요약 문장 생성 — `buildSummary`

**LLM을 쓰지 않는다.** 규칙 기반 분기로만 만든다.

```
asset   = |assetDiff| < 1,000,000  → 'similar'
          assetDiff > 0            → 'gain'
          else                     → 'loss'

commute = |hoursDiff| < 1          → 'same'
          hoursDiff > 0            → 'longer'
          else                     → 'shorter'
```

3 × 3 = 9개 조합에 각각 고정 문장이 대응된다. 예:

> 이직 시 10년 동안 약 1억 5,817만원의 추가 자산을 확보할 수 있지만,
> 약 1,600시간을 더 통근하게 됩니다.

**권유형 표현을 생성하지 않는다.** "이직하세요", "유리합니다", "추천" 같은 단어는
쓰지 않으며 테스트로 고정되어 있다. 어느 쪽이 나은지는 사용자가 판단한다.

---

## 5. 전체 흐름

```
UserProfile (DB, 원 단위)
   ↓  profileToSimulationInput()          lib/profile/transform.ts
SimulationInput
   ↓  runSimulation({ label, input, goal })
   ├─ calculateIncomeTimeline()      → IncomePoint[]   (t=0..10)
   ├─ calculateNetWorthTimeline()    → NetWorthPoint[] (t=0..10)
   ├─ milestoneIncome()              → 5년/10년 누적 소득
   ├─ netWorthAtYear()               → 5년/10년 순자산
   ├─ calculateCommuteHours/Cost()   → 연간·누적
   ├─ savingsRate
   └─ calculateGoalAchievementAge()  → GoalResult
SimulationResult
   ↓  compareScenarios(current, alternative)
ComparisonResult { diff, goalDiffMonths, summary }
```

Compare 화면은 사용자가 조건을 바꿀 때마다 **같은 순수 함수를 클라이언트에서 재호출**한다.
서버 왕복도 DB 쓰기도 없다.

---

## 6. 검증된 예시

입력: 30세 · 세전 5,500만원 · 자산 5,000만원 · 부채 3,000만원 ·
월 지출(주거 70 / 생활 90 / 교통 15 / 보험 15) · 월 상환 50만원 ·
월 저축 140만원 · 통근 왕복 80분 × 주 5일 · 목표 35세 2억원

| 항목 | 값 | 검산 |
|---|---|---|
| 현재 순자산 | 2,000만원 | 5,000 − 3,000 |
| 1년차 세후소득 | 4,660만원 | 5,500 − (3,000×12% + 2,000×18% + 500×24%) |
| 월 세후소득 | 388만원 | 4,660 / 12 |
| 월 고정지출 + 상환 | 240만원 | 190 + 50 |
| 1년차 잉여현금 | 1,780만원 | 4,660 − 2,880 |
| 저축률 | 36.1% | 140 / 388 |
| 부채 소진 | 5년차 | 3,000 / (50×12) |
| 5년 후 순자산 | 1억 5,192만원 | |
| 10년 후 순자산 | 3억 1,919만원 | |
| 10년 누적 소득(세전) | 6억 3,051만원 | |
| 10년 누적 통근시간 | 3,200시간 | 80 × 5 × 48 × 10 / 60 |
| 목표 달성 | 36세 7개월 (목표보다 1년 7개월 늦음) | |

이 값들은 단위 테스트(`lib/simulation/simulation.test.ts`, 32개)와
실제 화면 양쪽에서 확인되었다.

---

## 7. 현재 한계

비교 알고리즘을 개선할 때 다룰 지점들이다. **영향이 큰 순서로** 정리했다.

### 7.1 연봉 상승률이 시나리오 공통 고정값 (영향 매우 큼)

두 시나리오 모두 연 3%를 쓴다. 회사·직군·연차에 따른 성장 속도 차이가 반영되지 않는다.

10년 복리라 이 가정 하나가 결과를 지배한다. 예를 들어 A사 3% / B사 6%면
10년차 연봉이 **약 29.5% 벌어지는데**(`1.06⁹ / 1.03⁹ = 1.295`),
현재 모델은 이를 **전혀 표현하지 못한다.** 시작 연봉이 같으면 두 시나리오의
소득 곡선이 완전히 겹친다.

이직 비교 서비스의 핵심 변수인데 사용자가 조정할 수도 없다.

### 7.2 지출에 물가상승이 없음 (영향 큼)

소득만 연 3% 오르고 지출은 10년 내내 고정이다. 그 결과 저축률이 해마다
비현실적으로 상승하고, **순자산이 낙관적으로 과대평가된다.**

§6 예시에서 잉여현금은 1년차 1,780만원 → 10년차 3,654만원으로 **약 2.05배**가 된다.
부채 소진(5년차) 효과를 빼고 보더라도 상당 부분이 이 비대칭 때문이다.

### 7.3 투자수익률 미반영 (영향 큼)

`DEFAULT_INVESTMENT_RETURN = 0`. 10년 자산 형성에서 복리 수익은 핵심 요인인데
전부 현금으로 쌓인다고 가정한다. 보수적이지만, 자산이 많은 사용자일수록 왜곡이 커진다.

### 7.4 대출 이자 미반영 (영향 중간)

전액 원금 상환 가정이라 낙관 편향이 있다. 실제로는 상환액의 일부가 이자로 나가
부채가 더 천천히 줄어든다. 부채가 큰 사용자에게 오차가 크다.

### 7.5 통근시간이 통합 지표가 아님 (제품 판단 필요)

돈과 시간을 나란히 보여줄 뿐, 하나의 점수로 합치지 않는다.
"연봉 500만원 더 받고 통근 1시간 더"의 우열은 사용자가 판단한다.

시간을 화폐로 환산하면 비교는 쉬워지지만 **투자·재무 조언처럼 읽힐 위험**이 있다.
제품 원칙(§도메인 경고)과 충돌하므로 도입한다면 신중해야 한다.

### 7.6 이직 전환 비용 미반영 (영향 중간)

이직은 `t=1`에 즉시 일어나고 비용이 0이다. 공백기, 퇴직금, 사이닝 보너스,
스톡옵션 소멸, 이사비용이 모두 빠져 있다.

### 7.7 단일 결정론 경로 (영향 중간)

가정값 하나당 하나의 선을 그린다. 불확실성 구간이 없어 결과가 실제보다
확정적으로 보인다. 민감도 분석이나 시나리오 밴드가 없다.

### 7.8 기타

- 세금 근사에 부양가족·공제·지역가입자 구분이 없다
- 승진·재이직 등 경로 변화를 모델링하지 않는다
- 비교는 1:1 고정 (현재 회사 vs 1개사)
- 연 단위 계산이라 연중 이직·상여 시점을 표현하지 못한다

---

## 8. 개선 시 지켜야 할 것

무엇을 바꾸든 아래는 유지한다.

1. **계산은 pure function으로** — `lib/simulation`에 부수효과를 들이지 않는다.
   Compare 화면의 즉시 재계산이 여기에 의존한다.
2. **가정값은 `assumptions.ts` 한 곳에** — 매직넘버를 흩뿌리지 않는다.
3. **새 가정은 UI에 노출한다** — 투자수익률·물가상승률을 도입하면
   "연 N% 가정"을 반드시 화면에 표시한다.
4. **설명 가능성** — 왜 이 숫자가 나왔는지 코드로 추적 가능해야 한다.
   블랙박스 모델을 넣지 않는다.
5. **AI가 숫자를 만들지 않는다** — 계산은 코드가 하고, LLM은 결과 설명만 맡는다.
6. **예측이라 주장하지 않는다** — 문구는 항상 "시뮬레이션", "가정 기반".
7. **테스트를 먼저 고정한다** — 이중 계산·경계값·단조성은 이미 테스트로 잠겨 있다.
   모델을 바꾸면 테스트도 함께 갱신한다.
