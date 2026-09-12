import { AuthForm } from '@/components/auth/AuthForm';
import { SetupRequired } from '@/components/common/SetupRequired';
import { signIn } from '@/lib/auth/actions';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export default async function LoginPage(props: PageProps<'/login'>) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const searchParams = await props.searchParams;
  const raw = searchParams.redirectTo;
  const redirectTo = typeof raw === 'string' ? raw : undefined;

  return <AuthForm mode="login" action={signIn} redirectTo={redirectTo} />;
}
