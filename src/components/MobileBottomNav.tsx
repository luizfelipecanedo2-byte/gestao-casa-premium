import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Plus,
  PiggyBank,
  CreditCard,
  Calendar,
  Sparkles
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onOpenNewTransaction: () => void;
  onOpenAIAssistant?: () => void;
}

export function MobileBottomNav({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenAIAssistant
}: MobileBottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-2xl border-t border-white/10 px-3 py-2 flex items-center justify-between pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
      {/* 1. Indicadores */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
          activeTab === 'dashboard'
            ? 'text-indigo-400 font-black scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-500/20' : ''}`}>
          <LayoutDashboard size={20} />
        </div>
        <span className="text-[9px] uppercase tracking-wider font-bold mt-0.5">Visão</span>
      </button>

      {/* 2. Operações (Fluxo) */}
      <button
        onClick={() => setActiveTab('fluxo')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
          activeTab === 'fluxo'
            ? 'text-emerald-400 font-black scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${activeTab === 'fluxo' ? 'bg-emerald-500/20' : ''}`}>
          <TrendingUp size={20} />
        </div>
        <span className="text-[9px] uppercase tracking-wider font-bold mt-0.5">Fluxo</span>
      </button>

      {/* 3. BOTÃO CENTRAL DE LANÇAMENTO FLUTUANTE */}
      <div className="-mt-7 relative">
        <button
          onClick={onOpenNewTransaction}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/40 active:scale-95 transition-all border-4 border-[#090d16] group"
          title="Novo Lançamento Rápido"
        >
          <Plus size={26} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* 4. Investimentos (R$ 300) */}
      <button
        onClick={() => setActiveTab('investimentos')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all relative ${
          activeTab === 'investimentos'
            ? 'text-teal-400 font-black scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all relative ${activeTab === 'investimentos' ? 'bg-teal-500/20' : ''}`}>
          <PiggyBank size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="text-[9px] uppercase tracking-wider font-bold mt-0.5">R$ 300</span>
      </button>

      {/* 5. Cartões */}
      <button
        onClick={() => setActiveTab('cartoes')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
          activeTab === 'cartoes'
            ? 'text-rose-400 font-black scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${activeTab === 'cartoes' ? 'bg-rose-500/20' : ''}`}>
          <CreditCard size={20} />
        </div>
        <span className="text-[9px] uppercase tracking-wider font-bold mt-0.5">Cartões</span>
      </button>
    </nav>
  );
}
