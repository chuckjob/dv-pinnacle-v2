import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { VeraChatPanel } from '@/components/vera/VeraChatPanel';
import { VeraProvider, useVera } from '@/hooks/use-vera';
import { cn } from '@/lib/utils';

function AppShellInner() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { veraOpen, veraContext, closeVera } = useVera();

  return (
    <div className="h-screen flex flex-col bg-neutral-25">
      {/* Header spans full width, always visible */}
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Content area — holds both main content and Vera panel side by side */}
        <div className="flex-1 flex overflow-hidden px-4 pt-2 pb-4 gap-3">
          {/* Main content */}
          <div className={cn('relative flex-1 min-w-0 rounded-2xl bg-white shadow-sm p-6', veraOpen ? 'overflow-hidden' : 'overflow-y-auto')}>
            <Breadcrumbs />
            <Outlet />
            {/* Scrim overlay when Vera is open — z-30 to sit above all page content */}
            {veraOpen && (
              <div className="absolute inset-0 z-30 rounded-2xl pointer-events-none transition-opacity duration-300" style={{ backgroundColor: 'rgba(20, 17, 59, 0.15)' }} />
            )}
          </div>

          {/* Vera AI chat panel */}
          <VeraChatPanel open={veraOpen} onClose={closeVera} context={veraContext} />
        </div>
      </div>
    </div>
  );
}

export default function AppShell() {
  return (
    <VeraProvider>
      <AppShellInner />
    </VeraProvider>
  );
}
