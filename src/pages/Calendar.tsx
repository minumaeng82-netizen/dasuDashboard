import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { DUMMY_SCHEDULES } from '../constants';
import { cn } from '../lib/utils';

export const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">일정 관리</h1>
          <p className="text-slate-500 mt-1">학교의 모든 일정을 공유하고 관리하세요.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          일정 등록
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {/* Calendar Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">
              {format(currentMonth, 'yyyy년 MM월')}
            </h2>
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button 
                onClick={prevMonth}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button 
                onClick={nextMonth}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              오늘
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button className="px-3 py-1.5 text-sm font-bold bg-white shadow-sm rounded-md text-blue-600">월간</button>
            <button className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">주간</button>
            <button className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">목록</button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {weekDays.map((day, i) => (
              <div 
                key={day} 
                className={cn(
                  "py-3 text-center text-xs font-bold uppercase tracking-wider",
                  i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-400"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((day, i) => {
              const daySchedules = DUMMY_SCHEDULES.filter(s => 
                isSameDay(new Date(s.date), day)
              );
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);

              return (
                <div 
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[100px] p-2 transition-colors cursor-pointer flex flex-col gap-1",
                    !isCurrentMonth ? "bg-slate-50/50" : "bg-white hover:bg-slate-50",
                    isSelected && "ring-2 ring-inset ring-blue-500 z-10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                      !isCurrentMonth ? "text-slate-300" : 
                      day.getDay() === 0 ? "text-red-500" : 
                      day.getDay() === 6 ? "text-blue-500" : "text-slate-600",
                      isToday && "bg-blue-600 text-white font-bold"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {daySchedules.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {daySchedules.length}개
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-1 mt-1 scrollbar-hide">
                    {daySchedules.map(schedule => (
                      <div 
                        key={schedule.id}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold truncate border",
                          schedule.category === '공문' ? "bg-orange-50 text-orange-600 border-orange-100" :
                          schedule.category === '행사' ? "bg-blue-50 text-blue-600 border-blue-100" :
                          schedule.category === '연수' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          "bg-slate-50 text-slate-600 border-slate-200"
                        )}
                      >
                        {schedule.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
