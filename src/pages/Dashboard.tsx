import React from 'react';
import {
  Calendar as CalendarIcon,
  FileText,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Clock,
  ExternalLink,
  Sun,
  BookOpen,
  User as UserIcon
} from 'lucide-react';

import { DUMMY_SCHEDULES, DUMMY_TRAININGS } from '../constants';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ isAuthenticated, isAdmin }) => {
  const today = new Date();
  const [scheduleDate, setScheduleDate] = React.useState(today);

  const formattedDate = format(today, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko });
  const time = format(today, 'HH:mm');

  const selectedDaySchedules = DUMMY_SCHEDULES.filter(s =>
    isSameDay(new Date(s.date), scheduleDate)
  );

  const goToPreviousDay = () => setScheduleDate(prev => subDays(prev, 1));
  const goToNextDay = () => setScheduleDate(prev => addDays(prev, 1));
  const goToToday = () => setScheduleDate(today);

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

        {/* Bottom Row: Main Schedule (Daily View) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-blue-600 rounded-full" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 leading-none">주요 학교 일정</h2>
                <p className="text-slate-400 text-sm mt-1 font-medium italic">
                  {format(scheduleDate, 'yyyy. MM. dd (EEEE)', { locale: ko })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={goToPreviousDay}
                className="p-2 hover:bg-white hover:text-blue-600 rounded-lg transition-all hover:shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors border-x border-slate-200"
              >
                오늘
              </button>
              <button
                onClick={goToNextDay}
                className="p-2 hover:bg-white hover:text-blue-600 rounded-lg transition-all hover:shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={scheduleDate.toISOString()}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {selectedDaySchedules.length === 0 ? (
                  <div className="h-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium">등록된 일정이 없습니다.</p>
                  </div>
                ) : (
                  selectedDaySchedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center gap-6 p-6 bg-slate-50/80 hover:bg-white rounded-2xl transition-all border border-slate-100 hover:border-blue-200 hover:shadow-md group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${schedule.category === '공문' ? 'bg-orange-100 text-orange-600' :
                            schedule.category === '행사' ? 'bg-blue-100 text-blue-600' :
                              'bg-slate-200 text-slate-600'
                            }`}>
                            {schedule.category}
                          </span>
                          {schedule.important && (
                            <span className="flex items-center gap-1 text-[10px] font-black text-red-500 animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              중요
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors uppercase">
                          {schedule.title}
                        </h3>
                        {schedule.description && (
                          <p className="text-slate-500 mt-2 text-sm leading-relaxed">{schedule.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
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
        {!isAuthenticated && (
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-100 italic">로그인이 필요합니다</p>
              <p className="text-xs text-blue-300/80 mt-1 leading-relaxed">
                상세 일정 확인 및 공문 조회 등 모든 기능을 사용하시려면 로그인해 주세요.
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">두고두고 볼 것</h2>
          <p className="text-slate-400 text-sm">자주 확인해야 하는 중요 공지 및 연수</p>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
          {DUMMY_TRAININGS.map((post) => (
            <button
              key={post.id}
              disabled={!isAuthenticated}
              className={`w-full text-left p-5 bg-white/5 rounded-xl border border-white/10 transition-all group ${isAuthenticated ? 'hover:bg-white/10 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{post.author}</span>
                {isAuthenticated && <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />}
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-blue-300 transition-colors">{post.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                {post.summary}
              </p>
            </button>
          ))}

        </div>


        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {isAuthenticated ? '김다수 선생님' : '로그인 전'}
              </p>
              <p className="text-xs">
                {isAuthenticated ? '오늘도 행복한 하루 되세요!' : '서비스 이용을 위해 로그인해주세요.'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

