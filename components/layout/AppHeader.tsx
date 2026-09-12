import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth/actions';

const NAV = [
  { href: '/dashboard', label: '리포트' },
  { href: '/compare', label: '비교' },
  { href: '/settings', label: '설정' },
] as const;

export function AppHeader({ active }: { active?: string }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-4">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          LifePath
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-2.5 py-1.5 text-sm ${
                active === item.href
                  ? 'text-foreground bg-muted font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form action={signOut} className="ml-auto">
          <Button type="submit" variant="ghost" size="sm">
            로그아웃
          </Button>
        </form>
      </div>
    </header>
  );
}
