'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  FileText,
  FolderOpen,
  BookTemplate,
  LayoutTemplate,
  History,
} from 'lucide-react';

const navigation = [
  { name: '규칙', href: '/rules', icon: FileText },
  { name: '카테고리', href: '/categories', icon: FolderOpen },
  { name: '프리셋', href: '/presets', icon: BookTemplate },
  { name: '템플릿', href: '/templates', icon: LayoutTemplate },
  { name: '스냅샷', href: '/snapshots', icon: History },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-muted/40">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-semibold">프롬프트 관리자</h1>
        </div>
        <nav className="space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto pl-10">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}
