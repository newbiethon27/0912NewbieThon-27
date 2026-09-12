# LifePath

커리어 선택이 미래의 돈과 시간을 어떻게 바꾸는지 보여주는 시뮬레이션 서비스.

현재 직장·연봉·자산·지출·저축을 입력하면 앞으로 10년의 소득과 순자산을 그려주고,
다른 회사로 이직했을 때와 나란히 비교한다.

> 모든 결과는 입력값과 명시된 가정에 기반한 **시뮬레이션**이며 실제 미래를 보장하지 않는다.

개발 규칙과 도메인 제약은 [`CLAUDE.md`](./CLAUDE.md)에 있다.

---

## 실행에 필요한 설정

### 1. Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com/dashboard)에서 새 프로젝트를 만든다 (region은 Seoul 권장).
2. **Project Settings → API**에서 `Project URL`과 `anon public key`를 복사한다.
3. **SQL Editor**에서 [`supabase/schema.sql`](./supabase/schema.sql) 전체를 붙여넣고 실행한다.
   테이블 4개 + RLS 정책 + mock 회사 9곳이 한 번에 만들어진다. 여러 번 실행해도 안전하다.
4. **Authentication → Providers → Email**을 켜고 **"Confirm email"을 끈다.**
   켜져 있으면 가입 직후 메일 확인 단계가 끼어들어 데모 흐름이 끊긴다.

### 2. 환경변수

```bash
cp .env.example .env.local
```

`.env.local`에 위에서 복사한 두 값을 채운다.

| 이름 | 필수 | 비고 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | 클라이언트 노출 OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | 클라이언트 노출 OK (RLS가 보호) |
| `DART_API_KEY` | — | 없어도 mock 회사 데이터로 전체 흐름이 동작한다. **서버 전용** |

설정 전에는 앱이 인증을 우회하지 않고 "Supabase 설정이 필요합니다" 안내 화면을 띄운다.

### 3. 실행

```bash
npm install
npm run dev
```

> `.env.local` 없이도 `npm install` · `npm test` · `npm run build`는 모두 통과한다.
> 다만 로그인과 데이터 저장에는 Supabase 연결이 필요하므로, 위 1~2번을 마치기 전에는
> 앱이 "Supabase 설정이 필요합니다" 안내 화면을 띄운다.

---

## 명령어

```bash
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
npm test           # 계산 함수 단위 테스트 (vitest)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

---

## 구조 한눈에

| 위치 | 역할 |
|---|---|
| `lib/simulation/` | 모든 계산. 전부 pure function이고 DB·fetch에 의존하지 않는다 |
| `lib/constants/assumptions.ts` | 연봉 상승률·세율 구간 등 **모든 가정값의 단일 출처** |
| `lib/auth/dal.ts` | 실제 인증 검사. `proxy.ts`는 낙관적 리다이렉트만 한다 |
| `lib/profile/transform.ts` | 폼 ↔ 시뮬레이션 입력 ↔ DB row 변환 |
| `components/charts/` | Recharts 시각화. 계열 색은 검증된 팔레트로 고정 |

계산 로직은 컴포넌트 안에 두지 않는다. 차트는 계산이 끝난 배열을 props로 받기만 한다.

---

## 주의사항

- 회사 공시 **평균급여를 개인의 예상 연봉으로 자동 적용하지 않는다.** 사용자가 직접 입력한다.
- mock 회사 데이터는 실제 공시값이 아니다. `is_mock` 플래그와 "데모 데이터" 배지로 항상 구분한다.
- 금액은 DB에 원 단위 정수로 저장하고, 폼에서는 만원 단위로 입력받는다.
