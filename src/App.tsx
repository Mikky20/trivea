import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Flame, Trophy, Clock, ArrowRight, Home } from 'lucide-react';

type RegistrationForm = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

// --- Components & Utilities ---

// --- Data Models & Question Streak Utilities ---

export type PlayerStreakRecord = {
  phoneNumber: string;
  longestStreak: number;
  highestScore: number;
  totalQuizzes: number;
  lastPlayed?: string;
};

export type SavedQuizSession = {
  phoneNumber: string;
  currentIdx: number;
  score: number;
  questionStreak: number;
  maxStreak: number;
  timeLeft: number;
  questions: any[];
  selectedOption: string | null;
  isAnswerRevealed: boolean;
  savedAt: number;
};

export function getActivePhoneNumber(): string {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.phoneNumber) return parsed.phoneNumber;
    }
  } catch (e) {}
  return 'Guest';
}

export function getSavedSessionKey(phone: string): string {
  return `trivea_active_quiz_${phone}`;
}

export function loadSavedSession(phone: string): SavedQuizSession | null {
  try {
    const raw = localStorage.getItem(getSavedSessionKey(phone));
    if (!raw) return null;
    const session: SavedQuizSession = JSON.parse(raw);
    if (session && Array.isArray(session.questions) && session.questions.length > 0) {
      return session;
    }
  } catch (e) {}
  return null;
}

export function saveActiveSession(session: SavedQuizSession) {
  try {
    localStorage.setItem(getSavedSessionKey(session.phoneNumber), JSON.stringify(session));
  } catch (e) {}
}

export function clearSavedSession(phone: string) {
  try {
    localStorage.removeItem(getSavedSessionKey(phone));
  } catch (e) {}
}

export async function fetchPlayerStreakRecord(phone: string): Promise<PlayerStreakRecord | null> {
  if (!phone || phone === 'Guest') return null;
  try {
    const res = await fetch(`/trivea/api/streak.php?phoneNumber=${encodeURIComponent(phone)}`);
    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    }
  } catch (e) {
    console.error('Streak fetch error:', e);
  }
  return null;
}

export async function recordStreakToServer(phone: string, streak: number, score: number, isQuizCompleted = false) {
  if (!phone || phone === 'Guest') return null;
  try {
    const res = await fetch('/trivea/api/streak.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phone,
        streak,
        score,
        isQuizCompleted,
      }),
    });
    return await res.json();
  } catch (e) {
    console.error('Streak save error:', e);
    return null;
  }
}

// --- Components for Routes ---

