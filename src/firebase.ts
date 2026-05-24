import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, orderBy, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { Product, Order, PromoBanner, Coupon, Review, OrderItem } from './types';

// Detect if we have real configured Firebase or placeholder
const isRealFirebase = firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'placeholder-api-key' && 
  !firebaseConfig.apiKey.includes('placeholder');

let app;
let db: any;
let auth: any;

if (isRealFirebase) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    
    // Validate connection is online
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Firebase is offline. Operating with offline features.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error("Failed to initialize Firebase", error);
  }
}

// Error telemetry handler as required by Skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- INITIAL LOCAL MOCK DATABASE ---
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_agenda_fe',
    name: 'Agenda Personalizada "Fé & Elegância"',
    description: 'Nossa campeã de vendas. Agenda diária premium com capa dura personalizada (com o seu nome), laminação brilhosa de alta resistência, miolo pautado decorativo em papel de 75g, bolso porta-documentos plástico e elástico acetinado bicolor combinando. Customize com seu nome na capa!',
    price: 59.90,
    promoPrice: 49.90,
    category: 'Agenda',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    stock: 25,
    featured: true,
    rating: 4.9,
    reviewsCount: 14,
    details: [
      { name: 'Páginas', value: '348 páginas decoradas' },
      { name: 'Tamanho', value: 'A5 (15 x 21 cm)' },
      { name: 'Capa', value: 'Capa Dura com Laminação Holográfica opcional' },
      { name: 'Acessórios', value: 'Acompanha pingente tassel coordenado' }
    ]
  },
  {
    id: 'prod_harpa_luxo',
    name: 'Harpa Cristã Luxo Pentecostal',
    description: 'Harpa Cristã completa com 640 hinos em tamanho de letra gigante para leitura agradável. Acabamento primoroso com capa dura revestida em poliuretano azul marinho metálico, frisos dourados em hot stamping brilhoso, fita de cetim marca-página integrada e costura reforçada de alfaiataria.',
    price: 79.90,
    promoPrice: 69.90,
    category: 'Harpa Cristã',
    imageUrl: 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=800&auto=format&fit=crop&q=80',
    stock: 12,
    featured: true,
    rating: 5.0,
    reviewsCount: 8,
    details: [
      { name: 'Hinos', value: 'Todos os 640 hinos tradicionais' },
      { name: 'Letras', value: 'Tamanho Gigante de alta legibilidade' },
      { name: 'Acabamento', value: 'Dourado Hot Stamping com cantoneiras de metal' },
      { name: 'Papel', value: 'Papel Bíblia Premium de alta opacidade' }
    ]
  },
  {
    id: 'prod_lembranca_chaveiro',
    name: 'Kit Lembrancinhas Chaveiro Acrílico (10 un)',
    description: 'Kit contendo 10 chaveiros de acrílico cristal de alta transparência com correntes e argolas robustas. Cada chaveiro é personalizado frente e verso com papel fotográfico gloss à prova d’água contendo o tema do seu evento (aniversário, batizado, casamento ou brinde corporativo).',
    price: 35.00,
    category: 'Lembrancinhas',
    imageUrl: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&auto=format&fit=crop&q=80',
    stock: 40,
    featured: true,
    rating: 4.8,
    reviewsCount: 19,
    details: [
      { name: 'Quantidade', value: 'Pacote fechado com 10 unidades' },
      { name: 'Personalização', value: 'Frente e verso com papel fotográfico gloss' },
      { name: 'Design', value: 'Infinitas opções de layouts sob encomenda' },
      { name: 'Medida', value: 'Acrílico 3x4cm com argola de 2cm' }
    ]
  },
  {
    id: 'prod_agenda_floral',
    name: 'Agenda Planner Espiral "Floral Delicato"',
    description: 'Um planner completo de organização elegante com padronagem floral sofisticada. Contempla calendário anual, controle mensal de hábitos, páginas pautadas semanais, espaço financeiro robusto por mês, cartela de adesivos funcionais inclusa e aba de divisórias coloridas.',
    price: 55.00,
    promoPrice: 45.00,
    category: 'Agenda',
    imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=80',
    stock: 18,
    featured: false,
    rating: 4.7,
    reviewsCount: 6,
    details: [
      { name: 'Dimensões', value: '17 x 24 cm' },
      { name: 'Encadernação', value: 'Espiral bronze de alta resistência' },
      { name: 'Gramatura', value: 'Papel Offset de 90g (grosso, não vaza tinta)' },
      { name: 'Brindes', value: 'Tag de mala floral combinada' }
    ]
  },
  {
    id: 'prod_harpa_bolso',
    name: 'Harpa Cristã Mini Couro Vintage',
    description: 'Versão compacta de bolso da Harpa Cristã, revestida de couro ecológico marrom vintage com fecho em botão magnético. Perfeita para carregar na bolsa para ensaios e cultos. Costura artesanal resistente e cantos arredondados de luxo.',
    price: 49.90,
    category: 'Harpa Cristã',
    imageUrl: 'https://images.unsplash.com/photo-1474932430478-367dbbf6832c?w=800&auto=format&fit=crop&q=80',
    stock: 15,
    featured: false,
    rating: 4.6,
    reviewsCount: 5,
    details: [
      { name: 'Formato', value: 'Bolso pocket (10 x 13 cm)' },
      { name: 'Acabamento', value: 'Couro costurado com botão magnético' },
      { name: 'Páginas', value: 'Hinário oficial sem corte de estrofes' }
    ]
  },
  {
    id: 'prod_lembranca_caderneta',
    name: 'Lembrancinhas Mini Caderneta Kraft (15 un)',
    description: 'Conjunto irresistível de 15 mini cadernetas confeccionadas em papel kraft ecológico com capas costuradas à mão. Ideais para brindes temáticos. Você pode personalizar o rótulo frontal com frases inspiradoras, fotos, datas ou monogramas.',
    price: 45.00,
    category: 'Lembrancinhas',
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
    stock: 50,
    featured: false,
    rating: 4.9,
    reviewsCount: 11,
    details: [
      { name: 'Quantidade', value: 'Pacote fechado com 15 unidades' },
      { name: 'Páginas', value: '30 folhas sem pauta em papel creme leve' },
      { name: 'Tamanho', value: '口袋 de bolsa (9 x 13 cm)' }
    ]
  }
];

