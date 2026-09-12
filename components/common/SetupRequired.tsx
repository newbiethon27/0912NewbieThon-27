import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Supabase 환경변수가 없을 때 보여주는 안내.
 *
 * 인증을 우회하거나 가짜로 저장하지 않고, 필요한 설정을 그대로 드러낸다.
 */
export function SetupRequired() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <Alert>
        <AlertTitle>Supabase 설정이 필요합니다</AlertTitle>
        <AlertDescription>
          <div className="space-y-3 text-sm">
            <p>
              로그인과 데이터 저장에는 Supabase 연결이 필요합니다. 아직 연결되지
              않아 이 화면을 보고 있습니다.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  supabase.com
                </a>
                에서 프로젝트를 생성합니다.
              </li>
              <li>
                Project Settings → API 에서 <code>Project URL</code>과{' '}
                <code>anon public key</code>를 복사합니다.
              </li>
              <li>
                <code>.env.example</code>을 <code>.env.local</code>로 복사한 뒤
                두 값을 채웁니다.
              </li>
              <li>
                SQL Editor에서 <code>supabase/schema.sql</code> 전체를
                실행합니다.
              </li>
              <li>
                Authentication → Providers → Email 을 켜고{' '}
                <strong>Confirm email 을 끕니다.</strong>
              </li>
              <li>개발 서버를 재시작합니다.</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
