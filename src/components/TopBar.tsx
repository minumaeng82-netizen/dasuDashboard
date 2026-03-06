import React, { useState } from 'react';
import { Bell, User as UserIcon, Menu, LogOut, Sparkles, Monitor, Tablet, Smartphone, RotateCcw, MonitorSmartphone } from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useDeviceMode } from '../context/DeviceContext';
import { cn } from '../lib/utils';

interface TopBarProps {
  onMenuClick: () => void;
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onMenuClick,
  user,
  onLogout,
  onLoginClick
}) => {
  const { mode, setMode, isManual, resetToAuto } = useDeviceMode();
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  const isMobile = mode === 'Mobile';
  const isTablet = mode === 'Tablet';

  return (
    <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className={cn(
            "p-2 hover:bg-slate-100 rounded-lg transition-all",
            !isMobile && !isTablet && "lg:hidden"
          )}
        >
          <Menu className="w-6 h-6 text-slate-600" />
        </button>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <div className="flex w-10 h-10 items-center justify-center overflow-hidden">
            <img
              src="/icon.png"
              alt="Icon"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="w-6 h-6 bg-blue-600 rounded-md" />';
              }}
            />
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center">
            <span className="text-blue-600 mr-2">김천다수</span>
            <span className="text-slate-900">교무포털</span>
          </h1>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        {/* Mobile Device Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowDeviceMenu(!showDeviceMenu)}
            className={cn(
              "p-2 rounded-lg transition-all flex items-center justify-center",
              isManual ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500",
              "hover:bg-blue-100 hover:text-blue-600"
            )}
            title="기기 최전환"
          >
            <MonitorSmartphone className="w-5 h-5 sm:w-6 h-6" />
          </button>

          <AnimatePresence>
            {showDeviceMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDeviceMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-2 border-b border-slate-100 bg-slate-50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider">화면 최적화 설정</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => { resetToAuto(); setShowDeviceMenu(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        !isManual ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>자동 반응형</span>
                    </button>
                    <button
                      onClick={() => { setMode('PC'); setShowDeviceMenu(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isManual && mode === 'PC' ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Monitor className="w-4 h-4" />
                      <span>PC 모드</span>
                    </button>
                    <button
                      onClick={() => { setMode('Tablet'); setShowDeviceMenu(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isManual && mode === 'Tablet' ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Tablet className="w-4 h-4" />
                      <span>태블릿 모드</span>
                    </button>
                    <button
                      onClick={() => { setMode('Mobile'); setShowDeviceMenu(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isManual && mode === 'Mobile' ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>모바일 모드</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:block text-right">
              <p className="text-sm font-bold text-slate-900">{user.name} 선생님</p>
              <p className="text-[10px] text-slate-500">{user.role === 'admin' ? '관리자' : '교직원'}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors"
            >
              <LogOut className="w-4 h-4 sm:w-5 h-5" />
              <span className="hidden md:inline">로그아웃</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 text-sm sm:text-base"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
};

