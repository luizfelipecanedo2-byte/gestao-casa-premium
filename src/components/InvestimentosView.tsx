import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  PiggyBank,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Wallet,
  ArrowUpRight,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  X,
  Target
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { supabase } from '../lib/supabase';
import { triggerConfetti } from '../lib/confetti';

export interface InvestmentRecord {
  id: string;
  date: string; // YYYY-MM-DD
  month_ref: string; // ex: "Outubro 2024"
  wallet_name: string; // ex: "Cofrinho / Reserva", "CDB", "Tesouro Selic"
  previous_balance: number; // Saldo do ciclo anterior
  checked_balance: number; // Saldo que o usuário viu no banco
  balance_timing: 'before_deposit' | 'after_deposit'; // Se olhou antes ou depois de colocar os 300
  deposit_amount: number; // Ex: 300
  yield_amount: number; // Quanto rendeu calculado automaticamente
  yield_percentage: number; // % rendimento
  final_balance: number; // Saldo final após rendimento + aporte
  notes?: string;
  sync_to_transactions?: boolean;
}

interface InvestimentosViewProps {
  formatCurrency: (val: number) => string;
  formatDate: (val: string) => string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onRefreshTransactions?: () => void;
  currentUser?: string;
}

const STORAGE_KEY = 'gestao_casa_investimentos_v1';