const INITIAL_BANNERS: PromoBanner[] = [
  {
    id: 'banner_fe_lancamento',
    imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&auto=format&fit=crop&q=80',
    title: 'Coleção Agendas & Planners 2026',
    subtitle: 'Compre a sua agenda personalizada com seu nome gravado e tassel gratuito!',
    active: true
  },
  {
    id: 'banner_harpa_promo',
    imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=1200&auto=format&fit=crop&q=80',
    title: 'Harpas Cristãs sob medida',
    subtitle: 'Acabamentos luxuosos em couro e hot-stamping para elevar sua adoração.',
    active: true
  },
  {
    id: 'banner_ofertas',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80',
    title: 'Desconto de Frete em Lembrancinhas',
    subtitle: 'Ganhe 10% de desconto usando o cupom IDQUERIDA em pedidos acima de R$150.',
    active: true
  }
];

const INITIAL_COUPONS: Coupon[] = [
  { id: 'c1', code: 'IDPAPELARIA', discountType: 'percent', discountValue: 10, minPurchase: 50, active: true },
  { id: 'c2', code: 'PIX5', discountType: 'percent', discountValue: 5, minPurchase: 30, active: true },
  { id: 'c3', code: 'DESCONTO15', discountType: 'fixed', discountValue: 15, minPurchase: 100, active: true }
];

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    productId: 'prod_agenda_fe',
    userId: 'mock_u1',
    userName: 'Kátia Maria de Souza',
    rating: 5,
    comment: 'Maravilhosa! A capa com laminação brilhosa é lindíssima e o chaveiro tassel dá um charme especial. Chegou super rápido e embalado com cheirinho delicioso de canela. Com certeza farei novas compras!',
    createdAt: '2026-05-10T12:00:00Z'
  },
  {
    id: 'rev_2',
    productId: 'prod_agenda_fe',
    userId: 'mock_u2',
    userName: 'Reginaldo Silva',
    rating: 5,
    comment: 'Comprei para presentear minha esposa e ela amou. O miolo é super organizado e o acabamento da capa dura é muito durável. Excelente custo benefício.',
    createdAt: '2026-05-15T15:30:00Z'
  },
  {
    id: 'rev_3',
    productId: 'prod_harpa_luxo',
    userId: 'mock_u3',
    userName: 'Ester Oliveira',
    rating: 5,
    comment: 'Simplesmente deslumbrante. A letra gigante permite cantar sem forçar a vista e as folhas são macias de manusear. Um produto abençoado!',
    createdAt: '2026-05-18T09:15:00Z'
  }
];

