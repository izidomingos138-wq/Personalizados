import React, { useState } from 'react';
import { Order } from '../types';
import { Check, Copy, QrCode, FileText, Send, Sparkles, Receipt, Wallet } from 'lucide-react';

interface PixPaymentProps {
  order: Order;
  onPaymentConfirmed: () => void;
  onBackToOrders: () => void;
}

export default function PixPayment({ order, onPaymentConfirmed, onBackToOrders }: PixPaymentProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPaste, setCopiedPaste] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [receiptSent, setReceiptSent] = useState(false);

  const pixKey = '9598119-0869';
  const ownerName = 'ID PERSONALIZADOS';

  const copyToClipboard = (text: string, type: 'key' | 'paste') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedPaste(true);
      setTimeout(() => setCopiedPaste(false), 2000);
    }
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadProgress('Enviando comprovante...');
      setTimeout(() => {
        setUploadProgress(null);
        setReceiptSent(true);
      }, 1500);
    }
  };

  return (
    <div id="pix-payment-screen" className="max-w-md mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-sky-500/10 rounded-full text-sky-400 mb-2">
          <Wallet className="w-8 h-8 animate-pulse text-sky-400" />
        </div>
        <h2 className="text-2xl font-sans font-bold text-white tracking-tight">Pagamento via Pix</h2>
        <p className="text-slate-400 text-sm mt-1">Finalize seu pedido {order.id}</p>
      </div>

      {/* Value Card */}
      <div className="bg-slate-950/80 border border-sky-500/20 rounded-xl p-4 mb-6 text-center shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 p-1 opacity-20">
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </div>
        <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Valor Total a Pagar</span>
        <div className="text-3xl font-sans font-extrabold text-sky-400 tracking-tight mt-1">
          R$ {order.finalPrice.toFixed(2)}
        </div>
        {order.discount > 0 && (
          <div className="text-xs text-emerald-400 font-medium mt-1">
            Desconto de R$ {order.discount.toFixed(2)} aplicado!
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Step 1: Copy Pix Key */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 font-medium font-sans">Opção 1: Chave Pix (Celular)</span>
            <button
              onClick={() => copyToClipboard(pixKey.replace(/[^0-9]/g, ''), 'key')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-sans cursor-pointer focus:outline-none"
            >
              {copiedKey ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Chave</span>
                </>
              )}
            </button>
          </div>
          <div className="text-white font-mono text-base font-bold bg-slate-950/60 p-2 text-center rounded border border-slate-800 select-all">
            {pixKey}
          </div>
          <p className="text-[11px] text-slate-500 text-center mt-1">Beneficiário: {ownerName}</p>
        </div>

        {/* Dynamic QR Code display */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
          <span className="text-xs text-slate-400 font-medium font-sans mb-3 text-center">Opção 2: Escaneie o QR Code</span>
          
          <div className="bg-white p-3 rounded-xl shadow-lg relative group transition-all duration-300">
            {/* Draw Simulated Pix QR Code cleanly using styled divs to feel real */}
            <div className="w-40 h-40 flex flex-col items-center justify-center border-4 border-slate-900 bg-slate-50 relative p-1 overflow-hidden">
              <QrCode className="w-full h-full text-slate-900" />
              {/* Central Pix Logo mock */}
              <div className="absolute bg-[#3269a8] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                PIX
              </div>
              {/* Glowing camera scanner effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-400/20 to-transparent w-full h-1/5 animate-infinite duration-1000 top-0 left-0 border-b border-sky-500 shadow-md pointer-events-none" style={{ animationName: 'scanPulse' }} />
            </div>
          </div>
          
          <div className="w-full mt-4">
            <button
              onClick={() => copyToClipboard(order.pixCode, 'paste')}
              className="w-full bg-slate-950 border border-slate-800 hover:border-sky-500/40 text-xs text-slate-300 hover:text-white py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
            >
              {copiedPaste ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold font-sans">Código Copia e Cola Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="font-sans">Copiar Código Pix Copia e Cola</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 3: Upload Receipt */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium font-sans block mb-2">Comprovante de Pagamento</span>
          
          {receiptSent ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-center text-xs flex flex-col items-center gap-1">
              <Receipt className="w-6 h-6 text-emerald-400" />
              <span className="font-semibold">Comprovante Enviado com Sucesso!</span>
              <span className="text-[10px] text-emerald-500/80">Nosso financeiro auditará e aprovará seu pedido em instantes.</span>
            </div>
          ) : (
            <div>
              <label 
                htmlFor="pix-receipt-upload" 
                className="w-full border border-dashed border-slate-800 hover:border-sky-500/40 bg-slate-950/40 hover:bg-slate-950/60 p-4 rounded-lg text-center cursor-pointer flex flex-col items-center justify-center gap-1 transition-all duration-200"
              >
                <FileText className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs text-slate-300 font-sans">Selecionar ou arrastar comprovante</span>
                <span className="text-[10px] text-slate-500 font-sans">Aceita JPG, PNG ou PDF</span>
                {uploadProgress && (
                  <span className="text-xs text-amber-400 font-sans animate-pulse mt-1">{uploadProgress}</span>
                )}
              </label>
              <input 
                id="pix-receipt-upload" 
                type="file" 
                accept="image/*,application/pdf" 
                className="hidden" 
                onChange={handleSimulateUpload} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2">
        <button
          onClick={onPaymentConfirmed}
          className="w-full bg-sky-600 hover:bg-sky-500 active:scale-98 text-white text-sm font-sans font-bold py-3 px-4 rounded-xl shadow-lg shadow-sky-950/40 transition-all duration-200 cursor-pointer"
        >
          Confirmar Pagamento Realizado
        </button>
        <button
          onClick={onBackToOrders}
          className="w-full bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-sans font-medium py-2.5 px-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer"
        >
          Ver Meus Pedidos
        </button>
      </div>
      
      {/* Dynamic Keyframes injected right in the page header */}
      <style>{`
        @keyframes scanPulse {
          0% { transform: translateY(0); }
          50% { transform: translateY(128px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
