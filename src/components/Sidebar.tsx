import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  isAdmin: boolean;
}

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: '대시보드', path: '/' },
  { icon: Calendar, label: '일정 관리', path: '/calendar' },
  { icon: BookOpen, label: '연수 게시판', path: '/training' },
  { icon: FileText, label: '공문함', path: '/documents' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
  isAdmin
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full bg-slate-900 text-slate-300 w-64 z-50 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-slate-900 font-bold">퇴근</span>';
              }} />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">정시퇴근</span>
          </button>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>


        <nav className="p-4 space-y-1">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                onNavigate(item.path);
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                currentPath === item.path
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('/users');
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                currentPath === '/users'
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white text-blue-400"
              )}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">사용자 관리</span>
            </button>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">내 설정</span>
          </button>
        </div>
      </aside>
    </>
  );
};

