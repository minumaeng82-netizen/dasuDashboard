import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  Settings,
  Settings2,
  ShieldCheck,
  LogOut,
  X,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useDeviceMode } from '../context/DeviceContext';

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
  { icon: BookOpen, label: '두고두고 볼 것들', path: '/training' },
];


export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
  isAdmin
}) => {
  const { mode, setMode, isManual, resetToAuto } = useDeviceMode();
  const isMobile = mode === 'Mobile';

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
        "fixed top-0 left-0 h-full bg-slate-900 text-slate-300 w-64 z-50 transition-transform duration-300",
        (mode === 'PC' || mode === 'Tablet') ? "translate-x-0" : (isOpen ? "translate-x-0" : "-translate-x-full")
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-full shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-black text-lg tracking-tighter">김천다수교무포털</span>
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
            <>
              <button
                onClick={() => {
                  onNavigate('/shortcuts');
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  currentPath === '/shortcuts'
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-800 hover:text-white text-blue-400"
                )}
              >
                <ExternalLink className="w-5 h-5" />
                <span className="font-medium">바로가기 관리</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('/admin-settings');
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  currentPath === '/admin-settings'
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-800 hover:text-white text-blue-400"
                )}
              >
                <Settings2 className="w-5 h-5" />
                <span className="font-medium">설정</span>
              </button>
            </>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800 space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">화면 최적화</span>
              {!isManual && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-md font-bold">AUTO</span>}
            </div>
            <div className="flex items-center justify-between bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
              <button
                onClick={resetToAuto}
                className={cn(
                  "p-2 rounded-lg transition-all flex-1 flex justify-center",
                  !isManual ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
                title="자동 반응형 모드"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMode('PC')}
                className={cn(
                  "p-2 rounded-lg transition-all flex-1 flex justify-center",
                  isManual && mode === 'PC' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
                title="PC 강제 고정"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMode('Tablet')}
                className={cn(
                  "p-2 rounded-lg transition-all flex-1 flex justify-center",
                  isManual && mode === 'Tablet' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
                title="태블릿 강제 고정"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMode('Mobile')}
                className={cn(
                  "p-2 rounded-lg transition-all flex-1 flex justify-center",
                  isManual && mode === 'Mobile' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
                title="모바일 강제 고정"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              onNavigate('/settings');
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              currentPath === '/settings'
                ? "bg-blue-600 text-white"
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">내 설정</span>
          </button>
        </div>
      </aside>
    </>
  );
};

