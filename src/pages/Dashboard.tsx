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
  Cloud,
  CloudRain,
  CloudSnow,
  BookOpen,
  User as UserIcon
} from 'lucide-react';

import { DUMMY_SCHEDULES, DUMMY_TRAININGS } from '../constants';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Schedule, TrainingPost } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  onNavigate?: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ isAuthenticated, isAdmin, onNavigate }) => {
  const today = new Date();
  const [scheduleDate, setScheduleDate] = React.useState(today);
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [trainings, setTrainings] = React.useState<TrainingPost[]>([]);

  const [weather, setWeather] = React.useState<{ temp: number; icon: string; status: string; dust: string } | null>(null);

  React.useEffect(() => {
    fetchSchedules();
    fetchTrainings();
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      // Gimcheon, South Korea coordinates: 36.12, 128.11
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=36.12&longitude=128.11&current=temperature_2m,weather_code&timezone=Asia%2FSeoul');
      const data = await response.json();

      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;

      let status = '맑음';
      let icon = 'Sun';

      if (code >= 1 && code <= 3) { status = '구름 조금'; icon = 'Cloud'; }
      else if (code >= 45 && code <= 48) { status = '안개'; icon = 'Cloud'; }
      else if (code >= 51 && code <= 67) { status = '비'; icon = 'CloudRain'; }
      else if (code >= 71 && code <= 77) { status = '눈'; icon = 'CloudSnow'; }
      else if (code >= 80 && code <= 99) { status = '소나기/천둥'; icon = 'CloudRain'; }

      setWeather({
        temp,
        status,
        icon,
        dust: '보통' // Dust typically requires a different API, defaulting to 'Normal'
      });
    } catch (err) {
      console.error('Weather fetch error:', err);
      // Fallback
      setWeather({ temp: 2, status: '흐림', icon: 'Cloud', dust: '보통' });
    }
  };

  const fetchSchedules = () => {
    try {
      const saved = localStorage.getItem('school_schedules');
      if (saved && saved !== 'undefined') {
        setSchedules(JSON.parse(saved));
      } else {
        setSchedules(DUMMY_SCHEDULES);
      }
    } catch (err) {
      console.error('Failed to load dashboard schedules:', err);
      setSchedules(DUMMY_SCHEDULES);
    }
  };

  const fetchTrainings = async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('training_posts')
          .select('*')
          .order('date', { ascending: false })
          .limit(5);

        if (!error && data) {
          setTrainings(data);
          return;
        }
      }

      const saved = localStorage.getItem('training_posts');
      if (saved && saved !== 'undefined') {
        setTrainings(JSON.parse(saved).slice(0, 5));
      } else {
        setTrainings(DUMMY_TRAININGS.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load dashboard trainings:', err);
      setTrainings(DUMMY_TRAININGS.slice(0, 5));
    }
  };


  const formattedDate = format(today, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko });
  const time = format(today, 'HH:mm');

  // Dashboard shows ONLY PUBLIC schedules or those where user is author (if logged in)
  const selectedDaySchedules = schedules.filter(s => {
    const isSame = isSameDay(new Date(s.date), scheduleDate);
    if (!isSame) return false;

    // Show if public OR if it's the user's private schedule (logic simplified here to match Calendar's "All" view)
    return !s.isPrivate;
  }).sort((a, b) => {
    const timeA = a.timeRange || '99:99';
    const timeB = b.timeRange || '99:99';
    return timeA.localeCompare(timeB);
  });


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
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${weather?.icon === 'Sun' ? 'bg-yellow-50 text-yellow-500' :
                weather?.icon === 'Cloud' ? 'bg-slate-50 text-slate-500' :
                  weather?.icon === 'CloudRain' ? 'bg-blue-50 text-blue-500' :
                    'bg-blue-50 text-blue-400'
              }`}>
              {weather?.icon === 'Sun' && <Sun className="w-10 h-10" />}
              {weather?.icon === 'Cloud' && <Cloud className="w-10 h-10" />}
              {weather?.icon === 'CloudRain' && <CloudRain className="w-10 h-10" />}
              {weather?.icon === 'CloudSnow' && <CloudSnow className="w-10 h-10" />}
              {!weather && <Sun className="w-10 h-10" />}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-slate-900">
                {weather ? `${weather.status} ${weather.temp}°C` : '로딩 중...'}
              </p>
              <p className="text-sm text-slate-500">미세먼지: <span className="text-emerald-500 font-bold">{weather?.dust || '좋음'}</span></p>
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
                              schedule.category === '연수' ? 'bg-emerald-100 text-emerald-600' :
                                schedule.category === '회의' ? 'bg-purple-100 text-purple-600' :
                                  schedule.category === '계기교육' ? 'bg-amber-100 text-amber-600' :
                                    'bg-slate-200 text-slate-600'
                            }`}>
                            {schedule.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors uppercase">
                          {schedule.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                          {schedule.timeRange && (
                            <div className="text-sm font-bold text-blue-600 flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded">
                              <Clock className="w-3.5 h-3.5" />
                              {schedule.timeRange}
                            </div>
                          )}
                          {schedule.location && (
                            <div className="text-sm font-bold text-slate-600 flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded">
                              <span className="w-1 h-1 bg-slate-400 rounded-full" />
                              {schedule.location}
                            </div>
                          )}
                          {schedule.target && (
                            <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded">
                              <UserIcon className="w-3.5 h-3.5" />
                              {schedule.target}
                            </div>
                          )}
                        </div>
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
          <h2 className="text-2xl font-bold mb-2">두고두고 볼 것들</h2>

          <p className="text-slate-400 text-sm">자주 확인해야 하는 중요 공지 및 연수</p>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
          {trainings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 border border-white/5 rounded-xl border-dashed">
              <p className="text-sm">등록된 연수 자료가 없습니다.</p>
            </div>
          ) : (
            trainings.map((post) => (
              <button
                key={post.id}
                disabled={!isAuthenticated}
                onClick={() => {
                  if (post.pdfUrl) {
                    window.open(post.pdfUrl, '_blank');
                  } else if (onNavigate) {
                    onNavigate('/training');
                  }
                }}
                className={`w-full text-left p-5 bg-white/5 rounded-xl border border-white/10 transition-all group ${isAuthenticated ? 'hover:bg-white/10 cursor-pointer shadow-lg shadow-black/20' : 'opacity-60 cursor-not-allowed'
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
            ))
          )}
        </div>




      </motion.div>
    </div>
  );
};

