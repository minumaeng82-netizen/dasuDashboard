import React from 'react';
import { 
  Calendar as CalendarIcon, 
  FileText, 
  AlertCircle, 
  ChevronRight,
  Clock,
  ExternalLink,
  Sun,
  BookOpen,
  User
} from 'lucide-react';
import { DUMMY_SCHEDULES, DUMMY_TRAININGS } from '../constants';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion } from 'motion/react';

export const Dashboard: React.FC = () => {
  const today = new Date();
  const formattedDate = format(today, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko });
  const time = format(today, 'HH:mm');

  return (
    <div className="grid grid-cols-12 gap-6 h-full min-h-[calc(100vh-160px)]">
      {/* Left Area (Col 1-8) */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        {/* Top Row: Date & Weather */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-center shadow-sm"
          >
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <CalendarIcon className="w-6 h-6" />
              <span className="font-bold tracking-wider uppercase text-sm">Today's Date</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">
              {formattedDate}
            </h2>
            <p className="text-xl text-slate-500 mt-2 font-medium">현재 시각 {time}</p>
          </motion.div>

          {/* Weather Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center shadow-sm text-center"
          >
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
              <Sun className="w-10 h-10 text-yellow-500" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-slate-900">맑음 12°C</p>
              <p className="text-sm text-slate-500">미세먼지: <span className="text-emerald-500 font-bold">좋음</span></p>
              <p className="text-xs text-slate-400 mt-2">김천시 다수동 기준</p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Row: Main Schedule */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full" />
              주요 학교 일정
            </h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-600 transition-colors">주간</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm">월간</button>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {DUMMY_SCHEDULES.map((schedule) => (
              <div key={schedule.id} className="flex items-center gap-6 p-4 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                <div className="w-16 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase">{format(new Date(schedule.date), 'EEE', { locale: ko })}</p>
                  <p className="text-xl font-black text-slate-900">{format(new Date(schedule.date), 'dd')}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      schedule.category === '공문' ? 'bg-orange-100 text-orange-600' :
                      schedule.category === '행사' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {schedule.category}
                    </span>
                    {schedule.important && <span className="text-[10px] font-bold text-red-500">● 중요</span>}
                  </div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{schedule.title}</h3>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white rounded-lg transition-all">
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Area (Col 9-12) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="col-span-12 lg:col-span-4 bg-slate-900 rounded-2xl p-8 shadow-xl text-white flex flex-col"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">두고두고 볼 것</h2>
          <p className="text-slate-400 text-sm">자주 확인해야 하는 중요 공지 및 연수</p>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
          {DUMMY_TRAININGS.map((post) => (
            <button 
              key={post.id}
              className="w-full text-left p-5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{post.author}</span>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-blue-300 transition-colors">{post.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                {post.summary}
              </p>
            </button>
          ))}
          
          {/* Quick Action Cards */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-600/30 transition-colors">
              <FileText className="w-6 h-6 text-blue-400" />
              <span className="text-xs font-bold">나이스 바로가기</span>
            </div>
            <div className="p-4 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-emerald-600/30 transition-colors">
              <BookOpen className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-bold">에듀파인</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">김다수 선생님</p>
              <p className="text-xs">오늘도 행복한 하루 되세요!</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
