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
  Download,
  Home,
  Briefcase,
  Layers
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
  { id: '9', name: 'DESPESA COM SAÚDE', color: '#ef4444', type: 'payable' }, // Red
  { id: '10', name: 'PATRIMÔNIO', color: '#d946ef', type: 'receivable' }, // Fuchsia
]

const subCategoriesMap: Record<string, string[]> = {
  'RECEITA SALÁRIO': ['SALÁRIO MARA', 'SALÁRIO FELIPE'],
  'RECEITA EXTRA': ['HORAS EXTRAS', 'DINHEIRO VÓ BIA', 'DIVISÃO DE LUCRO EMPRESA', 'MÊS ANTERIOR'],
  'DESPESAS COM ALIMENTAÇÃO': ['MERCADO', 'PADARIA', 'AÇOUGUE', 'PEIXARIA'],
  'DESPESA LAZER': ['LANCHONETE', 'SORVETERIA', 'VIAGEM', 'NETFLIX', 'TV BOX'],
  'DESPESA PESSOAL': ['CABELO', 'MESADA', 'DIZIMO', 'ROUPAS', 'ACESSÓRIOS', 'ACADEMIA'],
  'DESPESA COM CASA': ['ÁGUA', 'LUZ', 'INTERNET', 'TERRENO', 'OUTROS'],
  'DESPESA COM TRANSPORTE': ['GASOLINA MOTO', 'GASOLINA BIZ', 'GASOLINA CARRO', 'CONSERTO DA MOTO', 'CONSERTO DA BIZ', 'DESPESA COM CARRO'],
  'INVESTIMENTO': ['RENDA FIXA', 'RENDA VARIAVEL', 'RESERVA DE EMERGENCIA'],
  'DESPESA COM SAÚDE': ['FARMÁCIA', 'EXAME', 'HOSPITAL'],
  'PATRIMÔNIO': ['IMÓVEL', 'VEÍCULO', 'APORTE', 'OUTROS BENS']
}

const banks = ["ITAÚ", "NUBANK", "COFRINHO NUBANK", "C6 BANK", "INTER", "BRADESCO", "SANTANDER", "XP", "DINHEIRO ESPÉCIE"]
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
  created_at?: string
}

interface ExpenseItem {
  description: string
  unit: string
  quantity: number
  unitValue: number
  totalValue: number
}

interface ServiceExpense {
  id: string
  client_name: string
  environment: string
  service_value: number
  spent_value: number
  items: ExpenseItem[]
  created_at?: string
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fluxo' | 'margem' | 'ativos'>('dashboard')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [serviceExpenses, setServiceExpenses] = useState<ServiceExpense[]>([])
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
    sub_category: subCategoriesMap['RECEITA SALÁRIO'][0],
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

  // Estado para o formulário de Margem/Serviço
  const [serviceFormData, setServiceFormData] = useState({
    client_name: '',
    environment: '',
    service_value: '',
    items: [] as ExpenseItem[]
  })

  useEffect(() => {
    const subs = subCategoriesMap[formData.category] || []
    if (subs.length > 0 && !subs.includes(formData.sub_category)) {
      setFormData(prev => ({ ...prev, sub_category: subs[0] }))
    }
  }, [formData.category])

  useEffect(() => {
    fetchTransactions()
    fetchServiceExpenses()
  }, [])

