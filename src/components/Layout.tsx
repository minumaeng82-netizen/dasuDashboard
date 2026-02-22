import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { User } from '../types';

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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentPath={currentPath}
        onNavigate={onNavigate}
        isAdmin={user?.role === 'admin'}
      />

      <div className="flex-1 flex flex-col lg:ml-64">
        <TopBar
          onMenuClick={() => setIsSidebarOpen(true)}
          user={user}
          onLogout={onLogout}
          onLoginClick={() => onNavigate('/login')}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