// Load local databases or seed them
const getLocalProducts = (): Product[] => {
  const p = localStorage.getItem('id_shop_products');
  if (!p) {
    localStorage.setItem('id_shop_products', JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(p);
};

const saveLocalProducts = (products: Product[]) => {
  localStorage.setItem('id_shop_products', JSON.stringify(products));
};

const getLocalBanners = (): PromoBanner[] => {
  const b = localStorage.getItem('id_shop_banners');
  if (!b) {
    localStorage.setItem('id_shop_banners', JSON.stringify(INITIAL_BANNERS));
    return INITIAL_BANNERS;
  }
  return JSON.parse(b);
};

const saveLocalBanners = (banners: PromoBanner[]) => {
  localStorage.setItem('id_shop_banners', JSON.stringify(banners));
};

const getLocalCoupons = (): Coupon[] => {
  const c = localStorage.getItem('id_shop_coupons');
  if (!c) {
    localStorage.setItem('id_shop_coupons', JSON.stringify(INITIAL_COUPONS));
    return INITIAL_COUPONS;
  }
  return JSON.parse(c);
};

const saveLocalCoupons = (coupons: Coupon[]) => {
  localStorage.setItem('id_shop_coupons', JSON.stringify(coupons));
};

const getLocalReviews = (): Review[] => {
  const r = localStorage.getItem('id_shop_reviews');
  if (!r) {
    localStorage.setItem('id_shop_reviews', JSON.stringify(INITIAL_REVIEWS));
    return INITIAL_REVIEWS;
  }
  return JSON.parse(r);
};

const saveLocalReviews = (reviews: Review[]) => {
  localStorage.setItem('id_shop_reviews', JSON.stringify(reviews));
};

const getLocalOrders = (): Order[] => {
  const o = localStorage.getItem('id_shop_orders');
  if (!o) return [];
  return JSON.parse(o);
};

const saveLocalOrders = (orders: Order[]) => {
  localStorage.setItem('id_shop_orders', JSON.stringify(orders));
};

// Seed initial on first load
getLocalProducts();
getLocalBanners();
getLocalCoupons();
getLocalReviews();

// Export auth check and basic references
export { isRealFirebase, db, auth };

// --- USER MANAGEMENT / AUTHENTICATION ---
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  phone?: string;
  address?: string;
}

// Global Subscriber list
type AuthCallback = (user: UserProfile | null) => void;
const authListeners = new Set<AuthCallback>();

let currentUser: UserProfile | null = (() => {
  const saved = localStorage.getItem('id_shop_user_session');
  if (saved) {
    return JSON.parse(saved);
  }
  return null;
})();

export function subscribeAuth(callback: AuthCallback) {
  authListeners.add(callback);
  callback(currentUser);
  return () => {
    authListeners.delete(callback);
  };
}

function notifyAuth() {
  authListeners.forEach(cb => cb(currentUser));
}

export function registerUser(email: string, pass: string, name: string): Promise<UserProfile> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dbUsersJson = localStorage.getItem('id_shop_users_db') || '[]';
      const dbUsers = JSON.parse(dbUsersJson);
      
      const exists = dbUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        throw new Error('E-mail já cadastrado.');
      }

      const isFirstAdmin = email.toLowerCase() === 'izidomingos12@gmail.com' || dbUsers.length === 0;

      const newUser: UserProfile = {
        uid: 'user_' + Math.random().toString(36).substr(2, 9),
        email,
        displayName: name,
        isAdmin: isFirstAdmin,
        phone: '',
        address: ''
      };

      dbUsers.push({ ...newUser, password: pass });
      localStorage.setItem('id_shop_users_db', JSON.stringify(dbUsers));

      currentUser = newUser;
      localStorage.setItem('id_shop_user_session', JSON.stringify(currentUser));
      notifyAuth();
      resolve(newUser);
    }, 600);
  });
}