  const fetchServiceExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('service_expenses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setServiceExpenses(data || [])
    } catch (error) {
      console.error('Erro ao buscar gastos por serviço:', error)
    }
  }


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
          // Safe string-based date increment to avoid timezone bugs
          const [yyyy, mm, dd] = formData.date.split('-');
          let yearNum = parseInt(yyyy, 10);
          let monthNum = parseInt(mm, 10) + (i - 1);

          // Adjust year and month
          if (monthNum > 12) {
            yearNum += Math.floor((monthNum - 1) / 12);
            monthNum = ((monthNum - 1) % 12) + 1;
          }

          const newMonth = monthNum.toString().padStart(2, '0');
          const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
          const newDay = Math.min(parseInt(dd, 10), daysInMonth).toString().padStart(2, '0');
          const newDateStr = `${yearNum}-${newMonth}-${newDay}`;

          // Se for parcelamento, divide o valor. Se for recorrente, repete o valor cheio.
          const finalAmount = formData.entry_type === 'installment' ? amountPerInstallment : totalAmount;

          insertData.push({
            title: numInstallments > 1 ? `${baseTitle} [${i}/${numInstallments}]` : baseTitle,
            category: formData.category,
            sub_category: formData.sub_category,
            amount: finalAmount,
            type: formData.type,
            date: newDateStr,
            competency_date: formData.competency_date,
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
                <button onClick={() => setActiveTab('ativos')} className="group">
                  <NavItem icon={<PiggyBank size={20} />} label="ATIVOS" active={activeTab === 'ativos'} />
                </button>
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
                  {activeTab === 'dashboard' ? 'Insight' : activeTab === 'ativos' ? 'Central' : 'Fluxo'} <span className="text-indigo-500">{activeTab === 'dashboard' ? 'Geral' : activeTab === 'ativos' ? 'de Ativos' : 'de Dados'}</span>
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
            ) : activeTab === 'ativos' ? (
              <AtivosView
                transactions={transactions}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                setIsModalOpen={setIsModalOpen}
                setFormData={setFormData}
                setEditingId={setEditingId}
                handleDeleteTransaction={handleDeleteTransaction}
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
                onRefresh={fetchTransactions}
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

  const getBankActualBalance = (bankName: string) => {
    return transactions
      .filter((t: any) => t.status === 'completed' && t.bank === bankName)
      .reduce((acc: number, t: any) => t.type === 'receivable' ? acc + (t.amount || 0) : acc - (t.amount || 0), 0);
  };

  const bankBalances = [
    {
      name: 'DINHEIRO',
      bank: 'DINHEIRO ESPÉCIE',
      value: getBankActualBalance('DINHEIRO ESPÉCIE'),
      icon: <DollarSign size={14} className="text-emerald-500" />,
      color: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      name: 'NUBANK',
      bank: 'NUBANK',
      value: getBankActualBalance('NUBANK'),
      icon: <CreditCard size={14} className="text-purple-500" />,
      color: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      name: 'C6 BANK',
      bank: 'C6 BANK',
      value: getBankActualBalance('C6 BANK'),
      icon: <Building2 size={14} className="text-slate-400" />,
      color: 'bg-white/5 border-white/10'
    },
    {
      name: 'COFRINHO NU',
      bank: 'COFRINHO NUBANK',
      value: getBankActualBalance('COFRINHO NUBANK'),
      icon: <PiggyBank size={14} className="text-pink-500" />,
      color: 'bg-pink-500/10 border-pink-500/20'
    },
  ];
  const totalCaixaReal = bankBalances.reduce((acc, b) => acc + b.value, 0);

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

        {/* Operational Result (DRE) Full Width */}
        <div className="lg:col-span-12 glass-card p-10 flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-700">
          <div className="flex justify-between items-start mb-8">
            <h5 className="font-black tracking-[0.2em] text-slate-400 uppercase text-[10px] italic flex items-center gap-3">
              <ListOrdered size={16} className="text-indigo-500" /> OPERAÇÕES LÍQUIDAS
            </h5>
            <div className={`p-2 rounded-lg ${netResult >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              <TrendingUp size={16} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
            <div className="flex justify-between items-center group/item p-8 bg-black/20 border border-white/5 rounded-3xl">
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Recebíveis (Período)</p>
                <p className="text-4xl lg:text-5xl font-black font-mono-numbers text-white/90 tracking-tighter">{maskValue(formatCurrency(totalReceivable))}</p>
              </div>
              <ArrowUpRight size={40} strokeWidth={1} className="text-emerald-500 opacity-20 group-hover/item:opacity-100 transition-opacity" />
            </div>

            <div className="flex justify-between items-center group/item p-8 bg-black/20 border border-white/5 rounded-3xl">
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Pagáveis (Período)</p>
                <p className="text-4xl lg:text-5xl font-black font-mono-numbers text-white/90 tracking-tighter">{maskValue(formatCurrency(totalPayable))}</p>
              </div>
              <ArrowDownRight size={40} strokeWidth={1} className="text-rose-500 opacity-20 group-hover/item:opacity-100 transition-opacity" />
            </div>

            <div className="flex justify-between items-center p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Superávit de Caixa</p>
                <p className={`text-4xl lg:text-5xl font-black font-mono-numbers italic tracking-tighter transition-all ${netResult >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {maskValue(formatCurrency(netResult))}
                </p>
              </div>
            </div>
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

          {/* Conciliação Bancária */}
          <div className="glass-card p-6 flex flex-col min-h-[220px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all" />

            <div className="flex justify-between items-center mb-6 relative z-10">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-2">
                <Target size={14} className="text-indigo-500" /> CONCILIAÇÃO BANCÁRIA
              </span>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Valor em Caixa</p>
                <p className="text-xl font-black font-mono-numbers text-white">{maskValue(formatCurrency(totalCaixaReal))}</p>
              </div>
            </div>

            <div className="flex-1 w-full relative z-10 space-y-3 mt-2 overflow-y-auto scrollbar-hide pr-2">
              {bankBalances.map((b) => (
                <div key={b.name} className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${b.color}`}>
                      {b.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{b.name}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-black font-mono-numbers ${b.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {maskValue(formatCurrency(b.value))}
                  </span>
                </div>
              ))}
            </div>

            {isPrivate && (
              <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Saldo Protegido</span>
              </div>
            )}
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
  banks,
  onRefresh
}: any) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map((t: any) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkPay = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Deseja efetivar o pagamento de ${selectedIds.length} conta(s)?`)) return;

    try {
      setIsProcessing(true);
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('home_transactions')
        .update({ status: 'completed', payment_date: today })
        .in('id', selectedIds);

      if (error) throw error;

      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      alert('Erro ao realizar pagamento em lote.');
    } finally {
      setIsProcessing(false);
    }
  };

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

  // Pega os 3 útimos que entraram fisicamente no sistema (ID decrescente ou data de criação)
  const recentEntries = [...transactions]
    .sort((a, b) => {
      // Tenta ordenar pelo ID ou created_at se disponível para garantir que os "últimos lançados" apareçam
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return b.id.localeCompare(a.id); // Fallback para ID
    })
    .slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">

      {/* QUICK MEMORY: ÚLTIMOS LANÇAMENTOS */}
      <div className="space-y-4">
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> MEMÓRIA DE LANÇAMENTOS (ÚLTIMOS 3)
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentEntries.map((t: any) => (
            <div
              key={t.id}
              className="glass-card p-4 border-l-2 border-indigo-500/30 hover:bg-white/[0.04] transition-all cursor-help group"
              onClick={() => handleEditClick(t)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t.category}</span>
                <span className="text-[8px] font-black text-indigo-400 font-mono italic">{formatDate(t.date)}</span>
              </div>
              <p className="text-[11px] font-black text-white uppercase truncate group-hover:text-indigo-300 transition-colors">{t.title}</p>
              <p className={`text-md font-black font-mono-numbers mt-1 ${t.type === 'receivable' ? 'text-emerald-400' : 'text-slate-300'}`}>
                {formatCurrency(t.amount)}
              </p>
            </div>
          ))}
          {recentEntries.length === 0 && (
            <div className="col-span-3 glass-card p-6 text-center text-[10px] font-black text-slate-700 uppercase tracking-widest border-dashed">
              Aguardando os primeiros dados para gerar histórico...
            </div>
          )}
        </div>
      </div>

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

      <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden border-b-4 border-b-indigo-500/20 shadow-2xl relative pb-20">
        {selectedIds.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-20 glass-card bg-indigo-600/20 border-t border-indigo-500/30 p-4 flex items-center justify-between animate-in slide-in-from-bottom-5">
            <div className="flex flex-col ml-4">
              <span className="text-white font-black uppercase text-sm">{selectedIds.length} Lançamentos Selecionados</span>
              <span className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest">Processamento em Lote Ativo</span>
            </div>
            <button
              onClick={handleBulkPay}
              disabled={isProcessing}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[10px] uppercase rounded-xl tracking-widest shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Baixar Linhas
            </button>
          </div>
        )}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.02]">
                <th className="p-8 w-16 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    className="w-4 h-4 rounded border-white/10 bg-black/50 text-indigo-500 focus:ring-indigo-500/50 cursor-pointer"
                  />
                </th>
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
                const isSelected = selectedIds.includes(t.id);

                return (
                  <tr key={t.id} className={`group hover:bg-white/[0.03] transition-colors font-black ${isOverdue ? 'bg-rose-500/[0.02]' : ''} ${isSelected ? 'bg-indigo-500/[0.05]' : ''}`}>
                    <td className="p-8 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(t.id)}
                        className="w-4 h-4 rounded border-white/10 bg-black/50 text-indigo-500 focus:ring-indigo-500/50 cursor-pointer"
                      />
                    </td>
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

function AtivosView({ transactions, formatCurrency, formatDate, setIsModalOpen, setFormData, setEditingId, handleDeleteTransaction }: any) {
  const patrimonioTransactions = transactions.filter((t: any) => t.category === 'PATRIMÔNIO');
  const investimentosTransactions = transactions.filter((t: any) => t.category === 'INVESTIMENTO');

  const totalPatrimonio = patrimonioTransactions.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
  const totalInvestimentos = investimentosTransactions.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
  const totalGeral = totalPatrimonio + totalInvestimentos;

  const handleOpenPatrimonio = () => {
    setFormData({
      title: 'MEU NOVO BEM',
      category: 'PATRIMÔNIO',
      sub_category: 'IMÓVEL',
      amount: '',
      type: 'receivable',
      date: new Date().toISOString().split('T')[0],
      competency_date: new Date().toISOString().split('T')[0],
      bank: 'DINHEIRO ESPÉCIE',
      payment_method: 'DINHEIRO',
      notes: '',
      payment_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      installments: '1',
      entry_type: 'single'
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenInvestimento = () => {
    setFormData({
      title: 'NOVO APORTE',
      category: 'INVESTIMENTO',
      sub_category: 'RENDA FIXA',
      amount: '',
      type: 'receivable',
      date: new Date().toISOString().split('T')[0],
      competency_date: new Date().toISOString().split('T')[0],
      bank: 'XP',
      payment_method: 'PIX',
      notes: '',
      payment_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      installments: '1',
      entry_type: 'single'
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 border-t-4 border-t-fuchsia-500 bg-fuchsia-500/[0.02] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-fuchsia-500/20 transition-all" />
          <div className="relative z-10 flex justify-between items-start mb-6">
            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Patrimônio Declarado</h5>
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center"><Building2 size={16} className="text-fuchsia-500" /></div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black font-mono-numbers text-fuchsia-400 tracking-tighter">{formatCurrency(totalPatrimonio)}</p>
          </div>
        </div>

        <div className="glass-card p-8 border-t-4 border-t-rose-500 bg-rose-500/[0.02] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/20 transition-all" />
          <div className="relative z-10 flex justify-between items-start mb-6">
            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo de Investimentos</h5>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center"><TrendingUp size={16} className="text-rose-500" /></div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black font-mono-numbers text-rose-400 tracking-tighter">{formatCurrency(totalInvestimentos)}</p>
          </div>
        </div>

        <div className="glass-card p-8 border-t-4 border-t-indigo-500 bg-indigo-500/[0.05] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all" />
          <div className="relative z-10 flex justify-between items-start mb-6">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acúmulo (Net Worth)</h5>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center"><PiggyBank size={16} className="text-indigo-400" /></div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black font-mono-numbers text-white tracking-tighter">{formatCurrency(totalGeral)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Patrimônio List */}
        <div className="glass-card p-8 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-black text-[12px] uppercase text-fuchsia-400 tracking-widest flex items-center gap-2"><Building2 size={16} /> Bens Patrimoniais</h4>
            <button onClick={handleOpenPatrimonio} className="flex items-center gap-2 text-[9px] font-black text-white bg-fuchsia-600 hover:bg-fuchsia-500 px-4 py-2 rounded-xl transition-colors uppercase tracking-widest">
              <Plus size={14} /> Registrar Bem
            </button>
          </div>
          <div className="flex-1 space-y-4">
            {patrimonioTransactions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-8">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Nenhum patrimônio registrado ainda.</p>
              </div>
            ) : (
              patrimonioTransactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-fuchsia-500/30 transition-colors group">
                  <div>
                    <p className="font-black text-sm text-white uppercase">{t.title}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{t.sub_category} • {formatDate(t.date)}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-black font-mono-numbers text-fuchsia-400 text-lg">{formatCurrency(t.amount)}</p>
                    <button onClick={() => handleDeleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Investimentos List */}
        <div className="glass-card p-8 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-black text-[12px] uppercase text-rose-400 tracking-widest flex items-center gap-2"><TrendingUp size={16} /> Aportes / Investimentos</h4>
            <button onClick={handleOpenInvestimento} className="flex items-center gap-2 text-[9px] font-black text-white bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-xl transition-colors uppercase tracking-widest">
              <Plus size={14} /> Novo Aporte
            </button>
          </div>
          <div className="flex-1 space-y-4">
            {investimentosTransactions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-8">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Nenhum investimento registrado.</p>
              </div>
            ) : (
              investimentosTransactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-rose-500/30 transition-colors group">
                  <div>
                    <p className="font-black text-sm text-white uppercase">{t.title}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{t.bank} • {t.sub_category}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-black font-mono-numbers text-rose-400 text-lg">{formatCurrency(t.amount)}</p>
                    <button onClick={() => handleDeleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
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
