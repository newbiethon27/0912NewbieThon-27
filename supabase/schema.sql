-- LifePath 스키마
--
-- 적용 방법: Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 실행한다.
-- 여러 번 실행해도 안전하도록 작성했다(멱등).
--
-- 금액 컬럼은 전부 원(KRW) 정수(bigint)다. 만원/억 변환은 화면에서만 한다.

-- ===========================================================================
-- companies
--   DART 공시 회사 + 개발/데모용 mock 데이터.
--   is_mock으로 둘을 반드시 구분한다.
-- ===========================================================================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  -- 시드를 여러 번 실행해도 중복되지 않도록 unique
  name text not null unique,
  dart_corp_code text unique,
  -- 공시된 회사 "전체 직원" 1인 평균 급여액.
  -- 개인의 예상 연봉으로 직접 사용하지 않는다.
  average_salary bigint,
  average_tenure numeric(4, 1),
  employee_count integer,
  -- 공시 기준 연도. mock 데이터는 실제 공시가 아니므로 null로 둔다.
  data_year integer,
  is_mock boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists companies_name_idx on public.companies (name);

-- ===========================================================================
-- user_profiles
-- ===========================================================================
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,

  -- Step 1. 기본 정보
  age integer not null check (age between 15 and 100),
  residence text not null,
  current_assets bigint not null default 0 check (current_assets >= 0),
  current_debt bigint not null default 0 check (current_debt >= 0),
  household_type text,

  -- Step 2. 직업 정보
  -- 목록에 없는 회사도 입력할 수 있어야 하므로 FK와 자유 입력 이름을 함께 둔다.
  current_company_id uuid references public.companies (id) on delete set null,
  current_company_name text,
  job_role text not null default '',
  -- 세전 연봉
  annual_salary bigint not null default 0 check (annual_salary >= 0),
  years_at_company numeric(4, 1) not null default 0 check (years_at_company >= 0),
  work_location text not null default '',
  office_days_per_week integer not null default 5
    check (office_days_per_week between 0 and 7),
  -- 하루 왕복 통근 분
  commute_minutes_per_day integer not null default 0
    check (commute_minutes_per_day between 0 and 1440),

  -- Step 3. 월 생활비
  housing_cost_monthly bigint not null default 0 check (housing_cost_monthly >= 0),
  living_cost_monthly bigint not null default 0 check (living_cost_monthly >= 0),
  transportation_cost_monthly bigint not null default 0
    check (transportation_cost_monthly >= 0),
  insurance_cost_monthly bigint not null default 0 check (insurance_cost_monthly >= 0),
  debt_payment_monthly bigint not null default 0 check (debt_payment_monthly >= 0),
  -- 순자산 계산에는 쓰지 않는다. 저축률 표시와 입력 정합성 경고 전용.
  savings_monthly bigint not null default 0 check (savings_monthly >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- financial_goals
--   MVP는 "나이 + 목표 순자산" 형태로 단순화한다.
-- ===========================================================================
create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_age integer not null check (target_age between 15 and 100),
  target_net_worth bigint not null check (target_net_worth > 0),
  created_at timestamptz not null default now()
);

create index if not exists financial_goals_user_id_idx
  on public.financial_goals (user_id);

-- ===========================================================================
-- scenarios
--   MVP에서는 비교를 클라이언트 state로 처리하므로 아직 쓰지 않는다.
--   P2 "여러 Scenario 저장"을 위해 자리만 만들어 둔다.
-- ===========================================================================
create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  company_id uuid references public.companies (id) on delete set null,
  annual_salary bigint not null default 0 check (annual_salary >= 0),
  office_days_per_week integer not null default 5
    check (office_days_per_week between 0 and 7),
  commute_minutes_per_day integer not null default 0
    check (commute_minutes_per_day between 0 and 1440),
  transportation_cost_monthly bigint not null default 0
    check (transportation_cost_monthly >= 0),
  -- null이면 기본 상승률(assumptions.ts)을 사용한다
  salary_growth_rate numeric(4, 3),
  created_at timestamptz not null default now()
);

create index if not exists scenarios_user_id_idx on public.scenarios (user_id);

-- ===========================================================================
-- updated_at 자동 갱신
-- ===========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Row Level Security
--   사용자 데이터는 본인 것만 읽고 쓴다.
--   companies는 로그인 사용자에게 읽기만 허용하고 쓰기 정책은 두지 않는다.
-- ===========================================================================
alter table public.user_profiles enable row level security;
alter table public.financial_goals enable row level security;
alter table public.scenarios enable row level security;
alter table public.companies enable row level security;

drop policy if exists "own profile select" on public.user_profiles;
create policy "own profile select" on public.user_profiles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own profile insert" on public.user_profiles;
create policy "own profile insert" on public.user_profiles
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "own profile update" on public.user_profiles;
create policy "own profile update" on public.user_profiles
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own goals select" on public.financial_goals;
create policy "own goals select" on public.financial_goals
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own goals insert" on public.financial_goals;
create policy "own goals insert" on public.financial_goals
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "own goals update" on public.financial_goals;
create policy "own goals update" on public.financial_goals
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own goals delete" on public.financial_goals;
create policy "own goals delete" on public.financial_goals
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "own scenarios all" on public.scenarios;
create policy "own scenarios all" on public.scenarios
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "companies readable" on public.companies;
create policy "companies readable" on public.companies
  for select to authenticated using (true);

-- ===========================================================================
-- Mock 회사 시드 (개발/데모 전용)
--
--   실제 공시값이 아니다. 그래서:
--     - is_mock = true
--     - data_year = null  (실제 공시 연도인 것처럼 보이지 않게 한다)
--     - 값은 눈에 띄게 반올림된 근사치만 사용한다
--   UI는 이 데이터에 반드시 "데모 데이터" 배지를 노출해야 한다.
-- ===========================================================================
insert into public.companies
  (name, average_salary, average_tenure, employee_count, data_year, is_mock)
values
  ('삼성전자',     130000000, 13.0, 120000, null, true),
  ('SK하이닉스',   120000000, 12.0,  30000, null, true),
  ('NAVER',        120000000,  6.0,   4500, null, true),
  ('카카오',       110000000,  6.0,   4000, null, true),
  ('현대자동차',   110000000, 19.0,  70000, null, true),
  ('LG전자',       110000000, 14.0,  35000, null, true),
  ('삼성SDS',      100000000, 12.0,  12000, null, true),
  ('크래프톤',     120000000,  4.0,   1700, null, true),
  ('엔씨소프트',   110000000,  6.0,   4700, null, true)
on conflict (name) do nothing;
