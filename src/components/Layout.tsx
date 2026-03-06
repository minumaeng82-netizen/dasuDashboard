import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { User } from '../types';
import { ShortcutBar } from './ShortcutBar';
import { cn } from '../lib/utils';
import { useDeviceMode } from '../context/DeviceContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentPath,
  onNavigate,
  user,
  onLogout
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { mode } = useDeviceMode();

  const isMobile = mode === 'Mobile';
  const isTablet = mode === 'Tablet';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentPath={currentPath}
        onNavigate={onNavigate}
        isAdmin={user?.role === 'admin'}
      />

      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        (mode === 'PC' || mode === 'Tablet') ? "ml-64" : "ml-0"
      )}>
        <TopBar
          onMenuClick={() => setIsSidebarOpen(true)}
          user={user}
          onLogout={onLogout}
          onLoginClick={() => onNavigate('/login')}
        />
        {!isMobile && !isTablet && <ShortcutBar user={user} currentPath={currentPath} mode={mode} />}

        <main className={cn(
          "flex-1 p-4 md:p-6 lg:p-8 mx-auto w-full",
          currentPath === '/calendar' ? "max-w-none" : "max-w-7xl",
          isMobile && "p-2"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

