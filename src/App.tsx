import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check, Timer, Flower2, X, Volume2, Play, LayoutDashboard, Dumbbell, Pause, Square } from 'lucide-react';

// --- Utils & Constants ---
const parseDateSafe = (dStr: string) => {
  const [y, m, d] = dStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d));
};

const getLocalDateString = (d: Date = new Date()) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatTime = (seconds: number | null) => {
  if (seconds === null) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatTotalWorkoutTime = (totalSeconds: number) => {
  if (!totalSeconds) return "0 мин";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h} ч ${m} м`;
  if (m === 0 && totalSeconds > 0) return "< 1 мин";
  return `${m} мин`;
};

type Exercise = { id: string; title: string; setsText: string; numSets: number; reps: string; tempo?: string; imageId: string; };
type WorkoutDay = { dayName: string; focus: string; phaseName: string; monthNum: number; exercises: Exercise[]; };

const START_DATE = new Date(2026, 9, 30); // Oct 30, 2026
const END_DATE = new Date(2027, 9, 30); // Oct 30, 2027

const getWorkoutData = (dateStr: string): WorkoutDay | null => {
  const date = parseDateSafe(dateStr);
  const activeDay = date.getDay();
  if (![1, 3, 5].includes(activeDay)) return null;

  let monthIndex = 0;
  if (date >= START_DATE) {
    const diffDays = Math.max(0, Math.floor((date.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)));
    monthIndex = Math.floor(diffDays / 30);
    if (monthIndex > 11) monthIndex = 11;
  }

  const phase = Math.floor(monthIndex / 3);
  const baseSets = 3 + phase;
  const repAdd = (monthIndex % 3) * 2;
  
  const tempoText = [
    "Обычный темп (1 сек вниз)",
    "Контроль (2 сек вниз)",
    "Взрыв (3 сек вниз, 1 сек пауза)",
    "Хардкор (4 сек вниз, 2 сек пауза)"
  ][phase];
  
  const phaseNames = [
    "Фаза 1: Адаптация (Мес. 1-3)",
    "Фаза 2: Объем (Мес. 4-6)",
    "Фаза 3: Сила (Мес. 7-9)",
    "Фаза 4: Пик (Мес. 10-12)"
  ];
  
  const formatReps = (base: number | 'max') => base === 'max' ? 'До отказа' : `${base + repAdd}–${base + repAdd + 3}`;

  if (activeDay === 1) {
    return {
      dayName: 'День 1', focus: 'Ноги и Кор', phaseName: phaseNames[phase], monthNum: monthIndex + 1,
      exercises: [
        { id: `m${monthIndex}_d1e1`, title: 'Болгарские сплиты (2х10кг)', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps(8) + ' на ногу', tempo: tempoText, imageId: 'Split_Squat_with_Dumbbells' },
        { id: `m${monthIndex}_d1e2`, title: 'Фронт. присед (Штанга 20кг)', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps(10), tempo: tempoText, imageId: 'Front_Barbell_Squat' },
        { id: `m${monthIndex}_d1e3`, title: 'Румынская 1 нога (Гантели)', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps(10) + ' на ногу', tempo: tempoText, imageId: 'Kettlebell_One-Legged_Deadlift' },
        { id: `m${monthIndex}_d1e4`, title: 'Скручивания на пресс', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps('max'), tempo: 'Без рывков', imageId: 'Crunches' },
      ]
    };
  }
  if (activeDay === 3) {
    return {
      dayName: 'День 2', focus: 'Грудь, Плечи, Трицепс', phaseName: phaseNames[phase], monthNum: monthIndex + 1,
      exercises: [
        { id: `m${monthIndex}_d2e1`, title: 'Жим лежа на полу (2х10кг)', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps(10), tempo: tempoText, imageId: 'Dumbbell_Floor_Press' },
        { id: `m${monthIndex}_d2e2`, title: 'Отжимания от пола', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps('max'), tempo: tempoText, imageId: 'Pushups' },
        { id: `m${monthIndex}_d2e3`, title: 'Армейский жим (Штанга 20кг)', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps(8), tempo: tempoText, imageId: 'Standing_Military_Press' },
        { id: `m${monthIndex}_d2e4`, title: 'Махи в стороны (2х10кг)', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps(10), tempo: tempoText, imageId: 'Side_Lateral_Raise' },
      ]
    };
  }
  return {
    dayName: 'День 3', focus: 'Спина и Руки', phaseName: phaseNames[phase], monthNum: monthIndex + 1,
    exercises: [
      { id: `m${monthIndex}_d3e1`, title: 'Тяга в наклоне (Штанга 20кг)', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps(10), tempo: tempoText, imageId: 'Bent_Over_Barbell_Row' },
      { id: `m${monthIndex}_d3e2`, title: 'Тяга гантели 1 рукой (10кг)', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps(8) + ' на руку', tempo: tempoText, imageId: 'One-Arm_Dumbbell_Row' },
      { id: `m${monthIndex}_d3e3`, title: 'Сгибания на бицепс (Штанга 20кг)', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps(10), tempo: tempoText, imageId: 'Barbell_Curl' },
      { id: `m${monthIndex}_d3e4`, title: 'Французский жим (Гантель 10кг)', setsText: `${baseSets} подхода`, numSets: baseSets, reps: formatReps(10), tempo: tempoText, imageId: 'Lying_Dumbbell_Tricep_Extension' },
    ]
  };
};

const DAY_NAMES = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const FLUTTERSHY_QUOTES = [
  "Эмм... ты сегодня так сильно постарался! Я тобой очень-очень горжусь, ты большой молодец! Отдохни немного, ладно? 🌸✨",
  "Ой, ты уже закончил? Ты справляешься просто замечательно!",
  "Эмм... если ты не против, я хотела сказать, что ты сегодня проявил настоящую силу! 🌸",
  "Ух ты, тренировка окончена! Ты такой молодец, обязательно похвали себя сегодня! 💛"
];

// --- M3 Material You Color Palette ---
const theme = {
  surface: 'bg-[#fffcf8]', // Extremely light, warm pinkish-white
  onSurface: 'text-[#4a2b32]', // Deep warm brownish-pink
  surfaceContainer: 'bg-[#ffebf0]', // Light Fluttershy Mane Pink
  onSurfaceVariant: 'text-[#7d5260]', // Muted warm pink-brown
  primaryContainer: 'bg-[#ffb3c6]', // Stronger Pink (Active, Primary buttons)
  onPrimaryContainer: 'text-[#4c0014]', // Deepest pink/red for high contrast
  secondaryContainer: 'bg-[#fff4b3]', // Fluttershy Coat Yellow (Secondary cards)
  onSecondaryContainer: 'text-[#5c4a00]', // Deep yellow/brown
  tertiaryContainer: 'bg-[#bcf0e4]', // Fluttershy Eye Teal/Cyan (Completed states)
  onTertiaryContainer: 'text-[#005040]', // Deep teal
  outline: 'border-[#ffd9e2]' // Soft pink border
};

// --- Helper Components ---
const ExerciseImages = ({ imageId, isDone }: { imageId: string, isDone: boolean }) => {
  const baseUrl = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
  return (
    <div className={`flex gap-2 w-[calc(100%+24px)] -mx-3 mt-4 mb-5 transition-all duration-500 ${isDone ? 'opacity-40 grayscale' : ''}`}>
      {[0, 1].map((idx) => (
        <div key={idx} className={`flex-1 rounded-[24px] overflow-hidden bg-[#fff0f5] ${theme.outline} border shadow-sm aspect-square relative flex items-center justify-center`}>
          <img src={`${baseUrl}${imageId}/${idx}.jpg`} className="w-full h-full object-contain mix-blend-multiply scale-[1.1]" alt="position" loading="lazy" />
        </div>
      ))}
    </div>
  );
};

