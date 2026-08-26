import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  return `${m} мин`;
};

type Exercise = { id: string; title: string; setsText: string; numSets: number; reps: string; tempo?: string; imageId: string; };
type WorkoutDay = { dayName: string; focus: string; exercises: Exercise[]; };

const WORKOUTS: Record<number, WorkoutDay> = {
  1: { dayName: 'День 1', focus: 'Ноги и тяги', exercises: [
    { id: 'd1e1', title: 'Болгарские сплит-приседания (с гантелями)', setsText: '4 подхода', numSets: 4, reps: '10–15 на ногу', tempo: '3 сек вниз, пауза 1 сек, подъем', imageId: 'Split_Squat_with_Dumbbells' },
    { id: 'd1e2', title: 'Румынская тяга на одной ноге', setsText: '3 подхода', numSets: 3, reps: '12–15 повторений', tempo: '3 сек вниз, подъем', imageId: 'Kettlebell_One-Legged_Deadlift' },
    { id: 'd1e3', title: 'Тяга штанги в наклоне к поясу', setsText: '4 подхода', numSets: 4, reps: '15–20 (до отказа)', tempo: '3 сек опускание, пауза вверху', imageId: 'Bent_Over_Barbell_Row' },
    { id: 'd1e4', title: 'Сгибания рук со штангой на бицепс', setsText: '3 подхода', numSets: 3, reps: '12–15 повторений', imageId: 'Barbell_Curl' },
  ]},
  3: { dayName: 'День 2', focus: 'Жимы и плечи', exercises: [
    { id: 'd2e1', title: 'Жим гантелей лежа на полу (Floor Press)', setsText: '4 подхода', numSets: 4, reps: '15–20 повторений', tempo: '3 сек вниз, касание пола, жим вверх', imageId: 'Dumbbell_Floor_Press' },
    { id: 'd2e2', title: 'Отжимания от пола', setsText: '4 подхода', numSets: 4, reps: 'До отказа', imageId: 'Pushups' },
    { id: 'd2e3', title: 'Армейский жим штанги стоя', setsText: '3 подхода', numSets: 3, reps: '12–15 повторений', tempo: '3 сек вниз, пауза у груди', imageId: 'Standing_Military_Press' },
    { id: 'd2e4', title: 'Махи гантелями в стороны', setsText: '3 подхода', numSets: 3, reps: '15–20 повторений', imageId: 'Side_Lateral_Raise' },
  ]},
  5: { dayName: 'День 3', focus: 'Всё тело + кор', exercises: [
    { id: 'd3e1', title: 'Приседания со штангой на груди (Фронтальные)', setsText: '4 подхода', numSets: 4, reps: '15–20 повторений', tempo: '4 сек вниз, пауза 2 сек внизу', imageId: 'Front_Barbell_Squat' },
    { id: 'd3e2', title: 'Тяга гантели одной рукой в упоре', setsText: '4 подхода', numSets: 4, reps: '12–15 на каждую руку', imageId: 'One-Arm_Dumbbell_Row' },
    { id: 'd3e3', title: 'Французский жим с гантелями лежа', setsText: '3 подхода', numSets: 3, reps: '12–15 повторений', imageId: 'Lying_Dumbbell_Tricep_Extension' },
    { id: 'd3e4', title: 'Подъемы ног или скручивания на пресс', setsText: '3 подхода', numSets: 3, reps: 'До отказа', imageId: 'Crunches' },
  ]}
};

const DAY_NAMES = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const FLUTTERSHY_QUOTES = [
  "Эмм... ты сегодня так сильно постарался! Я тобой очень-очень горжусь, ты большой молодец! Отдохни немного, ладно? 🌸✨",
  "Ой, ты уже закончил? Ты справляешься просто замечательно! 🦋",
  "Эмм... если ты не против, я хотела сказать, что ты сегодня проявил настоящую силу! 🌸",
  "Ух ты, тренировка окончена! Ты такой молодец, обязательно похвали себя сегодня! 💛"
];