function Landing() {
  const navigate = useNavigate();
  const [playerRecord, setPlayerRecord] = useState<PlayerStreakRecord | null>(null);
  const [hasLoggedInUser, setHasLoggedInUser] = useState(false);
  const [savedSession, setSavedSession] = useState<SavedQuizSession | null>(null);
  const userPhone = getActivePhoneNumber();

  useEffect(() => {
    const user = localStorage.getItem('user');
    setHasLoggedInUser(!!user);

    if (userPhone && userPhone !== 'Guest') {
      fetchPlayerStreakRecord(userPhone).then(rec => {
        if (rec) setPlayerRecord(rec);
      });
      const saved = loadSavedSession(userPhone);
      if (saved && (saved.currentIdx > 0 || saved.isAnswerRevealed || saved.score > 0)) {
        setSavedSession(saved);
      }
    }
  }, [userPhone]);

  const handleStart = () => {
    if (hasLoggedInUser) {
      navigate('/quiz');
    } else {
      navigate('/auth');
    }
  };

  const handleClearAndStart = () => {
    clearSavedSession(userPhone);
    setSavedSession(null);
    navigate('/quiz');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-950 p-4 md:p-6 text-center relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-700/25 via-blue-950/85 to-blue-950 pointer-events-none"></div>
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-blue-900/60 to-transparent pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center">
        
        {/* Title & Tagline */}
        <div className="mb-6">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-blue-900/80 border border-blue-400/40 text-blue-200 text-xs md:text-sm font-semibold uppercase tracking-wider mb-3 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <span>Gospels Interactive Challenge</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-wider drop-shadow-[0_0_25px_rgba(59,130,246,0.8)]">
            Gospels Trivia
          </h1>
          <p className="text-blue-200 text-sm md:text-base mt-2 max-w-md mx-auto font-medium">
            Test your knowledge across Matthew, Mark, Luke, and John. Answer consecutively to build your question streak!
          </p>
        </div>

        {/* Unfinished Session Alert (if user left mid-game) */}
        {savedSession && (
          <div className="w-full bg-gradient-to-r from-amber-600/25 via-blue-900/90 to-amber-600/25 border-2 border-amber-400/60 rounded-3xl p-5 mb-6 text-left shadow-[0_0_30px_rgba(245,158,11,0.3)] backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-amber-300 font-extrabold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" /> Unfinished Game Detected
              </span>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                Q {savedSession.currentIdx + 1} / {savedSession.questions.length}
              </span>
            </div>
            <p className="text-white text-sm font-semibold mb-3">
              You left off with <span className="text-amber-300">{savedSession.score} pts</span> and a <span className="text-emerald-400 font-bold">{savedSession.questionStreak} question streak</span>!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/quiz')}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black py-2.5 px-4 rounded-xl text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Resume Game ▶</span>
              </button>
              <button
                onClick={handleClearAndStart}
                className="bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-200 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Start Over 🔄
              </button>
            </div>
          </div>
        )}

        {/* Question Streak Showcase Card */}
        <div className="w-full bg-gradient-to-b from-blue-900/90 to-blue-950/90 border border-blue-500/50 rounded-3xl p-5 md:p-6 mb-8 shadow-[0_0_35px_rgba(30,58,138,0.6)] backdrop-blur-md">
          
          {/* Header with Player Phone & Longest Streak */}
          <div className="flex items-center justify-between pb-4 border-b border-blue-800/60">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                <Flame className="w-8 h-8 text-gray-950 fill-gray-950" />
              </div>
              <div className="text-left">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-black tracking-tight text-amber-400">
                    {playerRecord?.longestStreak || 0}
                  </span>
                  <span className="text-base md:text-lg font-extrabold uppercase tracking-wider text-blue-200">
                    Question Streak
                  </span>
                </div>
                <div className="text-xs text-blue-300/80 font-medium">
                  {hasLoggedInUser 
                    ? `Linked to: ${userPhone}` 
                    : 'Personal best questions answered in a row'}
                </div>
              </div>
            </div>

            {/* Total Quizzes / Best Score Badge */}
            <div className="flex flex-col items-end bg-blue-950/80 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              <span className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" /> Best Score
              </span>
              <span className="text-sm md:text-base font-black text-amber-300">
                {playerRecord?.highestScore || 0} pts
              </span>
            </div>
          </div>

          {/* Description & Streak Rules */}
          <div className="pt-4 text-left">
            <div className="bg-blue-950/70 border border-blue-800/40 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-1">How Question Streaks Work</h3>
              <p className="text-xs text-blue-200/90 leading-relaxed">
                Every correct question answered increases your active streak in real-time. If you get a question wrong, the streak resets to 0.
              </p>
            </div>
          </div>
        </div>

        {/* Enter / Continue Button */}
        <button
          onClick={handleStart}
          className="w-full sm:w-auto min-w-[280px] bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:to-blue-400 text-white py-5 px-10 rounded-2xl font-black text-xl uppercase tracking-wider hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(37,99,235,0.7)] border-2 border-blue-400/80 flex items-center justify-center gap-3 cursor-pointer"
        >
          <span>{hasLoggedInUser ? (savedSession ? 'Resume / Enter Quiz' : 'Start Quiz Game') : 'Enter Game'}</span>
          <ArrowRight className="w-6 h-6" />
        </button>

        {/* Quick Features Row */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-8 text-xs text-blue-200/80 font-semibold">
          <div className="bg-blue-950/60 border border-blue-800/40 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>20 Min Timer</span>
          </div>
          <div className="bg-blue-950/60 border border-blue-800/40 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Hot Streaks</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function Auth() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationForm>();
  const [message, setMessage] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const onSubmit = async (data: RegistrationForm) => {
    try {
      const endpoint = isLogin ? '/trivea/api/login.php' : '/trivea/api/register.php';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem('user', JSON.stringify({ phoneNumber: data.phoneNumber }));
        navigate('/quiz');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('API Error:', error);
      setMessage("An error occurred.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-950 p-4">
      <div className="bg-blue-900/80 border border-blue-500/50 p-8 rounded-xl shadow-[0_0_30px_rgba(30,58,138,0.5)] w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-100 uppercase tracking-widest">{isLogin ? 'Login' : 'Registration'}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-blue-200">First Name</label>
                <input {...register("firstName", { required: !isLogin })} className="w-full p-3 bg-blue-950 border border-blue-600 rounded mt-1 text-white focus:ring-2 focus:ring-blue-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200">Last Name</label>
                <input {...register("lastName", { required: !isLogin })} className="w-full p-3 bg-blue-950 border border-blue-600 rounded mt-1 text-white focus:ring-2 focus:ring-blue-400 outline-none" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-blue-200">Phone Number</label>
            <input {...register("phoneNumber", { required: true })} className="w-full p-3 bg-blue-950 border border-blue-600 rounded mt-1 text-white focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-500 transition duration-200 shadow-[0_0_10px_rgba(37,99,235,0.4)]">{isLogin ? 'Login' : 'Submit'}</button>
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-blue-300 text-sm mt-4 hover:underline">
            {isLogin ? 'Need to register?' : 'Already registered? Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Sound Synthesizer using Web Audio API ---
function playSound(type: 'correct' | 'wrong') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'correct') {
      // Pleasant upward two-tone chime (Major third / fifth: E5 -> G#5 -> B5)
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.1); // G5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.22); // C6
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.2, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.5);
    } else {
      // Gentle subtle downward buzz/thud
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch (err) {
    console.error('Audio play error:', err);
  }
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function Quiz() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [questionStreak, setQuestionStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [savedPrompt, setSavedPrompt] = useState<SavedQuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userPhone = getActivePhoneNumber();

  // Load questions or prompt to resume session
  const startFreshQuiz = () => {
    setLoading(true);
    fetch('/trivea/api/questions.json')
      .then(res => res.json())
      .then((data: any[]) => {
        const randomized = shuffleArray(data).map(q => ({
          ...q,
          options: q.options ? shuffleArray(q.options) : q.options,
        }));
        setQuestions(randomized);
        setCurrentIdx(0);
        setScore(0);
        setQuestionStreak(0);
        setMaxStreak(0);
        setTimeLeft(20 * 60);
        setSelectedOption(null);
        setIsAnswerRevealed(false);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load questions:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const saved = loadSavedSession(userPhone);
    if (saved && saved.questions && saved.questions.length > 0 && (saved.currentIdx > 0 || saved.isAnswerRevealed || saved.score > 0) && saved.currentIdx < saved.questions.length) {
      setSavedPrompt(saved);
      setLoading(false);
    } else {
      startFreshQuiz();
    }
  }, [userPhone]);

  // Resume play from saved session
  const handleResumePlay = () => {
    if (!savedPrompt) return;
    setQuestions(savedPrompt.questions);
    setCurrentIdx(savedPrompt.currentIdx);
    setScore(savedPrompt.score);
    setQuestionStreak(savedPrompt.questionStreak || 0);
    setMaxStreak(savedPrompt.maxStreak || 0);
    setTimeLeft(savedPrompt.timeLeft || 20 * 60);
    setSelectedOption(savedPrompt.selectedOption || null);
    setIsAnswerRevealed(savedPrompt.isAnswerRevealed || false);
    setSavedPrompt(null);
  };

  // Start over fresh
  const handleStartOver = () => {
    clearSavedSession(userPhone);
    setSavedPrompt(null);
    startFreshQuiz();
  };

  // Timer countdown (only active when not prompting to resume)
  useEffect(() => {
    if (savedPrompt || loading || !questions.length) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [savedPrompt, loading, questions.length]);

  // Continuously persist in-progress quiz session to localStorage
  useEffect(() => {
    if (savedPrompt || loading || !questions.length) return;
    saveActiveSession({
      phoneNumber: userPhone,
      currentIdx,
      score,
      questionStreak,
      maxStreak,
      timeLeft,
      questions,
      selectedOption,
      isAnswerRevealed,
      savedAt: Date.now(),
    });
  }, [currentIdx, score, questionStreak, maxStreak, timeLeft, selectedOption, isAnswerRevealed, questions, savedPrompt, loading, userPhone]);

  if (loading) {
    return (
      <div className="text-white min-h-screen bg-blue-950 p-6 flex flex-col items-center justify-center font-bold text-xl gap-3">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Preparing your Gospel questions...</span>
      </div>
    );
  }

  const q = questions[currentIdx];

  const handleAnswer = (option: string) => {
    if (isAnswerRevealed) return; // Prevent double clicks on options once chosen

    const isCorrect = option === q.answer;
    setSelectedOption(option);
    setIsAnswerRevealed(true);

    if (isCorrect) {
      playSound('correct');
      const nextScore = score + 1;
      const nextStreak = questionStreak + 1;
      const nextMax = Math.max(maxStreak, nextStreak);

      setScore(nextScore);
      setQuestionStreak(nextStreak);
      setMaxStreak(nextMax);

      // Trigger celebratory confetti burst (extra celebration if streak is on fire!)
      confetti({
        particleCount: nextStreak >= 3 ? 80 : 50,
        spread: nextStreak >= 3 ? 85 : 65,
        origin: { y: 0.7 },
        colors: nextStreak >= 5
          ? ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#10b981']
          : ['#10b981', '#34d399', '#38bdf8', '#fbbf24', '#f59e0b'],
        disableForReducedMotion: true,
      });

      // Save longest streak record as JSON linked to player's phone number!
      recordStreakToServer(userPhone, nextMax, nextScore, false);
    } else {
      playSound('wrong');
      setQuestionStreak(0); // Question streak resets to 0 on incorrect answer
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswerRevealed(false);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      // Completed quiz! Clear session and record completion to server
      clearSavedSession(userPhone);
      localStorage.setItem('finalScore', score.toString());
      localStorage.setItem('finalStreak', maxStreak.toString());
      localStorage.setItem('totalQuestions', questions.length.toString());
      recordStreakToServer(userPhone, maxStreak, score, true);
      navigate('/result');
    }
  };

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`;
  const progressPercent = Math.round(((currentIdx + 1) / (questions.length || 1)) * 100);
  const circleRadius = 38;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="min-h-screen bg-blue-950 p-4 md:p-6 text-white flex flex-col items-center select-none relative">
      
      {/* Resume or Start Over Modal Prompt */}
      {savedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/90 backdrop-blur-md select-none">
          <div className="bg-gradient-to-b from-blue-900 to-blue-950 border-2 border-amber-500/70 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.4)] relative overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              ⏳
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-2">
              Resume Previous Play?
            </h2>
            <p className="text-blue-200 text-sm mb-6 font-medium">
              We found your unfinished quiz session linked to <span className="text-amber-300 font-bold">{userPhone}</span>.
            </p>

            {/* Saved Progress Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-blue-950/80 border border-blue-600/50 rounded-2xl p-4 text-left">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-blue-300 font-bold block">Current Question</span>
                <span className="text-base sm:text-lg font-black text-white">
                  Q {savedPrompt.currentIdx + 1} <span className="text-xs text-blue-300 font-normal">/ {savedPrompt.questions.length}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-blue-300 font-bold block">Current Score</span>
                <span className="text-base sm:text-lg font-black text-amber-400">
                  {savedPrompt.score} pts
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-blue-300 font-bold block">Question Streak</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> {savedPrompt.questionStreak || 0} in a row
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-blue-300 font-bold block">Time Left</span>
                <span className="text-base sm:text-lg font-black text-sky-300 font-mono">
                  {formatTime(savedPrompt.timeLeft || 1200)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleResumePlay}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-gray-950 font-black py-4 px-6 rounded-xl uppercase tracking-wider text-base sm:text-lg shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Resume Play ▶</span>
              </button>

              <button
                onClick={handleStartOver}
                className="w-full bg-blue-950 hover:bg-blue-900 border border-blue-500/60 text-blue-200 hover:text-white font-bold py-3.5 px-6 rounded-xl uppercase tracking-wider text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Over 🔄</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Top Header Bar: Home Button, Question Tracker, Circular Progress, Question Streak, Score & Timer */}
      <div className="w-full max-w-2xl bg-blue-900/60 border border-blue-600/40 rounded-2xl p-3 sm:p-4 mb-6 flex items-center justify-between shadow-[0_0_25px_rgba(30,58,138,0.4)] backdrop-blur-sm gap-2">
        
        {/* Left: Home Button & Question Tracker */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/')}
            title="Return to Home (Progress saved)"
            className="p-2 sm:px-3 sm:py-1.5 bg-blue-950/90 hover:bg-blue-800 border border-blue-500/60 hover:border-amber-400/80 rounded-xl text-blue-200 hover:text-white transition-all shadow-[0_0_10px_rgba(30,58,138,0.5)] active:scale-95 flex items-center gap-1.5 cursor-pointer text-xs font-bold uppercase tracking-wider"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-blue-300/80 font-bold">Progress</span>
            <span className="text-base sm:text-lg md:text-xl font-extrabold text-white">
              Q {currentIdx + 1} <span className="text-blue-400 text-xs sm:text-sm font-normal">/ {questions.length}</span>
            </span>
          </div>
        </div>

        {/* Center: Circular Progress Meter with Percentage inside */}
        <div className="flex flex-col items-center justify-center relative">
          <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
            {/* Background Track */}
            <circle
              cx="40"
              cy="40"
              r={circleRadius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-blue-950/80"
            />
            {/* Animated Progress Stroke */}
            <circle
              cx="40"
              cy="40"
              r={circleRadius}
              stroke="url(#progressGradient)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs sm:text-sm font-black text-white leading-none">{progressPercent}%</span>
          </div>
        </div>

        {/* Right: Question Streak, Score & Timer */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Question Streak Badge */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-300/90 font-bold flex items-center gap-0.5">
              <Flame className={`w-3 h-3 ${questionStreak >= 3 ? 'text-rose-400 fill-rose-400 animate-bounce' : 'text-amber-400 fill-amber-400'}`} /> Streak
            </span>
            <span className={`text-xs sm:text-sm md:text-base font-black px-2 py-0.5 rounded-lg border transition-all ${
              questionStreak >= 5
                ? 'bg-rose-950 text-amber-300 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse'
                : questionStreak >= 3
                ? 'bg-amber-950/90 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'bg-blue-950/80 text-amber-400 border-amber-500/40'
            }`}>
              {questionStreak}🔥
            </span>
          </div>

          {/* Score Badge */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-blue-300/80 font-bold">Score</span>
            <span className="text-xs sm:text-sm md:text-base font-black text-amber-400 bg-blue-950/80 px-2 sm:px-2.5 py-0.5 rounded-lg border border-amber-500/40">
              {score}
            </span>
          </div>

          {/* Timer Badge */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-blue-300/80 font-bold">Time</span>
            <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-lg border font-mono font-bold text-xs sm:text-sm md:text-base ${timeLeft <= 180 ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse' : 'bg-blue-950/80 border-blue-500/40 text-amber-300'}`}>
              <span className="text-xs">⏱️</span>
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      {q && (
        <div className="bg-blue-900/80 border border-blue-500/50 p-6 md:p-8 rounded-2xl w-full max-w-2xl shadow-[0_0_30px_rgba(30,58,138,0.5)]">
          
          {/* Question Streak Multiplier Banner */}
          {questionStreak >= 2 && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-600/30 via-rose-600/30 to-amber-600/30 border border-amber-400/60 text-amber-300 text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{questionStreak >= 5 ? '🔥 UNSTOPPABLE STREAK!' : '🔥 HOT STREAK!'} {questionStreak} QUESTIONS IN A ROW</span>
            </div>
          )}

          <p className="text-xl md:text-2xl font-semibold mb-6 text-blue-50 leading-relaxed">{q.question}</p>
          
          <div className="grid gap-3.5">
            {q.options.map((option: string) => {
              let btnStyle = "bg-blue-950 border-blue-600 hover:bg-blue-800 text-white";

              if (isAnswerRevealed) {
                if (option === q.answer) {
                  // Correct answer is always marked GREEN
                  btnStyle = "bg-emerald-600 border-emerald-400 text-white font-bold ring-2 ring-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.8)] scale-[1.01]";
                } else if (selectedOption === option) {
                  // Wrong chosen answer is marked RED
                  btnStyle = "bg-rose-700 border-rose-400 text-white font-semibold ring-2 ring-rose-400 opacity-90";
                } else {
                  btnStyle = "bg-blue-950/40 border-blue-900/40 text-blue-300/40 opacity-40 cursor-not-allowed";
                }
              }

              return (
                <button
                  key={option}
                  disabled={isAnswerRevealed}
                  onClick={() => handleAnswer(option)}
                  className={`p-4 border rounded-xl text-left transition-all duration-200 font-medium text-lg flex items-center justify-between ${btnStyle}`}
                >
                  <span>{option}</span>
                  {isAnswerRevealed && option === q.answer && (
                    <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-bold shadow">
                      ✓ Correct Answer
                    </span>
                  )}
                  {isAnswerRevealed && selectedOption === option && option !== q.answer && (
                    <span className="bg-rose-500 text-white text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-bold shadow">
                      ✗ Incorrect
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isAnswerRevealed && q.reference && (
            <div className="mt-4 pt-3 border-t border-blue-800/60 text-sm text-blue-200/90 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">📖 Reference:</span>
              <span>{q.reference}</span>
            </div>
          )}

          {/* Prominent Next Question Button */}
          {isAnswerRevealed && (
            <div className="mt-6 pt-4 border-t border-blue-700/50 flex justify-end">
              <button
                onClick={handleNext}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-extrabold text-lg uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{currentIdx < questions.length - 1 ? 'Next Question →' : 'View Final Results 🏆'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function triggerQuizCelebration() {
  // Center massive initial explosion
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.55 },
    colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#eab308'],
    disableForReducedMotion: true,
  });

  // Alternating side cannons for celebratory duration
  const end = Date.now() + 2500;
  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(interval);
      return;
    }
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 60,
      origin: { x: 0.05, y: 0.75 },
      colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 60,
      origin: { x: 0.95, y: 0.75 },
      colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'],
      disableForReducedMotion: true,
    });
  }, 280);

  return () => clearInterval(interval);
}

function Result() {
  const navigate = useNavigate();
  const rawScore = parseInt(localStorage.getItem('finalScore') || '0', 10);
  const finalStreak = parseInt(localStorage.getItem('finalStreak') || '0', 10);
  const totalQuestions = parseInt(localStorage.getItem('totalQuestions') || '55', 10);
  const percentage = Math.round((rawScore / (totalQuestions || 1)) * 100);
  const userPhone = getActivePhoneNumber();
  const [recordData, setRecordData] = useState<PlayerStreakRecord | null>(null);

  useEffect(() => {
    const cleanup = triggerQuizCelebration();
    if (userPhone && userPhone !== 'Guest') {
      fetchPlayerStreakRecord(userPhone).then(rec => {
        if (rec) setRecordData(rec);
      });
    }
    return cleanup;
  }, [userPhone]);

  let badge = { title: "Faithful Disciple", icon: "📖", color: "text-amber-400", border: "border-amber-500/50" };
  if (percentage >= 90) {
    badge = { title: "Gospel Scholar", icon: "👑", color: "text-amber-300", border: "border-amber-400" };
  } else if (percentage >= 75) {
    badge = { title: "Word Champion", icon: "🏆", color: "text-emerald-400", border: "border-emerald-500/50" };
  } else if (percentage >= 50) {
    badge = { title: "Diligent Student", icon: "✨", color: "text-blue-300", border: "border-blue-400/50" };
  } else {
    badge = { title: "Truth Seeker", icon: "🕊️", color: "text-blue-200", border: "border-blue-500/30" };
  }

  return (
    <div className="min-h-screen bg-blue-950 p-4 md:p-8 text-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-700/20 via-blue-950/80 to-blue-950 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg bg-blue-900/80 border border-blue-500/50 rounded-3xl p-6 md:p-8 text-center shadow-[0_0_40px_rgba(30,58,138,0.7)] backdrop-blur-md">
        
        {/* Trophy / Accomplishment Icon */}
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-bounce">
          {badge.icon}
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-widest text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
          Quiz Completed!
        </h1>
        <p className="text-blue-200 text-sm mt-1 mb-5 font-medium">Glory to God for your pursuit of the Scriptures</p>

        {/* Question Streak Achievement Card */}
        <div className="bg-gradient-to-r from-amber-500/20 via-blue-950/90 to-amber-500/20 border border-amber-500/40 rounded-2xl p-4 mb-5 shadow-inner flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Flame className="w-7 h-7 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
            <div className="text-left">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-300">
                  {finalStreak} Questions
                </span>
                <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                  Longest Streak
                </span>
              </div>
              <p className="text-xs text-blue-200/90 font-medium">
                Recorded to profile for <span className="text-amber-300 font-bold">{userPhone}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-amber-300/80 font-bold block">All-Time Best</span>
            <span className="text-sm font-black text-white">{Math.max(finalStreak, recordData?.longestStreak || 0)} in a row</span>
          </div>
        </div>

        {/* Badge Card */}
        <div className={`bg-blue-950/80 border ${badge.border} rounded-2xl p-4 mb-5 shadow-inner`}>
          <div className="text-xs uppercase tracking-widest text-blue-300 font-semibold mb-1">Earned Title</div>
          <div className={`text-2xl font-black ${badge.color} tracking-wide`}>{badge.title}</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-950/70 border border-blue-600/40 rounded-xl p-4 flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-blue-300 font-bold">Total Score</span>
            <span className="text-3xl font-extrabold text-amber-400 mt-1">
              {rawScore} <span className="text-sm font-normal text-blue-300">/ {totalQuestions}</span>
            </span>
          </div>
          <div className="bg-blue-950/70 border border-blue-600/40 rounded-xl p-4 flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-blue-300 font-bold">Accuracy</span>
            <span className="text-3xl font-extrabold text-emerald-400 mt-1">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => triggerQuizCelebration()}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black py-3.5 px-6 rounded-xl uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🎉 Celebrate Again!</span>
          </button>

          <button
            onClick={() => navigate('/quiz')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-xl uppercase tracking-wider shadow-[0_0_15px_rgba(37,99,235,0.4)] active:scale-95 transition-all duration-200 cursor-pointer"
          >
            🔄 Try Quiz Again
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-transparent hover:bg-blue-950/60 text-blue-300 hover:text-white font-medium py-2.5 px-6 rounded-xl text-sm transition-all duration-200 cursor-pointer"
          >
            ← Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/trivea/">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}
