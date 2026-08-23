import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, Timer, Flower2, Settings2, Square, X, Volume2, ArrowLeft, Play } from 'lucide-react';

// --- Types & Data ---

type Exercise = {
  id: string;
  title: string;
  setsText: string;
  numSets: number;
  reps: string;
  tempo?: string;
  imageId: string;
};

type WorkoutDay = {
  dayName: string;
  focus: string;
  exercises: Exercise[];
};

const WORKOUTS: Record<number, WorkoutDay> = {
  1: { // Monday
    dayName: 'День 1',
    focus: 'Ноги и тяги',
    exercises: [
      { id: 'd1e1', title: 'Болгарские сплит-приседания (с гантелями)', setsText: '4 подхода', numSets: 4, reps: '10–15 на каждую ногу', tempo: '3 сек вниз, пауза 1 сек, подъем', imageId: 'Split_Squat_with_Dumbbells' },
      { id: 'd1e2', title: 'Румынская тяга на одной ноге', setsText: '3 подхода', numSets: 3, reps: '12–15 повторений', tempo: '3 сек вниз, подъем', imageId: 'Kettlebell_One-Legged_Deadlift' },
      { id: 'd1e3', title: 'Тяга штанги в наклоне к поясу', setsText: '4 подхода', numSets: 4, reps: '15–20 (до отказа)', tempo: '3 сек опускание, пауза вверху', imageId: 'Bent_Over_Barbell_Row' },
      { id: 'd1e4', title: 'Сгибания рук со штангой на бицепс', setsText: '3 подхода', numSets: 3, reps: '12–15 повторений', imageId: 'Barbell_Curl' },
    ]
  },
  3: { // Wednesday
    dayName: 'День 2',
    focus: 'Жимы и плечи',
    exercises: [
      { id: 'd2e1', title: 'Жим гантелей лежа на полу (Floor Press)', setsText: '4 подхода', numSets: 4, reps: '15–20 повторений', tempo: '3 сек вниз, касание локтями пола, жим вверх', imageId: 'Dumbbell_Floor_Press' },
      { id: 'd2e2', title: 'Отжимания от пола', setsText: '4 подхода', numSets: 4, reps: 'До отказа (с весом если легко)', imageId: 'Pushups' },
      { id: 'd2e3', title: 'Армейский жим штанги стоя', setsText: '3 подхода', numSets: 3, reps: '12–15 повторений', tempo: '3 сек вниз, пауза у груди', imageId: 'Standing_Military_Press' },
      { id: 'd2e4', title: 'Махи гантелями в стороны', setsText: '3 подхода', numSets: 3, reps: '15–20 повторений', imageId: 'Side_Lateral_Raise' },
    ]
  },
  5: { // Friday
    dayName: 'День 3',
    focus: 'Всё тело + кор',
    exercises: [
      { id: 'd3e1', title: 'Приседания со штангой на груди (Фронтальные)', setsText: '4 подхода', numSets: 4, reps: '15–20 повторений', tempo: '4 сек вниз, пауза 2 сек внизу', imageId: 'Front_Barbell_Squat' },
      { id: 'd3e2', title: 'Тяга гантели одной рукой в упоре', setsText: '4 подхода', numSets: 4, reps: '12–15 на каждую руку', imageId: 'One-Arm_Dumbbell_Row' },
      { id: 'd3e3', title: 'Французский жим с гантелями лежа', setsText: '3 подхода', numSets: 3, reps: '12–15 повторений', imageId: 'Lying_Dumbbell_Tricep_Extension' },
      { id: 'd3e4', title: 'Подъемы ног или скручивания на пресс', setsText: '3 подхода', numSets: 3, reps: 'До отказа', imageId: 'Crunches' },
    ]
  }
};

const DAY_NAMES = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

// --- Helper Components ---

