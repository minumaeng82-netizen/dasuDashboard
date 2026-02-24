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
  Lock,
  Clock,
  Users,
  Download,
  FileText
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
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addDays
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { DUMMY_SCHEDULES } from '../constants';
import { cn } from '../lib/utils';
import { Schedule, Category, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx-js-style';
import { HOLIDAYS_2026 } from '../holidays';

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
  const [newDescription, setNewDescription] = useState('');
  const [regDate, setRegDate] = useState('');
  const [newTimeRange, setNewTimeRange] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  // Daily View Modal State
  const [isDailyViewOpen, setIsDailyViewOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date | null>(null);

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('school_schedules')
          .select('*')
          .order('date', { ascending: true });

        if (!error && data) {
          setSchedules(data);
          localStorage.setItem('school_schedules', JSON.stringify(data));
          return;
        }
      }

      const saved = localStorage.getItem('school_schedules');
      if (saved && saved !== 'undefined') {
        setSchedules(JSON.parse(saved));
      } else {
        setSchedules(DUMMY_SCHEDULES);
        localStorage.setItem('school_schedules', JSON.stringify(DUMMY_SCHEDULES));
      }
    } catch (err) {
      console.error('Failed to parse schedules:', err);
      setSchedules(DUMMY_SCHEDULES);
    }
  };


  const saveSchedules = async (updated: Schedule[]) => {
    setSchedules(updated);
    localStorage.setItem('school_schedules', JSON.stringify(updated));

    if (supabase) {
      try {
        // In a real app, we'd only sync the changed item, but for now we upsert all
        const { error } = await supabase
          .from('school_schedules')
          .upsert(updated);

        if (error) console.error('Supabase Sync Error:', error);
      } catch (err) {
        console.error('Supabase connection error:', err);
      }
    }
  };

  const startDate = subWeeks(startOfWeek(currentMonth), 1);
  const endDate = endOfWeek(addWeeks(startOfWeek(currentMonth), 1));

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const openRegisterModal = (date?: Date) => {
    if (!isAuthenticated && !isAdmin) return;

    // Reset all fields for new registration
    setEditingId(null);
    setNewTitle('');
    setNewCategory('기타');
    setNewDescription('');
    setNewTimeRange('');
    setNewLocation('');
    setNewTarget('');
    setNewIsPrivate(false);

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
          ? { ...s, title: newTitle, category: newCategory, description: newDescription, date: regDate, timeRange: newTimeRange, location: newLocation, target: newTarget, isPrivate: newIsPrivate }
          : s
      );
      saveSchedules(updated);
    } else {
      const newEntry: Schedule = {
        id: Math.random().toString(36).substr(2, 9),
        title: newTitle,
        date: regDate,
        timeRange: newTimeRange,
        location: newLocation,
        target: newTarget,
        category: newCategory,
        description: newDescription,
        authorEmail: user?.email,
        isPrivate: newIsPrivate
      };
      saveSchedules([...schedules, newEntry]);
    }

    // Reset Form
    setNewTitle('');
    setNewCategory('기타');
    setNewDescription('');
    setNewTimeRange('');
    setNewLocation('');
    setNewTarget('');
    setNewIsPrivate(false);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const openEditModal = (e: React.MouseEvent, schedule: Schedule) => {
    e.stopPropagation();
    setEditingId(schedule.id);
    setNewTitle(schedule.title);
    setNewCategory(schedule.category);
    setNewIsPrivate(schedule.isPrivate || false);
    setNewDescription(schedule.description || '');
    setNewTimeRange(schedule.timeRange || '');
    setNewLocation(schedule.location || '');
    setNewTarget(schedule.target || '');
    setRegDate(schedule.date);
    setIsDailyViewOpen(false);
    setIsModalOpen(true);
  };

  const openDailyView = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    setViewDate(date);
    setIsDailyViewOpen(true);
  };

  const deleteSchedule = async (id: string) => {
    const target = schedules.find(s => s.id === id);
    if (!target) return;

    if (window.confirm(`'${target.title}' 일정을 정말로 삭제하시겠습니까?`)) {
      const updated = schedules.filter(s => s.id !== id);
      setSchedules(updated);
      localStorage.setItem('school_schedules', JSON.stringify(updated));

      if (supabase) {
        const { error } = await supabase
          .from('school_schedules')
          .delete()
          .eq('id', id);
        if (error) console.error('Failed to delete schedule from Supabase:', error);
      }
    }
  };

  const handleExportExcel = () => {
    // Current week starting from selectedDate or Monday of that week
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = addDays(weekStart, 6); // Sunday
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Load user names for "담당자" mapping
    const savedUsers = localStorage.getItem('registered_users');
    const userMap: Record<string, string> = {};
    if (savedUsers) {
      try {
        const users: User[] = JSON.parse(savedUsers);
        users.forEach(u => {
          userMap[u.email] = u.name;
        });
      } catch (e) {
        console.error('Failed to parse registered_users:', e);
      }
    }

    const excelData = daysInWeek.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySchedules = schedules.filter(s => s.date === dayStr && !s.isPrivate);

      // 계기교육: category === '계기교육'
      const educationalEvents = daySchedules
        .filter(s => s.category === '계기교육')
        .map(s => s.title)
        .join(', ');

      // 학교 행사 계획: title(timeRange, location, target)
      const schoolEvents = daySchedules
        .filter(s => s.category !== '계기교육')
        .map(s => {
          const details = [
            s.timeRange,
            s.location,
            s.target
          ].filter(Boolean).join(', ');
          return `${s.title}${details ? ` (${details})` : ''}`;
        })
        .join('\n');

      // 담당자: names of authors
      const authors = Array.from(new Set(daySchedules.map(s => {
        if (!s.authorEmail) return '관리자';
        return userMap[s.authorEmail] || s.authorEmail.split('@')[0];
      }))).join(', ');

      return {
        '날짜': format(day, 'MM/dd (EEEE)', { locale: ko }),
        '계기교육': educationalEvents,
        '학교 행사 계획': schoolEvents,
        '담당자': authors
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '주간일정');

    worksheet['!cols'] = [
      { wch: 20 }, // 날짜
      { wch: 30 }, // 계기교육
      { wch: 60 }, // 학교 행사 계획
      { wch: 20 }  // 담당자
    ];

    XLSX.writeFile(workbook, `주간학교일정_${format(weekStart, 'yyyyMMdd')}.xlsx`);
  };

  const handleOpenPreview = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const savedUsers = localStorage.getItem('registered_users');
    const userMap: Record<string, string> = {};
    if (savedUsers) {
      try {
        const users: User[] = JSON.parse(savedUsers);
        users.forEach(u => {
          userMap[u.email] = u.name;
        });
      } catch (e) {
        console.error('Failed to parse registered_users:', e);
      }
    }

    const data = daysInMonth.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySchedules = schedules.filter(s => s.date === dayStr && !s.isPrivate);
      const holiday = HOLIDAYS_2026.find(h => h.date === dayStr);

      // 계기교육
      const educationalEvents = [
        holiday?.name,
        ...daySchedules.filter(s => s.category === '계기교육').map(s => s.title)
      ].filter(Boolean).join('\n');

      // 학교 행사 계획
      const schoolEvents = daySchedules
        .filter(s => s.category !== '계기교육')
        .map(s => {
          const details = [
            s.timeRange,
            s.location,
            s.target
          ].filter(Boolean).join(', ');
          return `${s.title}${details ? ` (${details})` : ''}`;
        })
        .join('\n');

      // 담당자
      const authors = Array.from(new Set(daySchedules.map(s => {
        if (!s.authorEmail) return '관리자';
        return userMap[s.authorEmail] || s.authorEmail.split('@')[0];
      }))).join(', ');

      return {
        dateObj: day,
        '날짜': format(day, 'd'),
        '요일': format(day, 'E', { locale: ko }),
        '계기교육': educationalEvents,
        '학교 행사 계획': schoolEvents,
        '담당자': authors,
        isPublicHoliday: holiday?.isPublic || day.getDay() === 0 // Sunday is also holiday
      };
    });

    setPreviewData(data);
    setIsPreviewOpen(true);
  };

  const downloadExcel = () => {
    const workbook = XLSX.utils.book_new();
    const title = `2026학년도 ${format(currentMonth, 'M')}월 교육활동 계획`;

    // Create custom worksheet data
    const headerRow = ['날짜', '요일', '계기교육', '학교 행사 계획', '담당자'];
    const wsData = [
      [title], // Title row (will be merged)
      [],      // Empty row for spacing or subtitle
      headerRow
    ];

    previewData.forEach(row => {
      wsData.push([
        row['날짜'],
        row['요일'],
        row['계기교육'],
        row['학교 행사 계획'],
        row['담당자']
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Styling
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    // Merge title row
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }
    ];

    // Apply styles to all cells
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[addr]) continue;

        // Default style
        worksheet[addr].s = {
          alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          },
          font: { name: '맑은 고딕', sz: 10 }
        };

        // Header styles (Title)
        if (R === 0) {
          worksheet[addr].s.font = { name: '맑은 고딕', sz: 16, bold: true };
          worksheet[addr].s.border = {}; // No border for title? Or maybe just bottom.
        }

        // Table Header styles
        if (R === 2) {
          worksheet[addr].s.fill = { fgColor: { rgb: "F2F2F2" } };
          worksheet[addr].s.font.bold = true;
        }

        // Data Row styles
        if (R >= 3) {
          const rowData = previewData[R - 3];
          if (rowData?.isPublicHoliday) {
            worksheet[addr].s.font.color = { rgb: "FF0000" };
            worksheet[addr].s.fill = { fgColor: { rgb: "FFF2F2" } }; // Light red/pink background
          }

          // Justify text for long content
          if (C === 2 || C === 3) {
            worksheet[addr].s.alignment.horizontal = 'left';
          }
        }
      }
    }

    // Column widths
    worksheet['!cols'] = [
      { wch: 8 },  // 날짜
      { wch: 10 }, // 요일
      { wch: 30 }, // 계기교육
      { wch: 60 }, // 학교 행사 계획
      { wch: 15 }  // 담당자
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '교육계획');
    XLSX.writeFile(workbook, `${title}.xlsx`);
  };

  return (
    <div className="h-full flex flex-col relative">
      {!isAuthenticated && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
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
                onClick={() => setCurrentMonth(subWeeks(currentMonth, 1))}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={() => setCurrentMonth(addWeeks(currentMonth, 1))}
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

          <div className="flex items-center gap-3">
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
            {(isAuthenticated || isAdmin) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenPreview}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm active:scale-95"
                  title="월간 교육활동 계획 미리보기 및 다운로드"
                >
                  <Download className="w-4 h-4" />
                  <span>엑셀</span>
                </button>
                <button
                  onClick={() => openRegisterModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>일정 등록</span>
                </button>
              </div>
            )}
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
          <div className="flex-1 grid grid-cols-7 divide-x divide-y divide-slate-100">
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
              }).sort((a, b) => {
                const timeA = a.timeRange || '99:99';
                const timeB = b.timeRange || '99:99';
                return timeA.localeCompare(timeB);
              });
              const isCurrentMonth = isSameMonth(day, currentMonth);
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
                    "min-h-[160px] p-2 transition-colors cursor-pointer flex flex-col gap-1 relative group",
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDailyView(e, day);
                        }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                        title="상세 보기"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
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
                                schedule.category === '회의' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                  schedule.category === '계기교육' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                    "bg-slate-50 text-slate-600 border-slate-200"
                        )}
                        title={schedule.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDailyView(e, day);
                        }}
                      >
                        {schedule.isPrivate && <Lock className="inline w-2.5 h-2.5 mr-1" />}
                        {schedule.timeRange && (
                          <span className="text-blue-600 mr-1">
                            [{schedule.timeRange}]
                          </span>
                        )}
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

              <form onSubmit={handleAddSchedule} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">날짜 선택</label>
                    <input
                      type="date"
                      value={regDate}
                      onChange={(e) => setRegDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">카테고리</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as Category)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="공문">공문</option>
                      <option value="복무">복무</option>
                      <option value="행사">행사</option>
                      <option value="연수">연수</option>
                      <option value="회의">회의</option>
                      <option value="계기교육">계기교육</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">일정 제목</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="행사나 일정의 제목을 입력하세요"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">시간/기간</label>
                    <input
                      type="text"
                      value={newTimeRange}
                      onChange={(e) => setNewTimeRange(e.target.value)}
                      placeholder="09:00~10:00"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">장소/위치</label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="회의실, 교실 등"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">대상</label>
                  <input
                    type="text"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder="전교생, 해당학년, 교직원 등"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">상세 설명</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="비고 또는 추가적인 정보를 입력하세요"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
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
                        {newIsPrivate ? "나만 볼 수 있습니다." : "학교 모든 분들과 공유됩니다."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewIsPrivate(!newIsPrivate)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                      newIsPrivate
                        ? "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-100"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {newIsPrivate ? "비공개 일정" : "공개 일정"}
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
                    .sort((a, b) => {
                      const timeA = a.timeRange || '99:99';
                      const timeB = b.timeRange || '99:99';
                      return timeA.localeCompare(timeB);
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
                                      schedule.category === '회의' ? "bg-purple-100 text-purple-600" :
                                        schedule.category === '계기교육' ? "bg-amber-100 text-amber-600" :
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
                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                              {schedule.timeRange && (
                                <div className="text-sm font-bold text-blue-600 flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded">
                                  <Clock className="w-3.5 h-3.5" />
                                  {schedule.timeRange}
                                </div>
                              )}
                              {schedule.location && (
                                <div className="text-sm font-bold text-slate-600 flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded">
                                  <span className="w-1 h-1 bg-slate-400 rounded-full" />
                                  {schedule.location}
                                </div>
                              )}
                              {schedule.target && (
                                <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded">
                                  <Users className="w-3.5 h-3.5" />
                                  {schedule.target}
                                </div>
                              )}
                            </div>
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

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">교육활동 계획 미리보기</h3>
                    <p className="text-sm text-slate-500">{format(currentMonth, 'yyyy년 MM월')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg active:scale-95 shadow-emerald-200"
                  >
                    <Download className="w-5 h-5" />
                    엑셀 파일로 받기
                  </button>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6 bg-slate-50">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-8 text-center border-b border-slate-100">
                    <h2 className="text-2xl font-black text-slate-900">
                      2026학년도 {format(currentMonth, 'M')}월 교육활동 계획
                    </h2>
                  </div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-sm font-bold text-slate-700 border-r border-slate-200 w-16">날짜</th>
                        <th className="px-4 py-3 text-sm font-bold text-slate-700 border-r border-slate-200 w-20">요일</th>
                        <th className="px-4 py-3 text-sm font-bold text-slate-700 border-r border-slate-200">계기교육</th>
                        <th className="px-4 py-3 text-sm font-bold text-slate-700 border-r border-slate-200">학교 행사 계획</th>
                        <th className="px-4 py-3 text-sm font-bold text-slate-700 w-24">담당자</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr
                          key={idx}
                          className={cn(
                            "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                            row.isPublicHoliday && "bg-red-50/30"
                          )}
                        >
                          <td className={cn(
                            "px-4 py-3 text-sm text-center border-r border-slate-200 font-medium",
                            row.isPublicHoliday && "text-red-500 font-bold"
                          )}>
                            {row['날짜']}
                          </td>
                          <td className={cn(
                            "px-4 py-3 text-sm text-center border-r border-slate-200 font-medium",
                            row.isPublicHoliday && "text-red-500 font-bold"
                          )}>
                            {row['요일']}
                          </td>
                          <td className="px-4 py-3 text-sm border-r border-slate-200 whitespace-pre-wrap text-slate-700">
                            {row['계기교육']}
                          </td>
                          <td className="px-4 py-3 text-sm border-r border-slate-200 whitespace-pre-wrap text-slate-700">
                            {row['학교 행사 계획']}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-slate-600">
                            {row['담당자']}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


