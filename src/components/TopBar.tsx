import React from 'react';
import { Bell, User as UserIcon, Menu, LogOut } from 'lucide-react';
import { User } from '../types';

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
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          온 마음으로 <span className="text-blue-600">정시퇴근</span>을 꿈꾸는 행복 <span className="text-blue-600">김천다수</span> 교무통신
        </h1>
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

        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <button className="p-2 hover:bg-slate-100 rounded-full relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200">
            <UserIcon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};