const ExerciseImages = ({ imageId, isDone }: { imageId: string, isDone: boolean }) => {
  const baseUrl = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
  return (
    <div className={`flex gap-2 w-full mt-3 mb-4 transition-all duration-500 ${isDone ? 'opacity-40 grayscale' : ''}`}>
      <div className="flex-1 rounded-2xl overflow-hidden bg-white border-2 border-stone-100 shadow-sm aspect-square relative flex items-center justify-center p-2">
        <img 
          src={`${baseUrl}${imageId}/0.jpg`} 
          className="w-full h-full object-contain mix-blend-multiply" 
          alt="Start position" 
          loading="lazy"
        />
      </div>
      <div className="flex-1 rounded-2xl overflow-hidden bg-white border-2 border-stone-100 shadow-sm aspect-square relative flex items-center justify-center p-2">
        <img 
          src={`${baseUrl}${imageId}/1.jpg`} 
          className="w-full h-full object-contain mix-blend-multiply" 
          alt="End position" 
          loading="lazy"
        />
      </div>
    </div>
  );
};

const Butterfly = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C11.5 3 11 4 11 5C11 6.5 11.5 7.5 12 9C12.5 7.5 13 6.5 13 5C13 4 12.5 3 12 2Z" fill="#ec4899" opacity="0.8"/>
    <path d="M11.5 6.5C8 4 4 4 2 6C3.5 8 7 9 10 9.5C10.5 8.5 11 7.5 11.5 6.5Z" fill="#f472b6" opacity="0.9"/>
    <path d="M12.5 6.5C16 4 20 4 22 6C20.5 8 17 9 14 9.5C13.5 8.5 13 7.5 12.5 6.5Z" fill="#f472b6" opacity="0.9"/>
    <path d="M10.5 10.5C7 11 3.5 13 3 16C5.5 16.5 9 14.5 11.5 12C11 11.5 10.5 11 10.5 10.5Z" fill="#fbcfe8" opacity="0.9"/>
    <path d="M13.5 10.5C17 11 20.5 13 21 16C18.5 16.5 15 14.5 12.5 12C13 11.5 13.5 11 13.5 10.5Z" fill="#fbcfe8" opacity="0.9"/>
  </svg>
);

// --- Main App Component ---

