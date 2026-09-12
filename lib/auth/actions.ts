'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { credentialsSchema } from '@/lib/validation/schemas';

export interface AuthFormState {
  error?: string;
  /** 이메일 확인이 필요한 경우처럼, 실패는 아니지만 안내가 필요할 때 */
  notice?: string;
}

function parseCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
}

/** 안전한 내부 경로인지 확인한다 (오픈 리다이렉트 방지) */
function safeRedirectTo(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인하세요.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  }

  revalidatePath('/', 'layout');
  redirect(safeRedirectTo(formData.get('redirectTo')) ?? '/dashboard');
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인하세요.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return {
      error:
        error.message === 'User already registered'
          ? '이미 가입된 이메일입니다. 로그인해 주세요.'
          : `가입에 실패했습니다: ${error.message}`,
    };
  }

  // Supabase에서 "Confirm email"이 켜져 있으면 세션 없이 가입만 된다.
  // 로그인된 척하지 않고 사실대로 안내한다.
  if (!data.session) {
    return {
      notice:
        '가입 확인 메일을 보냈습니다. 메일의 링크를 눌러 인증한 뒤 로그인해 주세요. ' +
        '(Supabase 대시보드에서 Authentication → Providers → Email의 "Confirm email"을 끄면 바로 로그인됩니다.)',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
