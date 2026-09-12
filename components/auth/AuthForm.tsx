'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AuthFormState } from '@/lib/auth/actions';

type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

interface AuthFormProps {
  mode: 'login' | 'signup';
  action: AuthAction;
  redirectTo?: string;
}

const COPY = {
  login: {
    title: '로그인',
    submit: '로그인',
    pending: '로그인 중…',
    switchText: '아직 계정이 없으신가요?',
    switchHref: '/signup',
    switchLabel: '회원가입',
  },
  signup: {
    title: '회원가입',
    submit: '가입하고 시작하기',
    pending: '가입 중…',
    switchText: '이미 계정이 있으신가요?',
    switchHref: '/login',
    switchLabel: '로그인',
  },
} as const;

export function AuthForm({ mode, action, redirectTo }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    action,
    {},
  );
  const copy = COPY[mode];

  return (
    <div className="mx-auto w-full max-w-sm px-6 py-16">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        LifePath
      </Link>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">
        {copy.title}
      </h1>
      {mode === 'signup' && (
        <p className="text-muted-foreground mt-2 text-sm">
          가입 후 몇 가지 정보를 입력하면 바로 시뮬레이션을 볼 수 있습니다.
        </p>
      )}

      <form action={formAction} className="mt-8 space-y-4">
        {redirectTo && (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        )}

        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === 'signup' ? 'new-password' : 'current-password'
            }
            required
            minLength={6}
            placeholder="6자 이상"
          />
        </div>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.notice && (
          <Alert>
            <AlertDescription>{state.notice}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="h-10 w-full text-sm"
        >
          {isPending ? copy.pending : copy.submit}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-sm">
        {copy.switchText}{' '}
        <Link
          href={copy.switchHref}
          className="text-foreground underline underline-offset-4"
        >
          {copy.switchLabel}
        </Link>
      </p>
    </div>
  );
}
