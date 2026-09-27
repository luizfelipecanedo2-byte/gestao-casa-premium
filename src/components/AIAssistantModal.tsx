import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Sparkles,
  Send,
  X,
  Check,
  Building2,
  Tag,
  CreditCard,
  User,
  Key,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import { parseTransaction, type ParsedTransaction } from '../lib/aiAssistant'

interface AIAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: 'Felipe' | 'Mara'
  setCurrentUser: (user: 'Felipe' | 'Mara') => void
  onConfirmTransaction: (parsed: ParsedTransaction) => Promise<void>
  onOpenInForm: (parsed: ParsedTransaction) => void
  formatCurrency: (val: number) => string
}

export function AIAssistantModal({
  isOpen,
  onClose,
  currentUser,
  setCurrentUser,
  onConfirmTransaction,
  onOpenInForm,
  formatCurrency
}: AIAssistantModalProps) {
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedResult, setParsedResult] = useState<ParsedTransaction | null>(null)
  const [aiSource, setAiSource] = useState<'gemini' | 'local' | null>(null)
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '')
  const [showKeyConfig, setShowKeyConfig] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputText(transcript)
      handleAnalyzeText(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.warn('Erro no reconhecimento de voz:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [currentUser, geminiApiKey])

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Seu navegador não suporta reconhecimento de voz direto. Você pode digitar na caixa de texto!')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setParsedResult(null)
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (e) {
        console.error('Falha ao iniciar microfone:', e)
      }
    }
  }

  const handleAnalyzeText = async (textToParse?: string) => {
    const text = (textToParse || inputText).trim()
    if (!text) return

    setIsProcessing(true)
    try {
      const { result, source } = await parseTransaction(text, currentUser, geminiApiKey)
      setParsedResult(result)
      setAiSource(source)
    } catch (err) {
      console.error('Erro na análise de IA:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveApiKey = (key: string) => {
    setGeminiApiKey(key)
    localStorage.setItem('gemini_api_key', key)
  }

  const handleExecuteSave = async () => {
    if (!parsedResult) return
    setIsProcessing(true)
    try {
      await onConfirmTransaction(parsedResult)
      onClose()
      setParsedResult(null)
      setInputText('')
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0c101c] border border-indigo-500/30 rounded-[2.5rem] shadow-2xl p-6 lg:p-8 z-10 overflow-hidden font-sans space-y-6"
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Header */}
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Assistente de Voz IA
              </h3>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                Fale ou digite para lançar na hora
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* User Profile Selector (Quem está gastando) */}
        <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <User size={16} className="text-indigo-400" />
            <span>Quem está lançando agora:</span>
          </div>

          <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setCurrentUser('Felipe')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                currentUser === 'Felipe'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>👨</span> Felipe
            </button>

            <button
              type="button"
              onClick={() => setCurrentUser('Mara')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                currentUser === 'Mara'
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>👩</span> Mara
            </button>
          </div>
        </div>

        {/* Microphone and Speech Area */}
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-950/20 to-black/40 border border-white/5 rounded-3xl relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={toggleListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl relative ${
              isListening
                ? 'bg-rose-500 text-white shadow-rose-500/50 animate-pulse ring-8 ring-rose-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/40'
            }`}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </motion.button>

          <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-300 text-center">
            {isListening ? (
              <span className="text-rose-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                Ouvindo sua voz... Pode falar!
              </span>
            ) : (
              'Clique no microfone e fale seu gasto'
            )}
          </p>

          <p className="text-[10px] text-slate-500 mt-1 text-center">
            Ex: "Comprei 20 reais no supermercado com o cartão C6"
          </p>
        </div>

        {/* Text Input Option */}
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAnalyzeText()
              }
            }}
            placeholder="Ou digite aqui o que comprou..."
            className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
          />

          <button
            type="button"
            onClick={() => handleAnalyzeText()}
            disabled={isProcessing || !inputText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center transition-all"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        {/* Quick Example Suggestions */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center">Exemplos:</span>
          {[
            'Comprei 20 reais no supermercado com o cartão C6',
            'Abasteci 80 de gasolina no débito Itaú',
            'Almoço 45 no pix Nubank'
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setInputText(ex)
                handleAnalyzeText(ex)
              }}
              className="text-[10px] font-semibold px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 rounded-lg transition-all"
            >
              "{ex}"
            </button>
          ))}
        </div>

        {/* Parsed Result Preview */}
        {parsedResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-indigo-950/30 border border-indigo-500/40 rounded-3xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" />
                Lançamento Identificado com Sucesso
              </span>
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                {aiSource === 'gemini' ? '✨ Google Gemini AI' : '⚡ Motor Inteligente Local'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/30 p-4 rounded-2xl border border-white/5">
              <div>
                <p className="text-[8px] font-bold text-slate-500 uppercase">Título</p>
                <p className="text-xs font-black text-white truncate">{parsedResult.title}</p>
              </div>

              <div>
                <p className="text-[8px] font-bold text-slate-500 uppercase">Valor</p>
                <p className="text-sm font-black font-mono text-emerald-400">
                  {formatCurrency(parsedResult.amount)}
                </p>
              </div>

              <div>
                <p className="text-[8px] font-bold text-slate-500 uppercase">Banco / Método</p>
                <p className="text-xs font-black text-slate-200 truncate">
                  {parsedResult.bank} ({parsedResult.payment_method})
                </p>
              </div>

              <div>
                <p className="text-[8px] font-bold text-slate-500 uppercase">Quem Gastou</p>
                <p className="text-xs font-black text-indigo-400">
                  {currentUser === 'Mara' ? '👩 Mara' : '👨 Felipe'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onOpenInForm(parsedResult)}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
              >
                Ajustar no Formulário
              </button>

              <button
                type="button"
                onClick={handleExecuteSave}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>Confirmar e Lançar</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Gemini API Key Collapsible Settings */}
        <div className="pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Key size={12} />
              Configurar Chave Google Gemini API (Opcional)
            </span>
            {showKeyConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showKeyConfig && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2"
            >
              <p className="text-[9px] text-slate-400">
                Se quiser usar o modelo Gemini 1.5 Flash do Google diretamente, cole sua chave gratuita do{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 underline"
                >
                  Google AI Studio
                </a>
                . Se deixar em branco, o sistema usa o motor inteligente nativo automaticamente.
              </p>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="Cole sua Gemini API Key aqui (AIza...)"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
