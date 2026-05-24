import React, { useState, useEffect } from 'react';
import { Product, Order, PromoBanner, Coupon, Review } from '../types';
import { 
  fetchProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  fetchOrders, 
  updateOrderStatus, 
  fetchBanners, 
  addBanner, 
  deleteBanner, 
  fetchCoupons, 
  addCoupon, 
  deleteCoupon 
} from '../firebase';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  DollarSign, 
  ShoppingBag, 
  Tag, 
  Image as ImageIcon, 
  Check, 
  X, 
  RefreshCw, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  Truck, 
  ArrowLeftRight,
  Palette,
  Music 
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'banners' | 'coupons' | 'branding' | 'music'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Brand Customization State
  const [brandName, setBrandName] = useState(() => localStorage.getItem('id_shop_brand_name') || 'Personalizados Shop');
  const [brandSlogan, setBrandSlogan] = useState(() => localStorage.getItem('id_shop_sub_title') || 'Papelaria & Estúdio');
  const [brandLogoUrl, setBrandLogoUrl] = useState(() => localStorage.getItem('id_shop_brand_logo_url') || '');

  // Music Playlist Customization State
  const [songs, setSongs] = useState<{ name: string; url: string; author: string }[]>(() => {
    const saved = localStorage.getItem('id_shop_music_playlist');
    const defaultDevotionalList = [
      {
        name: 'Grandioso És Tu (Instrumental)',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        author: 'Harpa Cristã'
      },
      {
        name: 'Porque Ele Vive (Solo de Piano)',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        author: 'Adoração e Fé'
      },
      {
        name: 'Quão Grande És Tu (Acústico Suave)',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        author: 'Instrumental Gospel'
      }
    ];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasOldSongs = Array.isArray(parsed) && parsed.some(song => song.name.includes('Piano Celestial') || song.name.includes('Lofi'));
        if (hasOldSongs) {
          localStorage.setItem('id_shop_music_playlist', JSON.stringify(defaultDevotionalList));
          return defaultDevotionalList;
        }
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultDevotionalList;
  });

  // Song inputs for adding new music
  const [songNameInput, setSongNameInput] = useState('');
  const [songUrlInput, setSongUrlInput] = useState('');
  const [songAuthorInput, setSongAuthorInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State: Product
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodPromoPrice, setProdPromoPrice] = useState('');
  const [prodCat, setProdCat] = useState<'Agenda' | 'Harpa Cristã' | 'Lembrancinhas' | 'Outros'>('Agenda');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodStock, setProdStock] = useState('20');
  const [prodFeatured, setProdFeatured] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  // Form State: Coupon
  const [cpCode, setCpCode] = useState('');
  const [cpType, setCpType] = useState<'percent' | 'fixed'>('percent');
  const [cpVal, setCpVal] = useState('');
  const [cpMin, setCpMin] = useState('0');

  // Form State: Banner
  const [bnTitle, setBnTitle] = useState('');
  const [bnSubtitle, setBnSubtitle] = useState('');
  const [bnImageUrl, setBnImageUrl] = useState('');

  // Auto clear message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Load backend content
  const loadData = async () => {
    setLoading(true);
    try {
      const [p, o, b, c] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchBanners(),
        fetchCoupons()
      ]);
      setProducts(p);
      setOrders(o);
      setBanners(b);
      setCoupons(c);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit product creation or modification
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodImageUrl) {
      alert('Favor preencher os dados obrigatórios!');
      return;
    }

    try {
      setLoading(true);
      const data = {
        name: prodName,
        description: prodDesc,
        price: parseFloat(prodPrice),
        promoPrice: prodPromoPrice ? parseFloat(prodPromoPrice) : undefined,
        category: prodCat,
        imageUrl: prodImageUrl,
        stock: parseInt(prodStock),
        featured: prodFeatured,
        details: [
          { name: 'Categoria', value: prodCat },
          { name: 'Disponibilidade', value: parseInt(prodStock) > 0 ? 'Sob encomenda' : 'Esgotado' }
        ]
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        setSuccessMsg('Produto atualizado com sucesso!');
      } else {
        await addProduct(data);
        setSuccessMsg('Produto cadastrado com sucesso!');
      }

      setEditingProduct(null);
      resetProductForm();
      loadData();
    } catch (err) {
      alert('Erro ao salvar produto.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProductClick = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdPrice(p.price.toString());
    setProdPromoPrice(p.promoPrice ? p.promoPrice.toString() : '');
    setProdCat(p.category);
    setProdImageUrl(p.imageUrl);
    setProdStock(p.stock.toString());
    setProdFeatured(p.featured);
    setShowProductForm(true);
  };

  const handleDeleteProductClick = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      setLoading(true);
      await deleteProduct(id);
      setSuccessMsg('Produto excluído com sucesso!');
      loadData();
    } catch (e) {
      alert('Não foi possível excluir o produto.');
    } finally {
      setLoading(false);
    }
  };

  const resetProductForm = () => {
    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setProdPromoPrice('');
    setProdCat('Agenda');
    setProdImageUrl('');
    setProdStock('20');
    setProdFeatured(false);
    setShowProductForm(false);
    setEditingProduct(null);
  };

  // Submit Coupon
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpCode || !cpVal) return;
    try {
      setLoading(true);
      await addCoupon({
        code: cpCode.trim().toUpperCase(),
        discountType: cpType,
        discountValue: parseFloat(cpVal),
        minPurchase: parseFloat(cpMin),
        active: true
      });
      setSuccessMsg('Cupom criado!');
      setCpCode('');
      setCpVal('');
      setCpMin('0');
      loadData();
    } catch (e) {
      alert('Erro ao cadastrar cupom.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCouponClick = async (id: string) => {
    if (!confirm('Excluir cupom?')) return;
    try {
      setLoading(true);
      await deleteCoupon(id);
      setSuccessMsg('Cupom excluído!');
      loadData();
    } catch (e) {
      alert('Erro ao deletar.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Banner
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bnImageUrl || !bnTitle) return;
    try {
      setLoading(true);
      await addBanner(bnImageUrl, bnTitle, bnSubtitle || undefined);
      setSuccessMsg('Banner adicionado com sucesso!');
      setBnTitle('');
      setBnSubtitle('');
      setBnImageUrl('');
      loadData();
    } catch (e) {
      alert('Erro ao salvar banner.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBannerClick = async (id: string) => {
    if (!confirm('Remover este banner?')) return;
    try {
      setLoading(true);
      await deleteBanner(id);
      setSuccessMsg('Banner removido!');
      loadData();
    } catch (e) {
      alert('Erro ao apagar banner.');
    } finally {
      setLoading(false);
    }
  };

  // Turn payment actions
  const handleChangeOrderStatus = async (orderId: string, pState: any, dState: any) => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, pState, dState);
      setSuccessMsg('Status do pedido atualizado com sucesso!');
      loadData();
    } catch (e) {
      alert('Erro ao mudar status.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Custom Song to Playlist
  const handleSaveSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songNameInput || !songUrlInput) {
      setSuccessMsg('⚠️ Favor preencher o nome e o link da música.');
      setTimeout(() => setSuccessMsg(null), 4000);
      return;
    }
    const newSong = {
      name: songNameInput.trim(),
      url: songUrlInput.trim(),
      author: songAuthorInput.trim() || 'Estúdio ID'
    };
    
    const updatedSongs = [...songs, newSong];
    setSongs(updatedSongs);
    localStorage.setItem('id_shop_music_playlist', JSON.stringify(updatedSongs));
    
    setSongNameInput('');
    setSongUrlInput('');
    setSongAuthorInput('');
    
    setSuccessMsg('Música adicionada à playlist com sucesso!');
    window.dispatchEvent(new Event('id_music_playlist_updated'));
  };

  const handleDeleteSong = (indexToDelete: number) => {
    if (songs.length <= 1) {
      setSuccessMsg('⚠️ A playlist precisa ter pelo menos uma música!');
      setTimeout(() => setSuccessMsg(null), 4000);
      return;
    }
    // Safe removal without blocking confirm() iframe security error
    const updated = songs.filter((_, i) => i !== indexToDelete);
    setSongs(updated);
    localStorage.setItem('id_shop_music_playlist', JSON.stringify(updated));
    
    setSuccessMsg('Música removida!');
    window.dispatchEvent(new Event('id_music_playlist_updated'));
  };

  return (
    <div id="admin-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-w-5xl mx-auto">
      {/* Banner message alert */}
      {successMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Painel Estúdios ID
          </span>
          <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
            Administração Geral
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-950 text-slate-400 hover:text-white rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer focus:outline-none flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-sans font-semibold rounded-xl border border-rose-500/20 transition-all cursor-pointer"
          >
            Voltar ao Shop
          </button>
        </div>
      </div>

      {/* Tab select block */}
      <div className="flex gap-2 bg-slate-950 p-1.5 rounded-2xl mb-6 overflow-x-auto no-scrollbar font-sans">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'products' ? 'bg-sky-600 text-white shadow shadow-sky-950/40' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Package className="w-4 h-4" />
          Produtos ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'orders' ? 'bg-sky-600 text-white shadow shadow-sky-950/40' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <ShoppingBag className="w-4 h-4" />
          Pedidos ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'banners' ? 'bg-sky-600 text-white shadow shadow-sky-950/40' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <ImageIcon className="w-4 h-4" />
          Banners Promocionais
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'coupons' ? 'bg-sky-600 text-white shadow shadow-sky-950/40' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Tag className="w-4 h-4" />
          Cupons
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'branding' ? 'bg-sky-600 text-white shadow shadow-sky-950/40' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Palette className="w-4 h-4" />
          Marca & Logomarca
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('music')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'music' ? 'bg-sky-600 text-white shadow shadow-sky-950/40' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Music className="w-4 h-4" />
          Músicas & Louvores ({songs.length})
        </button>
      </div>

      {/* Tab: Products Manager */}
      {activeTab === 'products' && (
        <div id="admin-products-tab">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-sans font-extrabold uppercase tracking-wide text-slate-300">Inventário de Produtos</h3>
            {!showProductForm && (
              <button
                onClick={() => setShowProductForm(true)}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-sans py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-950/30 transition-all duration-200 animate-fade-in"
              >
                <Plus className="w-4 h-4" /> Cadastrar Novo
              </button>
            )}
          </div>

          {/* Form Create/Edit Product */}
          {showProductForm && (
            <form onSubmit={handleSaveProduct} className="bg-slate-950/80 border border-slate-855 rounded-2xl p-5 mb-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-amber-400">
                  {editingProduct ? 'Editar Produto Selecionado' : 'Cadastrar Novo Item'}
                </h4>
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="p-1 text-slate-500 hover:text-slate-200 cursor-pointer focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Título do Produto *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ex: Agenda Personalizada 2026 Feminina"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Categoria *</label>
                  <select
                    value={prodCat}
                    onChange={(e) => setProdCat(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  >
                    <option value="Agenda">Agenda</option>
                    <option value="Harpa Cristã">Harpa Cristã</option>
                    <option value="Lembrancinhas">Lembrancinhas</option>
                    <option value="Outros">Outras papelarias</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Exponha as qualidades, acabamento, capa e páginas..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Preço Normal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="Ex: 59.90"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Preço Promocional (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPromoPrice}
                    onChange={(e) => setProdPromoPrice(e.target.value)}
                    placeholder="Ex: 49.90"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-450 uppercase tracking-widest block mb-1 font-bold">Imagem do Produto *</label>
                  <p className="text-[10px] text-slate-500 mb-2">Selecione uma foto da sua galeria ou cole o link da imagem:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-8">
                      <input
                        type="text"
                        required
                        value={prodImageUrl}
                        onChange={(e) => setProdImageUrl(e.target.value)}
                        placeholder="Selecione um arquivo à direita ou cole a URL aqui..."
                        className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl px-3 text-xs focus:outline-none"
                      />
                    </div>
                    
                    <div className="sm:col-span-4">
                      <label className="flex items-center justify-center gap-2 h-10 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-sans rounded-xl cursor-pointer transition-all active:scale-[0.98]">
                        <ImageIcon className="w-4 h-4" />
                        <span>Fazer Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                setSuccessMsg('⚠️ Aviso: Imagem grande. Pode demorar mais para carregar!');
                                setTimeout(() => setSuccessMsg(null), 4000);
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setProdImageUrl(reader.result);
                                  setSuccessMsg('📸 Imagem carregada do dispositivo!');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {prodImageUrl && (
                    <div className="mt-2.5 flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <img 
                        src={prodImageUrl} 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-800"
                        onError={(e) => {
                          (e.target as any).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="overflow-hidden flex-1">
                        <span className="text-[11px] text-emerald-400 font-bold block mb-0.5">✓ Imagem Vinculada</span>
                        <span className="text-[9px] text-slate-500 font-mono block truncate">
                          {prodImageUrl.startsWith('data:') ? 'Arquivo físico carregado com sucesso (Base64)' : prodImageUrl}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setProdImageUrl('')} 
                        className="p-1 text-slate-500 hover:text-rose-450 text-xs font-sans transition"
                      >
                        Limpar
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Estoque Inicial (Itens)</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="featured-check"
                    checked={prodFeatured}
                    onChange={(e) => setProdFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="featured-check" className="text-xs text-slate-300 font-medium font-sans cursor-pointer select-none">
                    Colocar produto em DESTAQUE na página inicial
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="py-2 px-4 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-400 text-xs font-sans rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-sans font-bold rounded-xl cursor-pointer shadow-md shadow-sky-950/20 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> {editingProduct ? 'Salvar Edição' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          )}

          {/* List Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-2xl overflow-hidden relative group transition-all duration-300">
                <div className="h-32 w-full overflow-hidden relative">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[9px] font-bold font-sans px-2 py-0.5 rounded-full border border-slate-800 capitalize">
                    {p.category}
                  </div>
                  {p.featured && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[9px] font-bold py-0.5 px-2 rounded-full uppercase">
                      Destaque
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h4 className="text-white text-sm font-sans font-bold leading-tight line-clamp-1">{p.name}</h4>
                  <div className="mt-2 flex items-baseline gap-2">
                    {p.promoPrice ? (
                      <>
                        <span className="text-sky-450 font-sans font-extrabold text-sm">R$ {p.promoPrice.toFixed(2)}</span>
                        <span className="text-slate-500 text-xs font-sans line-through">R$ {p.price.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-sky-455 font-sans font-extrabold text-sm">R$ {p.price.toFixed(2)}</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl mt-3 text-[11px] border border-slate-855">
                    <span className="text-slate-400">Estoque:</span>
                    <span className={`font-mono font-bold ${p.stock <= 5 ? 'text-red-405 font-extrabold' : 'text-slate-200'}`}>
                      {p.stock} un
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => handleEditProductClick(p)}
                      className="py-2 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 text-[11px] font-sans font-bold rounded-xl border border-slate-800 cursor-pointer flex items-center justify-center gap-1 transition-all"
                    >
                      <Edit2 className="w-3 h-3 text-sky-400" /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProductClick(p.id)}
                      className="py-2 hover:bg-rose-600/10 text-rose-450 hover:text-rose-350 text-[11px] font-sans font-bold rounded-xl border border-rose-500/10 cursor-pointer flex items-center justify-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Orders Tracker */}
      {activeTab === 'orders' && (
        <div id="admin-orders-tab" className="space-y-4">
          <h3 className="text-sm font-sans font-extrabold uppercase tracking-wide text-slate-300 mb-2">Relatório Geral de Pedidos</h3>
          {orders.length === 0 ? (
            <div className="text-slate-500 text-center py-12 border border-dashed border-slate-800 rounded-2xl text-xs font-sans">
              Nenhum pedido solicitado no momento.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-900 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">ID:</span>
                        <span className="text-sm font-sans font-black text-amber-400">{order.id}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({new Date(order.createdAt).toLocaleDateString()})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                        Cliente: <strong className="text-slate-200">{order.customerName}</strong> • {order.customerPhone}
                      </div>
                    </div>
                    
                    {/* Grand info badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : order.paymentStatus === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        Pix: {order.paymentStatus === 'paid' ? 'Confirmado' : order.paymentStatus === 'cancelled' ? 'Cancelado' : 'Pendente'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full ${order.deliveryStatus === 'delivered' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/20' : order.deliveryStatus === 'shipped' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        Envio: {order.deliveryStatus === 'delivered' ? 'Entregue' : order.deliveryStatus === 'shipped' ? 'Enviado' : 'Aguardando'}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-slate-300 font-sans bg-slate-900/30 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover border border-slate-850" />
                          <div>
                            <span className="text-white font-medium">{item.name}</span>
                            {item.customName && <span className="text-[10px] text-amber-400 block font-semibold">Capa: {item.customName}</span>}
                            {item.notes && <span className="text-[10px] text-slate-500 block">Obs: {item.notes}</span>}
                          </div>
                        </div>
                        <span className="font-mono text-slate-400">{item.quantity}x • R$ {item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Address */}
                  <div className="bg-slate-950 p-2.5 rounded-xl text-[11px] font-sans border border-slate-900/60 text-slate-400">
                    <strong>Endereço de Entrega:</strong> {order.customerAddress}
                  </div>

                  {/* Pricing footer & status controllers */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20 p-3 rounded-xl border border-slate-855/60">
                    <div className="text-xs font-sans text-slate-400">
                      Total Bruto: <span className="text-slate-300">R$ {order.totalPrice.toFixed(2)}</span>
                      {order.discount > 0 && <span className="text-emerald-400 ml-2">(- R$ {order.discount.toFixed(2)})</span>}
                      <div className="text-sm font-sans font-black text-sky-400 mt-1">Líquido: R$ {order.finalPrice.toFixed(2)}</div>
                    </div>

                    {/* Quick status adjusters */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                      <span className="text-[10px] text-slate-500 font-medium font-sans uppercase">Ações do Administrador:</span>
                      
                      <button
                        onClick={() => handleChangeOrderStatus(order.id, 'paid', order.deliveryStatus)}
                        disabled={order.paymentStatus === 'paid'}
                        className="py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white text-[10px] font-bold uppercase rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
                      >
                        Confirmar Pix
                      </button>

                      <button
                        onClick={() => handleChangeOrderStatus(order.id, order.paymentStatus, 'shipped')}
                        disabled={order.deliveryStatus === 'shipped' || order.deliveryStatus === 'delivered'}
                        className="py-1.5 px-2 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white text-[10px] font-bold uppercase rounded-lg border border-sky-500/20 transition-all cursor-pointer"
                      >
                        Marcar Enviado
                      </button>

                      <button
                        onClick={() => handleChangeOrderStatus(order.id, order.paymentStatus, 'delivered')}
                        disabled={order.deliveryStatus === 'delivered'}
                        className="py-1.5 px-2 bg-sky-600/10 hover:bg-sky-600 text-sky-400 hover:text-white text-[10px] font-bold uppercase rounded-lg border border-sky-500/20 transition-all cursor-pointer"
                      >
                        Entregue
                      </button>

                      <button
                        onClick={() => handleChangeOrderStatus(order.id, 'cancelled', order.deliveryStatus)}
                        disabled={order.paymentStatus === 'cancelled'}
                        className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-[10px] font-bold uppercase rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Banners Admin */}
      {activeTab === 'banners' && (
        <div id="admin-banners-tab" className="space-y-6">
          <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-5">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wide text-amber-400 mb-4 flex items-center gap-2">
              Adicionar Novo Banner Carrossel
            </h3>
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Título do Banner *</label>
                  <input
                    type="text"
                    required
                    value={bnTitle}
                    onChange={(e) => setBnTitle(e.target.value)}
                    placeholder="Ex: Oferta Especial do Mês"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Subtítulo (Opcional)</label>
                  <input
                    type="text"
                    value={bnSubtitle}
                    onChange={(e) => setBnSubtitle(e.target.value)}
                    placeholder="Ex: Agendas com 15% de desconto"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-450 uppercase tracking-widest block mb-1 font-bold">Imagem do Banner *</label>
                  <p className="text-[10px] text-slate-500 mb-2">Envie da sua galeria ou cole a URL:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-9">
                      <input
                        type="text"
                        required
                        value={bnImageUrl}
                        onChange={(e) => setBnImageUrl(e.target.value)}
                        placeholder="Carregue à direita ou cole a URL..."
                        className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl px-3 text-xs focus:outline-none"
                      />
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label className="flex items-center justify-center gap-1.5 h-10 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-sans rounded-xl cursor-pointer transition select-none">
                        <ImageIcon className="w-4 h-4" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setBnImageUrl(reader.result);
                                  setSuccessMsg('📸 Foto de Banner carregada!');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  
                  {bnImageUrl && (
                    <div className="mt-2.5 flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-850">
                      <img 
                        src={bnImageUrl} 
                        alt="Banner Preview" 
                        referrerPolicy="no-referrer"
                        className="w-16 h-8 object-cover rounded border border-slate-800"
                        onError={(e) => {
                          (e.target as any).src = '';
                        }}
                      />
                      <span className="text-[9px] text-slate-500 font-mono truncate flex-1 block">
                        {bnImageUrl.startsWith('data:') ? 'Arquivo físico carregado' : bnImageUrl}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-sans py-2 px-4 rounded-xl cursor-pointer"
                >
                  Salvar Banner
                </button>
              </div>
            </form>
          </div>

          <div>
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400 mb-3">Banners Carroséis Ativos</h4>
            <div className="space-y-3">
              {banners.map((b) => (
                <div key={b.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850 gap-4">
                  <div className="flex items-center gap-3">
                    <img src={b.imageUrl} alt={b.title} className="w-16 h-10 object-cover rounded-lg border border-slate-800" />
                    <div>
                      <h5 className="text-white text-sm font-bold font-sans">{b.title}</h5>
                      <p className="text-slate-400 text-xs font-sans">{b.subtitle || 'Sem subtítulo'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBannerClick(b.id)}
                    className="py-1.5 px-3 bg-rose-600/10 hover:bg-rose-600 text-rose-450 hover:text-white text-xs font-bold rounded-lg border border-rose-500/20 cursor-pointer flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Coupons Admin */}
      {activeTab === 'coupons' && (
        <div id="admin-coupons-tab" className="space-y-6">
          <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-5">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wide text-amber-400 mb-4">
              Gerar Novo Cupom de Desconto
            </h3>
            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Código do Cupom *</label>
                  <input
                    type="text"
                    required
                    value={cpCode}
                    onChange={(e) => setCpCode(e.target.value)}
                    placeholder="Ex: VOLTEI10, IDAMOR"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Tipo de Desconto</label>
                  <select
                    value={cpType}
                    onChange={(e) => setCpType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  >
                    <option value="percent">Percentual (%)</option>
                    <option value="fixed">Fixo em Dinheiro (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Valor do Desconto *</label>
                  <input
                    type="number"
                    required
                    value={cpVal}
                    onChange={(e) => setCpVal(e.target.value)}
                    placeholder="Ex: 10 ou 15.00"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Mínimo de Compra Requerido (R$)</label>
                  <input
                    type="number"
                    value={cpMin}
                    onChange={(e) => setCpMin(e.target.value)}
                    placeholder="Ex: 50.00"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-sans py-2 px-4 rounded-xl cursor-pointer"
                >
                  Criar Cupom
                </button>
              </div>
            </form>
          </div>

          <div>
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400 mb-3">Lista de Cupons de Desconto</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coupons.map((c) => (
                <div key={c.id} className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex justify-between items-center relative overflow-hidden">
                  <div>
                    <span className="text-sm font-mono font-black tracking-wider text-sky-400 bg-sky-950/50 px-2.5 py-1 rounded-md border border-sky-900/60">
                      {c.code}
                    </span>
                    <div className="text-xs text-slate-300 font-sans mt-3">
                      Ganho: <strong className="text-white">{c.discountValue}{c.discountType === 'percent' ? '%' : ' R$'}</strong> de desconto
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                      Compra mínima: R$ {c.minPurchase.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCouponClick(c.id)}
                    className="p-2 hover:bg-rose-600/10 text-rose-450 hover:text-rose-350 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Branding / Logomarca Configuration */}
      {activeTab === 'branding' && (
        <div id="admin-branding-tab" className="space-y-6">
          <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-5">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wide text-amber-400 mb-4 flex items-center gap-2">
              <Palette className="w-4.5 h-4.5 text-sky-450 animate-pulse" />
              Customizar Identidade Visual (Logomarca e Textos)
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem('id_shop_brand_name', brandName);
              localStorage.setItem('id_shop_sub_title', brandSlogan);
              localStorage.setItem('id_shop_brand_logo_url', brandLogoUrl);
              setSuccessMsg('Branding e Logomarca salvos com sucesso!');
              // Trigger a global custom event to update top level state automatically
              window.dispatchEvent(new Event('id_branding_updated'));
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Nome da Loja / Marca *</label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Ex: ID Estúdios & Papelaria"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Slogan ou Subtítulo *</label>
                  <input
                    type="text"
                    required
                    value={brandSlogan}
                    onChange={(e) => setBrandSlogan(e.target.value)}
                    placeholder="Ex: Papelaria, Harpas & Lembrancinhas"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-455 uppercase tracking-widest block mb-1 font-bold">Logomarca (Ícone / Logo da Loja)</label>
                  <p className="text-[10px] text-slate-505 mb-2">Faça o upload do seu logo diretamente ou informe a URL do logo:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-9">
                      <input
                        type="text"
                        value={brandLogoUrl}
                        onChange={(e) => setBrandLogoUrl(e.target.value)}
                        placeholder="Carregue seu logo à direita ou cole a URL de imagem aqui..."
                        className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl px-3 text-xs focus:outline-none"
                      />
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label className="flex items-center justify-center gap-1.5 h-10 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-sans rounded-xl cursor-pointer transition select-none">
                        <ImageIcon className="w-4 h-4" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setBrandLogoUrl(reader.result);
                                  setSuccessMsg('✨ Logo da marca carregado com sucesso!');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Deixe em branco para usar o logo estilizado padrão "ID" ou faça upload de um arquivo para estampar seu próprio selo comercial.
                  </p>
                </div>
              </div>

              {/* Live Preview block */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-sans tracking-wider block mb-2">Live Preview do Header</span>
                <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-900">
                  {brandLogoUrl ? (
                    <img 
                      src={brandLogoUrl} 
                      alt="Logo preview" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1627556592933-ffe99c1cd9eb?w=200&auto=format&fit=crop&q=80';
                      }} 
                      className="w-10 h-10 object-contain rounded-lg border border-slate-800"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center font-sans font-black text-white text-xl">
                      ID
                    </div>
                  )}
                  <div>
                    <h1 className="text-sm font-sans font-black tracking-tight uppercase text-sky-400">
                      {brandName}
                    </h1>
                    <span className="text-[9px] text-slate-500 font-medium tracking-widest uppercase block">
                      {brandSlogan}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-sans py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/20 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  Salvar Configurações de Identidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Background Music Playlist Config */}
      {activeTab === 'music' && (
        <div id="admin-music-tab" className="space-y-6">
          <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-5">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wide text-amber-400 mb-4 flex items-center gap-2">
              <Music className="w-4.5 h-4.5 text-sky-450 animate-bounce" />
              Adicionar Louvor / Canção Personalizada
            </h3>
            
            <form onSubmit={handleSaveSong} className="space-y-4 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Título / Nome da Canção *</label>
                  <input
                    type="text"
                    required
                    value={songNameInput}
                    onChange={(e) => setSongNameInput(e.target.value)}
                    placeholder="Ex: Minha Melodia de Adoração Favorita"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Autor / Compositor (Opcional)</label>
                  <input
                    type="text"
                    value={songAuthorInput}
                    onChange={(e) => setSongAuthorInput(e.target.value)}
                    placeholder="Ex: Teclado Instrumental"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 border-t border-slate-850 pt-3 mt-1">
                  <label className="text-[10px] text-slate-455 uppercase tracking-widest block mb-1 font-bold">Arquivo de Áudio do Aparelho ou Link (.mp3) *</label>
                  <p className="text-[10px] text-slate-505 mb-2">Selecione uma música do seu dispositivo ou insira o link direto:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-9">
                      <input
                        type="text"
                        required
                        value={songUrlInput}
                        onChange={(e) => setSongUrlInput(e.target.value)}
                        placeholder="Carregue seu MP3 à direita ou insira link de áudio aqui..."
                        className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-sky-500 text-white rounded-xl px-3 text-xs focus:outline-none"
                      />
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label className="flex items-center justify-center gap-1.5 h-10 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-sans rounded-xl cursor-pointer transition select-none active:scale-[0.98]">
                        <Music className="w-4 h-4" />
                        <span>Selecionar MP3</span>
                        <input
                          type="file"
                          accept="audio/mp3, audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 8 * 1024 * 1024) {
                                setSuccessMsg('⚠️ Aviso: Áudio grande. Pode demorar mais para carregar!');
                                setTimeout(() => setSuccessMsg(null), 4000);
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setSongUrlInput(reader.result);
                                  // Autocomplete title using filename if empty
                                  setSongNameInput(prev => prev || file.name.replace(/\.[^/.]+$/, ""));
                                  setSuccessMsg('🎵 Canção carregada com sucesso do dispositivo!');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    💡 Dica: Ao selecionar um arquivo local, ele será embutido em formato web otimizado para que qualquer cliente escute na sua vitrine.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-sans py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-950/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Inserir Música na Playlist
                </button>
              </div>
            </form>
          </div>

          <div>
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400 mb-3">Músicas Disponíveis para os Clientes</h4>
            
            <div className="space-y-3 font-sans">
              {songs.map((s, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-950/50 flex items-center justify-center text-sky-450 border border-sky-900/45">
                      <Music className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h5 className="text-white text-xs font-bold font-sans">{s.name}</h5>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[280px] sm:max-w-md font-mono mt-0.5">
                        {s.author} • {s.url}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleDeleteSong(idx)}
                    className="py-1.5 px-3 bg-rose-600/10 hover:bg-rose-600 text-rose-450 hover:text-white text-[11px] font-sans font-bold rounded-lg border border-rose-500/15 cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
