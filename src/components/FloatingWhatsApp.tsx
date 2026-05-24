import React from 'react';
import { MessageSquareDot } from 'lucide-react';

export default function FloatingWhatsApp() {
  const phone = '95981190869';
  const text = encodeURIComponent('Olá, gostaria de fazer um pedido na ID PERSONALIZADOS.');
  const whatsappUrl = `https://wa.me/55${phone}?text=${text}`;

  return (
    <a
      id="whatsapp-floating-btn"
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-medium py-3 px-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-emerald-400/20 cursor-pointer transition-all duration-300 group hover:pr-5 select-none"
    >
      <div className="relative">
        <MessageSquareDot className="w-6 h-6 animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
      </div>
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out font-sans text-sm tracking-wide whitespace-nowrap">
        Pedir no WhatsApp
      </span>
    </a>
  );
}
