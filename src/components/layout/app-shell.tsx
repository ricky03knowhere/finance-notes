'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CalendarDays, LayoutDashboard, ReceiptText, Tags, Wallet, PiggyBank } from 'lucide-react';
import type { Route } from 'next';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/' as Route, label: 'Dashboard', icon: LayoutDashboard },
  { href: '/wallet' as Route, label: 'Wallet', icon: Wallet },
  { href: '/transactions' as Route, label: 'Transaction', icon: ReceiptText },
  { href: '/categories' as Route, label: 'Category', icon: Tags },
  { href: '/budget' as Route, label: 'Budget', icon: BarChart3 },
  { href: '/saving-goal' as Route, label: 'Saving Goal', icon: PiggyBank },
  { href: '/bills' as Route, label: 'Bills', icon: CalendarDays },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 md:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 flex-col rounded-3xl border border-border bg-card/90 p-4 shadow-soft backdrop-blur md:flex">
          <div className="mb-8 rounded-2xl bg-primary px-4 py-4 text-primary-foreground shadow-soft">
            <p className="text-sm font-medium uppercase tracking-[0.24em] opacity-80">Finora</p>
            <h1 className="mt-1 text-2xl font-semibold">Smart Finance</h1>
          </div>
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                    active
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                  href={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <main className="flex-1">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-2 gap-2 rounded-3xl border border-border bg-card/95 p-2 shadow-soft backdrop-blur md:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-xs font-medium transition',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
              href={item.href}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}