import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  LayoutDashboard,
  Plus,
  Bell,
  Wallet,
  X,
  Check,
  CreditCard,
  PiggyBank,
  Loader2,
  Search,
  Filter,
  Building2,
  Tag,
  Edit2,
  Trash2,
  ListOrdered,
  Download
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts'
import {
  Eye,
  EyeOff,
  ChevronRight,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard as CreditCardIcon,
  Target,
  AlertCircle
} from 'lucide-react'
import { supabase } from './lib/supabase'

const chartData = [
  { name: 'Jan', income: 12000, expenses: 8000 },
  { name: 'Fev', income: 15000, expenses: 9500 },
  { name: 'Mar', income: 14000, expenses: 7200 },
]

const categories = [
  { id: '1', name: 'RECEITA SALÁRIO', color: '#10b981', type: 'receivable' }, // Emerald
  { id: '2', name: 'RECEITA EXTRA', color: '#06b6d4', type: 'receivable' }, // Cyan
  { id: '3', name: 'DESPESAS COM ALIMENTAÇÃO', color: '#f59e0b', type: 'payable' }, // Amber
  { id: '4', name: 'DESPESA LAZER', color: '#ec4899', type: 'payable' }, // Pink
  { id: '5', name: 'DESPESA PESSOAL', color: '#6366f1', type: 'payable' }, // Indigo
  { id: '6', name: 'DESPESA COM CASA', color: '#3b82f6', type: 'payable' }, // Blue
  { id: '7', name: 'DESPESA COM TRANSPORTE', color: '#8b5cf6', type: 'payable' }, // Purple
  { id: '8', name: 'INVESTIMENTO', color: '#f43f5e', type: 'receivable' }, // Rose
]

const subCategoriesMap: Record<string, string[]> = {
  'RECEITA SALÁRIO': ['SALÁRIO MARA', 'SALÁRIO FELIPE'],
  'RECEITA EXTRA': ['HORAS EXTRAS', 'DINHEIRO VÓ BIA', 'DIVISÃO DE LUCRO EMPRESA', 'MÊS ANTERIOR'],
  'DESPESAS COM ALIMENTAÇÃO': ['MERCADO', 'PADARIA', 'AÇOUGUE', 'PEIXARIA'],
  'DESPESA LAZER': ['LANCHONETE', 'SORVETERIA', 'VIAGEM', 'NETFLIX', 'TV BOX'],
  'DESPESA PESSOAL': ['CABELO', 'MESADA', 'DIZIMO', 'ROUPAS', 'ACESSÓRIOS', 'ACADEMIA'],
  'DESPESA COM CASA': ['ÁGUA', 'LUZ', 'INTERNET', 'TERRENO', 'OUTROS'],
  'DESPESA COM TRANSPORTE': ['GASOLINA MOTO', 'GASOLINA BIZ', 'GASOLINA CARRO', 'CONSERTO DA MOTO', 'CONSERTO DA BIZ', 'DESPESA COM CARRO'],
  'INVESTIMENTO': ['RENDA FIXA', 'RENDA VARIAVEL', 'RESERVA DE EMERGENCIA']
}

const banks = ["ITAÚ", "NUBANK", "C6 BANK", "INTER", "BRADESCO", "SANTANDER", "XP", "DINHEIRO ESPÉCIE"]
const paymentMethods = ["PIX", "CARTÃO DE CRÉDITO", "DÉBITO", "BOLETO", "DINHEIRO"]

interface Transaction {
  id: string
  title: string
  category: string
  sub_category?: string
  amount: number
  type: 'payable' | 'receivable'
  date: string
  competency_date?: string
  bank?: string
  payment_method?: string
  status?: 'pending' | 'completed'
  notes?: string
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fluxo'>('dashboard')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isPrivate, setIsPrivate] = useState(false)
  const [timeRange, setTimeRange] = useState<'month' | 'year'>('month')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [filterText, setFilterText] = useState('')
  const [filterMonth, setFilterMonth] = useState<string>('todos')
  const [filterBank, setFilterBank] = useState<string>('todos')
  const [filterType, setFilterType] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')

  const [formData, setFormData] = useState({
    title: '',
    category: 'RECEITA SALÁRIO',
    sub_category: '',
    amount: '',
    type: 'receivable' as 'payable' | 'receivable',
    date: new Date().toISOString().split('T')[0],
    competency_date: new Date().toISOString().split('T')[0],
    bank: 'ITAÚ',
    payment_method: 'PIX',
    notes: '',
    payment_date: '',
    status: 'pending' as 'pending' | 'completed',
    installments: '1',
    entry_type: 'single' as 'single' | 'installment' | 'recurrent'
  })

  useEffect(() => {
    const subs = subCategoriesMap[formData.category] || []
    if (subs.length > 0 && !subs.includes(formData.sub_category)) {
      setFormData(prev => ({ ...prev, sub_category: subs[0] }))
    }
  }, [formData.category])

  useEffect(() => {
    fetchTransactions()
  }, [])


  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('home_transactions')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const numInstallments = parseInt(formData.installments) || 1;
      const totalAmount = Number(formData.amount) || 0;
      const amountPerInstallment = totalAmount / numInstallments;