export function InvestimentosView({
  formatCurrency,
  formatDate,
  showToast,
  onRefreshTransactions,
  currentUser = 'Felipe'
}: InvestimentosViewProps) {
  const [investments, setInvestments] = useState<InvestmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler investimentos:', e);
    }
    return [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [walletName, setWalletName] = useState('Reserva Mensal (R$ 300)');
  const [checkedBalance, setCheckedBalance] = useState('');
  const [balanceTiming, setBalanceTiming] = useState<'before_deposit' | 'after_deposit'>('before_deposit');
  const [depositAmount, setDepositAmount] = useState('300');
  const [notes, setNotes] = useState('');
  const [syncToFlow, setSyncToFlow] = useState(true);

  // Salvar no localStorage sempre que houver alteração
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(investments));
    } catch (e) {
      console.error('Erro ao persistir investimentos:', e);
    }
  }, [investments]);

  // Pegar o último saldo registrado para servir de base do mês anterior
  const latestRecord = useMemo(() => {
    if (investments.length === 0) return null;
    const sorted = [...investments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted[sorted.length - 1];
  }, [investments]);

  // Cálculos em tempo real para o modal
  const formCalculations = useMemo(() => {
    const prevBalance = editingId
      ? (investments.find(i => i.id === editingId)?.previous_balance || 0)
      : (latestRecord ? latestRecord.final_balance : 0);

    const checked = parseFloat(checkedBalance) || 0;
    const dep = parseFloat(depositAmount) || 0;

    let yieldAmt = 0;
    let finalBal = 0;

    if (balanceTiming === 'before_deposit') {
      // O usuário olhou a corretora ANTES de pôr os 300
      yieldAmt = checked - prevBalance;
      finalBal = checked + dep;
    } else {
      // O usuário olhou a corretora DEPOIS de já ter colocado os 300
      yieldAmt = checked - prevBalance - dep;
      finalBal = checked;
    }

    const yieldPct = prevBalance > 0 ? (yieldAmt / prevBalance) * 100 : 0;

    return {
      prevBalance,
      yieldAmt,
      yieldPct,
      finalBal
    };
  }, [editingId, latestRecord, checkedBalance, depositAmount, balanceTiming, investments]);

  // Totais consolidados
  const totals = useMemo(() => {
    if (investments.length === 0) {
      return {
        totalDeposited: 0,
        totalYield: 0,
        currentBalance: 0,
        yieldRate: 0,
        lastMonthYield: 0
      };
    }

    const totalDeposited = investments.reduce((acc, curr) => acc + (curr.deposit_amount || 0), 0);
    const totalYield = investments.reduce((acc, curr) => acc + (curr.yield_amount || 0), 0);
    const currentBalance = latestRecord ? latestRecord.final_balance : 0;
    const yieldRate = totalDeposited > 0 ? (totalYield / totalDeposited) * 100 : 0;
    const lastMonthYield = latestRecord ? latestRecord.yield_amount : 0;

    return {
      totalDeposited,
      totalYield,
      currentBalance,
      yieldRate,
      lastMonthYield
    };
  }, [investments, latestRecord]);

  // Dados para gráfico ordenados cronologicamente
  const chartData = useMemo(() => {
    const sorted = [...investments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningDeposit = 0;

    return sorted.map((inv) => {
      runningDeposit += inv.deposit_amount;
      return {
        name: inv.month_ref || inv.date,
        'Total Aportado': runningDeposit,
        'Saldo com Rendimento': inv.final_balance,
        'Rendimento do Mês': Math.max(0, inv.yield_amount)
      };
    });
  }, [investments]);

  // Status da meta de R$ 300 do mês atual
  const currentMonthGoal = useMemo(() => {
    const today = new Date();
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentRef = `${monthNames[today.getMonth()]}/${today.getFullYear()}`;
    const found = investments.find(i => i.month_ref === currentRef);
    const hasMetGoal = !!(found && found.deposit_amount >= 300);
    return { currentRef, found, hasMetGoal };
  }, [investments]);

  // Abrir modal para novo mês
  const handleOpenNew = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setWalletName('Reserva Mensal (R$ 300)');
    setCheckedBalance('');
    setBalanceTiming('before_deposit');
    setDepositAmount('300');
    setNotes('');
    setSyncToFlow(true);
    setIsModalOpen(true);
  };

  // Abrir modal para edição
  const handleEdit = (inv: InvestmentRecord) => {
    setEditingId(inv.id);
    setDate(inv.date);
    setWalletName(inv.wallet_name);
    setCheckedBalance(String(inv.checked_balance));
    setBalanceTiming(inv.balance_timing || 'before_deposit');
    setDepositAmount(String(inv.deposit_amount));
    setNotes(inv.notes || '');
    setSyncToFlow(false);
    setIsModalOpen(true);
  };

  // Excluir registro
  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de investimento?')) {
      setInvestments(prev => prev.filter(i => i.id !== id));
      showToast('Registro de investimento excluído com sucesso!');
    }
  };

  // Salvar registro
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const dep = parseFloat(depositAmount);
    if (isNaN(dep) || dep < 0) {
      showToast('Por favor, informe um valor de depósito válido.', 'error');
      return;
    }

    const checked = parseFloat(checkedBalance);
    if (isNaN(checked) || checked < 0) {
      showToast('Por favor, informe o saldo que consta na sua conta/corretora.', 'error');
      return;
    }

    // Formatar nome do mês
    const dateObj = new Date(date + 'T12:00:00');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const monthRef = `${monthNames[dateObj.getMonth()]}/${dateObj.getFullYear()}`;

    const prevBal = formCalculations.prevBalance;
    const yldAmt = formCalculations.yieldAmt;
    const yldPct = formCalculations.yieldPct;
    const finBal = formCalculations.finalBal;

    const record: InvestmentRecord = {
      id: editingId || crypto.randomUUID(),
      date,
      month_ref: monthRef,
      wallet_name: walletName,
      previous_balance: prevBal,
      checked_balance: checked,
      balance_timing: balanceTiming,
      deposit_amount: dep,
      yield_amount: yldAmt,
      yield_percentage: yldPct,
      final_balance: finBal,
      notes,
      sync_to_transactions: syncToFlow
    };

    if (editingId) {
      setInvestments(prev => prev.map(i => i.id === editingId ? record : i));
      showToast('Investimento atualizado com sucesso!');
    } else {
      setInvestments(prev => [...prev, record]);
      if (dep >= 300) {
        triggerConfetti({ count: 140, durationMs: 4000 });
        showToast(`🎉 PARABÉNS ${currentUser.toUpperCase()} & ${currentUser === 'Felipe' ? 'MARA' : 'FELIPE'}! Meta de ${formatCurrency(dep)} e rendimento de ${formatCurrency(yldAmt)} registrados!`, 'success');
      } else {
        triggerConfetti({ count: 80, durationMs: 3000 });
        showToast(`✨ Aporte de ${formatCurrency(dep)} e rendimento de ${formatCurrency(yldAmt)} registrados!`, 'success');
      }

      // Se marcado para sincronizar com o fluxo geral
      if (syncToFlow && dep > 0) {
        try {
          await supabase.from('home_transactions').insert([{
            title: `APORTE INVESTIMENTO - ${walletName.toUpperCase()}`,
            category: 'INVESTIMENTO',
            sub_category: 'RENDA FIXA',
            amount: dep,
            type: 'receivable',
            date: date,
            competency_date: date,
            bank: 'COFRINHO NUBANK',
            payment_method: 'PIX',
            status: 'completed',
            notes: `Rendimento apurado no ciclo: ${formatCurrency(yldAmt)}`
          }]);
          if (onRefreshTransactions) {
            onRefreshTransactions();
          }
        } catch (err) {
          console.warn('Não foi possível gravar transação espelho no Supabase:', err);
        }
      }
    }

    setIsModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Top Banner de Apresentação */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-indigo-950/50 border border-emerald-500/20 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={12} /> Calculadora Automática de Rendimentos
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              Investimento & Aportes Mensais
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Deposite seus <strong className="text-emerald-400">R$ 300,00</strong> todo mês. 
              Ao informar o saldo que consta na sua conta, calculamos automaticamente quanto seu patrimônio rendeu sozinho!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleOpenNew}
              className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} className="stroke-[3]" /> Registrar Mês / Aporte
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Celebração de Meta Batida */}
      {currentMonthGoal.hasMetGoal ? (
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-r from-amber-500/15 via-emerald-500/20 to-teal-500/15 border border-emerald-500/40 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center text-2xl shadow-md shrink-0">
              🎉
            </div>
            <div>
              <p className="text-xs font-black uppercase text-emerald-300 tracking-wider flex items-center gap-2">
                Meta de R$ 300,00 Batida em {currentMonthGoal.currentRef}!
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Parabéns {currentUser === 'Mara' ? 'Mara & Felipe' : 'Felipe & Mara'}! Vocês garantiram o aporte deste mês e o futuro do casal já está rendendo.
              </p>
            </div>
          </div>
          <button
            onClick={() => triggerConfetti({ count: 140, durationMs: 4000 })}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs uppercase rounded-xl tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Sparkles size={14} className="stroke-[3]" /> Soltar Confetes!
          </button>
        </motion.div>
      ) : (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎯</span>
            <p className="text-xs text-slate-300">
              <strong className="text-emerald-400 font-black">Meta de {currentMonthGoal.currentRef}:</strong> Guardar <strong className="text-white">R$ 300,00</strong> este mês. Assim que fizer o depósito, clique no botão e registre!
            </p>
          </div>
          <button
            onClick={handleOpenNew}
            className="text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
          >
            Registrar Agora →
          </button>
        </div>
      )}

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Saldo Total Acumulado */}
        <div className="glass-card p-6 border-t-4 border-t-emerald-500 bg-emerald-500/[0.02] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-emerald-500/20 transition-all" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo Atual Acumulado</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <PiggyBank size={18} className="text-emerald-400" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black font-mono-numbers text-emerald-400 tracking-tighter">
              {formatCurrency(totals.currentBalance)}
            </p>
            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              {investments.length} {investments.length === 1 ? 'mês registrado' : 'meses registrados'}
            </p>
          </div>
        </div>

        {/* Total Aportado */}
        <div className="glass-card p-6 border-t-4 border-t-indigo-500 bg-indigo-500/[0.02] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-500/20 transition-all" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Saído do Bolso</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Wallet size={18} className="text-indigo-400" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black font-mono-numbers text-indigo-300 tracking-tighter">
              {formatCurrency(totals.totalDeposited)}
            </p>
            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Aportes de R$ 300/mês
            </p>
          </div>
        </div>

        {/* Rendimento Total (Lucro) */}
        <div className="glass-card p-6 border-t-4 border-t-teal-400 bg-teal-400/[0.02] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-teal-400/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-teal-400/20 transition-all" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lucro / Rendimento Total</span>
            <div className="w-9 h-9 rounded-xl bg-teal-400/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-teal-400" />
            </div>
          </div>
          <div className="relative z-10">
            <p className={`text-3xl font-black font-mono-numbers tracking-tighter ${totals.totalYield >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
              {totals.totalYield >= 0 ? `+${formatCurrency(totals.totalYield)}` : formatCurrency(totals.totalYield)}
            </p>
            <p className="text-[9px] font-bold text-teal-400/90 mt-1 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight size={12} /> {totals.yieldRate.toFixed(2)}% sobre o total aportado
            </p>
          </div>
        </div>

        {/* Último Rendimento Mensal */}
        <div className="glass-card p-6 border-t-4 border-t-amber-400 bg-amber-400/[0.02] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-amber-400/20 transition-all" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rendimento Último Mês</span>
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center">
              <DollarSign size={18} className="text-amber-400" />
            </div>
          </div>
          <div className="relative z-10">
            <p className={`text-3xl font-black font-mono-numbers tracking-tighter ${totals.lastMonthYield >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
              {totals.lastMonthYield >= 0 ? `+${formatCurrency(totals.lastMonthYield)}` : formatCurrency(totals.lastMonthYield)}
            </p>
            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              {latestRecord ? `Ref: ${latestRecord.month_ref}` : 'Aguardando 1º registro'}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução & Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Evolução Patrimonial */}
        <div className="lg:col-span-2 glass-card p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-black text-sm uppercase text-white tracking-widest flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" /> Evolução: Dinheiro Guardado vs Rendimentos
              </h4>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">
                Visualização do crescimento do saldo com o poder dos juros
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full mt-2">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-2xl">
                <PiggyBank size={36} className="text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-400">Nenhum dado para o gráfico ainda.</p>
                <p className="text-[10px] text-slate-600 mt-1">Clique em "Registrar Mês / Aporte" para começar!</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradDeposit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `R$ ${val}`} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Saldo com Rendimento"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gradBalance)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Total Aportado"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#gradDeposit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Simulador de Futuro com R$ 300/mês */}
        <div className="glass-card p-8 flex flex-col justify-between bg-gradient-to-br from-indigo-950/20 to-slate-900/60 border border-indigo-500/20">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-amber-400" />
              <h4 className="font-black text-sm uppercase text-white tracking-widest">
                Projeção com R$ 300 / mês
              </h4>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Mantendo aportes de <strong className="text-white">R$ 300,00</strong> todo mês rendendo em média <strong className="text-emerald-400">0,85% a.m.</strong> (aprox. 10,5% a.a.):
            </p>

            <div className="mt-6 space-y-4">
              <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Em 6 Meses</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Guardando R$ 1.800</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black font-mono-numbers text-emerald-400">R$ 1.846,00</p>
                  <p className="text-[8px] font-bold text-emerald-500">+R$ 46 de juros</p>
                </div>
              </div>

              <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-indigo-300">Em 1 Ano (12 meses)</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Guardando R$ 3.600</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black font-mono-numbers text-indigo-300">R$ 3.805,00</p>
                  <p className="text-[8px] font-bold text-emerald-400">+R$ 205 de juros</p>
                </div>
              </div>

              <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-purple-300">Em 2 Anos (24 meses)</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Guardando R$ 7.200</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black font-mono-numbers text-purple-300">R$ 8.040,00</p>
                  <p className="text-[8px] font-bold text-emerald-400">+R$ 840 de juros</p>
                </div>
              </div>

              <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-amber-300">Em 5 Anos (60 meses)</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Guardando R$ 18.000</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black font-mono-numbers text-amber-300">R$ 23.630,00</p>
                  <p className="text-[8px] font-bold text-emerald-400">+R$ 5.630 de juros</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-400" /> O segredo é a constância mês a mês!
            </p>
          </div>
        </div>
      </div>

      {/* Histórico e Tabela de Registros */}
      <div className="glass-card p-8 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h4 className="font-black text-sm uppercase text-white tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-indigo-400" /> Histórico Mês a Mês de Aportes e Rendimentos
            </h4>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">
              Cada linha representa sua conferência mensal do investimento
            </p>
          </div>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl transition-all uppercase tracking-widest"
          >
            <Plus size={14} /> Novo Registro
          </button>
        </div>

        {investments.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
              <PiggyBank size={32} />
            </div>
            <h5 className="text-base font-black text-white uppercase tracking-wider">Nenhum mês registrado ainda</h5>
            <p className="text-xs text-slate-400 max-w-md mt-2">
              Adicione seu primeiro registro informando quanto você tem na conta hoje e os R$ 300 que vai depositar. O sistema passará a calcular seus rendimentos automaticamente a cada mês!
            </p>
            <button
              onClick={handleOpenNew}
              className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-wider px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all"
            >
              <Plus size={16} /> Começar Agora (R$ 300)
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="py-4 px-3">Mês / Data</th>
                  <th className="py-4 px-3">Aplicação / Banco</th>
                  <th className="py-4 px-3 text-right">Saldo Anterior</th>
                  <th className="py-4 px-3 text-right">Rendimento Apurado</th>
                  <th className="py-4 px-3 text-right">Aporte do Mês</th>
                  <th className="py-4 px-3 text-right">Saldo Final</th>
                  <th className="py-4 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...investments]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-3">
                        <span className="font-black text-white uppercase block">{inv.month_ref}</span>
                        <span className="text-[9px] text-slate-500 font-mono-numbers">{formatDate(inv.date)}</span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="font-bold text-slate-300 uppercase block">{inv.wallet_name}</span>
                        {inv.notes && <span className="text-[9px] text-slate-500 italic truncate max-w-[200px] block">{inv.notes}</span>}
                      </td>
                      <td className="py-4 px-3 text-right font-mono-numbers font-bold text-slate-400">
                        {formatCurrency(inv.previous_balance)}
                      </td>
                      <td className="py-4 px-3 text-right">
                        <div className="font-mono-numbers font-black text-emerald-400">
                          {inv.yield_amount >= 0 ? `+${formatCurrency(inv.yield_amount)}` : formatCurrency(inv.yield_amount)}
                        </div>
                        {inv.previous_balance > 0 && (
                          <div className="text-[9px] font-black text-emerald-500/80">
                            +{inv.yield_percentage.toFixed(2)}%
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-3 text-right">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-mono-numbers font-black text-indigo-300">
                          +{formatCurrency(inv.deposit_amount)}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right font-mono-numbers font-black text-base text-white">
                        {formatCurrency(inv.final_balance)}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(inv)}
                            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Lançamento / Conferência do Mês */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b101b] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <PiggyBank size={20} className="text-emerald-400" />
                    {editingId ? 'Editar Registro' : 'Conferir Mês & Depositar R$ 300'}
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                    Informe o saldo atual e calcularemos o rendimento automaticamente
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                      Data da Conferência
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono-numbers"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                      Conta / Aplicação
                    </label>
                    <select
                      value={walletName}
                      onChange={e => setWalletName(e.target.value)}
                      className="w-full bg-[#161f30] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Reserva Mensal (R$ 300)">Reserva Mensal (R$ 300)</option>
                      <option value="Cofrinho Nubank">Cofrinho Nubank</option>
                      <option value="Tesouro Selic">Tesouro Selic</option>
                      <option value="CDB 100% CDI">CDB 100% CDI</option>
                      <option value="Caixinha Nubank">Caixinha Nubank</option>
                      <option value="C6 Bank CDB">C6 Bank CDB</option>
                      <option value="XP Investimentos">XP Investimentos</option>
                      <option value="Outro Investimento">Outro Investimento</option>
                    </select>
                  </div>
                </div>

                {/* Passo 1: Saldo que o usuário vê */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <Target size={14} /> Passo 1: Saldo visto no App/Banco hoje (R$)
                    </label>
                    <span className="text-[9px] font-mono-numbers text-slate-500">
                      Saldo anterior: {formatCurrency(formCalculations.prevBalance)}
                    </span>
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1545.80"
                    value={checkedBalance}
                    onChange={e => setCheckedBalance(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-emerald-500/30 rounded-xl px-4 py-3 text-lg font-black text-white focus:outline-none focus:border-emerald-400 font-mono-numbers"
                  />

                  {/* Toggle: Se olhou antes ou depois */}
                  <div className="pt-2">
                    <p className="text-[9px] font-bold uppercase text-slate-400 mb-2">
                      Esse saldo que você digitou foi conferido:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBalanceTiming('before_deposit')}
                        className={`p-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-center border transition-all ${
                          balanceTiming === 'before_deposit'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        ⏱️ ANTES de depositar
                      </button>
                      <button
                        type="button"
                        onClick={() => setBalanceTiming('after_deposit')}
                        className={`p-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-center border transition-all ${
                          balanceTiming === 'after_deposit'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        ✅ DEPOIS de depositar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Passo 2: Quanto vai depositar (default 300) */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                      <DollarSign size={14} /> Passo 2: Depósito / Aporte deste mês (R$)
                    </label>
                    <span className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      Padrão R$ 300
                    </span>
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    placeholder="300"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-3 text-lg font-black text-white focus:outline-none focus:border-indigo-400 font-mono-numbers"
                  />
                </div>

                {/* Resultado Automático Calculado */}
                {checkedBalance !== '' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] font-black uppercase text-slate-400">Rendimento Calculado:</span>
                      <span className={`font-mono-numbers font-black text-base ${formCalculations.yieldAmt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formCalculations.yieldAmt >= 0 ? `+${formatCurrency(formCalculations.yieldAmt)}` : formatCurrency(formCalculations.yieldAmt)}
                        {formCalculations.prevBalance > 0 && ` (${formCalculations.yieldPct.toFixed(2)}%)`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                      <span className="text-[10px] font-black uppercase text-slate-400">Novo Saldo Consolidado:</span>
                      <span className="font-mono-numbers font-black text-lg text-white">
                        {formatCurrency(formCalculations.finalBal)}
                      </span>
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                    Observações (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Rendimento do mês + aporte feito via Pix"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {!editingId && (
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-white/[0.02]">
                    <input
                      type="checkbox"
                      checked={syncToFlow}
                      onChange={e => setSyncToFlow(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-white/10 border-white/20"
                    />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                      Registrar também como transação no fluxo geral (Categoria: INVESTIMENTO)
                    </span>
                  </label>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-black uppercase text-slate-400 hover:text-white rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20 transition-all font-sans"
                  >
                    {editingId ? 'Salvar Alterações' : 'Confirmar & Gravar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
