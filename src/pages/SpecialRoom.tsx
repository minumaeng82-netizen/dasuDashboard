import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Building2, Calendar as CalendarIcon, AlertCircle, Plus, ChevronLeft, ChevronRight, X, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  isSameDay,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useDeviceMode } from '../context/DeviceContext';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

export interface RoomReservation {
  id: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  timeRange: string;
  classGrade: string;
  title?: string; // 과거 데이터 호환용
  userName: string;
  userEmail?: string;
  isRegular?: boolean;
}

export interface RegularReservation {
  id: string;
  roomName: string;
  dayOfWeek: number;
  timeRange: string;
  classGrade: string;
  userName: string;
}

interface SpecialRoomProps {
  user: User | null;
}

export const SpecialRoom: React.FC<SpecialRoomProps> = ({ user }) => {
  const { mode } = useDeviceMode();
  const isMobile = mode === 'Mobile';

  // 요청에 따라 변경된 방 목록
  const rooms = ['체육관', '전담실', '과학실'];
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<RoomReservation[]>([]);
  const [regularReservations, setRegularReservations] = useState<RegularReservation[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [regDate, setRegDate] = useState('');
  const [newTimeRange, setNewTimeRange] = useState('1교시');
  const [newClassGrade, setNewClassGrade] = useState('1-1');
  const [existingReservation, setExistingReservation] = useState<RoomReservation | null>(null);

  useEffect(() => {
    const loadData = async () => {
      let finalRes: RoomReservation[] = [];
      let finalReg: RegularReservation[] = [];

      if (supabase) {
        try {
          const [resData, regData] = await Promise.all([
            supabase.from('room_reservations').select('*'),
            supabase.from('room_regular_reservations').select('*')
          ]);
          if (!resData.error && resData.data) {
            finalRes = resData.data.map(d => ({
              id: d.id,
              roomName: d.room_name,
              date: d.date,
              timeRange: d.time_range,
              classGrade: d.class_grade,
              title: d.title,
              userName: d.user_name,
              userEmail: d.user_email
            }));
          }
          if (!regData.error && regData.data) {
            finalReg = regData.data.map(d => ({
              id: d.id,
              roomName: d.room_name,
              dayOfWeek: d.day_of_week,
              timeRange: d.time_range,
              classGrade: d.class_grade,
              userName: d.user_name
            }));
          }
        } catch(e) {
          console.error("Supabase fetch error:", e);
        }
      }

      // fallback / merge
      if (finalRes.length === 0) {
        const saved = localStorage.getItem('room_reservations');
        if (saved) {
          try { finalRes = JSON.parse(saved) as RoomReservation[]; } catch(e){}
        }
      }
      if (finalReg.length === 0) {
        const savedRegs = localStorage.getItem('room_regular_reservations');
        if (savedRegs) {
          try { finalReg = JSON.parse(savedRegs) as RegularReservation[]; } catch(e){}
        }
      }

      // map legacy room names
      finalRes = finalRes.map(r => r.roomName === '전담교실' ? { ...r, roomName: '전담실' } : r);
      finalReg = finalReg.map(r => r.roomName === '전담교실' ? { ...r, roomName: '전담실' } : r);

      setReservations(finalRes);
      setRegularReservations(finalReg);
      localStorage.setItem('room_reservations', JSON.stringify(finalRes));
      localStorage.setItem('room_regular_reservations', JSON.stringify(finalReg));
    };

    loadData();
  }, []);

  const startDate = startOfWeek(currentDate);
  const endDate = endOfWeek(addWeeks(startDate, 1));
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const workingDays = calendarDays.filter(day => day.getDay() !== 0 && day.getDay() !== 6);
  const periods = ['1교시', '2교시', '3교시', '4교시', '5교시', '6교시', '7교시', '8교시'];

  const currentRoomReservations = reservations.filter(r => r.roomName === selectedRoom);

  const openRegisterModal = (date?: Date, period?: string) => {
    if (!user) return;
    setEditingId(null);
    setExistingReservation(null);
    setRegDate(format(date || new Date(), 'yyyy-MM-dd'));
    setNewTimeRange(period || '1교시');
    setNewClassGrade('1-1');
    setIsModalOpen(true);
  };

  const openEditModal = (res: RoomReservation) => {
    setEditingId(res.id);
    setExistingReservation(res);
    setRegDate(res.date);
    setNewTimeRange(res.timeRange || '1교시');
    setNewClassGrade(res.classGrade || res.title || '1-1');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassGrade || !regDate || !newTimeRange) return;

    // 만약 해당 시간대에 이미 다른 예약이 있다면 경고 (수정 시 본인 예약은 제외)
    const existing = currentRoomReservations.find(r => r.date === regDate && r.timeRange === newTimeRange);
    if (existing && existing.id !== editingId) {
       alert('해당 교시는 이미 예약되어 있습니다! 다른 교시를 선택해 주세요.');
       return;
    }

    const updated = [...reservations];
    let newData: RoomReservation;

    if (editingId) {
      const idx = updated.findIndex(r => r.id === editingId);
      if (idx > -1) {
        updated[idx] = { 
          ...updated[idx], 
          classGrade: newClassGrade, 
          timeRange: newTimeRange, 
          date: regDate 
        };
        newData = updated[idx];
      } else {
        return;
      }
    } else {
      newData = {
        id: Math.random().toString(36).substr(2, 9),
        roomName: selectedRoom,
        date: regDate,
        timeRange: newTimeRange,
        classGrade: newClassGrade,
        userName: user?.name || user?.email?.split('@')[0] || '사용자',
        userEmail: user?.email
      };
      updated.push(newData);
    }
    
    setReservations(updated);
    localStorage.setItem('room_reservations', JSON.stringify(updated));
    
    if (supabase) {
      try {
        await supabase.from('room_reservations').upsert({
          id: newData.id,
          room_name: newData.roomName,
          date: newData.date,
          time_range: newData.timeRange,
          class_grade: newData.classGrade,
          user_name: newData.userName,
          user_email: newData.userEmail,
          title: newData.title
        });
      } catch(e) {
        console.error("Supabase upsert error:", e);
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (confirm('정말로 이 예약을 취소하시겠습니까?')) {
      const updated = reservations.filter(r => r.id !== editingId);
      setReservations(updated);
      localStorage.setItem('room_reservations', JSON.stringify(updated));
      
      if (supabase) {
        try {
          await supabase.from('room_reservations').delete().eq('id', editingId);
        } catch(e) {
          console.error("Supabase delete error:", e);
        }
      }

      setIsModalOpen(false);
    }
  };

  const isReadOnly = editingId && existingReservation && user?.email !== existingReservation.userEmail && user?.role !== 'admin';

  return (
    <div className="h-full flex flex-col relative transition-all duration-500">
      {!user && (
         <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-blue-700 font-medium">로그인하시면 특별실을 예약하실 수 있습니다.</p>
         </div>
      )}
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              특별실 예약
            </h2>
            <p className="text-slate-500 mt-1">원하는 특별실을 선택하고 비어있는 시간에 예약하세요.</p>
          </div>
          {user && (
            <button 
              onClick={() => openRegisterModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-5 h-5" />
              새 예약 등록
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-6 flex-1 h-full overflow-hidden">
          {/* Room List Sidebar */}
          <div className="w-full md:w-56 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide flex-shrink-0">
             <h3 className="font-bold text-slate-700 mb-2 px-2 hidden md:block">특별실 목록</h3>
             {rooms.map(room => (
               <button
                 key={room}
                 onClick={() => setSelectedRoom(room)}
                 className={cn(
                   "whitespace-nowrap flex-shrink-0 text-left px-4 py-3 rounded-xl font-bold transition-all border", 
                   selectedRoom === room 
                     ? room === '체육관' ? 'bg-red-50 text-red-600 border-red-100/50 shadow-sm'
                     : room === '과학실' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50 shadow-sm'
                     : 'bg-blue-50 text-blue-600 border-blue-100/50 shadow-sm'
                   : "text-slate-600 hover:bg-slate-50 border-transparent"
                 )}
               >
                 {room}
               </button>
             ))}
          </div>

          {/* Schedule View (Calendar) */}
          <div className="flex-1 flex flex-col min-w-0">
             <div className="flex items-center justify-between mb-4 px-2">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                 <CalendarIcon className={cn("w-5 h-5", selectedRoom === '체육관' ? "text-red-500" : selectedRoom === '과학실' ? "text-emerald-500" : "text-blue-500")} />
                 {selectedRoom} 예약 현황
               </h3>
               
               <div className="flex items-center gap-4">
                 <div className="text-lg font-bold text-slate-700 hidden sm:block">
                   {format(startDate, 'yyyy년 MM월')}
                 </div>
                 <div className="flex items-center bg-slate-100 rounded-lg p-1">
                   <button
                     onClick={() => setCurrentDate(subWeeks(currentDate, 2))}
                     className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all"
                   >
                     <ChevronLeft className="w-5 h-5 text-slate-600" />
                   </button>
                   <button
                     onClick={() => setCurrentDate(addWeeks(currentDate, 2))}
                     className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all"
                   >
                     <ChevronRight className="w-5 h-5 text-slate-600" />
                   </button>
                 </div>
               </div>
             </div>
             
             {/* Calendar Grid */}
             <div className="flex-1 border border-slate-200 rounded-xl overflow-y-auto bg-white flex flex-col">
               {/* Weekday Labels (Hidden in Mobile) */}
               {!isMobile && (
                 <div className="grid grid-cols-5 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                   {weekDays.slice(1, 6).map((day) => (
                     <div
                       key={day}
                       className="py-2 text-center text-xs font-bold tracking-wider text-slate-500"
                     >
                       {day}
                     </div>
                   ))}
                 </div>
               )}

               <div className={cn(
                 "flex-1 grid divide-x divide-y divide-slate-100",
                 isMobile ? "grid-cols-1" : "grid-cols-5"
               )}>
                 {workingDays.map((day) => {
                   const dayStr = format(day, 'yyyy-MM-dd');
                   const dayOfWeek = day.getDay();
                   const specificRes = currentRoomReservations.filter(r => r.date === dayStr);
                   const regRes = regularReservations.filter(r => r.roomName === selectedRoom && r.dayOfWeek === dayOfWeek);
                   
                   const dayReservations = [...specificRes];
                   regRes.forEach(reg => {
                     if (!dayReservations.find(r => r.timeRange === reg.timeRange)) {
                       dayReservations.push({
                         id: `reg-${reg.id}-${dayStr}`,
                         roomName: reg.roomName,
                         date: dayStr,
                         timeRange: reg.timeRange,
                         classGrade: reg.classGrade,
                         userName: reg.userName,
                         isRegular: true
                       });
                     }
                   });

                   const isToday = isSameDay(day, new Date());

                   return (
                     <div
                       key={day.toString()}
                       className={cn(
                         "transition-colors relative group w-full bg-white",
                         isMobile ? "min-h-[140px] p-2 border-b border-slate-50" : "p-2 flex-col"
                       )}
                     >
                       <div className="flex items-center justify-between mb-1 pb-1">
                         <span className={cn(
                           "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full transition-all text-slate-700",
                           isToday && "bg-blue-600 text-white font-bold shadow-md shadow-blue-200"
                         )}>
                           {format(day, 'd')}
                         </span>
                         {isMobile && (
                           <span className="text-xs font-bold text-slate-400">
                             ({weekDays[day.getDay()]})
                           </span>
                         )}
                       </div>
                       
                       {/* Slots Wrapper */}
                       <div className={cn(
                         "flex-1 flex flex-col border border-slate-200 rounded-md overflow-hidden bg-white divide-y divide-slate-100 shadow-sm",
                         isMobile && "ml-2"
                       )}>
                          {periods.map(period => {
                            const reservation = dayReservations.find(r => r.timeRange === period);
                            
                            if (reservation) {
                              const eventColor = reservation.roomName === '체육관' ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                               : reservation.roomName === '과학실' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                               : 'bg-blue-50 text-blue-700 hover:bg-blue-100';
                              const borderColor = reservation.roomName === '체육관' ? 'border-red-200'
                                                : reservation.roomName === '과학실' ? 'border-emerald-200'
                                                : 'border-blue-200';
                              const isReg = reservation.isRegular;

                              return (
                                <div 
                                  key={period} 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (isReg) {
                                      alert('매주 반복되는 정기 시간표 구성입니다.\\n관리자 메뉴의 [설정 > 특별실 관리]에서만 수정할 수 있습니다.');
                                      return;
                                    }
                                    openEditModal(reservation); 
                                  }}
                                  title={`${period} ${reservation.classGrade || reservation.title} (${reservation.userName})`}
                                  className={cn("px-1 py-1.5 text-[10px] sm:text-[11px] font-bold flex items-center cursor-pointer transition-colors group/res", eventColor, isReg && "opacity-90")}
                                >
                                  <span className="opacity-70 flex-shrink-0 w-5 text-center">{period.replace('교시', '')}</span>
                                  <span className={cn("flex-1 truncate border-l ml-1.5 pl-1.5", borderColor)}>
                                    {isReg && "📌 "}{reservation.classGrade || reservation.title}
                                  </span> 
                                  <span className="font-normal text-[9px] opacity-70 truncate hidden lg:inline-block">({reservation.userName})</span>
                                </div>
                              );
                            } else {
                              return (
                                <div
                                  key={period}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (user) {
                                      openRegisterModal(day, period);
                                    } else {
                                      alert("로그인이 필요합니다.");
                                    }
                                  }}
                                  className="px-1 py-1.5 text-[10px] sm:text-[11px] text-slate-400 bg-white hover:bg-slate-50 cursor-pointer flex items-center transition-colors group/slot"
                                >
                                  <span className="opacity-50 flex-shrink-0 w-5 text-center">{period.replace('교시', '')}</span>
                                  <span className="flex-1 opacity-0 group-hover/slot:opacity-100 transition-opacity ml-1.5 pl-1.5 border-l border-slate-200 text-slate-400 font-medium truncate">+ 예약하기</span>
                                </div>
                              );
                            }
                          })}
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Registration / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 text-slate-900"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    {editingId ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{editingId ? (isReadOnly ? '예약 확인' : '예약 수정') : '새 예약 작성'}</h3>
                    <p className="text-sm font-medium text-blue-600">{selectedRoom}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {isReadOnly && (
                   <div className="bg-orange-50 text-orange-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 mb-2">
                     <AlertCircle className="w-5 h-5 flex-shrink-0" />
                     다른 사람의 예약은 내용을 보기만 할 수 있습니다.
                   </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 mx-1">날짜</label>
                  <input
                    type="date"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    required
                    disabled={!!isReadOnly}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 mx-1">이용 시간</label>
                  <select
                    value={newTimeRange}
                    onChange={(e) => setNewTimeRange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    required
                    disabled={!!isReadOnly}
                  >
                    <option value="1교시">1교시</option>
                    <option value="2교시">2교시</option>
                    <option value="3교시">3교시</option>
                    <option value="4교시">4교시</option>
                    <option value="5교시">5교시</option>
                    <option value="6교시">6교시</option>
                    <option value="7교시">7교시</option>
                    <option value="8교시">8교시</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 mx-1">사용 학반</label>
                  <select
                    value={['1-1', '2-1', '3-1', '4-1', '5-1', '5-2', '6-1'].includes(newClassGrade) ? newClassGrade : "직접 입력"}
                    onChange={(e) => setNewClassGrade(e.target.value === "직접 입력" ? "" : e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold cursor-pointer disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    required
                    disabled={!!isReadOnly}
                  >
                    <option value="1-1">1-1</option>
                    <option value="2-1">2-1</option>
                    <option value="3-1">3-1</option>
                    <option value="4-1">4-1</option>
                    <option value="5-1">5-1</option>
                    <option value="5-2">5-2</option>
                    <option value="6-1">6-1</option>
                    <option value="직접 입력">직접 입력 (직접 지정)</option>
                  </select>
                  {!['1-1', '2-1', '3-1', '4-1', '5-1', '5-2', '6-1'].includes(newClassGrade) && (
                     <input
                       type="text"
                       placeholder="사용 학반 또는 목적을 직접 입력하세요"
                       value={newClassGrade}
                       onChange={(e) => setNewClassGrade(e.target.value)}
                       className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all mt-2"
                       required
                       disabled={!!isReadOnly}
                     />
                  )}
                </div>
                
                {editingId && existingReservation && (
                   <div className="pt-2 flex justify-between items-center text-sm text-slate-500">
                     <span className="bg-slate-100 px-2 py-1 rounded-md">예약자: {existingReservation.userName}</span>
                   </div>
                )}

                {!isReadOnly ? (
                  <div className="pt-4 flex gap-3">
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {editingId ? '수정 완료' : '예약 등록'}
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-all active:scale-95"
                    >
                      닫기
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