      if (editingId) {
        const payload = {
          title: formData.title.toUpperCase() || formData.sub_category,
          category: formData.category,
          sub_category: formData.sub_category,
          amount: totalAmount,
          type: formData.type,
          date: formData.date,
          competency_date: formData.competency_date,
          bank: formData.bank,
          payment_method: formData.payment_method,
          notes: formData.notes.toUpperCase(),
          payment_date: formData.status === 'completed' ? (formData.payment_date || formData.date) : null,
          status: formData.status
        }
        const { error } = await supabase.from('home_transactions').update(payload).eq('id', editingId)
        if (error) throw error
      } else if (numInstallments > 1 && (formData.entry_type === 'installment' || formData.entry_type === 'recurrent')) {
        const insertData = [];
        const baseTitle = formData.title.toUpperCase() || formData.sub_category;

        for (let i = 1; i <= numInstallments; i++) {
          const transDate = new Date(formData.date + 'T12:00:00');
          transDate.setMonth(transDate.getMonth() + (i - 1));

          // Se for parcelamento, divide o valor. Se for recorrente, repete o valor cheio.
          const finalAmount = formData.entry_type === 'installment' ? amountPerInstallment : totalAmount;

          insertData.push({
            title: numInstallments > 1 ? `${baseTitle} [${i}/${numInstallments}]` : baseTitle,
            category: formData.category,
            sub_category: formData.sub_category,
            amount: finalAmount,
            type: formData.type,
            date: transDate.toISOString().split('T')[0],
            competency_date: formData.date,
            bank: formData.bank,
            payment_method: formData.payment_method,
            notes: formData.notes.toUpperCase(),
            status: 'pending'
          });
        }
        const { error } = await supabase.from('home_transactions').insert(insertData)
        if (error) throw error
      } else {
        const payload = {
          title: formData.title.toUpperCase() || formData.sub_category,
          category: formData.category,
          sub_category: formData.sub_category,
          amount: totalAmount,
          type: formData.type,
          date: formData.date,
          competency_date: formData.competency_date,
          bank: formData.bank,
          payment_method: formData.payment_method,
          notes: formData.notes.toUpperCase(),
          payment_date: formData.status === 'completed' ? (formData.payment_date || formData.date) : null,
          status: formData.status
        }
        const { error } = await supabase.from('home_transactions').insert([payload])
        if (error) throw error
      }