// --- Helper Components ---
const ExerciseImages = ({ imageId, isDone }: { imageId: string, isDone: boolean }) => {
  const baseUrl = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
  return (
    <div className={`flex gap-2 w-[calc(100%+24px)] -mx-3 mt-4 mb-5 transition-all duration-500 ${isDone ? 'opacity-40 grayscale' : ''}`}>
      {[0, 1].map((idx) => (
        <div key={idx} className="flex-1 rounded-[20px] overflow-hidden bg-white border border-[#fef08a]/80 shadow-md aspect-square relative flex items-center justify-center">
          <img src={`${baseUrl}${imageId}/${idx}.jpg`} className="w-full h-full object-contain mix-blend-multiply scale-[1.1]" alt="position" loading="lazy" />
        </div>
      ))}
    </div>
  );
};

const Butterfly = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C11.5 3 11 4 11 5C11 6.5 11.5 7.5 12 9C12.5 7.5 13 6.5 13 5C13 4 12.5 3 12 2Z" fill="#db2777" opacity="0.8"/>
    <path d="M11.5 6.5C8 4 4 4 2 6C3.5 8 7 9 10 9.5C10.5 8.5 11 7.5 11.5 6.5Z" fill="#f472b6" opacity="0.9"/>
    <path d="M12.5 6.5C16 4 20 4 22 6C20.5 8 17 9 14 9.5C13.5 8.5 13 7.5 12.5 6.5Z" fill="#f472b6" opacity="0.9"/>
    <path d="M10.5 10.5C7 11 3.5 13 3 16C5.5 16.5 9 14.5 11.5 12C11 11.5 10.5 11 10.5 10.5Z" fill="#fbcfe8" opacity="0.9"/>
    <path d="M13.5 10.5C17 11 20.5 13 21 16C18.5 16.5 15 14.5 12.5 12C13 11.5 13.5 11 13.5 10.5Z" fill="#fbcfe8" opacity="0.9"/>
  </svg>
);

const BackgroundDecorations = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <style>{`
      @keyframes flapWings {
        0%, 100% { transform: scaleX(1) rotateZ(0deg); }
        50% { transform: scaleX(0.2) rotateZ(3deg); }
      }
      @keyframes bobbing {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-30px); }
      }
      @keyframes flyPath1 {
        0% { left: -20%; top: 80%; }
        100% { left: 120%; top: 20%; }
      }
      @keyframes flyPath2 {
        0% { left: 120%; top: 50%; transform: scaleX(-1); }
        100% { left: -20%; top: 10%; transform: scaleX(-1); }
      }
      @keyframes flyPath3 {
        0% { left: -20%; top: 30%; }
        100% { left: 120%; top: 60%; }
      }
      .butterfly-wrapper { position: absolute; }
      .butterfly-bob { animation: bobbing 3s ease-in-out infinite; }
      .butterfly-flap { animation: flapWings 0.25s infinite alternate ease-in-out; transform-origin: center; }
    `}</style>
    
    <Flower2 className="absolute top-10 -left-6 w-32 h-32 text-[#fbcfe8]/30 -rotate-12" strokeWidth={1} />
    <Flower2 className="absolute bottom-40 -right-10 w-48 h-48 text-[#fef08a]/30 rotate-45" strokeWidth={1} />
    <Flower2 className="absolute top-1/2 left-1/4 w-20 h-20 text-[#fbcfe8]/20 rotate-90" strokeWidth={1} />

    <div className="butterfly-wrapper" style={{ animation: 'flyPath1 16s linear infinite' }}>
      <div className="butterfly-bob" style={{ animationDelay: '0s' }}>
        <Butterfly className="butterfly-flap w-10 h-10 text-[#f472b6] drop-shadow-sm" />
      </div>
    </div>
    
    <div className="butterfly-wrapper" style={{ animation: 'flyPath2 24s linear infinite', animationDelay: '-5s' }}>
      <div className="butterfly-bob" style={{ animationDelay: '1s' }}>
        <Butterfly className="butterfly-flap w-12 h-12 text-[#fef08a] drop-shadow-sm" />
      </div>
    </div>

    <div className="butterfly-wrapper" style={{ animation: 'flyPath3 19s linear infinite', animationDelay: '-10s' }}>
      <div className="butterfly-bob" style={{ animationDelay: '2s' }}>
        <Butterfly className="butterfly-flap w-8 h-8 text-[#db2777] drop-shadow-sm opacity-80" />
      </div>
    </div>
  </div>
);

