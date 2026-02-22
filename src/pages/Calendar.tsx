import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
  Trash2,
  Edit2,
  Lock
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
  eachDayOfInterval
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { DUMMY_SCHEDULES } from '../constants';
import { cn } from '../lib/utils';
import { Schedule, Category, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarProps {
  user: User | null;
}

export const Calendar: React.FC<CalendarProps> = ({ user }) => {
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Registration Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('기타');
  const [newImportant, setNewImportant] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [regDate, setRegDate] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  // Daily View Modal State
  const [isDailyViewOpen, setIsDailyViewOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('school_schedules');
      if (saved && saved !== 'undefined') {
        setSchedules(JSON.parse(saved));
      } else {
        setSchedules(DUMMY_SCHEDULES);
        localStorage.setItem('school_schedules', JSON.stringify(DUMMY_SCHEDULES));
      }
    } catch (err) {
      console.error('Failed to parse schedules from localStorage:', err);
      setSchedules(DUMMY_SCHEDULES);
      localStorage.setItem('school_schedules', JSON.stringify(DUMMY_SCHEDULES));
    }
  }, []);


  const saveSchedules = (updated: Schedule[]) => {
    setSchedules(updated);
    localStorage.setItem('school_schedules', JSON.stringify(updated));
  };

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

  const openRegisterModal = (date?: Date) => {
    if (!isAuthenticated && !isAdmin) return;
    if (date) {
      setRegDate(format(date, 'yyyy-MM-dd'));
    } else {
      setRegDate(format(new Date(), 'yyyy-MM-dd'));
    }
    setIsModalOpen(true);
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !regDate) return;

    if (editingId) {
      const updated = schedules.map(s =>
        s.id === editingId
          ? { ...s, title: newTitle, category: newCategory, important: newImportant, description: newDescription, date: regDate, isPrivate: newIsPrivate }
          : s
      );
      saveSchedules(updated);
    } else {
      const newEntry: Schedule = {
        id: Math.random().toString(36).substr(2, 9),
        title: newTitle,
        date: regDate,
        category: newCategory,
        important: newImportant,
        description: newDescription,
        authorEmail: user?.email,
        isPrivate: newIsPrivate
      };
      saveSchedules([...schedules, newEntry]);
    }

    // Reset Form
    setNewTitle('');
    setNewCategory('기타');
    setNewImportant(false);
    setNewDescription('');
    setNewIsPrivate(false);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const openEditModal = (e: React.MouseEvent, schedule: Schedule) => {
    e.stopPropagation();
    setEditingId(schedule.id);
    setNewTitle(schedule.title);
    setNewCategory(schedule.category);
    setNewImportant(schedule.important);
    setNewIsPrivate(schedule.isPrivate || false);
    setNewDescription(schedule.description || '');
    setRegDate(schedule.date);
    setIsDailyViewOpen(false);
    setIsModalOpen(true);
  };

  const openDailyView = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    setViewDate(date);
    setIsDailyViewOpen(true);
  };

  const deleteSchedule = (id: string) => {
    const target = schedules.find(s => s.id === id);
    if (!target) return;

    if (window.confirm(`'${target.title}' 일정을 정말로 삭제하시겠습니까?`)) {
      const updated = schedules.filter(s => s.id !== id);
      saveSchedules(updated);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">일정 관리</h1>
          <p className="text-slate-500 mt-1">학교의 모든 일정을 공유하고 관리하세요.</p>
        </div>
        {(isAuthenticated || isAdmin) && (
          <button
            onClick={() => openRegisterModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors shadow-sm active:scale-95"
          >
            <Plus className="w-5 h-5" />
            일정 등록
          </button>
        )}
      </header>

      {!isAuthenticated && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-blue-500" />
          <p className="text-sm text-blue-700 font-medium">로그인하시면 학교 일정을 등록하고 관리하실 수 있습니다.</p>
        </div>
      )}

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

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('all')}
              className={cn(
                "px-4 py-1.5 text-sm font-bold rounded-md transition-all",
                viewMode === 'all'
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              학교 일정
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  alert('로그인이 필요한 기능입니다.');
                  return;
                }
                setViewMode('mine');
              }}
              className={cn(
                "px-4 py-1.5 text-sm font-bold rounded-md transition-all",
                viewMode === 'mine'
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              내 일정
            </button>
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
              const displaySchedules = schedules.filter(s => {
                const sameDay = isSameDay(new Date(s.date), day);
                if (!sameDay) return false;

                // Show in 'Mine' view if it's my schedule
                if (viewMode === 'mine') {
                  return s.authorEmail === user?.email;
                }

                // In 'All' view: Show ONLY public schedules
                return !s.isPrivate;
              });
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);

              return (
                <div
                  key={day.toString()}
                  onClick={() => {
                    setSelectedDate(day);
                    if ((isAuthenticated || isAdmin)) {
                      openRegisterModal(day);
                    }
                  }}
                  className={cn(
                    "min-h-[100px] p-2 transition-colors cursor-pointer flex flex-col gap-1 relative group",
                    !isCurrentMonth ? "bg-slate-100/30" : "bg-white hover:bg-slate-50",
                    isSelected && "bg-blue-50/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all",
                      !isCurrentMonth ? "text-slate-300" :
                        day.getDay() === 0 ? "text-red-500" :
                          day.getDay() === 6 ? "text-blue-500" : "text-slate-600",
                      isToday && "bg-blue-600 text-white font-bold shadow-md shadow-blue-200"
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openDailyView(e, day)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                        title="상세 보기"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                      {(isAuthenticated || isAdmin) && isCurrentMonth && (
                        <Plus className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden space-y-1 mt-1">
                    {displaySchedules.slice(0, 2).map(schedule => (
                      <div
                        key={schedule.id}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold truncate border shadow-sm transition-transform hover:scale-105",
                          schedule.category === '공문' ? "bg-orange-50 text-orange-600 border-orange-100" :
                            schedule.category === '행사' ? "bg-blue-50 text-blue-600 border-blue-100" :
                              schedule.category === '연수' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                "bg-slate-50 text-slate-600 border-slate-200"
                        )}
                        title={schedule.title}
                      >
                        {schedule.important && "● "}
                        {schedule.isPrivate && <Lock className="inline w-2.5 h-2.5 mr-1" />}
                        {schedule.title}
                      </div>
                    ))}
                    {displaySchedules.length > 2 && (
                      <div className="text-[9px] font-bold text-slate-400 pl-1 mt-0.5">
                        +{displaySchedules.length - 2}개 더 있음...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 text-slate-900"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    {editingId ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{editingId ? '일정 수정' : '새 일정 등록'}</h3>
                    <p className="text-sm text-slate-500">{format(new Date(regDate), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddSchedule} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">날짜 선택</label>
                  <input
                    type="date"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">일정 제목</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="중요한 일정을 입력하세요"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>


                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">카테고리</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as Category)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="공문">공문</option>
                      <option value="복무">복무</option>
                      <option value="행사">행사</option>
                      <option value="연수">연수</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">중요도</label>
                    <div
                      onClick={() => setNewImportant(!newImportant)}
                      className={cn(
                        "w-full py-3.5 px-4 border rounded-2xl cursor-pointer flex items-center justify-center gap-2 font-bold transition-all",
                        newImportant
                          ? "bg-red-50 border-red-200 text-red-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      <AlertCircle className={cn("w-5 h-5", newImportant ? "animate-pulse" : "opacity-30")} />
                      {newImportant ? '중요 일정' : '보통 일정'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">상세 설명</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="추가적인 정보를 입력하세요 (옵션)"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-28 resize-none"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      newIsPrivate ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {newIsPrivate ? <Lock className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">공유 설정</p>
                      <p className="text-xs text-slate-500">
                        {newIsPrivate ? "나만 볼 수 있는 일정입니다." : "우리 학교 선생님들과 공유됩니다."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewIsPrivate(!newIsPrivate)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      newIsPrivate
                        ? "bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-100"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {newIsPrivate ? "일정 공유하기" : "일정 공유하지 않음"}
                  </button>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {editingId ? '수정 완료' : '일정 등록 완료'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Daily View Modal */}
      <AnimatePresence>
        {isDailyViewOpen && viewDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDailyViewOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">상세 일정</h3>
                  <p className="text-slate-500 font-medium mt-1">
                    {format(viewDate, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                  </p>
                </div>
                <button
                  onClick={() => setIsDailyViewOpen(false)}
                  className="w-12 h-12 flex items-center justify-center bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl shadow-sm transition-all"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="p-8 max-h-[500px] overflow-y-auto space-y-4">
                {schedules.filter(s => {
                  const sameDay = isSameDay(new Date(s.date), viewDate);
                  if (!sameDay) return false;
                  if (viewMode === 'mine') return s.authorEmail === user?.email;
                  return !s.isPrivate; // All view shows only public
                }).length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center">
                    <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-bold text-lg text-slate-300">이날은 표시할 일정이 없습니다.</p>
                  </div>
                ) : (
                  schedules
                    .filter(s => {
                      const sameDay = isSameDay(new Date(s.date), viewDate);
                      if (!sameDay) return false;
                      if (viewMode === 'mine') return s.authorEmail === user?.email;
                      return !s.isPrivate; // All view shows only public
                    })
                    .map((schedule) => (
                      <div key={schedule.id} className="group p-6 bg-slate-50 hover:bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn(
                                "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider",
                                schedule.category === '공문' ? "bg-orange-100 text-orange-600" :
                                  schedule.category === '행사' ? "bg-blue-100 text-blue-600" :
                                    schedule.category === '연수' ? "bg-emerald-100 text-emerald-600" :
                                      "bg-slate-200 text-slate-700"
                              )}>
                                {schedule.category}
                              </span>
                              {schedule.important && (
                                <span className="flex items-center gap-1 text-[10px] font-black text-red-500 px-2 py-1 bg-red-50 rounded-lg border border-red-100">
                                  ● 중요
                                </span>
                              )}
                              {schedule.isPrivate && (
                                <span className="flex items-center gap-1 text-[10px] font-black text-orange-600 px-2 py-1 bg-orange-50 rounded-lg border border-orange-100">
                                  <Lock className="w-3 h-3" />
                                  비공개
                                </span>
                              )}
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {schedule.title}
                            </h4>
                            {schedule.description && (
                              <p className="mt-2 text-sm text-slate-500 leading-relaxed font-medium">
                                {schedule.description}
                              </p>
                            )}
                          </div>
                          {(isAdmin || (isAuthenticated && schedule.authorEmail === user?.email)) && (
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => openEditModal(e, schedule)}
                                className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                title="일정 수정"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => deleteSchedule(schedule.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="일정 삭제"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setIsDailyViewOpen(false)}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