export default function App() {
  // --- State ---
  const [view, setView] = useState<'home' | 'workout'>('home');
  
  // Current Date handling for resetting progress
  const getLocalDateString = (d: Date = new Date()) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [currentDateStr] = useState(getLocalDateString());
  const realDayOfWeek = new Date().getDay();
  const [simulatedDay, setSimulatedDay] = useState<number | null>(null);
  
  const activeDay = simulatedDay !== null ? simulatedDay : realDayOfWeek;
  const isWorkoutDay = activeDay === 1 || activeDay === 3 || activeDay === 5;
  const workoutData = WORKOUTS[activeDay];

  // Exercises Progress (array of set IDs, e.g. "d1e1-0", "d1e1-1")
  const [completedSets, setCompletedSets] = useState<string[]>([]);
  
  // Workout Stats History
  const [stats, setStats] = useState(() => {
    const stored = localStorage.getItem('workout_stats_v3');
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        if (typeof parsed.totalTimeSeconds !== 'number') parsed.totalTimeSeconds = 0;
        return parsed;
      } catch (e) {}
    }
    return { installDate: getLocalDateString(), completedDates: [] as string[], totalTimeSeconds: 0 };
  });

  // Timer State
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState<number>(90); // default 90s
  const [timerActive, setTimerActive] = useState(false);
  const [showDevMode, setShowDevMode] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- Effects ---

  // Persist Stats
  useEffect(() => {
    localStorage.setItem('workout_stats_v3', JSON.stringify(stats));
  }, [stats]);

  // Track time spent in workout view
  const lastTickRef = useRef<number>(Date.now());
  useEffect(() => {
    if (view !== 'workout') return;
    
    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = Math.floor((now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      setStats(prev => ({ ...prev, totalTimeSeconds: (prev.totalTimeSeconds || 0) + delta }));
    }, 5000); // tick every 5 seconds

    return () => {
      clearInterval(interval);
      const now = Date.now();
      const delta = Math.floor((now - lastTickRef.current) / 1000);
      setStats(prev => ({ ...prev, totalTimeSeconds: (prev.totalTimeSeconds || 0) + delta }));
    };
  }, [view]);

  // Load / Reset progress based on date
  useEffect(() => {
    const today = getLocalDateString();
    const stored = localStorage.getItem('workout_progress_v2');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          setCompletedSets(parsed.completedSets || []);
        } else {
          // New day, reset
          setCompletedSets([]);
          localStorage.setItem('workout_progress_v2', JSON.stringify({ date: today, completedSets: [] }));
        }
      } catch (e) {
        console.error("Failed to parse progress", e);
      }
    } else {
      localStorage.setItem('workout_progress_v2', JSON.stringify({ date: today, completedSets: [] }));
    }
  }, []);

  // Save progress on change
  useEffect(() => {
    if (completedSets.length >= 0) {
      localStorage.setItem('workout_progress_v2', JSON.stringify({
        date: currentDateStr,
        completedSets: completedSets
      }));
    }
  }, [completedSets, currentDateStr]);

  // Timer Tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive && timerRemaining !== null && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining((prev) => (prev !== null ? prev - 1 : 0));
      }, 1000);
    } else if (timerActive && timerRemaining === 0) {
      setTimerActive(false);
      playAlarm();
    }
    return () => clearInterval(interval);
  }, [timerActive, timerRemaining]);

  // --- Handlers ---

  const handleToggleSet = (exerciseId: string, setIndex: number, totalSets: number) => {
    const setId = `${exerciseId}-${setIndex}`;
    const isDoneNow = !completedSets.includes(setId);
    
    if (isDoneNow) {
      const willBeDone = Array.from({length: totalSets}).every((_, i) => 
        i === setIndex ? true : completedSets.includes(`${exerciseId}-${i}`)
      );
      
      setCompletedSets(prev => [...prev, setId]);
      
      // Auto-start timer if exercise is NOT fully complete yet
      if (!willBeDone) {
        startTimer();
      }
    } else {
      setCompletedSets(prev => prev.filter(id => id !== setId));
    }
  };

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playAlarm = () => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 500]);
    }
    
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.4); // G5
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    }
  };

  const startTimer = (presetDuration?: number) => {
    initAudio();
    const duration = presetDuration || timerDuration;
    setTimerDuration(duration);
    setTimerRemaining(duration);
    setTimerActive(true);
  };

  const stopTimer = () => {
    setTimerActive(false);
    setTimerRemaining(null);
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

  // --- Derived State ---
  const completedExercisesCount = workoutData?.exercises.filter(ex => 
    Array.from({length: ex.numSets}).every((_, i) => completedSets.includes(`${ex.id}-${i}`))
  ).length || 0;

  const isWorkoutDayFullyCompleted = workoutData && workoutData.exercises.length > 0 && completedExercisesCount === workoutData.exercises.length;

  useEffect(() => {
    if (simulatedDay !== null || !isWorkoutDay) return;
    setStats(prev => {
      const hasToday = prev.completedDates.includes(currentDateStr);
      if (isWorkoutDayFullyCompleted && !hasToday) {
        return { ...prev, completedDates: [...prev.completedDates, currentDateStr] };
      }
      if (!isWorkoutDayFullyCompleted && hasToday) {
        return { ...prev, completedDates: prev.completedDates.filter((d: string) => d !== currentDateStr) };
      }
      return prev;
    });
  }, [simulatedDay, isWorkoutDay, isWorkoutDayFullyCompleted, currentDateStr]);

  const { misses, completedWeeks, missedLastWorkout, mockingMessage } = useMemo(() => {
      let missesCount = 0;
      
      const parseDateSafe = (dStr: string) => {
        const [y, m, d] = dStr.split('-');
        return new Date(Number(y), Number(m) - 1, Number(d));
      };

      let currentD = parseDateSafe(stats.installDate);
      const todayD = parseDateSafe(currentDateStr);
      
      while (currentD < todayD) {
          const dStr = getLocalDateString(currentD);
          const legacyDStr = `${currentD.getFullYear()}-${currentD.getMonth() + 1}-${currentD.getDate()}`;
          const day = currentD.getDay();
          if ([1, 3, 5].includes(day)) {
              if (!stats.completedDates.includes(dStr) && !stats.completedDates.includes(legacyDStr)) {
                  missesCount++;
              }
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
              if (!stats.completedDates.includes(dStr) && !stats.completedDates.includes(legacyDStr)) {
                  missedLast = true;
              }
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
      const cWeeks = Object.values(weeksMap).filter(count => count >= 3).length;

      let msg = "";
      if (missedLast) {
          let list = [];
          if (missesCount <= 2) {
              list = [
                  "Эй, отдыхающий, пропуск тренировки был жизненно необходим?",
                  "Твои мышцы передают привет и спрашивают, когда ты соизволишь поработать.",
                  "Опять пропуск? Флаттершай, конечно, добрая, но даже она неодобрительно качает головой."
              ];
          } else if (missesCount <= 5) {
              list = [
                  "Эй, неудачник, диван сам себя не пролежит, да? Очередной пропуск.",
                  "Так мы форму не построим. Твои отговорки уже не работают.",
                  "Три пропуска? Ты вообще собираешься тренироваться, или это приложение чисто для красоты?"
              ];
          } else {
              list = [
                  "Слушай, тряпка. Ты либо тренируешься, либо удаляй приложение. Хватит позориться.",
                  "Твоя лень достигла космических масштабов. Очередной пропуск? Кто бы сомневался.",
                  "Ноль дисциплины. Абсолютный ноль. Возвращайся, когда у тебя появится хоть капля силы воли."
              ];
          }
          const seed = todayD.getTime() / 86400000;
          msg = list[Math.floor(seed) % list.length];
      }

      return { misses: missesCount, completedWeeks: cWeeks, missedLastWorkout: missedLast, mockingMessage: msg };
  }, [stats, currentDateStr]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#fefce8] text-stone-700 font-sans pb-32 selection:bg-pink-200 relative overflow-hidden">
      
      {/* Background Decorations */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-40 z-0">
        <Flower2 className="absolute top-10 left-4 text-pink-300 w-12 h-12 rotate-12" />
        <Flower2 className="absolute top-40 right-4 text-pink-300 w-8 h-8 -rotate-12 opacity-60" />
        <Butterfly className="absolute top-20 right-10 w-10 h-10" />
        <Butterfly className="absolute bottom-40 left-8 w-8 h-8 -scale-x-100 rotate-45" />
      </div>

      <div className="max-w-md mx-auto relative z-10">
        
        {view === 'home' ? (
          <div className="px-6 py-8 space-y-6">
            <header className="text-center mb-8 relative">
              <Butterfly className="w-10 h-10 mx-auto mb-4 text-pink-400" />
              <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Твой Прогресс</h1>
            </header>

            {missedLastWorkout && (
              <div className="bg-red-50 border-2 border-red-200 p-5 rounded-3xl relative overflow-hidden shadow-sm">
                <div className="font-bold text-red-700 mb-2 flex items-center gap-2">
                  Пропуск зафиксирован 🚨
                </div>
                <p className="text-red-600/90 text-sm font-medium leading-relaxed">{mockingMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-pink-100 flex flex-col items-center justify-center text-center">
                <div className="text-5xl font-black text-pink-500 mb-2">{completedWeeks}</div>
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider leading-tight">Идеальных<br/>недель</div>
              </div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200 flex flex-col items-center justify-center text-center">
                <div className="text-5xl font-black text-stone-700 mb-2">{misses}</div>
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider leading-tight">Пропусков<br/>всего</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100 flex flex-col items-center justify-center text-center">
              <div className="text-4xl font-black text-stone-800 mb-1">{formatTotalWorkoutTime(stats.totalTimeSeconds || 0)}</div>
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider leading-tight">Общее время тренировок</div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setView('workout')} 
                className="w-full bg-pink-500 text-white font-bold text-lg py-5 rounded-[2rem] shadow-lg shadow-pink-200 hover:bg-pink-600 transition-transform active:scale-95 flex items-center justify-center gap-3"
              >
                {isWorkoutDay && !isWorkoutDayFullyCompleted ? <><Play fill="currentColor" className="w-5 h-5"/> Начать тренировку</> : 'Посмотреть расписание'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="pt-8 pb-6 px-6 bg-[#fef9c3] rounded-b-[2.5rem] shadow-sm mb-6 flex flex-col items-center relative">
              <button 
                onClick={() => setView('home')}
                className="absolute top-4 left-4 p-2 text-stone-500 hover:text-pink-500 transition-colors bg-white/50 rounded-full"
                aria-label="Назад"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button 
            onClick={() => setShowDevMode(!showDevMode)}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-pink-400 transition-colors bg-white/50 rounded-full"
            aria-label="Режим разработчика"
          >
            <Settings2 className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <Butterfly className="w-6 h-6" />
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Трекер Тренировок</h1>
            <Butterfly className="w-6 h-6 -scale-x-100" />
          </div>
          
          <p className="text-lg font-medium text-pink-500 mb-1">
             {isWorkoutDay && workoutData ? `${workoutData.dayName} (${DAY_NAMES[activeDay]})` : DAY_NAMES[activeDay]}
          </p>
          
          {isWorkoutDay && workoutData && (
            <div className="flex flex-col items-center mt-3 w-full">
              <span className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-2 bg-white/60 px-4 py-1 rounded-full shadow-sm">
                {workoutData.focus}
              </span>
              
              {/* Progress Bar */}
              <div className="w-full max-w-[200px] mt-2">
                <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
                  <span>Прогресс</span>
                  <span>{completedExercisesCount} / {workoutData.exercises.length}</span>
                </div>
                <div className="h-3 w-full bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-pink-400 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${(completedExercisesCount / workoutData.exercises.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Developer Mode Panel */}
        {showDevMode && (
          <div className="mx-4 mb-6 p-4 bg-white rounded-3xl shadow-md border border-pink-100 relative">
            <button onClick={() => setShowDevMode(false)} className="absolute top-3 right-3 text-stone-400">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-pink-500" />
              Режим Разработчика
            </h2>
            <div className="flex bg-stone-100 p-1 rounded-2xl w-full">
              {[
                { label: 'Реал', val: null },
                { label: 'День 1', val: 1 },
                { label: 'День 2', val: 3 },
                { label: 'День 3', val: 5 }
              ].map(opt => (
                <button 
                  key={opt.label}
                  onClick={() => setSimulatedDay(opt.val)}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors ${simulatedDay === opt.val ? 'bg-pink-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="px-4">
          {!isWorkoutDay ? (
            // Rest Day View
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white/60 rounded-[3rem] shadow-sm border border-white">
              <div className="text-6xl mb-6 drop-shadow-sm">💤</div>
              <h2 className="text-2xl font-bold text-stone-800 mb-3">Сегодня день отдыха</h2>
              <p className="text-stone-500 text-lg">
                Вашим мышцам нужно время на восстановление. Наслаждайтесь отдыхом!
              </p>
              <div className="flex gap-4 mt-8 opacity-50">
                <Flower2 className="w-8 h-8 text-pink-400" />
                <Flower2 className="w-8 h-8 text-yellow-400" />
                <Flower2 className="w-8 h-8 text-pink-400" />
              </div>
            </div>
          ) : (
            // Workout Day View
            <div className="space-y-4">
              {workoutData?.exercises.map((exercise, index) => {
                const isExerciseDone = Array.from({length: exercise.numSets}).every((_, i) => completedSets.includes(`${exercise.id}-${i}`));
                
                return (
                  <div 
                    key={exercise.id} 
                    className={`p-5 rounded-3xl transition-all duration-300 border-2 shadow-sm relative overflow-hidden ${
                      isExerciseDone 
                        ? 'bg-green-50/80 border-green-200/50' 
                        : 'bg-white border-transparent shadow-md'
                    }`}
                  >
                    {isExerciseDone && (
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-green-200/40 rounded-full blur-xl pointer-events-none" />
                    )}
                    
                    <div className="relative z-10">
                      <h3 className={`text-lg font-bold leading-tight mb-2 transition-all ${
                        isExerciseDone ? 'text-stone-400 line-through' : 'text-stone-800'
                      }`}>
                        <span className="text-pink-400 mr-1.5 opacity-80">{index + 1}.</span>
                        {exercise.title}
                      </h3>
                      
                      {exercise.imageId && (
                        <ExerciseImages imageId={exercise.imageId} isDone={isExerciseDone} />
                      )}
                      
                      <div className={`space-y-1.5 text-sm ${isExerciseDone ? 'text-stone-400' : 'text-stone-600'}`}>
                        <div className="flex items-center gap-2 bg-stone-100/60 w-fit px-3 py-1 rounded-lg">
                          <span className="font-semibold text-stone-700">{exercise.setsText}</span>
                          <span className="text-stone-300">|</span>
                          <span>{exercise.reps}</span>
                        </div>
                        
                        {exercise.tempo && exercise.tempo !== '-' && (
                          <div className="flex items-start gap-2 mt-2 text-stone-500 text-xs px-1">
                            <Timer className="w-4 h-4 shrink-0 opacity-60" />
                            <span className="leading-snug">Темп: {exercise.tempo}</span>
                          </div>
                        )}
                      </div>

                      {/* Sets Checkboxes */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {Array.from({length: exercise.numSets}).map((_, i) => {
                          const isSetDone = completedSets.includes(`${exercise.id}-${i}`);
                          return (
                            <button
                              key={i}
                              onClick={() => handleToggleSet(exercise.id, i, exercise.numSets)}
                              className={`px-2 py-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all flex-1 min-w-[50px] border-2 ${
                                isSetDone
                                  ? 'bg-green-400 border-green-400 text-white shadow-inner'
                                  : 'bg-stone-50 border-stone-200 text-stone-400 hover:border-pink-300'
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Подход</span>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-lg font-black leading-none">{i + 1}</span>
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
            </div>
          )}
        </main>
        </>
        )}
      </div>

      {/* Floating Timer UI */}
      {timerActive && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 flex justify-center">
          <div className="bg-white max-w-sm w-full p-4 rounded-[2rem] shadow-xl border border-pink-100 flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-stone-600 font-medium">
                <Timer className="w-5 h-5 text-pink-500" />
                Таймер отдыха
              </div>
              <button 
                onClick={stopTimer}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center font-mono text-5xl font-bold tracking-tight text-stone-800 my-1 flex justify-center items-center gap-2">
              {formatTime(timerRemaining)}
              {timerRemaining === 0 && <Volume2 className="w-8 h-8 text-pink-500 animate-pulse" />}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[60, 90, 120].map((t) => (
                <button
                  key={t}
                  onClick={() => startTimer(t)}
                  className={`py-2 rounded-xl text-sm font-bold transition-colors ${
                    timerDuration === t 
                      ? 'bg-pink-100 text-pink-600' 
                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  {t} сек
                </button>
              ))}
            </div>
            
            {timerRemaining === 0 ? (
              <button
                onClick={stopTimer}
                className="w-full py-3 bg-pink-500 text-white rounded-2xl font-bold mt-1 hover:bg-pink-600 transition-colors shadow-md shadow-pink-200"
              >
                Завершить отдых
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="w-full py-3 bg-stone-100 text-stone-600 rounded-2xl font-bold mt-1 hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4" />
                Остановить
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