const ButterflyConfetti = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    <style>{`
      @keyframes flyUpFade {
        0% { transform: translateY(100vh) scale(0.5) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        100% { transform: translateY(-20vh) scale(1.2) rotate(360deg); opacity: 0; }
      }
    `}</style>
    {Array.from({ length: 15 }).map((_, i) => (
      <div key={i} className="absolute" style={{
        left: `${(i * 7) % 100}%`,
        animation: `flyUpFade ${3 + (i % 3)}s ease-out forwards`,
        animationDelay: `${(i % 5) * 0.3}s`,
      }}>
        <Butterfly className={`w-8 h-8 ${i % 2 === 0 ? 'text-[#f472b6]' : 'text-[#fef08a]'} opacity-80 drop-shadow-sm`} />
      </div>
    ))}
  </div>
);

const NavBar = ({ current, onSelect, showWorkout }: { current: string, onSelect: (v: string) => void, showWorkout: boolean }) => (
  <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-[#fffdf7] border-t border-[#fefce8] flex justify-center gap-12 items-center px-6 z-40 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
    <button onClick={() => onSelect('home')} className="flex flex-col items-center justify-center gap-1 min-w-[80px]">
      <div className={`px-5 py-1.5 rounded-full transition-all duration-300 ${current === 'home' ? 'bg-[#fbcfe8] text-[#831843]' : 'text-stone-500 hover:bg-[#fefce8]'}`}>
        <LayoutDashboard className="w-6 h-6" />
      </div>
      <span className={`text-[12px] font-medium transition-colors ${current === 'home' ? 'text-[#831843]' : 'text-stone-500'}`}>Прогресс</span>
    </button>
    {showWorkout && (
      <button onClick={() => onSelect('workout')} className="flex flex-col items-center justify-center gap-1 min-w-[80px]">
        <div className={`px-5 py-1.5 rounded-full transition-all duration-300 ${current === 'workout' ? 'bg-[#fbcfe8] text-[#831843]' : 'text-stone-500 hover:bg-[#fefce8]'}`}>
          <Dumbbell className="w-6 h-6" />
        </div>
        <span className={`text-[12px] font-medium transition-colors ${current === 'workout' ? 'text-[#831843]' : 'text-stone-500'}`}>Тренировка</span>
      </button>
    )}
  </div>
);

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState<'home' | 'workout' | 'completion'>('home');
  
  const [isWorkoutActive, setIsWorkoutActive] = useState(() => {
    return localStorage.getItem('workout_active') === 'true';
  });
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);

  useEffect(() => {
    localStorage.setItem('workout_active', String(isWorkoutActive));
  }, [isWorkoutActive]);

  const [currentDateStr] = useState(getLocalDateString());
  const activeDay = parseDateSafe(currentDateStr).getDay();
  const isWorkoutDay = activeDay === 1 || activeDay === 3 || activeDay === 5;
  const workoutData = WORKOUTS[activeDay];

  // Exercises Progress
  const [completedSets, setCompletedSets] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('workout_progress_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === currentDateStr) return parsed.completedSets || [];
      }
    } catch (e) {}
    return [];
  });
  
  // Workout Stats History
  const [stats, setStats] = useState(() => {
    try { 
      const stored = localStorage.getItem('workout_stats_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.totalTimeSeconds !== 'number') parsed.totalTimeSeconds = 0;
        return parsed;
      }
    } catch (e) {}
    return { installDate: currentDateStr, completedDates: [] as string[], totalTimeSeconds: 0 };
  });

  // Audio Context (M3 Refactor: Eager init on interaction)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
  }, []);

  useEffect(() => {
    const handleTouch = () => { initAudio(); window.removeEventListener('pointerdown', handleTouch); };
    window.addEventListener('pointerdown', handleTouch);
    return () => window.removeEventListener('pointerdown', handleTouch);
  }, [initAudio]);

  const playAlarm = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    }
  }, []);

  // Timer State (M3 Refactor: Target-based timer to prevent sleep-drift bugs)
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState<number>(90);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);

  const startTimer = useCallback((presetDuration?: number) => {
    initAudio();
    const duration = presetDuration || timerDuration;
    setTimerDuration(duration);
    setTimerEndTime(Date.now() + duration * 1000);
    setTimerRemaining(duration);
  }, [timerDuration, initAudio]);

  const stopTimer = useCallback(() => {
    setTimerEndTime(null);
    setTimerRemaining(null);
  }, []);

  useEffect(() => {
    if (timerEndTime === null) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((timerEndTime - now) / 1000);
      if (remaining <= 0) {
        setTimerRemaining(0);
        setTimerEndTime(null);
        playAlarm();
      } else {
        setTimerRemaining(remaining);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [timerEndTime, playAlarm]);

  // Effects & Persist
  useEffect(() => {
    localStorage.setItem('workout_stats_v3', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('workout_progress_v2', JSON.stringify({ date: currentDateStr, completedSets }));
  }, [completedSets, currentDateStr]);

  // Derived State
  const completedExercisesCount = workoutData?.exercises.filter(ex => 
    Array.from({length: ex.numSets}).every((_, i) => completedSets.includes(`${ex.id}-${i}`))
  ).length || 0;

  const isWorkoutDayFullyCompleted = workoutData && workoutData.exercises.length > 0 && completedExercisesCount === workoutData.exercises.length;

  // Track time spent (M3 Refactor: Capped delta to avoid massive jumps after sleep)
  const lastTickRef = useRef<number>(Date.now());
  useEffect(() => {
    if (view !== 'workout' || isWorkoutDayFullyCompleted || !isWorkoutActive || isWorkoutPaused) return;
    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      let delta = Math.floor((now - lastTickRef.current) / 1000);
      if (delta > 300) delta = 5; // Cap at 5 mins idle to avoid sleep bugs
      lastTickRef.current = now;
      setStats(prev => ({ ...prev, totalTimeSeconds: (prev.totalTimeSeconds || 0) + delta }));
    }, 5000);
    return () => clearInterval(interval);
  }, [view, isWorkoutDayFullyCompleted, isWorkoutActive, isWorkoutPaused]);

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
          setTimeout(() => setView('completion'), 800);
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
    if (isWorkoutDayFullyCompleted && isWorkoutActive) {
      setIsWorkoutActive(false);
    }
  }, [isWorkoutDayFullyCompleted, isWorkoutActive]);

  useEffect(() => {
    if (!isWorkoutDay) return;
    setStats(prev => {
      const hasToday = prev.completedDates.includes(currentDateStr);
      if (isWorkoutDayFullyCompleted && !hasToday) return { ...prev, completedDates: [...prev.completedDates, currentDateStr] };
      if (!isWorkoutDayFullyCompleted && hasToday) return { ...prev, completedDates: prev.completedDates.filter((d: string) => d !== currentDateStr) };
      return prev;
    });
  }, [isWorkoutDay, isWorkoutDayFullyCompleted, currentDateStr]);

  const { misses, completedWeeks, missedLastWorkout, mockingMessage, currentWeekStatus } = useMemo(() => {
      let missesCount = 0;
      let currentD = parseDateSafe(stats.installDate);
      const todayD = parseDateSafe(currentDateStr);
      
      while (currentD < todayD) {
          const dStr = getLocalDateString(currentD);
          const legacyDStr = `${currentD.getFullYear()}-${currentD.getMonth() + 1}-${currentD.getDate()}`;
          const day = currentD.getDay();
          if ([1, 3, 5].includes(day)) {
              if (!stats.completedDates.includes(dStr) && !stats.completedDates.includes(legacyDStr)) missesCount++;
          }
          currentD.setDate(currentD.getDate() + 1);
      }

      let missedLast = false;
      let lastD = parseDateSafe(currentDateStr);
      lastD.setDate(lastD.getDate() - 1);
      const installD = parseDateSafe(stats.installDate);
      
      while (lastD >= installD) {
          if ([1, 3, 5].includes(lastD.getDay())) {
              const dStr = getLocalDateString(lastD);
              const legacyDStr = `${lastD.getFullYear()}-${lastD.getMonth() + 1}-${lastD.getDate()}`;
              if (!stats.completedDates.includes(dStr) && !stats.completedDates.includes(legacyDStr)) missedLast = true;
              break;
          }
          lastD.setDate(lastD.getDate() - 1);
      }

      const weeksMap: Record<string, number> = {};
      stats.completedDates.forEach((dStr: string) => {
         const d = parseDateSafe(dStr);
         const day = d.getDay() || 7;
         d.setDate(d.getDate() - day + 1);
         const weekId = getLocalDateString(d);
         weeksMap[weekId] = (weeksMap[weekId] || 0) + 1;
      });
      const cWeeks = Object.values(weeksMap).filter(count => count === 3).length;

      let msg = "";
      if (missedLast) {
          let list = [];
          if (missesCount <= 2) list = ["Эй, отдыхающий, пропуск был жизненно необходим?", "Твои мышцы передают привет.", "Даже Флаттершай неодобрительно качает головой."];
          else if (missesCount <= 5) list = ["Эй, диван сам себя не пролежит, да?", "Так форму не построим.", "Очередной пропуск. Ищем отговорки дальше?"];
          else list = ["Хватит позориться, тряпка.", "Твоя лень достигла космических масштабов.", "Ноль дисциплины. Абсолютный ноль."];
          const seed = todayD.getTime() / 86400000;
          msg = list[Math.floor(seed) % list.length];
      }

      const currentWeekDays = [1, 3, 5];
      const weekStatus = currentWeekDays.map(targetDay => {
          const d = parseDateSafe(currentDateStr);
          const currentDay = d.getDay() || 7;
          d.setDate(d.getDate() - currentDay + targetDay);
          const dStr = getLocalDateString(d);
          const legacyDStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          return {
              label: targetDay === 1 ? 'Пн' : targetDay === 3 ? 'Ср' : 'Пт',
              done: stats.completedDates.includes(dStr) || stats.completedDates.includes(legacyDStr),
              isPast: todayD > d,
              isToday: dStr === currentDateStr
          };
      });

      return { misses: missesCount, completedWeeks: cWeeks, missedLastWorkout: missedLast, mockingMessage: msg, currentWeekStatus: weekStatus };
  }, [stats, currentDateStr]);

  // --- Render ---
  return (
    <div className="bg-gradient-to-br from-[#fffdf7] via-[#fffdf7] to-[#fdf2f8] text-stone-900 font-sans min-h-screen pb-24 selection:bg-pink-200 relative">
      <BackgroundDecorations />
      <div className="max-w-md mx-auto relative z-10 w-full flex-col">
        
        {view === 'home' && (
          <div className="px-5 py-8 flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-20">
            <header className="mb-4 mt-2 relative flex flex-col items-center text-center">
              <Butterfly className="w-16 h-16 mb-2 text-[#db2777]" />
              <h1 className="text-[2.2rem] leading-tight font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#f472b6] via-[#db2777] to-[#eab308] drop-shadow-sm pb-2">
                Fluttershy<br/>Training
              </h1>
            </header>

            {missedLastWorkout && (
              <div className="bg-[#fee2e2] text-[#991b1b] p-4 rounded-[24px] shadow-sm flex items-start gap-3 border border-[#fca5a5]/30">
                <div className="bg-[#fca5a5] p-2 rounded-full mt-0.5 shadow-sm text-lg leading-none">🚨</div>
                <div className="flex-1">
                  <div className="font-bold text-sm mb-1 tracking-wide">Пропуск зафиксирован</div>
                  <p className="text-[#991b1b]/80 text-xs font-medium leading-relaxed">{mockingMessage}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#fbcfe8] p-5 rounded-[24px] shadow-sm flex flex-col justify-center">
                <div className="text-[11px] font-bold text-[#831843] uppercase tracking-wider mb-2 opacity-90">Идеальные недели</div>
                <div className="text-5xl font-normal text-[#831843] tracking-tighter">{completedWeeks}</div>
              </div>
              <div className="bg-[#fef08a] p-5 rounded-[24px] shadow-sm flex flex-col justify-center">
                <div className="text-[11px] font-bold text-[#713f12] uppercase tracking-wider mb-2 opacity-90">Пропусков всего</div>
                <div className="text-5xl font-normal text-[#713f12] tracking-tighter">{misses}</div>
              </div>
            </div>

            <div className="bg-[#fefce8] border border-[#fef08a]/50 p-5 rounded-[24px] shadow-sm flex flex-col mt-2">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-medium text-[#713f12]">Эта неделя</div>
                <div className="text-[11px] font-bold bg-[#fef08a] px-3 py-1 rounded-full text-[#713f12]">
                   {currentWeekStatus.filter(d => d.done).length} / 3
                </div>
              </div>
              <div className="flex justify-between gap-2">
                {currentWeekStatus.map((day, idx) => (
                  <div key={idx} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-[20px] transition-all ${
                      day.done ? 'bg-[#dcfce7] text-[#166534]' : 
                      day.isToday ? 'bg-[#fbcfe8] text-[#831843] shadow-sm' :
                      day.isPast ? 'bg-[#fee2e2] text-[#991b1b]' :
                      'bg-[#fffdf7] border border-[#fef08a]/30 text-[#713f12]/50'
                  }`}>
                    <span className="text-[11px] font-bold uppercase mb-1.5 opacity-80">{day.label}</span>
                    {day.done ? <Check className="w-5 h-5" strokeWidth={3} /> : <div className="w-5 h-5 rounded-full border-2 border-current opacity-30" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#fffdf7] border border-[#fef08a]/30 p-5 rounded-[24px] shadow-sm flex flex-col justify-center items-center mt-2">
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">Общее время тренировок</div>
              <div className="text-3xl font-medium text-stone-800 tracking-tight">{formatTotalWorkoutTime(stats.totalTimeSeconds || 0)}</div>
            </div>

            {isWorkoutDay && !isWorkoutDayFullyCompleted && (
              <button 
                onClick={() => {
                  setIsWorkoutActive(true);
                  setIsWorkoutPaused(false);
                  setView('workout');
                }}
                className="w-full mt-2 bg-[#db2777] text-white px-5 py-4 rounded-full shadow-sm hover:shadow-md hover:bg-[#be185d] active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-medium"
              >
                <Play fill="currentColor" className="w-5 h-5" />
                <span>{isWorkoutActive ? "Продолжить тренировку" : "Начать тренировку"}</span>
              </button>
            )}

          </div>
        )}

        {view === 'workout' && (
          <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="px-5 pt-8 pb-4 bg-[#fffdf7]/90 backdrop-blur-md sticky top-0 z-30 shadow-sm">
              <h1 className="text-3xl font-medium tracking-tight text-stone-900">Тренировка</h1>
              <p className="text-sm font-medium text-[#db2777] mt-1">
                 {isWorkoutDay && workoutData ? `${workoutData.dayName} • ${workoutData.focus}` : 'Отдых'}
              </p>
              
              {isWorkoutDay && workoutData && (
                <div className="mt-5 h-2.5 w-full bg-[#fef08a] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#db2777] transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${(completedExercisesCount / workoutData.exercises.length) * 100}%` }}
                  />
                </div>
              )}
            </header>

            <main className="px-5 py-4">
              {!isWorkoutDay ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-[#fefce8] border border-[#fef08a]/50 rounded-[32px] shadow-sm">
                  <div className="text-6xl mb-6">💤</div>
                  <h2 className="text-2xl font-medium text-[#713f12] mb-3">Сегодня день отдыха</h2>
                  <p className="text-[#713f12]/80 text-[15px] leading-relaxed">Вашим мышцам нужно время на восстановление. Наслаждайтесь заслуженным отдыхом!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workoutData?.exercises.map((exercise, index) => {
                    const isExerciseDone = Array.from({length: exercise.numSets}).every((_, i) => completedSets.includes(`${exercise.id}-${i}`));
                    
                    return (
                      <div 
                        key={exercise.id} 
                        className={`p-5 rounded-[28px] transition-all duration-300 relative overflow-hidden shadow-sm border ${
                          isExerciseDone ? 'bg-[#dcfce7] border-[#bbf7d0]' : 'bg-[#fffdf7] border-[#fef08a]/40'
                        }`}
                      >
                        <div className="relative z-10">
                          <h3 className={`text-[17px] font-medium leading-snug mb-3 transition-colors ${isExerciseDone ? 'text-[#166534]/70 line-through' : 'text-stone-900'}`}>
                            <span className={`${isExerciseDone ? 'text-[#166534]/50' : 'text-[#db2777]'} mr-2`}>{index + 1}.</span>
                            {exercise.title}
                          </h3>
                          
                          {exercise.imageId && <ExerciseImages imageId={exercise.imageId} isDone={isExerciseDone} />}
                          
                          <div className={`space-y-2 text-sm ${isExerciseDone ? 'text-[#166534]/70' : 'text-stone-600'}`}>
                            <div className={`flex items-center gap-2 w-fit px-3 py-1.5 rounded-[12px] font-medium ${isExerciseDone ? 'bg-[#bbf7d0]/60' : 'bg-[#fefce8]'}`}>
                              <span className={isExerciseDone ? 'text-[#166534]' : 'text-[#713f12]'}>{exercise.setsText}</span>
                              <span className="opacity-30">|</span>
                              <span className={isExerciseDone ? 'text-[#166534]' : 'text-[#713f12]'}>{exercise.reps}</span>
                            </div>
                            
                            {exercise.tempo && exercise.tempo !== '-' && (
                              <div className="flex items-center gap-2 mt-2 text-[13px] px-1 opacity-80">
                                <Timer className="w-4 h-4 shrink-0" />
                                <span>Темп: {exercise.tempo}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            {Array.from({length: exercise.numSets}).map((_, i) => {
                              const isSetDone = completedSets.includes(`${exercise.id}-${i}`);
                              return (
                                <button
                                  key={i}
                                  onClick={() => handleToggleSet(exercise.id, i, exercise.numSets)}
                                  className={`py-3 rounded-[16px] flex flex-col items-center justify-center gap-1 transition-all flex-1 min-w-[50px] shadow-sm active:scale-95 ${
                                    isSetDone
                                      ? 'bg-[#16a34a] text-white border-transparent'
                                      : 'bg-[#fefce8] text-[#713f12] border border-[#fef08a] hover:bg-[#fef08a]'
                                  }`}
                                >
                                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Сет</span>
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-lg font-medium leading-none">{i + 1}</span>
                                    {isSetDone && <Check className="w-3.5 h-3.5" strokeWidth={4} />}
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
                    <div className="mt-8 mb-4 flex flex-col gap-3">
                      <button
                        onClick={() => setIsWorkoutPaused(!isWorkoutPaused)}
                        className={`w-full py-4 rounded-full font-medium flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 border ${
                          isWorkoutPaused 
                            ? 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]' 
                            : 'bg-[#fff8cd] text-[#713f12] border-[#fef08a]'
                        }`}
                      >
                        {isWorkoutPaused ? <Play fill="currentColor" className="w-5 h-5" /> : <Pause fill="currentColor" className="w-5 h-5" />}
                        {isWorkoutPaused ? "Возобновить тренировку" : "Пауза тренировки"}
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsWorkoutActive(false);
                          setIsWorkoutPaused(false);
                          setView('home');
                        }}
                        className="w-full py-4 bg-[#fee2e2] text-[#991b1b] rounded-full font-medium flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 border border-[#fca5a5]/30 hover:bg-[#fecaca]"
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
          <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#fdf2f8] via-[#fffdf7] to-[#fefce8] overflow-y-auto animate-in fade-in zoom-in-95 duration-700">
            <div className="min-h-full w-full flex flex-col items-center justify-center px-6 py-12">
              <ButterflyConfetti />
              
              <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
              <div className="w-24 h-24 bg-[#fbcfe8] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-pink-200/50 animate-bounce" style={{ animationDuration: '3s' }}>
                 <Flower2 className="w-12 h-12 text-[#db2777]" />
              </div>
              
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f472b6] to-[#eab308] drop-shadow-sm mb-5 leading-tight">
                Тренировка окончена!
              </h1>
              
              <div className="bg-white/70 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl shadow-pink-100/50 mb-8 w-full">
                <p className="text-[#831843] text-[16px] font-medium leading-relaxed italic">
                  "{FLUTTERSHY_QUOTES[activeDay % FLUTTERSHY_QUOTES.length]}"
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full mb-10">
                <div className="bg-[#dcfce7] p-5 rounded-[24px] shadow-sm flex flex-col items-center justify-center border border-[#bbf7d0]/50">
                   <div className="text-4xl font-black text-[#166534] mb-1 tracking-tighter">{workoutData?.exercises.length}</div>
                   <div className="text-[10px] font-bold text-[#166534]/70 uppercase tracking-wider">Упражнений</div>
                </div>
                <div className="bg-[#fff8cd] p-5 rounded-[24px] shadow-sm flex flex-col items-center justify-center border border-[#fef08a]/50">
                   <div className="text-4xl font-black text-[#713f12] mb-1 tracking-tighter">{formatTotalWorkoutTime(stats.totalTimeSeconds || 0)}</div>
                   <div className="text-[10px] font-bold text-[#713f12]/70 uppercase tracking-wider">Общее время</div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setIsWorkoutActive(false);
                  setView('home');
                }}
                className="w-full bg-gradient-to-r from-[#f472b6] to-[#db2777] text-white px-5 py-4 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 font-bold text-lg"
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
          <div className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-50 transition-opacity animate-in fade-in" onClick={stopTimer} />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-full duration-300">
            <div className="bg-[#fffdf7] rounded-t-[32px] p-6 pb-10 shadow-2xl flex flex-col gap-4">
              <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-2" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-800 font-medium">
                  <Timer className="w-5 h-5 text-[#db2777]" />
                  Таймер отдыха
                </div>
                <button onClick={stopTimer} className="p-2 bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center font-mono text-[64px] font-normal tracking-tighter text-stone-900 my-2">
                {formatTime(timerRemaining)}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[60, 90, 120].map((t) => (
                  <button
                    key={t}
                    onClick={() => startTimer(t)}
                    className={`py-3.5 rounded-[16px] text-sm font-medium transition-colors active:scale-95 ${
                      timerDuration === t ? 'bg-[#fbcfe8] text-[#831843]' : 'bg-[#fefce8] border border-[#fef08a]/50 text-[#713f12] hover:bg-[#fef08a]'
                    }`}
                  >
                    {t} сек
                  </button>
                ))}
              </div>
              
              {timerRemaining === 0 && (
                <button onClick={stopTimer} className="w-full py-4 rounded-[16px] bg-[#db2777] text-white font-medium text-lg mt-3 flex items-center justify-center gap-2 animate-pulse active:scale-95 shadow-md">
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