export function loginUser(email: string, pass: string): Promise<UserProfile> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const dbUsersJson = localStorage.getItem('id_shop_users_db') || '[]';
      const dbUsers = JSON.parse(dbUsersJson);

      // Support mock first admin check automatically
      if (email.toLowerCase() === 'izidomingos12@gmail.com' && pass === '123456') {
        const adminUser: UserProfile = {
          uid: 'admin_12',
          email,
          displayName: 'ID Admin',
          isAdmin: true,
          phone: '(95) 98119-0869',
          address: 'Estúdio ID, Sede Administrativa'
        };
        currentUser = adminUser;
        localStorage.setItem('id_shop_user_session', JSON.stringify(currentUser));
        notifyAuth();
        return resolve(adminUser);
      }

      const user = dbUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
      if (!user) {
        return reject(new Error('Credenciais de acesso incorretas. Verifique seu e-mail e senha.'));
      }

      const activeUser: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        phone: user.phone || '',
        address: user.address || ''
      };

      currentUser = activeUser;
      localStorage.setItem('id_shop_user_session', JSON.stringify(currentUser));
      notifyAuth();
      resolve(activeUser);
    }, 600);
  });
}

export function logoutUser(): Promise<void> {
  return new Promise((resolve) => {
    currentUser = null;
    localStorage.removeItem('id_shop_user_session');
    notifyAuth();
    resolve();
  });
}

export function updateProfile(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
  return new Promise((resolve) => {
    if (currentUser && currentUser.uid === uid) {
      currentUser = { ...currentUser, ...data };
      localStorage.setItem('id_shop_user_session', JSON.stringify(currentUser));

      const dbUsersJson = localStorage.getItem('id_shop_users_db') || '[]';
      const dbUsers = JSON.parse(dbUsersJson);
      const idx = dbUsers.findIndex((u: any) => u.uid === uid);
      if (idx !== -1) {
        dbUsers[idx] = { ...dbUsers[idx], ...data };
        localStorage.setItem('id_shop_users_db', JSON.stringify(dbUsers));
      }
      notifyAuth();
    }
    resolve(currentUser!);
  });
}

export function recoverPassword(email: string): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const dbUsersJson = localStorage.getItem('id_shop_users_db') || '[]';
      const dbUsers = JSON.parse(dbUsersJson);
      const user = dbUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        resolve(`Instruções de recuperação de senha enviadas para ${email}! Em ambiente real, o Firebase cuidará desse envio.`);
      } else if (email.toLowerCase() === 'izidomingos12@gmail.com') {
        resolve(`Recuperação de e-mail de administrador simulada para ${email}!`);
      } else {
        reject(new Error('E-mail não encontrado no sistema.'));
      }
    }, 500);
  });
}

// --- PRODUCT OPERATIONS ---
export async function fetchProducts(): Promise<Product[]> {
  if (isRealFirebase) {
    try {
      const snap = await getDocs(collection(db, 'products'));
      const list: Product[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as any) } as Product);
      });
      if (list.length > 0) return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'products');
    }
  }
  return getLocalProducts();
}

