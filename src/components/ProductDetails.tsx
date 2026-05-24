import React, { useState, useEffect } from 'react';
import { Product, Review } from '../types';
import { fetchReviews, addReview } from '../firebase';
import { Star, ArrowLeft, Plus, Minus, ShoppingCart, Send, User, Calendar, CheckSquare } from 'lucide-react';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, qty: number, notes?: string, customName?: string) => void;
}

export default function ProductDetails({ product, onBack, onAddToCart }: ProductDetailsProps) {
  const [qty, setQty] = useState(1);
  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState('');
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadReviewsData = async () => {
    try {
      const res = await fetchReviews(product.id);
      setReviews(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadReviewsData();
  }, [product.id]);

  const handleAddClick = () => {
    onAddToCart(product, qty, notes, customName);
    setQty(1);
    setCustomName('');
    setNotes('');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      alert('Preencha os dados do comentário!');
      return;
    }
    setSubmittingReview(true);
    try {
      await addReview(product.id, reviewName, reviewRating, reviewComment);
      setReviewName('');
      setReviewComment('');
      setReviewRating(5);
      loadReviewsData(); // reload reviews
    } catch (e) {
      alert('Ocorreu um erro ao enviar seu comentário.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div id="product-detail" className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-sans font-bold text-slate-300 hover:text-white cursor-pointer group bg-slate-900/50 py-2.5 px-4 rounded-xl border border-slate-800 transition-all shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Voltar para a Vitrine
      </button>

      {/* Main Product Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900/40 border border-slate-850 rounded-3xl p-6 sm:p-8">
        
        {/* Left Side: Photo */}
        <div className="space-y-4">
          <div className="w-full h-[300px] sm:h-[380px] overflow-hidden rounded-2xl relative border border-slate-800 shadow-lg">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-slate-950/80 text-white border border-slate-800 font-bold px-3 py-1 rounded-full text-xs font-sans uppercase tracking-wide">
              {product.category}
            </div>
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-400 font-bold font-sans uppercase">
                Produto Esgotado
              </div>
            )}
          </div>
          
          {/* Quick Info details list */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-1.5">
            <h4 className="text-[10px] text-amber-400 uppercase font-sans font-black tracking-widest mb-2">Especificações do Estúdio:</h4>
            {product.details && product.details.length > 0 ? (
              product.details.map((det, i) => (
                <div key={i} className="flex justify-between items-center text-xs font-sans">
                  <span className="text-slate-500 font-medium">{det.name}</span>
                  <span className="text-slate-300 font-bold font-mono">{det.value}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="text-slate-500 font-medium font-sans">Acabamento</span>
                  <span className="text-slate-300 font-bold font-mono">Premium feito à mão</span>
                </div>
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="text-slate-500 font-medium font-sans">Previsão</span>
                  <span className="text-slate-300 font-bold font-mono">Pronta entrega ou 3 dias</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Options & Custom fields buy */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-sans font-black text-white tracking-tight leading-tight">{product.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-700'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400 font-bold font-mono">({product.reviewsCount} avaliações)</span>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-850/60 relative overflow-hidden">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Preço Unitário</span>
              <div className="flex items-baseline gap-2.5 mt-1">
                {product.promoPrice ? (
                  <>
                    <span className="text-2xl font-sans font-black text-sky-400">R$ {product.promoPrice.toFixed(2)}</span>
                    <span className="text-slate-500 font-sans line-through text-sm">R$ {product.price.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-2xl font-sans font-black text-sky-400">R$ {product.price.toFixed(2)}</span>
                )}
              </div>
              <p className="text-[10.5px] text-emerald-400 font-sans font-medium mt-1">
                ✓ Pague no Pix e ganhe desconto na hora!
              </p>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">{product.description}</p>

            {/* CUSTOMIZATION INSTRUCTIONS */}
            <div className="border border-slate-840 bg-slate-950/40 p-4 rounded-2xl space-y-3">
              <div className="text-xs text-amber-400 font-bold font-sans uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-amber-500" />
                Personalize Seus Itens
              </div>
              
              {/* If category is Agenda, show Cover name field */}
              {product.category === 'Agenda' && (
                <div>
                  <label className="text-[10.5px] text-slate-400 uppercase tracking-widest block mb-1">Nome para Grafar na Capa *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ex: Dra. Kátia Ramos, Pastora Ester Ramos..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-sans mt-1 block">Gravação metálica dourada ou laminação premium holográfica.</span>
                </div>
              )}

              {/* General custom observation */}
              <div>
                <label className="text-[10.5px] text-slate-400 uppercase tracking-widest block mb-1">Observações ou Dúvidas do Pedido</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Quero com fita vermelha / chaveiro azul..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Buy and item counts */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-850">
            <div className="flex bg-slate-950 rounded-xl border border-slate-850 items-center overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-2.5 text-slate-400 hover:text-white cursor-pointer active:scale-90"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-mono font-bold text-white text-sm">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="p-2.5 text-slate-400 hover:text-white cursor-pointer active:scale-90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddClick}
              disabled={product.stock === 0}
              className={`flex-1 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white text-xs font-bold font-sans py-3 px-4 rounded-xl shadow-lg shadow-sky-950/40 transition-all cursor-pointer flex items-center justify-center gap-2 ${product.stock === 0 ? 'opacity-50 cursor-not-allowed bg-slate-800 shadow-none' : ''}`}
            >
              <ShoppingCart className="w-4 h-4 text-sky-200" />
              Adicionar ao Carrinho (R$ {((product.promoPrice || product.price) * qty).toFixed(2)})
            </button>
          </div>
        </div>
      </div>

      {/* Customer reviews block */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-sans font-extrabold text-white tracking-tight">Avaliações do Produto</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Form write review */}
          <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-amber-500">Deixe sua avaliação</h4>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Seu Nome *</label>
                <input
                  type="text"
                  required
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Ex: Maria Alice, Reginaldo..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Nota (Estrelas) *</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                >
                  <option value="5">⭐⭐⭐⭐⭐ Perfeito (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ Muito bom (4/5)</option>
                  <option value="3">⭐⭐⭐ Bom (3/5)</option>
                  <option value="2">⭐⭐ Regular (2/5)</option>
                  <option value="1">⭐ Ruim (1/5)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Seu Comentário *</label>
                <textarea
                  rows={2}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Fale o que achou da beleza, qualidade e agilidade..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-sky-600/25 hover:bg-sky-600 text-sky-300 hover:text-white text-xs font-sans font-bold py-2 px-3 rounded-xl border border-sky-500/20 transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Send className="w-4.5 h-4.5 text-sky-400" /> {submittingReview ? 'Enviando...' : 'Publicar Avaliação'}
              </button>
            </form>
          </div>

          {/* List Reviews */}
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 no-scrollbar">
            {reviews.length === 0 ? (
              <div className="text-slate-500 text-center py-12 text-xs font-sans italic border border-dashed border-slate-850 rounded-2xl">
                Seja o primeiro a avaliar este produto personalizado!
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="bg-slate-900/30 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center text-xs border-b border-slate-850 pb-1.5">
                    <span className="text-white font-bold flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-sky-450" />
                      {r.userName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < r.rating ? 'fill-current' : 'text-slate-800'}`}
                      />
                    ))}
                  </div>
                  <p className="text-slate-300 text-xs font-sans leading-relaxed">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
