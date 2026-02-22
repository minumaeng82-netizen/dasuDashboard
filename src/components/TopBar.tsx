import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
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
          온 마음으로 미래를 여는 행복 <span className="text-blue-600">김천다수초등학교</span> 교무통신
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="hidden md:flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-blue-600 font-bold transition-colors">
          로그인
        </button>
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <button className="p-2 hover:bg-slate-100 rounded-full relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};
