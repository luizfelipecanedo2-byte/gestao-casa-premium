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
  Loader2,
  AlertCircle
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const isPointerDownRef = useRef(false)
  const pointerStartTimeRef = useRef(0)
  const recognitionRef = useRef<any>(null)
  const lastTranscriptRef = useRef('')

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {}
      }
    }
  }, [])

  const startListening = () => {
    setErrorMessage(null)
    setParsedResult(null)
    lastTranscriptRef.current = ''

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMessage('Seu navegador não suporta reconhecimento de voz direto. Digite na caixa de texto!')
      return
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {}
      }

      const rec = new SpeechRecognition()
      rec.lang = 'pt-BR'
      rec.continuous = false // Crucial para compatibilidade com iOS Safari / WebKit
      rec.interimResults = true
      rec.maxAlternatives = 1

      rec.onstart = () => {
        setIsListening(true)
        if ('vibrate' in navigator) {
          try { navigator.vibrate(40) } catch (e) {}
        }
      }

      rec.onresult = (event: any) => {
        let currentText = ''
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript
        }
        if (currentText) {
          lastTranscriptRef.current = currentText
          setInputText(currentText)
        }
      }

      rec.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error)
        if (event.error === 'service-not-allowed') {
          setErrorMessage('dictation-disabled')
        } else if (event.error === 'not-allowed') {
          setErrorMessage('Permissão de microfone negada. Ative o microfone nas permissões do site!')
        } else if (event.error === 'audio-capture') {
          setErrorMessage('Microfone não disponível ou em uso por outro app.')
        } else if (event.error === 'network') {
          setErrorMessage('Erro de conexão com o serviço de voz. Verifique sua conexão com a internet.')
        } else if (event.error === 'no-speech') {
          setErrorMessage('Nenhuma fala detectada. Toque no microfone e fale perto do celular.')
        } else {
          setErrorMessage(`Aviso: ${event.error}`)
        }
        setIsListening(false)
      }

      rec.onend = () => {
        setIsListening(false)
        const finalRecorded = lastTranscriptRef.current.trim()
        if (finalRecorded) {
          handleAnalyzeText(finalRecorded)
        }
      }

      recognitionRef.current = rec
      rec.start()
    } catch (err: any) {
      console.error('Falha ao iniciar microfone:', err)
      setErrorMessage('Toque novamente para iniciar o microfone.')
      setIsListening(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        if ('vibrate' in navigator) {
          try { navigator.vibrate(30) } catch (e) {}
        }
        recognitionRef.current.stop()
      } catch (e) {}
    }
    setIsListening(false)
  }

  // Push-To-Talk + Tap-To-Talk handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    pointerStartTimeRef.current = Date.now()
    isPointerDownRef.current = true

    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handlePointerUp = () => {
    if (!isPointerDownRef.current) return
    isPointerDownRef.current = false
    const holdTime = Date.now() - pointerStartTimeRef.current

    // Se segurou por mais de 500ms, foi Push-To-Talk -> soltar encerra a gravação
    if (holdTime >= 500 && isListening) {
      stopListening()
    }
  }

  const handlePointerLeave = () => {
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false
      const holdTime = Date.now() - pointerStartTimeRef.current
      if (holdTime >= 500 && isListening) {
        stopListening()
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
        className="relative w-full max-w-2xl bg-[#0c101c] border border-indigo-500/30 rounded-[2.5rem] shadow-2xl p-6 lg:p-8 z-10 overflow-hidden font-sans space-y-6 max-h-[92vh] overflow-y-auto custom-scroll"
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
                Pressione para falar seu gasto
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

        {/* PUSH-TO-TALK Voice Area */}
        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-indigo-950/20 to-black/40 border border-white/5 rounded-3xl relative select-none">
          <motion.div
            animate={isListening ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="relative"
          >
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
            )}

            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onContextMenu={(e) => e.preventDefault()}
              style={{ touchAction: 'none' }}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl relative cursor-pointer active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white shadow-rose-500/50 ring-8 ring-rose-500/25'
                  : 'bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/40 ring-4 ring-indigo-500/10'
              }`}
            >
              {isListening ? <MicOff size={36} /> : <Mic size={36} />}
            </button>
          </motion.div>

          <p className="mt-5 text-xs font-black uppercase tracking-widest text-center">
            {isListening ? (
              <span className="text-rose-400 flex items-center justify-center gap-2 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                Gravando sua voz... Solte ou toque para lançar!
              </span>
            ) : (
              <span className="text-slate-200">
                Pressione para falar (ou dê um toque)
              </span>
            )}
          </p>

          <p className="text-[10px] text-slate-400 mt-1.5 text-center max-w-sm">
            Exemplo: "Comprei 20 reais no supermercado com o cartão C6"
          </p>

          {errorMessage === 'dictation-disabled' ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left space-y-3 w-full max-w-md"
            >
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertCircle size={18} className="shrink-0" />
                <span>Ditado do iPhone Desativado</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                No iPhone (iOS), o Safari exige que o <strong>Ditado</strong> esteja ligado nos Ajustes do sistema:
              </p>
              <div className="p-2.5 bg-black/50 border border-white/10 rounded-xl text-[11px] font-medium text-amber-200 flex items-center gap-2">
                <span>⚙️</span>
                <span>Ajustes &gt; Geral &gt; Teclado &gt; Ativar Ditado</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-slate-300">
                  💡 Ou fale agora mesmo usando o microfone do seu teclado:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    inputRef.current?.focus()
                  }}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  <span>🎙️</span> Tocar para Abrir Teclado e Falar
                </button>
              </div>
            </motion.div>
          ) : errorMessage ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2 text-center max-w-md"
            >
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          ) : null}
        </div>

        {/* Live / Typed Text Box */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Texto falado ou digitado:
            </label>
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>📱 Ditar pelo teclado</span>
            </button>
          </div>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAnalyzeText()
                }
              }}
              placeholder="O que você comprou? (ou fale pelo microfone)"
              className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
            />

            <button
              type="button"
              onClick={() => handleAnalyzeText()}
              disabled={isProcessing || !inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
              title="Analisar com IA"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Dica no celular: você também pode tocar no campo acima e clicar no microfone 🎙️ do próprio teclado para falar!
          </p>
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
              className="text-[10px] font-semibold px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 rounded-lg transition-all cursor-pointer"
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
            <div className="flex justify-between items-center flex-wrap gap-2">
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

            <div className="flex gap-3 flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => onOpenInForm(parsedResult)}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center"
              >
                Ajustar no Formulário
              </button>

              <button
                type="button"
                onClick={handleExecuteSave}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
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
            className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
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
