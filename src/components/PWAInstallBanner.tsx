import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verificar se já está rodando em modo standalone (já instalado)
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // Verificar se foi dispensado recentemente
    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 86400000 * 3) {
      return; // dispensado por 3 dias
    }

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    if (isAppleDevice) {
      setIsVisible(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa_banner_dismissed', String(Date.now()));
  };

  if (isStandalone || !isVisible) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-gradient-to-r from-indigo-900/90 via-slate-900/95 to-emerald-950/90 border-b border-indigo-500/30 px-4 py-2.5 text-xs text-white flex items-center justify-between gap-3 shadow-lg z-50 backdrop-blur-md"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-300">
              <Smartphone size={16} />
            </div>
            <div className="truncate">
              <p className="font-bold truncate">Instale o Gestão Casa no seu celular!</p>
              <p className="text-[10px] text-slate-400 truncate">Acesso instantâneo em tela cheia como aplicativo nativo.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-white font-black text-[10px] uppercase rounded-xl tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Download size={12} /> Instalar App
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modal Guia para iPhone/iOS */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b101b] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-black text-sm uppercase text-white flex items-center gap-2">
                  <Smartphone size={18} className="text-indigo-400" /> Como Instalar no iPhone
                </h4>
                <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                    <Share size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-black uppercase text-[10px]">1. Toque em Compartilhar</strong>
                    <span>No Safari, clique no botão de compartilhamento (ícone do quadrado com a setinha para cima).</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                    <PlusSquare size={16} />
                  </div>
                  <div>
                    <strong className="text-white block font-black uppercase text-[10px]">2. Adicionar à Tela de Início</strong>
                    <span>Role um pouco para baixo e toque em "Adicionar à Tela de Início".</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition-all"
              >
                Entendi!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