      setIsModalOpen(false)
      setEditingId(null)
      resetForm()
      fetchTransactions()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert('Erro ao salvar.')
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Deseja realmente excluir este lançamento?')) return
    try {
      const { error } = await supabase
        .from('home_transactions')
        .delete()
        .eq('id', id)
      if (error) throw error
      fetchTransactions()
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }

  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id)
    setFormData({
      title: t.title || '',
      category: t.category,
      sub_category: t.sub_category || '',
      amount: t.amount?.toString() || '0',
      type: t.type,
      date: t.date,
      competency_date: t.competency_date || t.date,
      bank: t.bank || 'ITAÚ',
      payment_method: t.payment_method || 'PIX',
      notes: t.notes || '',
      payment_date: (t as any).payment_date || '',
      status: t.status || 'pending',
      installments: '1'
    })
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'RECEITA SALÁRIO',
      sub_category: subCategoriesMap['RECEITA SALÁRIO'][0],
      amount: '',
      type: 'receivable',
      date: new Date().toISOString().split('T')[0],
      competency_date: new Date().toISOString().split('T')[0],
      bank: 'ITAÚ',
      payment_method: 'PIX',
      notes: '',
      payment_date: '',
      status: 'pending',
      installments: '1',
      entry_type: 'single'
    })
  }

  const formatCurrency = (val: number) => {
    const safeVal = isNaN(val) ? 0 : val;
    return safeVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch (e) {
      return '---';
    }
  }

  const totalBalance = transactions.reduce((acc, t) => {
    if (t.type === 'receivable') return acc + (t.amount || 0);
    if (t.payment_method === 'CARTÃO DE CRÉDITO' && t.status === 'pending') return acc;
    return acc - (t.amount || 0);
  }, 10000)

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthBill = transactions
    .filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date + 'T12:00:00');
      return t.payment_method === 'CARTÃO DE CRÉDITO' &&
        t.status === 'pending' &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear;
    })
    .reduce((acc, t) => acc + (t.amount || 0), 0)

  const totalInvested = transactions.filter(t => t.category === 'INVESTIMENTO').reduce((acc, t) => acc + (t.amount || 0), 0)

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-indigo-500/30">
      {/* Background ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/10 blur-[120px] -z-10 pointer-events-none" />

      {loading ? (
        <div className="flex h-screen items-center justify-center font-black tracking-widest text-indigo-500/50 animate-pulse">CARREGANDO PROTOCOLO...</div>
      ) : (
        <div className="flex min-h-screen">
          {/* Detached Sidebar */}
          <aside className="w-24 lg:w-72 p-6 flex flex-col h-screen sticky top-0">
            <div className="glass-card h-full flex flex-col p-6 items-center lg:items-stretch">
              <div className="flex items-center gap-3 px-2 mb-12">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <Wallet className="text-black" size={20} />
                </div>
                <div className="hidden lg:block">
                  <h1 className="font-black text-sm tracking-tighter uppercase leading-none">CASA IQ</h1>
                  <p className="text-[8px] text-slate-500 font-bold tracking-[0.3em] uppercase mt-1">Versão 2.0</p>
                </div>
              </div>

              <nav className="flex flex-col gap-3 flex-1">
                <button onClick={() => setActiveTab('dashboard')} className="group">
                  <NavItem icon={<LayoutDashboard size={20} />} label="INDICADORES" active={activeTab === 'dashboard'} />
                </button>
                <button onClick={() => setActiveTab('fluxo')} className="group">
                  <NavItem icon={<TrendingUp size={20} />} label="OPERAÇÕES" active={activeTab === 'fluxo'} />
                </button>
                <NavItem icon={<Calendar size={20} />} label="AGENDA" />
                <NavItem icon={<CreditCard size={20} />} label="CARTÕES" />
                <NavItem icon={<PiggyBank size={20} />} label="ATIVOS" />
              </nav>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="hidden lg:block p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Segurança</p>
                  <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-2">
                    <Check size={12} /> PROTOCOLO ATIVO
                  </p>
                </div>
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-black text-xs">LF</div>
                  <div className="hidden lg:block truncate text-[10px] font-bold text-slate-400 uppercase">Felipe Mara</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic gradient-text"
                >
                  {activeTab === 'dashboard' ? 'Insight' : 'Fluxo'} <span className="text-indigo-500">{activeTab === 'dashboard' ? 'Geral' : 'de Dados'}</span>
                </motion.h2>
                <p className="text-slate-500 font-bold tracking-[0.4em] text-[9px] mt-2 uppercase opacity-40">SISTEMA INTELIGENTE DE MODELAGEM FINANCEIRA</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sincronização Ativa</span>
                </div>
                <button className="w-12 h-12 glass-card flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all"><Bell size={18} /></button>
              </div>
            </header>

            {activeTab === 'dashboard' ? (
              <DashboardView
                transactions={transactions}
                totalBalance={totalBalance}
                creditCardLimitUsed={currentMonthBill}
                totalInvested={totalInvested}
                formatCurrency={formatCurrency}
                setIsModalOpen={setIsModalOpen}
                setEditingId={setEditingId}
                resetForm={resetForm}
                isPrivate={isPrivate}
                setIsPrivate={setIsPrivate}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
            ) : (
              <FluxoView
                transactions={transactions}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                setIsModalOpen={setIsModalOpen}
                handleEditClick={handleEditClick}
                handleDeleteTransaction={handleDeleteTransaction}
                setEditingId={setEditingId}
                resetForm={resetForm}
                filterText={filterText}
                setFilterText={setFilterText}
                filterMonth={filterMonth}
                setFilterMonth={setFilterMonth}
                filterBank={filterBank}
                setFilterBank={setFilterBank}
                filterType={filterType}
                setFilterType={setFilterType}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                banks={banks}
              />
            )}
          </main>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <TransactionModal
            setIsModalOpen={setIsModalOpen}
            editingId={editingId}
            setEditingId={setEditingId}
            formData={formData}
            setFormData={setFormData}
            handleSaveTransaction={handleSaveTransaction}
            categories={categories}
            subCategories={subCategoriesMap[formData.category] || []}
            banks={banks}
            paymentMethods={paymentMethods}
            formatCurrency={formatCurrency}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function DashboardView({
  transactions,
  totalBalance,
  creditCardLimitUsed,
  totalInvested,
  formatCurrency,
  setIsModalOpen,
  setEditingId,
  resetForm,
  isPrivate,
  setIsPrivate,
  timeRange,
  setTimeRange,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear
}: any) {

  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  // Filtragem de transações com base no tempo/mês selecionado
  const filteredTransactions = transactions.filter((t: any) => {
    const d = new Date(t.date + 'T12:00:00');
    if (timeRange === 'year') {
      return d.getFullYear() === selectedYear;
    }
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Cálculo de gastos por categoria (Pie Chart) baseado no filtro
  const categoryData = filteredTransactions
    .filter((t: any) => t.type === 'payable')
    .reduce((acc: any[], t: any) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += Number(t.amount);
      } else {
        const catObj = categories.find(c => c.name === t.category);
        acc.push({
          name: t.category,
          value: Number(t.amount),
          color: catObj?.color || '#6366f1'
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Faturas dos cartões baseadas no filtro (se for mensal, mostra a do mês, se anual, o total acumulado)
  const getNubankBill = () => filteredTransactions
    .filter(t => t.bank?.toUpperCase() === 'NUBANK' && t.payment_method === 'CARTÃO DE CRÉDITO' && t.status === 'pending')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const getC6Bill = () => filteredTransactions
    .filter(t => t.bank?.toUpperCase() === 'C6 BANK' && t.payment_method === 'CARTÃO DE CRÉDITO' && t.status === 'pending')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  // Dados para o Gráfico de Área (Fluxo de Performance) agrupados por todos os meses do ano
  const dynamicChartData = months.map((month, index) => {
    const monthTransactions = transactions.filter((t: any) => {
      const d = new Date(t.date + 'T12:00:00');
      return d.getMonth() === index && d.getFullYear() === selectedYear;
    });

    return {
      name: month,
      income: monthTransactions.filter(t => t.type === 'receivable').reduce((acc, t) => acc + (t.amount || 0), 0),
      expenses: monthTransactions.filter(t => t.type === 'payable').reduce((acc, t) => acc + (t.amount || 0), 0)
    };
  });

  // 1. Resumo de Caixa (Receber vs Pagar)
  const totalReceivable = filteredTransactions
    .filter((t: any) => t.type === 'receivable')
    .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

  const totalPayable = filteredTransactions
    .filter((t: any) => t.type === 'payable')
    .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

  const netResult = totalReceivable - totalPayable;

  // 2. Projeção de Saldo (Previsibilidade)
  // Considera o saldo atual + o que ainda não foi pago/recebido no mês selecionado
  const pendingIn = filteredTransactions
    .filter((t: any) => t.type === 'receivable' && t.status !== 'completed')
    .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

  const pendingOut = filteredTransactions
    .filter((t: any) => t.type === 'payable' && t.status !== 'completed')
    .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

  const projectedBalance = totalBalance + pendingIn - pendingOut;

  // 3. Distribuição por Instituição
  const bankDistribution = filteredTransactions.reduce((acc: any, t: any) => {
    const bank = t.bank || 'OUTROS';
    if (!acc[bank]) acc[bank] = 0;
    acc[bank] += t.type === 'receivable' ? t.amount : -t.amount;
    return acc;
  }, {});

  // 4. Saúde Mensal (Budget) - Gastos não podem ultrapassar 80% da receita idealmente
  const budgetHealth = totalReceivable > 0 ? (totalPayable / totalReceivable) * 100 : 0;

  // Próximos Vencimentos (Próximos 7 dias) - Este permanece global por segurança
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const upcomingPayments = transactions
    .filter((t: any) => {
      if (t.status === 'completed' || t.type === 'receivable') return false;
      const d = new Date(t.date + 'T12:00:00');
      return d >= today && d <= nextWeek;
    })
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'];

  const lifestyleCategories = [
    'ALIMENTAÇÃO', 'LAZER', 'PESSOAL', 'CASA', 'TRANSPORTE'
  ];

  const radarData = lifestyleCategories.map(label => {
    const matchingCat = categories.find(c => c.name.includes(label));
    const total = filteredTransactions
      .filter((t: any) => t.category === matchingCat?.name)
      .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
    return {
      subject: label,
      value: total,
    };
  });

  const maskValue = (val: string) => isPrivate ? '••••••' : val;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Dynamic Filter Controls */}
      <div className="glass-card p-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex bg-white/5 p-1 rounded-3xl">
          {['month', 'year'].map((range: any) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${timeRange === range ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-slate-500 hover:text-white'}`}
            >
              {range === 'month' ? 'Mensal' : 'Anual'}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center gap-3 overflow-x-auto scrollbar-hide px-2">
          {timeRange === 'month' && months.map((month, index) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(index)}
              className={`flex-none px-5 py-2.5 rounded-2xl font-black text-[9px] transition-all uppercase tracking-widest ${selectedMonth === index
                ? 'bg-indigo-500 text-white'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {month}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-[10px] font-black text-white focus:outline-none focus:border-white/20 uppercase tracking-widest cursor-pointer appearance-none"
          >
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year} className="bg-black">{year}</option>
            ))}
          </select>
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            className="w-12 h-12 glass-card flex items-center justify-center text-slate-500 hover:text-white transition-all"
          >
            {isPrivate ? <Eye size={18} className="text-indigo-400" /> : <EyeOff size={18} />}
          </button>
        </div>
      </div>

      {/* Primary Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Main Liquidity Card */}
        <div className="lg:col-span-8 glass-card p-10 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-700">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] -mr-48 -mt-48 group-hover:bg-indigo-600/20 transition-all" />

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-black tracking-[0.3em] text-[10px] uppercase italic mb-2 flex items-center gap-2">
                  <Wallet size={14} className="text-indigo-500" /> LIQUIDEZ TOTAL DISPONÍVEL
                </p>
                <motion.h3
                  key={totalBalance}
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  className="text-7xl lg:text-8xl font-black tracking-tighter font-mono-numbers leading-none"
                >
                  {maskValue(formatCurrency(totalBalance))}
                </motion.h3>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-right">
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Projeção p/ Fim</p>
                <p className="text-md font-bold font-mono-numbers text-emerald-400">{maskValue(formatCurrency(projectedBalance))}</p>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-slate-900 flex items-center justify-center font-black text-[10px] text-white">
                    {['C6', 'NU', 'IT'][i]}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-[10px] text-black">+2</div>
              </div>
              <div className="h-0.5 w-12 bg-white/10" />
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Verificado via protocolos criptografados</p>
            </div>
          </div>
        </div>

        {/* Operational Result (DRE) */}
        <div className="lg:col-span-4 glass-card p-8 flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-700">
          <div className="flex justify-between items-start mb-8">
            <h5 className="font-black tracking-[0.2em] text-slate-400 uppercase text-[10px] italic flex items-center gap-3">
              <ListOrdered size={16} className="text-indigo-500" /> OPERAÇÕES LÍQUIDAS
            </h5>
            <div className={`p-2 rounded-lg ${netResult >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              <TrendingUp size={16} />
            </div>
          </div>

          <div className="space-y-8 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center group/item">
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Recebíveis</p>
                <p className="text-3xl font-black font-mono-numbers text-white/90">{maskValue(formatCurrency(totalReceivable))}</p>
              </div>
              <ArrowUpRight size={24} className="text-emerald-500 opacity-20 group-hover/item:opacity-100 transition-opacity" />
            </div>

            <div className="h-px w-full bg-white/5" />

            <div className="flex justify-between items-center group/item">
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Pagáveis</p>
                <p className="text-3xl font-black font-mono-numbers text-white/90">{maskValue(formatCurrency(totalPayable))}</p>
              </div>
              <ArrowDownRight size={24} className="text-rose-500 opacity-20 group-hover/item:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase">Superávit de Caixa</p>
            <p className={`text-2xl font-black font-mono-numbers italic transition-all ${netResult >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {maskValue(formatCurrency(netResult))}
            </p>
          </div>
        </div>

        {/* Credit System Layout */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Nubank Neomorphic */}
          <div className="glass-card-hover bg-gradient-to-br from-[#1a0124] to-[#0a0a0a] border border-purple-500/20 rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-[#8a05be] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <CreditCard size={20} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest italic">Nubank Gold</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Balanço do Ciclo</p>
              <p className="text-4xl font-black font-mono-numbers text-white leading-none tracking-tighter mb-2">{maskValue(formatCurrency(getNubankBill()))}</p>
              <div className="flex items-center gap-2">
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[65%]" />
                </div>
                <span className="text-[8px] font-bold text-slate-600">65%</span>
              </div>
            </div>
          </div>

          {/* C6 Stealth */}
          <div className="glass-card-hover bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="flex justify-between items-start relative z-10">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-black rounded-sm border border-white/10" />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">C6 Carbon</span>
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Vencimentos Pendentes</p>
              <p className="text-4xl font-black font-mono-numbers text-white leading-none tracking-tighter mb-4">{maskValue(formatCurrency(getC6Bill()))}</p>
              <p className="text-[8px] font-black text-slate-700 tracking-[0.3em] font-mono truncate">ID: CARBON-X-8842-PREMIUM</p>
            </div>
          </div>

          {/* Lifestyle Radar Chart */}
          <div className="glass-card p-6 flex flex-col min-h-[220px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Lifestyle Radar</span>
              <Target size={14} className="text-slate-700" />
            </div>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 8, fontWeight: 900 }} />
                  <Radar
                    name="Gastos"
                    dataKey="value"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
              {isPrivate && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-xl">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Protegido</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Institutional Flow Scroll */}
        <div className="lg:col-span-4 glass-card p-10 h-[500px] flex flex-col">
          <h5 className="font-black tracking-[0.2em] text-emerald-400 uppercase text-[10px] italic mb-10 flex items-center gap-3">
            <Building2 size={16} /> DISTRIBUIÇÃO POR ENTIDADE
          </h5>
          <div className="flex-1 space-y-4 overflow-y-auto pr-3 scrollbar-hide">
            {Object.entries(bankDistribution).map(([bank, amount]: any) => (
              <motion.div
                whileHover={{ x: 5 }}
                key={bank}
                className="flex items-center justify-between p-5 rounded-[2rem] bg-white/[0.03] border border-white/[0.03] hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 glass-card flex items-center justify-center font-black text-[10px] text-slate-500">
                    {bank.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{bank}</span>
                </div>
                <span className={`font-mono-numbers font-black italic text-sm ${amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {maskValue(formatCurrency(amount))}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Evolution & Performance (Charts) */}
        <div className="lg:col-span-8 glass-card p-10 h-[500px] flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h5 className="font-black tracking-[0.2em] text-indigo-400 uppercase text-[10px] italic flex items-center gap-3">
              <TrendingUp size={16} /> ÍNDICE DE PERFORMANCE
            </h5>
            <div className="flex gap-6">
              <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Entradas</span></div>
              <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Saídas</span></div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicChartData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9, fontWeight: 900 }} dy={15} />
                <YAxis hide />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="income" name="Entradas" stroke="#10b981" strokeWidth={3} fill="url(#colorInc)" />
                <Area type="monotone" dataKey="expenses" name="Saídas" stroke="#f43f5e" strokeWidth={3} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Final Row Insights */}
        <div className="lg:col-span-12 glass-card p-6 flex flex-col md:flex-row items-center gap-8 group">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Indicador de Segurança Orçamentária</span>
              <span className={`text-[10px] font-black font-mono-numbers ${budgetHealth > 80 ? 'text-rose-500' : 'text-emerald-500'}`}>{budgetHealth.toFixed(2)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetHealth, 100)}%` }}
                className={`h-full rounded-full ${budgetHealth > 80 ? 'bg-rose-500' : 'bg-indigo-500 animate-pulse outline outline-indigo-500/50'}`}
              />
            </div>
          </div>
          <div className="hidden md:block w-px h-10 bg-white/5" />
          <div className="flex items-center gap-4 px-2">
            <AlertCircle size={24} className={budgetHealth > 80 ? 'text-rose-500 animate-bounce' : 'text-slate-700'} />
            <div>
              <p className="text-[10px] font-black text-white uppercase italic">Conselheiro do Sistema</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase">{budgetHealth > 80 ? 'ALERTA DE LIQUIDEZ: Reduza os Pagáveis' : 'Alocação de Recursos Detectada como Ideal'}</p>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  )
}

function FluxoView({
  transactions,
  formatCurrency,
  formatDate,
  setIsModalOpen,
  handleEditClick,
  handleDeleteTransaction,
  setEditingId,
  resetForm,
  filterText,
  setFilterText,
  filterMonth,
  setFilterMonth,
  filterBank,
  setFilterBank,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  banks
}: any) {
  const months = [
    { val: '0', label: 'JANEIRO' }, { val: '1', label: 'FEVEREIRO' }, { val: '2', label: 'MARÇO' },
    { val: '3', label: 'ABRIL' }, { val: '4', label: 'MAIO' }, { val: '5', label: 'JUNHO' },
    { val: '6', label: 'JULHO' }, { val: '7', label: 'AGOSTO' }, { val: '8', label: 'SETEMBRO' },
    { val: '9', label: 'OUTUBRO' }, { val: '10', label: 'NOVEMBRO' }, { val: '11', label: 'DEZEMBRO' }
  ];

  const filtered = transactions.filter((t: any) => {
    const matchesText = t.title?.toLowerCase().includes(filterText.toLowerCase()) ||
      t.sub_category?.toLowerCase().includes(filterText.toLowerCase());

    const d = new Date(t.date + 'T12:00:00');
    const matchesMonth = filterMonth === 'todos' || d.getMonth() === parseInt(filterMonth);
    const matchesBank = filterBank === 'todos' || t.bank === filterBank;
    const matchesType = filterType === 'todos' || t.type === filterType;
    const matchesStatus = filterStatus === 'todos' || t.status === filterStatus;

    return matchesText && matchesMonth && matchesBank && matchesType && matchesStatus;
  });

  const totals = filtered.reduce((acc: any, t: any) => {
    if (t.type === 'receivable') acc.in += (t.amount || 0);
    else acc.out += (t.amount || 0);
    return acc;
  }, { in: 0, out: 0 });

  const exportToCSV = () => {
    const headers = ['Data', 'Titulo', 'Categoria', 'Subcategoria', 'Banco', 'Tipo', 'Valor', 'Status'];
    const rows = filtered.map((t: any) => [
      t.date,
      t.title,
      t.category,
      t.sub_category,
      t.bank,
      t.type === 'receivable' ? 'Receita' : 'Despesa',
      t.amount,
      t.status === 'completed' ? 'Pago' : 'Pendente'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `operacoes_casa_iq_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-3 space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Busca Rápida</label>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="PROCURAR..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-6 font-black text-xs focus:outline-none focus:border-indigo-500 uppercase transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 italic">Mês</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 font-black text-[10px] focus:outline-none focus:border-indigo-500 uppercase appearance-none cursor-pointer text-slate-300"
            >
              <option value="todos">TODOS</option>
              {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1 italic">Natureza</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 font-black text-[10px] focus:outline-none focus:border-emerald-500 uppercase appearance-none cursor-pointer text-slate-300"
            >
              <option value="todos">RECEITA/DESPESA</option>
              <option value="receivable">RECEITA (ENTRADA)</option>
              <option value="payable">DESPESA (SAÍDA)</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 italic">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 font-black text-[10px] focus:outline-none focus:border-rose-500 uppercase appearance-none cursor-pointer text-slate-300"
            >
              <option value="todos">PAGO/PENDENTE</option>
              <option value="completed">PAGO</option>
              <option value="pending">PENDENTE</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Banco</label>
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 font-black text-[10px] focus:outline-none focus:border-indigo-500 uppercase appearance-none cursor-pointer text-slate-300"
            >
              <option value="todos">INSTITUIÇÃO</option>
              {banks.map((b: string) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="md:col-span-1">
            <button
              onClick={() => { resetForm(); setEditingId(null); setIsModalOpen(true); }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-black text-[10px] uppercase shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center group"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Dinamic Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-emerald-500 bg-emerald-500/[0.02]">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Entradas Filtradas</p>
          <p className="text-2xl font-black font-mono-numbers text-emerald-400">{formatCurrency(totals.in)}</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-rose-500 bg-rose-500/[0.02]">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Saídas Filtradas</p>
          <p className="text-2xl font-black font-mono-numbers text-rose-400">{formatCurrency(totals.out)}</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-indigo-500 bg-indigo-500/[0.02]">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo do Recorte</p>
          <p className={`text-2xl font-black font-mono-numbers ${totals.in - totals.out >= 0 ? 'text-white' : 'text-rose-500'}`}>
            {formatCurrency(totals.in - totals.out)}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="glass-card group flex items-center justify-center gap-4 hover:bg-white/[0.05] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
            <Download size={18} className="group-hover:text-white" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-white uppercase italic">Exportar Dados</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Relatório CSV</p>
          </div>
        </button>
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden border-b-4 border-b-indigo-500/20 shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.02]">
              <th className="p-8">ID</th>
              <th className="p-8">IDENTIFICAÇÃO OPERACIONAL</th>
              <th className="p-8 text-center">COMPRA</th>
              <th className="p-8 text-center text-indigo-400">PAGAMENTO</th>
              <th className="p-8">CLASSIFICAÇÃO</th>
              <th className="p-8">INSTITUIÇÃO</th>
              <th className="p-8 text-right">MONTANTE</th>
              <th className="p-8 text-center text-[10px]">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((t: any) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const transDate = new Date(t.date + 'T12:00:00');
              const isOverdue = t.status === 'pending' && transDate < today;

              return (
                <tr key={t.id} className={`group hover:bg-white/[0.03] transition-colors font-black ${isOverdue ? 'bg-rose-500/[0.02]' : ''}`}>
                  <td className="p-8">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverdue ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]' : t.type === 'receivable' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {isOverdue ? <AlertCircle size={18} /> : t.type === 'receivable' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-3">
                      <p className="font-black text-sm tracking-tight text-white/90 uppercase">{t.title}</p>
                      {isOverdue && <span className="text-[7px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full animate-bounce uppercase">Atraso</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : isOverdue ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-rose-500/10 text-rose-500'}`}>
                        {t.status === 'completed' ? 'PAGO' : isOverdue ? 'ATRASADO' : 'PENDENTE'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">{t.sub_category}</span>
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase italic">
                      {formatDate(t.competency_date || t.date)}
                    </span>
                  </td>
                  <td className="p-8 text-center">
                    <span className={`text-[10px] font-black tracking-widest italic ${isOverdue ? 'text-rose-500 underline underline-offset-4 decoration-rose-500/50' : 'text-indigo-400'}`}>
                      {formatDate(t.date)}
                    </span>
                  </td>
                  <td className="p-8">
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-slate-400 tracking-widest uppercase">{t.category}</span>
                  </td>
                  <td className="p-8 text-[10px] font-black text-slate-400 tracking-widest flex items-center gap-2 uppercase">
                    <Building2 size={14} className="text-slate-600" />
                    {t.bank || '---'}
                  </td>
                  <td className={`p-8 text-right font-black text-xl tracking-tighter ${t.type === 'receivable' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="p-8">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleEditClick(t)} className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all" title="Editar"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all" title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-20 text-center">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Nenhum registro encontrado para os filtros aplicados</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

function TransactionModal({ setIsModalOpen, editingId, setEditingId, formData, setFormData, handleSaveTransaction, categories, subCategories, banks, paymentMethods, formatCurrency }: any) {
  const numInstallments = parseInt(formData.installments) || 1;
  const installmentValue = formData.entry_type === 'installment'
    ? (Number(formData.amount) || 0) / numInstallments
    : Number(formData.amount) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-4xl bg-[#0b1222] border border-white/10 rounded-[3.5rem] shadow-2xl overflow-y-auto max-h-[90vh] p-12 custom-scroll scrollbar-hide font-sans">
        <div className="flex justify-between items-center mb-10">
          <div><h3 className="text-4xl font-extrabold tracking-tighter uppercase italic">{editingId ? 'Editar Lançamento' : 'Novo Lançamento Premium'}</h3><p className="text-[10px] text-indigo-400 font-black tracking-[0.5em] uppercase mt-1 leading-none italic">Intelligence Data Entry Protocol</p></div>
          <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-3 hover:bg-white/5 rounded-full text-slate-400 transition-colors"><X size={32} /></button>
        </div>

        <form onSubmit={handleSaveTransaction} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Bloco 1: Classificação */}
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-3 block uppercase italic">Natureza da Operação</label>
                <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-950 rounded-2xl border border-white/5">
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'receivable' })} className={`py-4 rounded-xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${formData.type === 'receivable' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-600 hover:text-white'}`}><TrendingUp size={14} /> RECEITA</button>
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'payable' })} className={`py-4 rounded-xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${formData.type === 'payable' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-slate-600 hover:text-white'}`}><TrendingDown size={14} /> DESPESA</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-indigo-400 tracking-[0.2em] mb-3 block uppercase italic">Categoria Master</label>
                  <div className="relative group">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <select className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 pl-12 font-black text-xs focus:border-indigo-500 focus:outline-none uppercase appearance-none cursor-pointer"
                      value={formData.category}
                      onChange={(e) => {
                        const cat = categories.find(c => c.name === e.target.value);
                        setFormData({ ...formData, category: e.target.value, type: cat?.type || 'payable' as any });
                      }}>
                      {categories.map((cat: any) => <option key={cat.id} value={cat.name} className="bg-slate-900 uppercase">{cat.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-indigo-400 tracking-[0.2em] mb-3 block uppercase italic">Sub-Classificação</label>
                  <select className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 font-black text-xs focus:border-indigo-500 focus:outline-none uppercase appearance-none cursor-pointer"
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}>
                    {subCategories.map((sub: string) => <option key={sub} value={sub} className="bg-slate-900 uppercase">{sub}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-3 block uppercase italic">Descrição personalizada (Opcional)</label>
                <input type="text" placeholder="EX: COMPRA SEMANAL" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 font-black text-sm focus:border-indigo-500 focus:outline-none uppercase placeholder:text-slate-800" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-3 block uppercase italic">Tipo de Lançamento</label>
                  <select className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 font-black text-[10px] focus:border-indigo-500 focus:outline-none uppercase appearance-none cursor-pointer text-indigo-400" value={formData.entry_type} onChange={(e) => setFormData({ ...formData, entry_type: e.target.value, installments: e.target.value === 'single' ? '1' : formData.installments })}>
                    <option value="single">Lançamento Único</option>
                    <option value="installment">Parcelado (Dividir Total)</option>
                    <option value="recurrent">Recorrente (Repetir Valor)</option>
                  </select>
                </div>
                {!editingId && formData.entry_type !== 'single' && (
                  <div>
                    <label className="text-[10px] font-black text-indigo-400 tracking-[0.2em] mb-3 block uppercase italic">
                      {formData.entry_type === 'installment' ? 'Parcelas' : 'Duração (Meses)'}
                    </label>
                    <div className="relative">
                      <ListOrdered className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                      <select className="w-full bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 pl-12 font-black text-xs focus:border-indigo-500 focus:outline-none uppercase appearance-none cursor-pointer" value={formData.installments} onChange={(e) => setFormData({ ...formData, installments: e.target.value })}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map(n => <option key={n} value={n.toString()}>{n}x {formData.entry_type === 'recurrent' ? 'meses' : ''}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Instituição e Cronograma */}
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-3 block uppercase italic">Forma de Movimentação</label>
                  <select className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 font-black text-[10px] focus:border-indigo-500 focus:outline-none uppercase appearance-none cursor-pointer text-white" value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}>
                    {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-3 block uppercase italic">
                    {formData.status === 'completed' && formData.payment_method !== 'CARTÃO DE CRÉDITO'
                      ? 'Conta de Origem'
                      : 'Instituição / Cartão'}
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                    <select className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 pl-12 font-black text-xs focus:border-indigo-500 focus:outline-none uppercase appearance-none cursor-pointer" value={formData.bank} onChange={(e) => setFormData({ ...formData, bank: e.target.value })}>
                      {banks.map(b => <option key={b} value={b} className="bg-slate-900 uppercase">{b}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-3 block uppercase italic">Compra feito no dia :</label>
                  <input required type="date" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 font-black text-xs focus:border-indigo-500 focus:outline-none" value={formData.competency_date} onChange={(e) => setFormData({ ...formData, competency_date: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-3 block uppercase italic font-bold text-indigo-400">Pagar no dia :</label>
                  <input required type="date" className="w-full bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 font-black text-xs focus:border-indigo-500 focus:outline-none shadow-[0_0_15px_rgba(99,102,241,0.1)]" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-3 block uppercase italic">Situação Operacional</label>
                <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-950 rounded-2xl border border-white/5">
                  <button type="button" onClick={() => setFormData({ ...formData, status: 'completed' })} className={`py-4 rounded-xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${formData.status === 'completed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-700 hover:text-slate-400'}`}>PAGO / CONCLUÍDO</button>
                  <button type="button" onClick={() => setFormData({ ...formData, status: 'pending' })} className={`py-4 rounded-xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${formData.status === 'pending' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-700 hover:text-slate-400'}`}>ABERTO / FATURA</button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-3 block uppercase italic leading-none">Observações</label>
                <textarea rows={2} placeholder="DETALHES DA OPERAÇÃO..." className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 font-black text-xs focus:border-indigo-500 focus:outline-none uppercase resize-none placeholder:text-slate-800" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="w-full md:max-w-sm">
              <label className="text-[10px] font-black text-indigo-400 tracking-[0.3em] mb-3 block uppercase italic">
                {formData.entry_type === 'installment' ? 'Valor TOTAL da Compra' : 'Valor da Operação (R$)'}
              </label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 font-black text-2xl">R$</span>
                <input required type="number" placeholder="0,00" step="0.01" className="w-full bg-indigo-500/10 border-2 border-indigo-500/30 rounded-3xl p-7 pl-20 font-black text-4xl tracking-tighter text-indigo-100 focus:outline-none focus:border-indigo-500 transition-all shadow-[0_0_30px_rgba(99,102,241,0.1)]" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
              </div>
              {numInstallments > 1 && (
                <p className="text-[10px] font-black text-slate-500 mt-3 italic uppercase">
                  {formData.entry_type === 'installment'
                    ? `Serão geradas ${numInstallments} parcelas de ${formatCurrency(installmentValue)}`
                    : `Será repetido o valor de ${formatCurrency(installmentValue)} por ${numInstallments} meses`}
                </p>
              )}
            </div>
            <button type="submit" className="w-full md:flex-1 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white font-black py-8 rounded-[2.5rem] transition-all shadow-2xl flex items-center justify-center gap-4 tracking-[0.5em] uppercase text-xl group">
              <Check size={36} strokeWidth={4} className="group-hover:translate-y-[-2px] transition-transform" /> {editingId ? 'CONFIRMAR EDIÇÃO' : 'EFETIVAR NO SISTEMA'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function NavItem({ icon, label, active = false }: any) {
  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border ${active ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-inner' : 'border-transparent text-slate-500 hover:text-white hover:bg-white/5'
      }`}>
      <span className={active ? 'text-indigo-400' : ''}>{icon}</span>
      <span className="text-[10px] font-black tracking-[0.2em] uppercase">{label}</span>
      {active && <div className="ml-auto w-1 h-4 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]" />}
    </div>
  )
}

export default App
