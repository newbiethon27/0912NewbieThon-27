import { AuthForm } from '@/components/auth/AuthForm';
import { SetupRequired } from '@/components/common/SetupRequired';
import { signUp } from '@/lib/auth/actions';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export default function SignupPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  return <AuthForm mode="signup" action={signUp} />;
}