export async function addProduct(p: Omit<Product, 'id' | 'rating' | 'reviewsCount'>): Promise<Product> {
  const newProduct: Product = {
    ...p,
    id: 'prod_' + Math.random().toString(36).substr(2, 9),
    rating: 5.0,
    reviewsCount: 0
  };

  if (isRealFirebase) {
    try {
      await setDoc(doc(db, 'products', newProduct.id), newProduct);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `products/${newProduct.id}`);
    }
  }

  const existing = getLocalProducts();
  existing.unshift(newProduct);
  saveLocalProducts(existing);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  if (isRealFirebase) {
    try {
      await updateDoc(doc(db, 'products', id), updates as any);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${id}`);
    }
  }

  const existing = getLocalProducts();
  const idx = existing.findIndex(p => p.id === id);
  if (idx !== -1) {
    existing[idx] = { ...existing[idx], ...updates };
    saveLocalProducts(existing);
    return existing[idx];
  }
  throw new Error('Produto não encontrado');
}

export async function deleteProduct(id: string): Promise<void> {
  if (isRealFirebase) {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }
  }

  const existing = getLocalProducts();
  const filtered = existing.filter(p => p.id !== id);
  saveLocalProducts(filtered);
}

// --- REVIEW OPERATIONS ---
export async function fetchReviews(productId: string): Promise<Review[]> {
  if (isRealFirebase) {
    try {
      const q = query(collection(db, 'reviews'), where('productId', '==', productId));
      const snap = await getDocs(q);
      const list: Review[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...(d.data() as any) } as Review);
      });
      if (list.length > 0) return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'reviews');
    }
  }
  const all = getLocalReviews();
  return all.filter(r => r.productId === productId);
}

export async function addReview(productId: string, userName: string, rating: number, comment: string): Promise<Review> {
  const newReview: Review = {
    id: 'rev_' + Math.random().toString(36).substr(2, 9),
    productId,
    userId: currentUser?.uid || 'anonymous',
    userName,
    rating,
    comment,
    createdAt: new Date().toISOString()
  };

  if (isRealFirebase) {
    try {
      await setDoc(doc(db, 'reviews', newReview.id), newReview);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `reviews/${newReview.id}`);
    }
  }

  // Update dynamic rating details of the product
  const products = getLocalProducts();
  const pIdx = products.findIndex(p => p.id === productId);
  if (pIdx !== -1) {
    const existingReviews = getLocalReviews().filter(r => r.productId === productId);
    const totalCount = existingReviews.length + 1;
    const totalSum = existingReviews.reduce((sum, r) => sum + r.rating, 0) + rating;
    const avgRating = parseFloat((totalSum / totalCount).toFixed(1));
    
    products[pIdx].rating = avgRating;
    products[pIdx].reviewsCount = totalCount;
    saveLocalProducts(products);
    
    // update real firebase if online
    if (isRealFirebase) {
      try {
        await updateDoc(doc(db, 'products', productId), {
          rating: avgRating,
          reviewsCount: totalCount
        });
      } catch (e) { /* ignore secondary error */ }
    }
  }

  const allReviews = getLocalReviews();
  allReviews.unshift(newReview);
  saveLocalReviews(allReviews);
  return newReview;
}

// --- BANNER OPERATIONS ---
export async function fetchBanners(): Promise<PromoBanner[]> {
  if (isRealFirebase) {
    try {
      const snap = await getDocs(collection(db, 'banners'));
      const list: PromoBanner[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...(d.data() as any) } as PromoBanner);
      });
      if (list.length > 0) return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'banners');
    }
  }
  return getLocalBanners();
}

export async function addBanner(imageUrl: string, title: string, subtitle?: string): Promise<PromoBanner> {
  const newBanner: PromoBanner = {
    id: 'banner_' + Math.random().toString(36).substr(2, 9),
    imageUrl,
    title,
    subtitle,
    active: true
  };

  if (isRealFirebase) {
    try {
      await setDoc(doc(db, 'banners', newBanner.id), newBanner);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `banners/${newBanner.id}`);
    }
  }

  const b = getLocalBanners();
  b.push(newBanner);
  saveLocalBanners(b);
  return newBanner;
}

export async function deleteBanner(id: string): Promise<void> {
  if (isRealFirebase) {
    try {
      await deleteDoc(doc(db, 'banners', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `banners/${id}`);
    }
  }

  const b = getLocalBanners();
  const index = b.findIndex(b => b.id === id);
  if (index !== -1) {
    b.splice(index, 1);
    saveLocalBanners(b);
  }
}

// --- COUPON OPERATIONS ---
export async function fetchCoupons(): Promise<Coupon[]> {
  if (isRealFirebase) {
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      const list: Coupon[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...(d.data() as any) } as Coupon);
      });
      if (list.length > 0) return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'coupons');
    }
  }
  return getLocalCoupons();
}

export async function addCoupon(coupon: Omit<Coupon, 'id'>): Promise<Coupon> {
  const newCoupon: Coupon = {
    ...coupon,
    id: 'coupon_' + Math.random().toString(36).substr(2, 9),
    code: coupon.code.toUpperCase()
  };

  if (isRealFirebase) {
    try {
      await setDoc(doc(db, 'coupons', newCoupon.id), newCoupon);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `coupons/${newCoupon.id}`);
    }
  }

  const c = getLocalCoupons();
  c.push(newCoupon);
  saveLocalCoupons(c);
  return newCoupon;
}

export async function deleteCoupon(id: string): Promise<void> {
  if (isRealFirebase) {
    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `coupons/${id}`);
    }
  }

  const c = getLocalCoupons();
  const f = c.filter(item => item.id !== id);
  saveLocalCoupons(f);
}

// --- ORDER OPERATIONS (WITH PIX INTEGRATION) ---
export function generatePixCopyAndPaste(amount: number): string {
  const payloadFormatIndicator = "000201";
  const merchantAccountInformation = "26620014br.gov.bcb.pix01149598119086952040000";
  const merchantCategoryCode = "52040000";
  const transactionCurrency = "5303986";
  const formattedAmount = amount.toFixed(2);
  const transactionAmount = `54${formattedAmount.length.toString().padStart(2, '0')}${formattedAmount}`;
  const countryCode = "5802BR";
  const merchantName = "5917ID PERSONALIZADOS";
  const merchantCity = "6009Boa Vista";
  const postalCode = "610869300000";
  const valueCheckDigits = "62070503***6304";
  
  const incompletePayload = `${payloadFormatIndicator}${merchantAccountInformation}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantName}${merchantCity}${postalCode}${valueCheckDigits}`;
  
  // Custom deterministic simple CRC16 representation
  let hash = 0xFFFF;
  for (let i = 0; i < incompletePayload.length; i++) {
    hash ^= incompletePayload.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      if (hash & 1) {
        hash = (hash >>> 1) ^ 0xA001;
      } else {
        hash = hash >>> 1;
      }
    }
  }
  const crc16 = hash.toString(16).toUpperCase().padStart(4, '0');
  
  return `${incompletePayload}${crc16}`;
}

export async function createOrder(
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  items: OrderItem[],
  totalPrice: number,
  discount: number,
  finalPrice: number,
  couponCode?: string
): Promise<Order> {
  
  const pixCode = generatePixCopyAndPaste(finalPrice);
  
  const newOrder: Order = {
    id: 'PED_' + Math.floor(100000 + Math.random() * 90000).toString(),
    userId: currentUser?.uid || 'anonymous',
    customerName,
    customerPhone,
    customerAddress,
    items,
    totalPrice,
    discount,
    finalPrice,
    couponCode,
    paymentStatus: 'pending',
    deliveryStatus: 'pending',
    createdAt: new Date().toISOString(),
    pixCode
  };

  if (isRealFirebase) {
    try {
      await setDoc(doc(db, 'orders', newOrder.id), newOrder);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `orders/${newOrder.id}`);
    }
  }

  // Update dynamic stock values
  const products = getLocalProducts();
  items.forEach(item => {
    const pIdx = products.findIndex(p => p.id === item.productId);
    if (pIdx !== -1) {
      products[pIdx].stock = Math.max(0, products[pIdx].stock - item.quantity);
      if (isRealFirebase) {
        updateDoc(doc(db, 'products', item.productId), { stock: products[pIdx].stock }).catch(() => {});
      }
    }
  });
  saveLocalProducts(products);

  const existing = getLocalOrders();
  existing.unshift(newOrder);
  saveLocalOrders(existing);
  return newOrder;
}

export async function fetchOrders(): Promise<Order[]> {
  if (isRealFirebase) {
    try {
      let q;
      if (currentUser?.isAdmin) {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      } else {
        q = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser?.uid || 'anonymous'),
          orderBy('createdAt', 'desc')
        );
      }
      const snap = await getDocs(q);
      const list: Order[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...(d.data() as any) } as Order);
      });
      if (list.length > 0) return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'orders');
    }
  }
  
  const all = getLocalOrders();
  if (currentUser?.isAdmin) {
    return all;
  }
  return all.filter(o => o.userId === (currentUser?.uid || 'anonymous'));
}

export async function updateOrderStatus(
  orderId: string,
  paymentStatus: 'pending' | 'paid' | 'cancelled',
  deliveryStatus: 'pending' | 'shipped' | 'delivered'
): Promise<Order> {
  if (isRealFirebase) {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus,
        deliveryStatus
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  }

  const existing = getLocalOrders();
  const idx = existing.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    existing[idx].paymentStatus = paymentStatus;
    existing[idx].deliveryStatus = deliveryStatus;
    saveLocalOrders(existing);
    return existing[idx];
  }
  throw new Error('Pedido não encontrado');
}
