import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  User as UserIcon, 
  MapPin, 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Star, 
  Sparkles, 
  FileLock2, 
  Lock, 
  Coins, 
  Info, 
  ClipboardCheck, 
  LogOut, 
  History, 
  Plus, 
  Minus, 
  BadgePercent, 
  ArrowRight,
  Package,
  Sliders,
  CheckCircle2,
  Calendar,
  Gift,
  BookOpen
} from 'lucide-react';

import { Product, CartItem, Order, PromoBanner, Coupon, OrderItem } from './types';
import { 
  isRealFirebase, 
  subscribeAuth, 
  registerUser, 
  loginUser, 
  logoutUser, 
  updateProfile, 
  recoverPassword, 
  fetchProducts, 
  fetchBanners, 
  fetchCoupons, 
  createOrder, 
  fetchOrders, 
  generatePixCopyAndPaste,
  UserProfile
} from './firebase';

import FloatingWhatsApp from './components/FloatingWhatsApp';
import PixPayment from './components/PixPayment';
import SplashScreen from './components/SplashScreen';
import AdminPanel from './components/AdminPanel';
import ProductDetails from './components/ProductDetails';
import BackgroundMusic from './components/BackgroundMusic';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Dynamic branding state
  const [storeBrandName, setStoreBrandName] = useState(() => localStorage.getItem('id_shop_brand_name') || 'Personalizados Shop');
  const [storeBrandSlogan, setStoreBrandSlogan] = useState(() => localStorage.getItem('id_shop_sub_title') || 'Papelaria & Estúdio');
  const [storeBrandLogoUrl, setStoreBrandLogoUrl] = useState(() => localStorage.getItem('id_shop_brand_logo_url') || '');

  // Navigation / Views
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'admin'>('home');
  
  // Catalog / Interactive logic
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom interactive banner slider index
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Cart & Orders State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [orderInProgress, setOrderInProgress] = useState<Order | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Checkout Form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  
  // Auth state modals/inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // App general alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Read auth and content
  useEffect(() => {
    const unsub = subscribeAuth((savedUser) => {
      setUser(savedUser);
      if (savedUser) {
        setCustName(savedUser.displayName);
        setCustPhone(savedUser.phone || '');
        setCustAddress(savedUser.address || '');
      }
    });

    const loadContent = async () => {
      try {
        const [prodList, bannerList, couponList] = await Promise.all([
          fetchProducts(),
          fetchBanners(),
          fetchCoupons()
        ]);
        setProducts(prodList);
        setFilteredProducts(prodList);
        setBanners(bannerList.filter(b => b.active));
        setCoupons(couponList.filter(c => c.active));
      } catch (err) {
        console.error(err);
      }
    };

    loadContent();
    return () => unsub();
  }, []);

  // Listen to visual custom logo and brand changes from Admin tab
  useEffect(() => {
    const handleBrandingChange = () => {
      setStoreBrandName(localStorage.getItem('id_shop_brand_name') || 'Personalizados Shop');
      setStoreBrandSlogan(localStorage.getItem('id_shop_sub_title') || 'Papelaria & Estúdio');
      setStoreBrandLogoUrl(localStorage.getItem('id_shop_brand_logo_url') || '');
    };
    window.addEventListener('id_branding_updated', handleBrandingChange);
    return () => {
      window.removeEventListener('id_branding_updated', handleBrandingChange);
    };
  }, []);

  // Filter Catalog
  useEffect(() => {
    let list = [...products];
    if (categoryFilter !== 'Todos') {
      list = list.filter(p => p.category === categoryFilter);
    }
    if (searchQuery.trim() !== '') {
      list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setFilteredProducts(list);
  }, [categoryFilter, searchQuery, products]);

  // Automatic banner transition
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  // Toast automations
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Quick direct access to the admin system (Preços, Imagens, Estoque)
  const handleAutoAdminLogin = async () => {
    try {
      const admin = await loginUser('izidomingos12@gmail.com', '123456');
      setUser(admin);
      setSelectedProduct(null);
      setActiveTab('admin');
      triggerToast('🛡️ Painel Admin Ativado! Altere imagens e insira os preços.');
    } catch (err) {
      console.error(err);
      setSelectedProduct(null);
      setActiveTab('profile');
      triggerToast('❌ Erro no login automático. Efetue o login manualmente.');
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number, notes?: string, customName?: string) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id && item.customName === customName);
    if (existingIndex !== -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity, notes, customName }]);
    }
    setSelectedProduct(null);
    triggerToast(`🛒 ${product.name} adicionado ao carrinho!`);
  };

  const handleUpdateCartQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    }
    setCart(updated);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const price = item.product.promoPrice || item.product.price;
      return sum + (price * item.quantity);
    }, 0);
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const sub = calculateSubtotal();
    if (appliedCoupon.discountType === 'percent') {
      return (sub * appliedCoupon.discountValue) / 100;
    } else {
      return Math.min(sub, appliedCoupon.discountValue);
    }
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - calculateDiscount());
  };

  const handleApplyCoupon = () => {
    const code = couponCodeInput.trim().toUpperCase();
    const found = coupons.find(c => c.code === code);
    if (!found) {
      triggerToast('❌ Cupom inválido ou expirado.');
      return;
    }
    const sub = calculateSubtotal();
    if (sub < found.minPurchase) {
      triggerToast(`⚠️ Compra mínima para este cupom é R$ ${found.minPurchase.toFixed(2)}`);
      return;
    }
    setAppliedCoupon(found);
    triggerToast(`🎉 Cupom ${found.code} aplicado com sucesso!`);
  };

  // Favorites trigger
  const handleToggleFavorite = (id: string, name: string) => {
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(f => f !== id);
      triggerToast(`🤍 Removido dos favoritos: ${name}`);
    } else {
      updated = [...favorites, id];
      triggerToast(`💖 Favoritado: ${name}`);
    }
    setFavorites(updated);
  };

  // Submission Checkout
  const handleSubmissionCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone || !custAddress) {
      alert('Favor preencher todos os dados para entrega!');
      return;
    }

    if (!user) {
      setActiveTab('profile');
      setShowCheckout(false);
      setShowCart(false);
      alert('Por favor, efetue seu login ou cadastro para finalizar a encomenda de personalizados!');
      return;
    }

    try {
      const orderItems: OrderItem[] = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.promoPrice || item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl,
        category: item.product.category,
        notes: item.notes,
        customName: item.customName
      }));

      const sub = calculateSubtotal();
      const disc = calculateDiscount();
      const finalVal = calculateTotal();

      const newOrder = await createOrder(
        custName,
        custPhone,
        custAddress,
        orderItems,
        sub,
        disc,
        finalVal,
        appliedCoupon?.code
      );

      // Successfully saved
      setOrderInProgress(newOrder);
      setCart([]);
      setAppliedCoupon(null);
      setCouponCodeInput('');
      setShowCheckout(false);
      setShowCart(false);
      
      triggerToast('🎉 Pedido gerado com sucesso! Efetue o Pix.');
    } catch (err) {
      alert('Não foi possível gerar seu pedido de personalizados.');
    }
  };

  // Interactive local auth handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!authEmail || !authPass) return;

    try {
      if (isRegistering) {
        if (!authName) {
          setAuthError('Por favor digite seu nome.');
          return;
        }
        await registerUser(authEmail, authPass, authName);
        setAuthSuccess('Cadastro realizado e logado com sucesso!');
      } else {
        await loginUser(authEmail, authPass);
        setAuthSuccess('Bem vindo ao ID Personalizados Shop!');
      }
      setAuthEmail('');
      setAuthPass('');
      setAuthName('');
    } catch (err: any) {
      setAuthError(err.message || 'Erro de autenticação.');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!authEmail) return;

    try {
      const msg = await recoverPassword(authEmail);
      setAuthSuccess(msg);
      setAuthEmail('');
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div id="full-app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-sky-500/30 selection:text-white">
      {/* Visual background flares */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-sky-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[300px] h-[300px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating alert Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 hover:bg-slate-900 border border-sky-500/30 text-xs text-white font-bold px-4 py-3 rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.4)] backdrop-blur-md flex items-center gap-2 select-none"
          >
            <Sparkles className="w-4 h-4 text-sky-450 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Header of the Store */}
      <header id="store-main-header" className="sticky top-0 z-40 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo & Sub */}
          <div 
            onClick={() => { setSelectedProduct(null); setActiveTab('home'); }}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            {storeBrandLogoUrl ? (
              <img 
                src={storeBrandLogoUrl} 
                alt="Logomarca" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to default block on image load failure
                  (e.target as any).style.display = 'none';
                }}
                className="w-10 h-10 object-contain bg-slate-800/40 rounded-lg shadow-md border border-slate-700/50 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20 font-sans font-black text-white text-xl group-hover:scale-105 transition-transform">
                ID
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-sans font-black tracking-tight uppercase text-sky-450 group-hover:text-sky-300 transition-colors">
                {storeBrandName}
              </h1>
              <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase block -mt-0.5">{storeBrandSlogan}</span>
            </div>
          </div>

          {/* Search bar inside header */}
          {activeTab === 'home' && !selectedProduct && (
            <div className="w-full md:max-w-md relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar agendas, comemorativos, harpas..."
                className="w-full bg-slate-800/80 border border-slate-700 hover:border-slate-650 focus:border-sky-500 text-xs rounded-full py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition-all placeholder:text-slate-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-[50%] -translate-y-1/2 p-0.5 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Main Action buttons row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedProduct(null); setActiveTab('home'); }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold font-sans transition pointer-events-auto cursor-pointer ${activeTab === 'home' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Vitrine
            </button>

            {/* General Administrative Control Panel Direct Access – Sandbox Quick Access */}
            <button
              onClick={handleAutoAdminLogin}
              className={`py-2.5 px-4 rounded-xl text-xs font-black font-sans transition pointer-events-auto cursor-pointer flex items-center gap-1.5 ${activeTab === 'admin' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 border-amber-400' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold'}`}
              title="Acesso completo ao Painel Administrativo para programar preços e imagens"
              id="header-admin-panel-btn"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Painel Admin</span>
            </button>
            
            <button
              onClick={() => { setSelectedProduct(null); setActiveTab('profile'); }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold font-sans transition pointer-events-auto cursor-pointer flex items-center gap-1.5 ${activeTab === 'profile' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <UserIcon className="w-4 h-4" />
              {user ? (user.isAdmin ? 'Admin' : 'Meu Perfil') : 'Minha Conta'}
            </button>

            {/* Shopping Cart Trigger icon */}
            <button
              onClick={() => setShowCart(true)}
              className="p-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl border border-slate-800 transition relative cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4.5 h-4.5 text-sky-400" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-sans text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-slate-950 animate-pulse">
                  {cart.reduce((s, b) => s + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Core */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 font-sans">
        
        {/* PIX MODAL IN PROGRESS OVERLAY */}
        {orderInProgress && (
          <div className="mb-8 p-1">
            <div className="max-w-md mx-auto relative bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl">
              <button 
                onClick={() => setOrderInProgress(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white focus:outline-none p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <PixPayment
                order={orderInProgress}
                onPaymentConfirmed={() => {
                  setOrderInProgress(null);
                  triggerToast('👍 Seu pedido foi notificado ao administrador para aprovação!');
                  setActiveTab('profile');
                }}
                onBackToOrders={() => {
                  setOrderInProgress(null);
                  setActiveTab('profile');
                }}
              />
            </div>
          </div>
        )}

        {/* Dynamic tabs controller */}

        {/* View 1: Home Showcase / Shop */}
        {activeTab === 'home' && !selectedProduct && (
          <div id="home-view-container" className="space-y-8">
            
            {/* Promo Carousel Banner */}
            {banners.length > 0 && (
              <div className="relative h-[180px] sm:h-[300px] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-gradient-to-r from-sky-950 to-slate-950">
                {/* Current banner picture */}
                <div className="absolute inset-0">
                  <img
                    src={banners[currentBannerIndex].imageUrl}
                    alt={banners[currentBannerIndex].title}
                    className="w-full h-full object-cover brightness-[0.35]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
                </div>
                {/* Title & subtitle copy */}
                <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10 space-y-3 z-10">
                  <span className="bg-sky-400/20 text-sky-300 text-[10px] font-bold px-2.5 py-1 rounded inline-block uppercase tracking-wider border border-sky-400/30 self-start">
                    Novidade Especial
                  </span>
                  <h2 className="text-xl sm:text-3xl font-sans font-black text-white leading-tight max-w-xl">
                    {banners[currentBannerIndex].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                    {banners[currentBannerIndex].subtitle}
                  </p>
                  
                  {/* Call WhatsApp offer widget */}
                  <a
                    href="https://wa.me/5595981190869?text=Ol%C3%A1%2C%20gostaria%20de%20fazer%20um%20pedido%20na%20ID%20PERSONALIZADOS."
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 py-2.5 px-5 bg-sky-650 hover:bg-sky-600 active:scale-95 text-white font-bold font-sans text-xs rounded-xl self-start flex items-center gap-1.5 shadow-lg shadow-sky-950/40 transition-all border border-sky-500/20"
                  >
                    Fazer Encomenda Sob Medida
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Left/Right manual triggers */}
                {banners.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentBannerIndex(prev => (prev - 1 + banners.length) % banners.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-slate-950/40 hover:bg-slate-950 text-white border border-slate-800/20 rounded-full cursor-pointer focus:outline-none transition active:scale-90 z-20"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentBannerIndex(prev => (prev + 1) % banners.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-950/40 hover:bg-slate-950 text-white border border-slate-800/20 rounded-full cursor-pointer focus:outline-none transition active:scale-90 z-20"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Category horizontal badges bar filter */}
            <div className="space-y-3">
              <h3 className="text-xs font-sans font-extrabold uppercase tracking-widest text-slate-500">Filtrar por Categoria</h3>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {['Todos', 'Agenda', 'Harpa Cristã', 'Lembrancinhas', 'Outros'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`py-2.5 px-5 rounded-full text-xs font-sans font-bold border transition whitespace-nowrap cursor-pointer select-none active:scale-95 ${categoryFilter === cat ? 'bg-sky-500 text-white border-sky-500/10 shadow-[0_4px_16px_rgba(14,165,233,0.3)]' : 'bg-slate-950 text-slate-400 hover:text-white border-slate-900 hover:border-slate-800'}`}
                  >
                    {cat === 'Todos' && '🛍️ Todos os Produtos'}
                    {cat === 'Agenda' && '📅 Agendas & Planners'}
                    {cat === 'Harpa Cristã' && '🎵 Harpas Cristãs'}
                    {cat === 'Lembrancinhas' && '🎁 Lembrancinhas e Brindes'}
                    {cat === 'Outros' && '✏️ Papelaria e Acessórios'}
                  </button>
                ))}
              </div>
            </div>

            {/* Core Products Grid list */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-sans font-extrabold text-white tracking-tight">
                  {categoryFilter === 'Todos' ? '🛒 Todos os Produtos Ativos' : `✨ ${categoryFilter} de Qualidade`}
                </h2>
                <span className="text-[11px] font-bold font-mono text-slate-500 uppercase">
                  {filteredProducts.length} itens encontrados
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-slate-950 p-12 rounded-3xl border border-slate-900 border-dashed text-center text-xs text-slate-400 font-sans italic">
                  Nenhum produto correspondente disponível nesta categoria.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((p) => (
                    <div 
                      key={p.id}
                      className="bg-slate-900 border border-slate-800/80 hover:border-sky-500/50 rounded-3xl overflow-hidden relative group transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Photo Header */}
                      <div className="h-48 w-full overflow-hidden relative border-b border-slate-800">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 bg-slate-950/90 text-sky-400 border border-slate-800/80 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase font-sans tracking-wide">
                          {p.category}
                        </div>
                        
                        {/* Favorites button */}
                        <button
                          onClick={() => handleToggleFavorite(p.id, p.name)}
                          className="absolute top-3 right-3 p-2 bg-slate-950/90 hover:bg-slate-900 text-slate-400 hover:text-rose-500 rounded-full border border-slate-800 transition active:scale-90 cursor-pointer"
                        >
                          <Heart className={`w-4 h-4 ${favorites.includes(p.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        {/* Stock alert */}
                        {p.stock === 0 ? (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-xs font-sans font-bold text-red-400 uppercase tracking-widest">
                            Temporariamente Esgotado
                          </div>
                        ) : p.stock <= 5 ? (
                          <div className="absolute bottom-3 right-3 bg-rose-600 text-white font-sans text-[9px] font-black py-0.5 px-2 rounded-full uppercase">
                            Apenas {p.stock} un!
                          </div>
                        ) : null}
                      </div>

                      {/* Info and action */}
                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 
                            onClick={() => setSelectedProduct(p)}
                            className="text-white text-base font-sans font-black leading-snug cursor-pointer hover:text-sky-400 transition-colors line-clamp-1"
                          >
                            {p.name}
                          </h3>

                          {/* Stars */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="flex text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${i < Math.floor(p.rating) ? 'fill-current' : 'text-slate-800'}`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold font-mono">(R{p.reviewsCount})</span>
                          </div>

                          <p className="text-slate-400 text-xs font-sans leading-relaxed mt-2 line-clamp-2">
                            {p.description}
                          </p>
                        </div>

                        {/* Pricing details & button */}
                        <div className="space-y-3 pt-3 border-t border-slate-800/60">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Valor Unitário</span>
                            <div className="flex items-baseline gap-2">
                              {p.promoPrice ? (
                                <>
                                  <span className="text-sky-400 font-sans font-black text-sm">R$ {p.promoPrice.toFixed(2)}</span>
                                  <span className="text-slate-500 font-sans text-xs line-through">R$ {p.price.toFixed(2)}</span>
                                </>
                              ) : (
                                <span className="text-sky-400 font-sans font-black text-sm">R$ {p.price.toFixed(2)}</span>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => setSelectedProduct(p)}
                            className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-xs text-slate-300 hover:text-white font-sans font-bold rounded-xl transition flex justify-center items-center gap-1 cursor-pointer active:scale-95"
                          >
                            <span>Ver Detalhes & Personalizar</span>
                            <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom info panel highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-900">
              <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Pix com Desconto</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ganhe até 10% de abatimento usando o cupom correto no checkout do Pix!</p>
                </div>
              </div>

              <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">100% Personalizado</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">As agendas e harpas são feitas sob medida com o seu nome gravado em altíssima resolução!</p>
                </div>
              </div>

              <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2.5 bg-pink-500/10 text-pink-500 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Envio para todo Brasil</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Embalamos tudo com cuidado especial e cheirinho personalizado na caixa.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* View 2: Product Detailed Page Selection */}
        {selectedProduct && (
          <ProductDetails
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* View 3: Customer profile and order history portal */}
        {activeTab === 'profile' && (
          <div id="profile-container" className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-900">
              <div>
                <h2 className="text-xl sm:text-2xl font-sans font-black text-white tracking-tight">Sua Conta ID Shop</h2>
                <p className="text-xs text-slate-400">Gerencie seus pedidos, configurações e veja suas encomendas.</p>
              </div>

              {user && (
                <button
                  onClick={async () => {
                    await logoutUser();
                    triggerToast('👋 Sessão finalizada com sucesso!');
                  }}
                  className="py-1.5 px-3 bg-rose-600/15 hover:bg-rose-600 active:scale-95 text-rose-400 hover:text-white text-xs font-sans font-bold rounded-lg border border-rose-500/10 cursor-pointer flex items-center gap-1 transition"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              )}
            </div>

            {/* Authenticated user screen */}
            {user ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Profile card left pane */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 text-center">
                    <div className="w-16 h-16 bg-sky-600 text-white font-sans font-black border border-slate-800 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-md">
                      {user.displayName.substring(0,2).toUpperCase()}
                    </div>
                    <h3 className="text-white font-bold text-md tracking-tight mt-3">{user.displayName}</h3>
                    <p className="text-slate-500 text-xs font-mono">{user.email}</p>
                    
                    {user.isAdmin && (
                      <div className="inline-block mt-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider">
                        🛡️ Administrador do Sistema
                      </div>
                    )}
                  </div>

                  {/* Settings form */}
                  <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-300">Dados do Destinatário</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block mb-1">Telefone WhatsApp</label>
                        <input
                          type="text"
                          value={custPhone}
                          onChange={(e) => {
                            setCustPhone(e.target.value);
                            updateProfile(user.uid, { phone: e.target.value });
                          }}
                          placeholder="(95) 98119-0869"
                          className="w-full bg-slate-950 border border-slate-900 text-amber-400 rounded-lg py-1.5 px-3 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block mb-1">Endereço Completo de Entrega</label>
                        <textarea
                          rows={2}
                          value={custAddress}
                          onChange={(e) => {
                            setCustAddress(e.target.value);
                            updateProfile(user.uid, { address: e.target.value });
                          }}
                          placeholder="Rua, Número, Bairro, CEP, Cidade/UF..."
                          className="w-full bg-slate-950 border border-slate-900 text-amber-400 rounded-lg py-1.5 px-3 text-xs focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Super admin switcher button */}
                  {user.isAdmin && activeTab !== 'admin' && (
                    <button
                      onClick={() => setActiveTab('admin')}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black font-sans text-xs rounded-2xl flex items-center justify-center gap-1 cursor-pointer transition shadow-[0_4px_16px_rgba(217,119,6,0.3)]"
                    >
                      <Sliders className="w-4 h-4" /> Abrir Painel Administrativo
                    </button>
                  )}
                </div>

                {/* Orders list history right pane */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <History className="w-5 h-5 text-sky-400" />
                    <h3 className="text-white font-black text-md tracking-tight">Seu Histórico de Encomendas</h3>
                  </div>

                  <ActiveOrdersList user={user} onSelectOrder={(order) => setOrderInProgress(order)} />
                </div>

              </div>
            ) : (
              /* Non authenticated view signup/login forms */
              <div className="max-w-md mx-auto bg-slate-900/40 border border-slate-850 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 bg-sky-500/10 rounded-2xl text-sky-400 mb-2.5">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-sans font-black text-white">
                    {isForgotPassword ? 'Recuperação de Senha' : isRegistering ? 'Crie Sua Conta Grátis' : 'Identifique-se para Continuar'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isForgotPassword ? 'Insira seu e-mail para recuperar as instruções.' : 'Fique por dentro das atualizações e acompanhe seus pedidos Pix.'}
                  </p>
                </div>

                {authError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-3 rounded-xl text-xs mb-4 text-center">
                    {authError}
                  </div>
                )}
                
                {authSuccess && (
                  <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-450 p-3 rounded-xl text-xs mb-4 text-center font-medium">
                    {authSuccess}
                  </div>
                )}

                {isForgotPassword ? (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Seu E-mail Cadastrado *</label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="Ex: joao@gmail.com"
                        className="w-full bg-slate-950 border border-slate-900 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-sans font-bold text-xs rounded-xl cursor-pointer shadow transition"
                    >
                      Enviar Link de Recuperação
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(false); setAuthError(null); setAuthSuccess(null); }}
                      className="w-full text-[11px] text-slate-400 hover:text-white mt-2 block focus:outline-none text-center"
                    >
                      Voltar ao Login
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {isRegistering && (
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Seu Nome Completo *</label>
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Ex: Maria Alice Ramos de Souza"
                          className="w-full bg-slate-950 border border-slate-900 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">E-mail de Acesso *</label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="Ex: cliente@estudio.com"
                        className="w-full bg-slate-950 border border-slate-900 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest">Senha secreta *</label>
                        {!isRegistering && (
                          <button
                            type="button"
                            onClick={() => { setIsForgotPassword(true); setAuthError(null); setAuthSuccess(null); }}
                            className="text-[10.5px] text-sky-450 hover:text-sky-350 focus:outline-none cursor-pointer"
                          >
                            Esqueceu?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        required
                        value={authPass}
                        onChange={(e) => setAuthPass(e.target.value)}
                        placeholder="Mínimo 6 dígitos"
                        className="w-full bg-slate-950 border border-slate-900 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-sans font-bold text-xs rounded-xl cursor-pointer shadow transition"
                    >
                      {isRegistering ? 'Cadastrar e Entrar' : 'Efetuar Login Seguro'}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); setAuthSuccess(null); }}
                        className="text-xs text-slate-400 hover:text-white focus:outline-none cursor-pointer"
                      >
                        {isRegistering ? 'Já tem conta? Faça Login' : 'Não tem conta? Cadastre-se aqui'}
                      </button>
                    </div>

                    {/* Protip */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900/60 text-[10.5px] text-slate-400 font-sans leading-relaxed text-center mt-4">
                      💡 <strong>Dica de teste admin:</strong> Entre com o e-mail <code>izidomingos12@gmail.com</code> e a senha <code>123456</code> para testar as superferramentas!
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* View 4: Complete Admin Suite with panels toggle */}
        {activeTab === 'admin' && user?.isAdmin && (
          <div className="max-w-5xl mx-auto">
            <AdminPanel onClose={() => setActiveTab('profile')} />
          </div>
        )}

      </main>

      {/* FOOTER STATS INFO */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500 font-sans">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4.5 h-4.5 text-blue-400" />
            <span>© 2026 ID PERSONALIZADOS SHOP • Papelaria sob Medida</span>
          </div>
          <div className="flex gap-4">
            <span>Pix Key: 9598119-0869</span>
            <span>Estúdio Autorizado</span>
          </div>
        </div>
      </footer>

      {/* Floating active cart sidebar dialog drawer */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-50 overflow-hidden select-none">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!showCheckout) setShowCart(false); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            {/* Drawer sheet body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-black text-md tracking-tight font-sans">Seu Carrinho de Compras</h3>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  disabled={showCheckout}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white focus:outline-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Middle content scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                
                {showCheckout ? (
                  /* Form Delivery address inside cart view drawer */
                  <form onSubmit={handleSubmissionCheckout} className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs text-amber-400 font-extrabold uppercase font-sans tracking-wider">Endereço & Entrega</span>
                      <button
                        type="button"
                        onClick={() => setShowCheckout(false)}
                        className="text-xs text-slate-500 hover:text-white font-sans font-bold"
                      >
                        ← Voltar ao carrinho
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Nome Completo do Destinatário *</label>
                      <input
                        type="text"
                        required
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="Ex: Maria Alice Ramos"
                        className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">WhatsApp para Contato *</label>
                      <input
                        type="text"
                        required
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="Ex: (95) 98119-0869"
                        className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Endereço Completo de Destino *</label>
                      <textarea
                        rows={3}
                        required
                        value={custAddress}
                        onChange={(e) => setCustAddress(e.target.value)}
                        placeholder="Rua, Número, Complemento, Bairro, CEP, Cidade/UF..."
                        className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 text-white rounded-xl py-2 px-3 text-xs focus:outline-none resize-none"
                      />
                    </div>

                    {/* Summary lists items before submission */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs font-sans text-slate-400">
                      <strong>Itens no Pedido:</strong> {cart.reduce((ct, item) => ct + item.quantity, 0)} unidades de personalizados.
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-lg shadow-sky-950/40 transition-all cursor-pointer"
                    >
                      Finalizar Pedido e Ver QR Code Pix
                    </button>
                  </form>
                ) : (
                  /* Standard item list view */
                  <>
                    {cart.length === 0 ? (
                      <div className="text-center py-20 text-slate-500 font-sans text-xs italic">
                        Seu carrinho está vazio. Adicione lindos personalizados da nossa vitrine!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item, idx) => (
                          <div 
                            key={idx}
                            className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl flex justify-between items-center relative overflow-hidden group"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-12 h-12 rounded-lg object-cover border border-slate-950"
                              />
                              <div>
                                <h4 className="text-white text-xs font-bold font-sans line-clamp-1">{item.product.name}</h4>
                                {item.customName && (
                                  <span className="text-[10px] text-amber-400 font-bold block">
                                    Capa: {item.customName}
                                  </span>
                                )}
                                {item.notes && (
                                  <span className="text-[10px] text-slate-500 block leading-tight">
                                    Obs: {item.notes}
                                  </span>
                                )}
                                <span className="text-[10.5px] text-slate-400 font-mono block mt-0.5">
                                  R$ {((item.product.promoPrice || item.product.price)).toFixed(2)} un
                                </span>
                              </div>
                            </div>

                            {/* Quantity controllers */}
                            <div className="flex bg-slate-900 border border-slate-800 rounded-lg items-center overflow-hidden">
                              <button
                                onClick={() => handleUpdateCartQuantity(idx, -1)}
                                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 font-mono text-xs font-bold text-white">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateCartQuantity(idx, 1)}
                                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

              </div>

              {/* Drawer Footer summary pricing calculation */}
              {!showCheckout && cart.length > 0 && (
                <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-4">
                  
                  {/* Coupon section widget */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      placeholder="CUPOM DE DESCONTO"
                      className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs focus:outline-none placeholder:text-slate-500 uppercase font-mono font-bold"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-sans rounded-xl cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs font-sans text-slate-400">
                    <div className="flex justify-between">
                      <span>Valor dos Itens:</span>
                      <span className="font-mono text-white">R$ {calculateSubtotal().toFixed(2)}</span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Cupom aplicado ({appliedCoupon.code}):</span>
                        <span className="font-mono">- R$ {calculateDiscount().toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-white font-extrabold text-sm border-t border-slate-900 pt-2">
                      <span>Total Geral:</span>
                      <span className="font-mono text-sky-400">R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions to final proceed */}
                  <button
                    onClick={() => {
                      if (!user) {
                        setShowCart(false);
                        setActiveTab('profile');
                        triggerToast('👤 Entre com sua conta ou crie uma grátis primeiro!');
                      } else {
                        setShowCheckout(true);
                      }
                    }}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-sans rounded-xl shadow-lg shadow-sky-950/40 transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    Prosseguir para o Checkout
                    <ArrowRight className="w-4.5 h-4.5 text-sky-300" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent contact buttons floating */}
      <FloatingWhatsApp />
      
      {/* Elegant floating background ambient lofi & piano melody music control */}
      <BackgroundMusic />
    </div>
  );
}

// Sub Component Order History list tracker
interface ActiveOrdersListProps {
  user: UserProfile;
  onSelectOrder: (order: Order) => void;
}

function ActiveOrdersList({ user, onSelectOrder }: ActiveOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMyOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchOrders();
      setOrders(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyOrders();
  }, [user]);

  if (loading) {
    return <div className="text-slate-500 text-xs font-mono py-12 text-center">Carregando seus pedidos Pix...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-slate-900/10 border border-dashed border-slate-900 p-8 rounded-2xl text-center text-xs text-slate-500 font-sans italic">
        Nenhum pedido efetuado ainda. Vá até a vitrine e se encante com nossos artigos!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850 mb-3">
            <div>
              <span className="text-xs font-mono text-slate-400">Pedido: </span>
              <span className="text-xs font-black text-amber-400">{o.id}</span>
              <span className="text-[10px] text-slate-500 block font-mono">{new Date(o.createdAt).toLocaleString()}</span>
            </div>
            
            {/* Action details if pending code copy paste pix is requested */}
            {o.paymentStatus === 'pending' && (
              <button
                onClick={() => onSelectOrder(o)}
                className="py-1 px-2.5 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase rounded-lg shadow cursor-pointer transition select-none flex items-center gap-1"
              >
                <Coins className="w-3.5 h-3.5" /> Pagar no Pix
              </button>
            )}
          </div>

          {/* List items brief */}
          <div className="space-y-1.5 text-xs">
            {o.items.map((item, id) => (
              <div key={id} className="flex justify-between text-slate-300 font-sans">
                <span>{item.quantity}x {item.name} {item.customName && <span className="text-amber-400 block sm:inline">({item.customName})</span>}</span>
                <span className="font-mono text-slate-400">R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Summarized cost & badges status */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-850/60">
            <div className="text-xs font-sans text-slate-400">
              Valor Pago: <span className="text-sky-400 font-black">R$ {o.finalPrice.toFixed(2)}</span>
            </div>

            <div className="flex gap-1.5">
              <span className={`text-[9px] font-sans font-bold uppercase tracking-wider py-0.5 px-2 rounded-full ${o.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : o.paymentStatus === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                Pix: {o.paymentStatus === 'paid' ? 'Aprovado' : o.paymentStatus === 'cancelled' ? 'Cancelado' : 'Aguardando'}
              </span>
              <span className={`text-[9px] font-sans font-bold uppercase tracking-wider py-0.5 px-2 rounded-full ${o.deliveryStatus === 'delivered' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20' : o.deliveryStatus === 'shipped' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                Entrega: {o.deliveryStatus === 'delivered' ? 'Entregue' : o.deliveryStatus === 'shipped' ? 'Enviado' : 'Pendente'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
