import React from 'react';
import { Bell, User as UserIcon, Menu, LogOut, Sparkles } from 'lucide-react';
import { User } from '../types';
import { motion } from 'motion/react';

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
  return (
    <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-6 h-6 text-slate-600" />
        </button>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="hidden sm:flex w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl items-center justify-center shadow-lg shadow-blue-200">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex flex-wrap items-center gap-x-2">
            <span className="text-slate-400 font-medium text-sm md:text-base w-full md:w-auto">온 마음으로</span>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
              정시퇴근
            </span>
            <span className="text-slate-800">을 꿈꾸는 행복</span>
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">김천다수</span>
              <span className="absolute bottom-1 left-0 w-full h-2 bg-blue-100 -z-0 rounded-full opacity-60"></span>
            </span>
            <span className="text-slate-900">교무통신</span>
          </h1>
        </motion.div>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-900">{user.name} 선생님</p>
              <p className="text-[10px] text-slate-500">{user.role === 'admin' ? '관리자' : '교직원'}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">로그아웃</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
};