const NavBar = ({ current, onSelect, showWorkout }: { current: string, onSelect: (v: string) => void, showWorkout: boolean }) => (
  <div className={`fixed bottom-0 left-0 right-0 h-[80px] ${theme.surfaceContainer} flex justify-center gap-12 items-center px-6 z-40 pb-safe`}>
    <button onClick={() => onSelect('home')} className="flex flex-col items-center justify-center gap-1 min-w-[80px]">
      <div className={`px-5 py-1.5 rounded-full transition-all duration-300 ${current === 'home' ? `${theme.primaryContainer} ${theme.onPrimaryContainer}` : 'text-[#7d5260] hover:bg-[#ffd9e2]'}`}>
        <LayoutDashboard className="w-6 h-6" />
      </div>
      <span className={`text-[12px] font-medium transition-colors ${current === 'home' ? theme.onPrimaryContainer : 'text-[#7d5260]'}`}>Прогресс</span>
    </button>
    {showWorkout && (
      <button onClick={() => onSelect('workout')} className="flex flex-col items-center justify-center gap-1 min-w-[80px]">
        <div className={`px-5 py-1.5 rounded-full transition-all duration-300 ${current === 'workout' ? `${theme.primaryContainer} ${theme.onPrimaryContainer}` : 'text-[#7d5260] hover:bg-[#ffd9e2]'}`}>
          <Dumbbell className="w-6 h-6" />
        </div>
        <span className={`text-[12px] font-medium transition-colors ${current === 'workout' ? theme.onPrimaryContainer : 'text-[#7d5260]'}`}>Тренировка</span>
      </button>
    )}
  </div>
);

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState<'home' | 'workout' | 'completion'>('home');
  
  const [isWorkoutActive, setIsWorkoutActive] = useState(() => localStorage.getItem('workout_active') === 'true');
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);

  useEffect(() => {
    localStorage.setItem('workout_active', String(isWorkoutActive));
  }, [isWorkoutActive]);

  const [currentDateStr] = useState(getLocalDateString());
  
  // Auto-refresh if the user keeps the app open past midnight
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (getLocalDateString() !== currentDateStr) {
           window.location.reload();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [currentDateStr]);

  const activeDay = parseDateSafe(currentDateStr).getDay();
  const isWorkoutDay = activeDay === 1 || activeDay === 3 || activeDay === 5;
  const isBeforeStart = parseDateSafe(currentDateStr) < START_DATE;
  const workoutData = useMemo(() => getWorkoutData(currentDateStr), [currentDateStr]);

  // Track progress specific to today
  const [completedSets, setCompletedSets] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('workout_progress_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === getLocalDateString()) return parsed.completedSets || [];
      }
    } catch (e) {}
    return [];
  });

  // Track lifetime stats and session time
  const [stats, setStats] = useState(() => {
    try {
      const stored = localStorage.getItem('workout_stats_v4'); // upgraded version to fix bugs
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          installDate: parsed.installDate || currentDateStr,
          completedDates: Array.isArray(parsed.completedDates) ? parsed.completedDates : [],
          totalTimeSeconds: typeof parsed.totalTimeSeconds === 'number' ? parsed.totalTimeSeconds : 0,
          currentSessionTime: typeof parsed.currentSessionTime === 'number' ? parsed.currentSessionTime : 0,
        };
      }
    } catch (e) {}
    return { installDate: currentDateStr, completedDates: [] as string[], totalTimeSeconds: 0, currentSessionTime: 0 };
  });

  useEffect(() => {
    localStorage.setItem('workout_stats_v4', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('workout_progress_v3', JSON.stringify({ date: currentDateStr, completedSets }));
  }, [completedSets, currentDateStr]);

  const completedExercisesCount = workoutData?.exercises.filter(ex => 
    Array.from({length: ex.numSets}).every((_, i) => completedSets.includes(`${ex.id}-${i}`))
  ).length || 0;

  const totalSetsForDay = workoutData?.exercises.reduce((sum, ex) => sum + ex.numSets, 0) || 1;
  const progressPercent = Math.min(100, (completedSets.length / totalSetsForDay) * 100);

  const isWorkoutDayFullyCompleted = !!workoutData && workoutData.exercises.length > 0 && completedExercisesCount === workoutData.exercises.length;

  // Rest Timer State
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState<number>(60);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);

  const startTimer = useCallback((seconds: number = 60) => {
    const end = Date.now() + seconds * 1000;
    setTimerDuration(seconds);
    setTimerEndTime(end);
    setTimerRemaining(seconds);
  }, []);

  const stopTimer = useCallback(() => {
    setTimerEndTime(null);
    setTimerRemaining(0);
  }, []);

  useEffect(() => {
    if (timerEndTime === null) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
      setTimerRemaining(remaining);
      if (remaining === 0) {
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [timerEndTime]);

  // Robust Time Tracking (Delta updates)
  const lastTickRef = useRef<number>(Date.now());
  useEffect(() => {
    // Reset tick ref when active state changes to avoid big jumps
    lastTickRef.current = Date.now();
  }, [isWorkoutActive, isWorkoutPaused]);

  useEffect(() => {
    if (!isWorkoutActive || isWorkoutPaused || isWorkoutDayFullyCompleted || !isWorkoutDay) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      let delta = Math.floor((now - lastTickRef.current) / 1000);
      
      // Cap at 300 seconds (5 mins) to avoid giant jumps if phone was locked overnight,
      // but still track time if user switches to another app (music, messages)
      if (delta > 300) delta = 300;
      
      if (delta > 0) {
        lastTickRef.current = now;
        setStats(prev => ({
          ...prev,
          totalTimeSeconds: prev.totalTimeSeconds + delta,
          currentSessionTime: prev.currentSessionTime + delta
        }));
      }
    }, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [isWorkoutActive, isWorkoutPaused, isWorkoutDayFullyCompleted]);

  // Handlers
  const handleToggleSet = (exerciseId: string, setIndex: number, totalSets: number) => {
    const setId = `${exerciseId}-${setIndex}`;
    const isDoneNow = !completedSets.includes(setId);
    
    if (isDoneNow) {
      const willBeDone = Array.from({length: totalSets}).every((_, i) => i === setIndex ? true : completedSets.includes(`${exerciseId}-${i}`));
      
      setCompletedSets(prev => {
        const next = [...prev, setId];
        const totalSetsForDay = workoutData?.exercises.reduce((sum, ex) => sum + ex.numSets, 0) || 0;
        
        if (next.length >= totalSetsForDay) {
          setTimeout(() => setView('completion'), 600);
        } else if (!willBeDone) {
          startTimer();
        }
        return next;
      });
    } else {
      setCompletedSets(prev => prev.filter(id => id !== setId));
    }
  };

  useEffect(() => {
    if ((isWorkoutDayFullyCompleted || !isWorkoutDay) && isWorkoutActive) {
      setIsWorkoutActive(false);
    }
  }, [isWorkoutDayFullyCompleted, isWorkoutDay, isWorkoutActive]);

  useEffect(() => {
    if (!isWorkoutDay) return;
    setStats(prev => {
      const hasToday = prev.completedDates.includes(currentDateStr);
      if (isWorkoutDayFullyCompleted && !hasToday) {
        return { ...prev, completedDates: [...prev.completedDates, currentDateStr] };
      }
      if (!isWorkoutDayFullyCompleted && hasToday) {
        return { ...prev, completedDates: prev.completedDates.filter(d => d !== currentDateStr) };
      }
      return prev;
    });
  }, [isWorkoutDay, isWorkoutDayFullyCompleted, currentDateStr]);

  const missedLastWorkout = useMemo(() => {
    if (!stats.installDate) return false;
    const install = parseDateSafe(stats.installDate);
    const today = parseDateSafe(currentDateStr);
    
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);
    
    while (checkDate >= install) {
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        const dString = getLocalDateString(checkDate);
        if (!stats.completedDates.includes(dString)) return true;
        return false;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return false;
  }, [stats.installDate, stats.completedDates, currentDateStr]);

  // Handle Starting new session
  const handleStartWorkout = () => {
    if (completedSets.length === 0) {
      setStats(prev => ({ ...prev, currentSessionTime: 0 }));
    }
    setIsWorkoutActive(true);
    setIsWorkoutPaused(false);
    setView('workout');
  };

  // --- Render ---
  return (
    <div className={`${theme.surface} ${theme.onSurface} font-sans min-h-screen pb-24 selection:bg-pink-200 relative`}>
      <div className="max-w-md mx-auto relative z-10 w-full flex flex-col">
        
        {view === 'home' && (
          <div className="px-5 py-10 flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-20">
            <header className="mb-2 text-center flex flex-col items-center">
              <div className={`w-20 h-20 rounded-[32px] ${theme.primaryContainer} flex items-center justify-center mb-6`}>
                 <Flower2 className={`w-10 h-10 ${theme.onPrimaryContainer}`} />
              </div>
              <h1 className={`text-4xl leading-tight font-black tracking-tight ${theme.onSurface}`}>
                Проект "18 лет"
              </h1>
              <div className={`mt-4 font-medium ${theme.onSurfaceVariant} text-sm flex flex-col gap-1`}>
                <span>🎯 Цель: 1 год (30 окт 2026 – 30 окт 2027)</span>
                <span>🏋️ Инвентарь: Штанга 20кг, Гантели 2х10кг</span>
              </div>
            </header>

            {missedLastWorkout && (
              <div className={`${theme.tertiaryContainer} ${theme.onTertiaryContainer} p-5 rounded-[28px] animate-pulse`}>
                <p className="font-medium">Ой... кажется, ты пропустил прошлую тренировку. Но ничего страшного, давай продолжим сегодня! 🌸</p>
              </div>
            )}

            <div className={`p-6 rounded-[32px] ${theme.surfaceContainer} shadow-sm`}>
              <h2 className={`text-sm uppercase tracking-wider font-bold ${theme.onSurfaceVariant} mb-5`}>Статистика</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={`${theme.surface} p-5 rounded-[24px]`}>
                  <div className={`text-3xl font-medium ${theme.onSurface} tracking-tight`}>{stats.completedDates.length}</div>
                  <div className={`text-[11px] font-bold ${theme.onSurfaceVariant} uppercase tracking-wider mt-1`}>Тренировок</div>
                </div>
                <div className={`${theme.surface} p-5 rounded-[24px]`}>
                  <div className={`text-3xl font-medium ${theme.onSurface} tracking-tight`}>{formatTotalWorkoutTime(stats.totalTimeSeconds || 0)}</div>
                  <div className={`text-[11px] font-bold ${theme.onSurfaceVariant} uppercase tracking-wider mt-1`}>Общее время</div>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-[32px] ${theme.surfaceContainer} shadow-sm`}>
              <h2 className={`text-sm uppercase tracking-wider font-bold ${theme.onSurfaceVariant} mb-4`}>План на сегодня</h2>
              
              {isBeforeStart ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className={`font-bold ${theme.onSurfaceVariant} text-lg`}>Подготовка...</p>
                  <p className={`font-medium ${theme.onSurfaceVariant} mt-2 text-sm opacity-80`}>
                    Полноценные тренировки начнутся 30 октября 2026.
                    Сейчас лучше отдохнуть и подготовиться к большому году! 🌸
                  </p>
                </div>
              ) : !isWorkoutDay ? (
                 <div className="text-center py-6">
                   <div className="text-4xl mb-4">💤</div>
                   <p className={`font-medium ${theme.onSurfaceVariant}`}>Отдыхай и восстанавливай силы!</p>
                 </div>
              ) : (
                <>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <div className={`text-xl font-bold ${theme.onSurface}`}>{workoutData!.dayName}</div>
                      <div className={`text-sm ${theme.onSurfaceVariant} mt-1`}>{workoutData!.focus}</div>
                      <div className={`text-xs font-bold ${theme.onPrimaryContainer} bg-[#ffd9e2] px-2 py-0.5 rounded-md inline-block mt-2`}>
                        {workoutData!.phaseName} (Месяц {workoutData!.monthNum})
                      </div>
                    </div>
                    {isWorkoutDayFullyCompleted && (
                      <div className="bg-[#bcf0e4] text-[#005040] px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Выполнено
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 mt-5">
                    {workoutData!.exercises.map((ex, i) => (
                      <div key={ex.id} className={`flex items-center gap-3 p-3 rounded-[20px] ${theme.surface}`}>
                        <div className={`w-8 h-8 rounded-full ${theme.secondaryContainer} ${theme.onSecondaryContainer} flex items-center justify-center font-bold text-sm shrink-0`}>
                          {i+1}
                        </div>
                        <div className="text-sm font-medium leading-tight truncate">{ex.title}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {isWorkoutDay && !isWorkoutDayFullyCompleted && (
              <button 
                onClick={handleStartWorkout}
                disabled={isBeforeStart}
                className={`w-full mt-2 ${theme.primaryContainer} ${theme.onPrimaryContainer} px-5 py-5 rounded-full hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-bold text-lg disabled:opacity-50 disabled:active:scale-100 disabled:hover:opacity-50`}
              >
                <Play fill="currentColor" className="w-6 h-6" />
                <span>{isBeforeStart ? "Ожидание старта" : completedSets.length > 0 ? "Продолжить" : "Начать"}</span>
              </button>
            )}

            <div className="h-4"></div>
          </div>
        )}

        {view === 'workout' && (
          <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
            <header className={`px-5 pt-10 pb-6 ${theme.surface}/95 backdrop-blur-md sticky top-0 z-30`}>
              <h1 className={`text-3xl font-black tracking-tight ${theme.onSurface}`}>Тренировка</h1>
              <p className={`text-sm font-medium ${theme.onPrimaryContainer} mt-2 flex flex-col gap-1`}>
                 <span>{isWorkoutDay && workoutData ? `${workoutData.dayName} • ${workoutData.focus}` : 'Отдых'}</span>
                 {isWorkoutDay && workoutData && (
                   <span className={`text-xs font-bold ${theme.onPrimaryContainer} bg-[#ffd9e2] px-2 py-0.5 rounded-md self-start inline-block`}>
                     {workoutData.phaseName} (Месяц {workoutData.monthNum})
                   </span>
                 )}
              </p>
              
              {isWorkoutDay && workoutData && (
                <div className={`mt-6 h-3 w-full ${theme.surfaceContainer} rounded-full overflow-hidden`}>
                  <div 
                    className={`h-full ${theme.primaryContainer} transition-all duration-700 ease-out rounded-full`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </header>

            <main className="px-5 py-4">
              {!isWorkoutDay ? (
                <div className={`flex flex-col items-center justify-center py-20 px-6 text-center ${theme.surfaceContainer} rounded-[32px]`}>
                  <div className="text-6xl mb-6">💤</div>
                  <h2 className={`text-2xl font-medium ${theme.onSurface} mb-3`}>День отдыха</h2>
                </div>
              ) : (
                <div className="space-y-4">
                  {workoutData?.exercises.map((exercise, index) => {
                    const isExerciseDone = Array.from({length: exercise.numSets}).every((_, i) => completedSets.includes(`${exercise.id}-${i}`));
                    
                    return (
                      <div 
                        key={exercise.id} 
                        className={`p-5 rounded-[32px] transition-all duration-300 relative overflow-hidden ${
                          isExerciseDone ? theme.tertiaryContainer : theme.surfaceContainer
                        }`}
                      >
                        <div className="relative z-10">
                          <h3 className={`text-[19px] font-bold leading-snug mb-4 ${isExerciseDone ? theme.onTertiaryContainer : theme.onSurface}`}>
                            <span className="opacity-50 mr-2">{index + 1}.</span>
                            {exercise.title}
                          </h3>
                          
                          {exercise.imageId && <ExerciseImages imageId={exercise.imageId} isDone={isExerciseDone} />}
                          
                          <div className={`space-y-3 text-sm ${isExerciseDone ? theme.onTertiaryContainer : theme.onSurfaceVariant}`}>
                            <div className={`flex items-center gap-2 w-fit px-4 py-2 rounded-full font-bold ${isExerciseDone ? 'bg-white/30' : theme.surface}`}>
                              <span>{exercise.setsText}</span>
                              <span className="opacity-30">|</span>
                              <span>{exercise.reps}</span>
                            </div>
                            
                            {exercise.tempo && exercise.tempo !== '-' && (
                              <div className="flex items-center gap-2 mt-2 font-medium opacity-80 px-1">
                                <Timer className="w-4 h-4 shrink-0" />
                                <span>{exercise.tempo}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-6 flex flex-wrap gap-2">
                            {Array.from({length: exercise.numSets}).map((_, i) => {
                              const isSetDone = completedSets.includes(`${exercise.id}-${i}`);
                              return (
                                <button
                                  key={i}
                                  onClick={() => handleToggleSet(exercise.id, i, exercise.numSets)}
                                  className={`py-4 rounded-[20px] flex flex-col items-center justify-center gap-1 transition-all flex-1 min-w-[50px] active:scale-95 ${
                                    isSetDone
                                      ? 'bg-[#005040] text-[#bcf0e4]'
                                      : `${theme.surface} ${theme.onSurface}`
                                  }`}
                                >
                                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Сет</span>
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-xl font-black leading-none">{i + 1}</span>
                                    {isSetDone && <Check className="w-4 h-4" strokeWidth={4} />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {isWorkoutActive && (
                    <div className="mt-10 mb-6 flex flex-col gap-3">
                      <button
                        onClick={() => setIsWorkoutPaused(!isWorkoutPaused)}
                        className={`w-full py-5 rounded-[24px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                          isWorkoutPaused 
                            ? theme.tertiaryContainer + ' ' + theme.onTertiaryContainer
                            : theme.secondaryContainer + ' ' + theme.onSecondaryContainer
                        }`}
                      >
                        {isWorkoutPaused ? <Play fill="currentColor" className="w-5 h-5" /> : <Pause fill="currentColor" className="w-5 h-5" />}
                        {isWorkoutPaused ? "Возобновить тренировку" : "Пауза тренировки"}
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsWorkoutActive(false);
                          setIsWorkoutPaused(false);
                          // Reset session time when manual finish so next session starts at 0
                          setStats(prev => ({...prev, currentSessionTime: 0}));
                          setView('home');
                        }}
                        className={`w-full py-5 bg-[#ffb4ab] text-[#690005] rounded-[24px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95`}
                      >
                        <Square fill="currentColor" className="w-5 h-5" />
                        Завершить тренировку
                      </button>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        )}
        
        {view === 'completion' && (
          <div className={`fixed inset-0 z-50 ${theme.surface} overflow-y-auto animate-in fade-in zoom-in-95 duration-700`}>
            <div className="min-h-full w-full flex flex-col items-center justify-center px-6 py-12">
              <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
              
              <div className={`w-28 h-28 ${theme.primaryContainer} rounded-full flex items-center justify-center mb-8`}>
                 <Flower2 className={`w-14 h-14 ${theme.onPrimaryContainer}`} />
              </div>
              
              <h1 className={`text-4xl font-black ${theme.onSurface} mb-6 leading-tight`}>
                Тренировка окончена!
              </h1>
              
              <div className={`${theme.surfaceContainer} p-8 rounded-[32px] mb-10 w-full`}>
                <p className={`${theme.onSurfaceVariant} text-[18px] font-medium leading-relaxed italic`}>
                  "{FLUTTERSHY_QUOTES[activeDay % FLUTTERSHY_QUOTES.length]}"
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full mb-12">
                <div className={`${theme.tertiaryContainer} p-6 rounded-[28px] flex flex-col items-center justify-center`}>
                   <div className={`text-5xl font-black ${theme.onTertiaryContainer} mb-2 tracking-tighter`}>{workoutData?.exercises.length}</div>
                   <div className={`text-[11px] font-bold ${theme.onTertiaryContainer} opacity-80 uppercase tracking-wider`}>Упражнений</div>
                </div>
                <div className={`${theme.secondaryContainer} p-6 rounded-[28px] flex flex-col items-center justify-center`}>
                   <div className={`text-4xl font-black ${theme.onSecondaryContainer} mb-2 tracking-tighter`}>{formatTotalWorkoutTime(stats.currentSessionTime || 0)}</div>
                   <div className={`text-[11px] font-bold ${theme.onSecondaryContainer} opacity-80 uppercase tracking-wider`}>Время сегодня</div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setIsWorkoutActive(false);
                  setStats(prev => ({...prev, currentSessionTime: 0}));
                  setView('home');
                }}
                className={`w-full ${theme.primaryContainer} ${theme.onPrimaryContainer} px-5 py-5 rounded-full active:scale-95 transition-all flex items-center justify-center font-bold text-lg`}
              >
                Вернуться на главный экран
              </button>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Bar M3 */}
      <NavBar current={view} onSelect={(v) => setView(v as 'home'|'workout')} showWorkout={isWorkoutActive} />

      {/* Timer M3 Bottom Sheet */}
      {timerEndTime !== null && (
        <>
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 transition-opacity animate-in fade-in" onClick={stopTimer} />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-full duration-300">
            <div className={`${theme.surface} rounded-t-[32px] p-6 pb-10 flex flex-col gap-5`}>
              <div className={`w-12 h-1.5 ${theme.surfaceContainer} rounded-full mx-auto mb-2`} />
              
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${theme.onSurface} font-bold text-lg`}>
                  <Timer className={`w-6 h-6 ${theme.onPrimaryContainer}`} />
                  Отдых
                </div>
                <button onClick={stopTimer} className={`p-3 ${theme.surfaceContainer} ${theme.onSurfaceVariant} rounded-full active:scale-95 transition-colors`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className={`text-center font-mono text-[72px] font-medium tracking-tighter ${theme.onSurface} my-4`}>
                {formatTime(timerRemaining)}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[60, 90, 120].map((t) => (
                  <button
                    key={t}
                    onClick={() => startTimer(t)}
                    className={`py-4 rounded-[24px] font-bold transition-colors active:scale-95 ${
                      timerDuration === t ? `${theme.primaryContainer} ${theme.onPrimaryContainer}` : `${theme.surfaceContainer} ${theme.onSurfaceVariant}`
                    }`}
                  >
                    {t} сек
                  </button>
                ))}
              </div>
              
              {timerRemaining === 0 && (
                <button onClick={stopTimer} className={`w-full py-5 rounded-[24px] ${theme.tertiaryContainer} ${theme.onTertiaryContainer} font-bold text-lg mt-4 flex items-center justify-center gap-2 animate-pulse active:scale-95`}>
                  <Volume2 className="w-6 h-6" /> Завершить отдых
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
