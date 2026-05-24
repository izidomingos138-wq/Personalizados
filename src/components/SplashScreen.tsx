import React, { useEffect, useState } from 'react';
import { Sparkles, Calendar, BookOpen, Gift } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 400);

    const timer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div id="app-splash-screen" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] bg-sky-500/10 rounded-full blur-[60px] pointer-events-none" />

      {/* Decorative Core Product Icons */}
      <div className="relative flex justify-center items-center gap-4 mb-4">
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl shadow-lg animate-bounce duration-1000">
          <Calendar className="w-6 h-6 text-blue-400" />
        </div>
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl shadow-xl animate-pulse">
          <BookOpen className="w-8 h-8 text-amber-400" />
        </div>
        <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl shadow-lg animate-bounce duration-1000延迟-200" style={{ animationDelay: '0.2s' }}>
          <Gift className="w-6 h-6 text-pink-400" />
        </div>
      </div>

      {/* App branding */}
      <div className="relative text-center mt-2">
        <h1 className="text-3xl sm:text-4xl font-sans font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-sky-300 to-amber-200 bg-clip-text text-transparent">
          ID PERSONALIZADOS
        </h1>
        <div className="text-amber-400 text-xs tracking-[0.25em] font-sans font-semibold uppercase mt-1 relative flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Estúdio & Papelaria Shop
        </div>
      </div>

      {/* Loader */}
      <div className="mt-12 flex flex-col items-center">
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full animate-infinite w-2/5 absolute left-[-40%]" style={{ animationName: 'progressSlide' }} />
        </div>
        <span className="text-slate-500 text-[11px] font-mono tracking-widest uppercase mt-4">
          Iniciando Estúdio{dots}
        </span>
      </div>

      <div className="absolute bottom-8 text-slate-600 text-[10px] font-sans tracking-wide">
        v1.2.0 • Papelaria Pronta & Sob Encomenda
      </div>

      <style>{`
        @keyframes progressSlide {
          0% { left: -40%; width: 30%; }
          50% { width: 50%; }
          100% { left: 110%; width: 30%; }
        }
      `}</style>
    </div>
  );
}
