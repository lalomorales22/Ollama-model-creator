import React from 'react';
import { Sidebar } from './CollapsibleSidebar';
import { Header } from './Header';
import { CommandPalette } from '@/components/CommandPalette';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <div className="pt-16">
        <Sidebar />
        <main 
          className={cn(
            "p-4 md:p-6 transition-all duration-300",
            // Desktop: adjust margin based on sidebar state
            sidebarCollapsed ? "md:ml-[72px]" : "md:ml-64",
            // Mobile: no margin
            "ml-0"
          )}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}