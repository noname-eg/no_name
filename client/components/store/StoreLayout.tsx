import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Facebook, Instagram, Menu, MessageCircle, Music2, Search, ShoppingBag, X, Youtube } from "lucide-react";

export const products = [
  { id: "set-01", name: "طقم كتان بلون الجمل", price: "2,490 ج.م", numericPrice: 2490, category: "أطقم", image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=700&q=85", tag: "جديد" },
  { id: "set-02", name: "طقم يومي بلون رمادي", price: "2,190 ج.م", numericPrice: 2190, category: "أطقم", image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "set-03", name: "طقم واسع بلون الزيتي", price: "2,350 ج.م", numericPrice: 2350, category: "أطقم", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "set-04", name: "طقم السفر المريح", price: "1,990 ج.م", numericPrice: 1990, category: "أطقم", image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "set-05", name: "طقم كريمي ناعم", price: "2,250 ج.م", numericPrice: 2250, category: "أطقم", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=700&q=85", tag: "جديد" },
  { id: "set-06", name: "طقم كتان صيفي", price: "2,590 ج.م", numericPrice: 2590, category: "أطقم", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "linen-shirt", name: "قميص Linen الناعم", price: "990 ج.م", numericPrice: 990, category: "توبس", image: "https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "top-02", name: "توب أسود مضلع", price: "790 ج.م", numericPrice: 790, category: "توبس", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=85", tag: "جديد" },
  { id: "top-03", name: "قميص أبيض واسع", price: "1,150 ج.م", numericPrice: 1150, category: "توبس", image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "top-04", name: "بلوزة بأزرار أمامية", price: "1,050 ج.م", numericPrice: 1050, category: "توبس", image: "https://images.unsplash.com/photo-1564257577054-8e7c5f8e8e8a?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "top-05", name: "توب كتان بلون الحجر", price: "890 ج.م", numericPrice: 890, category: "توبس", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "top-06", name: "قميص أزرق مطبع", price: "1,650 ج.م", numericPrice: 1650, category: "توبس", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "wide-leg-pants", name: "بنطلون الـ Wide Leg", price: "1,290 ج.م", numericPrice: 1290, category: "بنطال", image: "https://images.unsplash.com/photo-1506629905607-d9b1c7d8b7d9?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "pants-02", name: "بنطلون كتان مستقيم", price: "1,390 ج.م", numericPrice: 1390, category: "بنطال", image: "https://images.unsplash.com/photo-1506629905607-d9b1c7d8b7d9?auto=format&fit=crop&w=700&q=85", tag: "جديد" },
  { id: "pants-03", name: "بنطلون أسود كلاسيك", price: "1,250 ج.م", numericPrice: 1250, category: "بنطال", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "pants-04", name: "بنطلون واسع بلون رملي", price: "1,350 ج.م", numericPrice: 1350, category: "بنطال", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "pants-05", name: "بنطلون جيرسي مريح", price: "1,090 ج.م", numericPrice: 1090, category: "بنطال", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "pants-06", name: "بنطلون جينز مستقيم", price: "1,490 ج.م", numericPrice: 1490, category: "بنطال", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "everyday-jacket", name: "جاكيت الـ Everyday", price: "1,890 ج.م", numericPrice: 1890, category: "جاكيتات", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=85", tag: "الأكثر طلباً" },
  { id: "classic-blazer", name: "بليزر الـ Classic", price: "2,150 ج.م", numericPrice: 2150, category: "جاكيتات", image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "jacket-03", name: "جاكيت دنيم واسع", price: "1,750 ج.م", numericPrice: 1750, category: "جاكيتات", image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=85", tag: "جديد" },
  { id: "jacket-04", name: "جاكيت كتان خفيف", price: "1,690 ج.م", numericPrice: 1690, category: "جاكيتات", image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "jacket-05", name: "كارديجان طويل", price: "1,590 ج.م", numericPrice: 1590, category: "جاكيتات", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "jacket-06", name: "بليزر بلون العاج", price: "2,290 ج.م", numericPrice: 2290, category: "جاكيتات", image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "denim-01", name: "جينز مستقيم أزرق", price: "1,490 ج.م", numericPrice: 1490, category: "جينز", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=85", tag: "جديد" },
  { id: "denim-02", name: "جينز واسع فاتح", price: "1,550 ج.م", numericPrice: 1550, category: "جينز", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "denim-03", name: "جاكيت جينز كلاسيك", price: "1,750 ج.م", numericPrice: 1750, category: "جينز", image: "https://images.unsplash.com/photo-1523205565295-f8e0c1b7d3a2?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "denim-04", name: "جينز داكن مستقيم", price: "1,590 ج.م", numericPrice: 1590, category: "جينز", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "denim-05", name: "تنورة جينز طويلة", price: "1,290 ج.م", numericPrice: 1290, category: "جينز", image: "https://images.unsplash.com/photo-1583496661160-fb5886a13d27?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "denim-06", name: "قميص جينز خفيف", price: "1,350 ج.م", numericPrice: 1350, category: "جينز", image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "dress-01", name: "فستان Siena الحريري", price: "2,450 ج.م", numericPrice: 2450, category: "فساتين", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=85", tag: "جديد" },
  { id: "dress-02", name: "فستان Laila اليومي", price: "1,790 ج.م", numericPrice: 1790, category: "فساتين", image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "dress-03", name: "فستان كتان طويل", price: "1,990 ج.م", numericPrice: 1990, category: "فساتين", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "dress-04", name: "فستان صيفي واسع", price: "1,650 ج.م", numericPrice: 1650, category: "فساتين", image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "dress-05", name: "فستان أسود بسيط", price: "1,850 ج.م", numericPrice: 1850, category: "فساتين", image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=700&q=85", tag: "" },
  { id: "dress-06", name: "فستان كريمي ناعم", price: "2,090 ج.م", numericPrice: 2090, category: "فساتين", image: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=700&q=85", tag: "" },
];

const englishProductNames: Record<string, string> = {
  "everyday-jacket": "Everyday Jacket",
  "siena-dress": "Siena Silk Dress",
  "wide-leg-pants": "Wide Leg Pants",
  "linen-shirt": "Soft Linen Shirt",
  "laila-dress": "Laila Day Dress",
  "classic-blazer": "Classic Blazer",
  "linen-set": "Camel Linen Set",
  "blue-overshirt": "Blue Printed Overshirt",
  "set-01": "Camel Linen Set",
  "set-02": "Grey Everyday Set",
  "set-03": "Olive Relaxed Set",
  "set-04": "Comfort Travel Set",
  "set-05": "Soft Cream Set",
  "set-06": "Summer Linen Set",
  "top-01": "Soft Linen Shirt",
  "top-02": "Ribbed Black Top",
  "top-03": "Relaxed White Shirt",
  "top-04": "Front Button Blouse",
  "top-05": "Stone Linen Top",
  "top-06": "Blue Printed Shirt",
  "pants-02": "Straight Linen Pants",
  "pants-03": "Classic Black Pants",
  "pants-04": "Wide Sand Pants",
  "pants-05": "Comfort Jersey Pants",
  "pants-06": "Straight Leg Jeans",
  "jacket-03": "Oversized Denim Jacket",
  "jacket-04": "Light Linen Jacket",
  "jacket-05": "Long Cardigan",
  "jacket-06": "Ivory Blazer",
  "denim-01": "Straight Blue Jeans",
  "denim-02": "Light Wide Jeans",
  "denim-03": "Classic Denim Jacket",
  "denim-04": "Dark Straight Jeans",
  "denim-05": "Long Denim Skirt",
  "denim-06": "Light Denim Shirt",
  "dress-01": "Siena Silk Dress",
  "dress-02": "Laila Day Dress",
  "dress-03": "Long Linen Dress",
  "dress-04": "Relaxed Summer Dress",
  "dress-05": "Simple Black Dress",
  "dress-06": "Soft Cream Dress",
};

const englishCategories: Record<string, string> = { "أطقم": "Sets", "توبس": "Blouses / shirts", "بنطال": "Skirts / pants", "جينز": "Denims", "جاكيتات": "Jackets", "فساتين": "Dresses", Sets: "Sets", "Blouses / shirts": "Blouses / shirts", "Skirts / pants": "Skirts / pants", Denims: "Denims", Dresses: "Dresses", Jackets: "Jackets" };
const normalizeCategory = (category: string) => englishCategories[category] || category;
export const getProductName = (product: StoreProduct, language: Language) => language === "en" ? product.nameEn || englishProductNames[product.id] || product.name : product.name;
export const getCategoryName = (category: string, language: Language) => {
  const normalized = normalizeCategory(category);
  return normalized;
};
export const getProductPrice = (product: StoreProduct, language: Language) => language === "en" ? product.price.replace("ج.م", "L.E") : product.price;
export const getProductBadge = (product: StoreProduct) => product.badge?.trim() || product.tag?.trim() || "";
export const getProductDiscount = (product: StoreProduct) => {
  if (typeof product.originalPrice !== "number" || typeof product.salePrice !== "number" || product.salePrice >= product.originalPrice) return null;
  return Math.round((1 - product.salePrice / product.originalPrice) * 100);
};
export const formatProductAmount = (amount: number, language: Language) => `${amount.toLocaleString("en-US")} ${language === "en" ? "L.E" : "ج.م"}`;
const productColors: Record<string, string[]> = {
  أطقم: ["#d8d1c2", "#6f756b", "#222222"],
  توبس: ["#f4f1e8", "#222222", "#9b9b92"],
  بنطال: ["#1e2937", "#b3b5b4", "#8b6f58", "#222222"],
  جاكيتات: ["#222222", "#d2c7b6", "#7d8a76"],
  جينز: ["#91b6d6", "#45627a", "#1e2937"],
};
export const getProductColors = (product: StoreProduct) => product.colors?.length ? product.colors : productColors[product.category] || ["#222222", "#d8d1c2"];

export const categories = [
  { label: "فساتين", image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=850&q=85" },
  { label: "طقم كامل", image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=850&q=85" },
  { label: "أساسيات", image: "https://images.unsplash.com/photo-1496217590455-aa63a8350eea?auto=format&fit=crop&w=850&q=85" },
];

export type StoreProduct = Omit<typeof products[number], "nameEn"> & { nameEn?: string; description?: string; descriptionEn?: string; stock?: number; lowStockThreshold?: number; originalPrice?: number; salePrice?: number; badge?: string; colors?: string[]; sizes?: string[]; video?: string; images?: string[] };
export type CartItem = { product: StoreProduct; quantity: number };
export type SiteSettings = { announcement: string; accent: string; heroTitle?: string; heroDescription?: string; walletNumber?: string; instapayNumber?: string; salesWhatsappNumber?: string; salesWhatsappUrl?: string; discoverVideos?: string[]; socialLinks?: { instagram?: string; facebook?: string; youtube?: string; whatsapp?: string; tiktok?: string } };
export type SectionSettings = { title: string; description: string; image: string; video?: string };
export type PageSettings = {
  about: { titleAr: string; titleEn: string; introAr: string; introEn: string; beliefTitleAr: string; beliefTitleEn: string; bodyAr: string; bodyEn: string; body2Ar: string; body2En: string; image1: string; image2: string };
  shipping: { titleAr: string; titleEn: string; contentAr: string; contentEn: string };
  contact: { titleAr: string; titleEn: string; contentAr: string; contentEn: string; recipientEmail: string };
};
export type Coupon = { code: string; discount: number; uses: number; active: boolean };
export type PaymentMethod = "cod" | "wallet" | "instapay";
export type StoreOrderItem = { name: string; quantity: number; unitPrice: number; total: number };
export type StoreOrder = { id: string; date: string; total: number; status: "جديد" | "قيد التجهيز" | "مكتمل"; items: number; customerName?: string; phone?: string; address?: string; notes?: string; paymentMethod?: PaymentMethod; transferNumber?: string; receipt?: string; orderItems?: StoreOrderItem[] };
export type Language = "ar" | "en";
export const getSalesWhatsAppUrl = (settings: SiteSettings) => {
  const number = settings.salesWhatsappNumber?.replace(/\D/g, "");
  return settings.salesWhatsappUrl?.trim() || (number ? `https://wa.me/${number}` : settings.socialLinks?.whatsapp || "https://wa.me/201553003040");
};
type StoreContextValue = { cart: number; cartItems: CartItem[]; catalog: StoreProduct[]; siteSettings: SiteSettings; sections: Record<string, SectionSettings>; pageSettings: PageSettings; coupons: Coupon[]; orders: StoreOrder[]; addToCart: (product: StoreProduct) => void; removeFromCart: (id: string) => void; updateQuantity: (id: string, quantity: number) => void; clearCart: () => void; addProduct: (product: StoreProduct) => void; updateProduct: (product: StoreProduct) => void; deleteProduct: (id: string) => void; addOrder: (order: StoreOrder) => void; updateSiteSettings: (settings: SiteSettings) => void; updateSection: (key: string, section: SectionSettings) => void; updatePageSettings: (settings: PageSettings) => void; addCoupon: (coupon: Coupon) => void; deleteCoupon: (code: string) => void; liked: number[]; toggleLike: (index: number) => void; language: Language; toggleLanguage: () => void };
const StoreContext = createContext<StoreContextValue | null>(null);
export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreLayout");
  return context;
};

export function StoreLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [catalog, setCatalog] = useState<StoreProduct[]>(() => { try { const saved = JSON.parse(localStorage.getItem("no-name-products") || "null") as StoreProduct[] | null; const legacyIds = new Set(["siena-dress", "laila-dress", "linen-set", "blue-overshirt"]); const removedIds = new Set(["check-print-set"]); const merged: StoreProduct[] = saved ? [...products.map((product) => saved.find((savedProduct) => savedProduct.id === product.id) || product), ...saved.filter((savedProduct) => !legacyIds.has(savedProduct.id) && !removedIds.has(savedProduct.id) && !products.some((product) => product.id === savedProduct.id))] : products; return merged.map((product) => ({ ...product, stock: product.stock ?? 12, lowStockThreshold: product.lowStockThreshold ?? 3 })); } catch { return products.map((product) => ({ ...product, stock: 12, lowStockThreshold: 3 })); } });
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => { const defaults: SiteSettings = { announcement: "Free shipping on orders over 2,500 EGP · Cash on delivery available", accent: "#d4775c", heroTitle: "New for Summer 2026", heroDescription: "Modest styles designed for everyday comfort.", salesWhatsappNumber: "201068568250", salesWhatsappUrl: "https://wa.me/201068568250", socialLinks: { instagram: "", facebook: "", youtube: "", whatsapp: "https://wa.me/201553003040", tiktok: "" } }; try { const saved = JSON.parse(localStorage.getItem("no-name-settings") || "null") as SiteSettings | null; return { ...defaults, ...saved, socialLinks: { ...defaults.socialLinks, ...saved?.socialLinks } }; } catch { return defaults; } });
  const defaultSections: Record<string, SectionSettings> = { arrivals: { title: "New Collection", description: "New pieces have just arrived.", image: "" }, categories: { title: "Shop by category", description: "Find the section closest to your style.", image: "" }, editorial: { title: "Effortless style", description: "Thoughtful designs for every moment.", image: "" }, discover: { title: "Discover your style", description: "Explore the latest looks.", image: "" }, sets: { title: "Sets", description: "", image: "" }, tops: { title: "Blouses / shirts", description: "", image: "" }, pants: { title: "Skirts / pants", description: "", image: "" }, dresses: { title: "Dresses", description: "", image: "" } };
  const [sections, setSections] = useState<Record<string, SectionSettings>>(() => { try { return { ...defaultSections, ...JSON.parse(localStorage.getItem("no-name-sections") || "null") }; } catch { return defaultSections; } });
  const defaultPageSettings: PageSettings = {
    about: { titleAr: "لما تكوني على طبيعتك.", titleEn: "When you are yourself.", introAr: "بدأت no name من سؤال بسيط: ليه لازم نختار بين إننا نكون مرتاحين وإننا نكون أنيقين؟", introEn: "no name began with a simple question: why should we choose between feeling comfortable and looking beautiful?", beliefTitleAr: "اللبس الحلو بيبدأ من الإحساس.", beliefTitleEn: "Good clothes start with a feeling.", bodyAr: "نحن علامة مصرية مستقلة نصمم للمرأة التي تعرف نفسها جيداً. نختار خامات مريحة، قصّات ذكية، وألواناً تعيش أبعد من موسم واحد.", bodyEn: "We are an independent Egyptian label designing for women who know themselves well. We choose comfortable fabrics, considered cuts, and colors that live beyond one season.", body2Ar: "كل قطعة تُصنع بالتعاون مع حرفيين محليين في القاهرة. لأن التفاصيل الصغيرة، من أول غرزة لآخر زر، هي التي تجعل القطعة خاصة.", body2En: "Every piece is made with local artisans in Cairo. The smallest details, from the first stitch to the last button, are what make a piece special.", image1: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1100&q=90", image2: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=700&q=90" },
    shipping: { titleAr: "الشحن والاستبدال", titleEn: "Shipping & returns", contentAr: "نوفر شحناً سريعاً داخل مصر مع إمكانية الاستبدال بسهولة. تواصلي معنا لمعرفة التفاصيل.", contentEn: "We offer fast shipping across Egypt with easy exchanges. Contact us for full details." },
    contact: { titleAr: "تواصلي معنا", titleEn: "Contact us", contentAr: "يسعدنا الرد على استفساراتك ومساعدتك في اختيار القطعة المناسبة.", contentEn: "We would love to answer your questions and help you find the right piece.", recipientEmail: "" },
  };
  const [pageSettings, setPageSettings] = useState<PageSettings>(() => { try { const saved = JSON.parse(localStorage.getItem("no-name-pages") || "null") as Partial<PageSettings> | null; return { ...defaultPageSettings, ...saved, about: { ...defaultPageSettings.about, ...saved?.about }, shipping: { ...defaultPageSettings.shipping, ...saved?.shipping }, contact: { ...defaultPageSettings.contact, ...saved?.contact } }; } catch { return defaultPageSettings; } });
  const [coupons, setCoupons] = useState<Coupon[]>(() => { try { return JSON.parse(localStorage.getItem("no-name-coupons") || "[]"); } catch { return []; } });
  const [orders, setOrders] = useState<StoreOrder[]>(() => { try { return JSON.parse(localStorage.getItem("no-name-orders") || "[]"); } catch { return []; } });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [liked, setLiked] = useState<number[]>([]);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isEnglish = language === "en";
  const activeSection = (query: string) => {
    if (location.pathname !== "/shop") return false;
    return new URLSearchParams(location.search).toString() === new URLSearchParams(query).toString();
  };
  useEffect(() => { localStorage.setItem("no-name-products", JSON.stringify(catalog)); }, [catalog]);
  useEffect(() => { const handleScroll = () => setIsScrolled(window.scrollY > 12); handleScroll(); window.addEventListener("scroll", handleScroll, { passive: true }); return () => window.removeEventListener("scroll", handleScroll); }, []);
  useEffect(() => { setCatalog((current) => current.filter((product) => product.id !== "check-print-set")); }, []);
  useEffect(() => { localStorage.setItem("no-name-language", language); localStorage.setItem("no-name-language-version", "2"); document.documentElement.lang = language; document.documentElement.dir = isEnglish ? "ltr" : "rtl"; }, [language, isEnglish]);
  const toggleLanguage = () => setLanguage((current) => current === "ar" ? "en" : "ar");
  useEffect(() => { localStorage.setItem("no-name-settings", JSON.stringify(siteSettings)); }, [siteSettings]);
  useEffect(() => { localStorage.setItem("no-name-sections", JSON.stringify(sections)); }, [sections]);
  useEffect(() => { localStorage.setItem("no-name-pages", JSON.stringify(pageSettings)); }, [pageSettings]);
  useEffect(() => { localStorage.setItem("no-name-coupons", JSON.stringify(coupons)); }, [coupons]);
  useEffect(() => { localStorage.setItem("no-name-orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname, location.search]);
  const addToCart = (product: typeof products[number]) => setCartItems((current) => { const existing = current.find((item) => item.product.id === product.id); return existing ? current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { product, quantity: 1 }]; });
  const removeFromCart = (id: string) => setCartItems((current) => current.filter((item) => item.product.id !== id));
  const updateQuantity = (id: string, quantity: number) => setCartItems((current) => quantity < 1 ? current.filter((item) => item.product.id !== id) : current.map((item) => item.product.id === id ? { ...item, quantity } : item));
  const clearCart = () => setCartItems([]);
  const cart = cartItems.reduce((total, item) => total + item.quantity, 0);
  const toggleLike = (index: number) => setLiked((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  const addProduct = (product: StoreProduct) => setCatalog((current) => [...current, product]);
  const updateProduct = (product: StoreProduct) => setCatalog((current) => current.map((item) => item.id === product.id ? product : item));
  const deleteProduct = (id: string) => setCatalog((current) => current.filter((item) => item.id !== id));
  const addOrder = (order: StoreOrder) => {
    const next = [order, ...orders];
    localStorage.setItem("no-name-orders", JSON.stringify(next));
    setOrders(next);
  };
  const updateSiteSettings = (settings: SiteSettings) => setSiteSettings(settings);
  const updateSection = (key: string, section: SectionSettings) => setSections((current) => ({ ...current, [key]: section }));
  const updatePageSettings = (settings: PageSettings) => setPageSettings(settings);
  const addCoupon = (coupon: Coupon) => setCoupons((current) => [...current, coupon]);
  const deleteCoupon = (code: string) => setCoupons((current) => current.filter((coupon) => coupon.code !== code));
  const nav = (path: string) => { setMenuOpen(false); navigate(path); };

  return <StoreContext.Provider value={{ cart, cartItems, catalog, siteSettings, sections, pageSettings, coupons, orders, addToCart, removeFromCart, updateQuantity, clearCart, addProduct, updateProduct, deleteProduct, addOrder, updateSiteSettings, updateSection, updatePageSettings, addCoupon, deleteCoupon, liked, toggleLike, language, toggleLanguage }}>
    <main dir={isEnglish ? "ltr" : "rtl"} className="min-h-screen overflow-x-clip bg-white text-[#171717]">
      <div className="fixed inset-x-0 top-0 z-40 h-[30px] overflow-hidden border-b border-[#1c2822]/10 bg-[#f4f2e9] px-5 py-1.5 text-center text-[8px] tracking-[0.08em] text-[#1c2822]/75 sm:text-[9px]"><div className="announcement-track flex w-max items-center gap-16 whitespace-nowrap"><span>{siteSettings.announcement || (isEnglish ? "Free Shipping on Orders Over 3,000 EGP" : "شحن مجاني للطلبات فوق ٣٠٠٠ جنيه")}</span><span>{isEnglish ? "Enjoy Up to 50% Off · Welcome Anew" : "خصم يصل إلى ٥٠٪ · أهلاً بكِ"}</span><span>{siteSettings.announcement || (isEnglish ? "Free Shipping on Orders Over 3,000 EGP" : "شحن مجاني للطلبات فوق ٣٠٠٠ جنيه")}</span><span>{siteSettings.announcement || (isEnglish ? "Free Shipping on Orders Over 3,000 EGP" : "شحن مجاني للطلبات فوق ٣٠٠٠ جنيه")}</span><span>{isEnglish ? "Enjoy Up to 50% Off · Welcome Anew" : "خصم يصل إلى ٥٠٪ · أهلاً بكِ"}</span><span>{siteSettings.announcement || (isEnglish ? "Free Shipping on Orders Over 3,000 EGP" : "شحن مجاني للطلبات فوق ٣٠٠٠ جنيه")}</span></div></div>
      <header className={`z-30 ${isHome ? (isScrolled ? "fixed inset-x-0 top-[30px] border-b border-black/10 bg-[#eeece1] text-[#171717] shadow-sm" : "fixed inset-x-0 top-[30px] bg-transparent text-white") : "sticky top-[30px] border-b border-black/10 bg-[#eeece1] text-[#171717]"}`}>
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <button className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة"><Menu size={21} strokeWidth={1.4} /></button>
          <nav className="hidden items-center gap-4 text-[10px] font-medium tracking-[0.08em] lg:flex">
            <Link to="/shop?collection=new" className={`text-[13px] hover:underline hover:underline-offset-8 ${activeSection("?collection=new") ? "font-semibold underline underline-offset-8" : ""}`}>New Collection</Link>
            <Link to="/shop?category=Sets" className={`text-[13px] hover:underline hover:underline-offset-8 ${activeSection("?category=Sets") ? "font-semibold underline underline-offset-8" : ""}`}>Sets</Link>
            <Link to="/shop?category=Skirts%20%2F%20pants" className={`text-[13px] hover:underline hover:underline-offset-8 ${activeSection("?category=Skirts%20%2F%20pants") ? "font-semibold underline underline-offset-8" : ""}`}>Skirts / pants</Link>
            <Link to="/shop?category=Blouses%20%2F%20shirts" className={`text-[13px] hover:underline hover:underline-offset-8 ${activeSection("?category=Blouses%20%2F%20shirts") ? "font-semibold underline underline-offset-8" : ""}`}>Blouses / shirts</Link>
            <Link to="/shop?category=Denims" className={`text-[13px] hover:underline hover:underline-offset-8 ${activeSection("?category=Denims") ? "font-semibold underline underline-offset-8" : ""}`}>Denims</Link>
            <Link to="/shop?category=Dresses" className={`text-[13px] hover:underline hover:underline-offset-8 ${activeSection("?category=Dresses") ? "font-semibold underline underline-offset-8" : ""}`}>Dresses</Link>
          </nav>
          <Link to="/" className="store-logo absolute left-1/2 -translate-x-1/2 text-center leading-none" aria-label="الصفحة الرئيسية">
            <div className="font-['Times_New_Roman'] text-[22px] font-semibold tracking-[0.12em]">No Name</div>
            <div className="mt-1 text-[7px] tracking-[0.38em]">MODEST WEAR</div>
          </Link>
          <div className="flex items-center gap-3 text-[10px] tracking-wide"><button className="hidden border border-current/30 px-2 py-1 text-[10px] lg:inline-flex" onClick={toggleLanguage} aria-label={isEnglish ? "Switch to Arabic" : "Switch to English"}>{isEnglish ? "العربية" : "English"}</button><button onClick={() => setSearchOpen((open) => !open)} aria-label={isEnglish ? "Search" : "بحث"}><Search size={17} strokeWidth={1.4} /></button><button className="relative" onClick={() => navigate("/cart")} aria-label="حقيبة التسوق"><ShoppingBag size={17} strokeWidth={1.4} />{cart > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d68b71] px-1 text-[9px] text-white">{cart}</span>}</button></div>
        </div>
        {searchOpen && <form onSubmit={(event) => { event.preventDefault(); navigate(`/shop?search=${encodeURIComponent((event.currentTarget.elements.namedItem("search") as HTMLInputElement).value)}`); setSearchOpen(false); }} className="mx-auto flex max-w-[1240px] border-t border-[#1c2822]/10 px-5 py-4 lg:px-8"><input name="search" autoFocus placeholder={isEnglish ? "Search for a piece..." : "ابحثي عن قطعة..."} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button className="text-[11px] font-bold">{isEnglish ? "Search" : "بحث"} <ArrowLeft className="mr-2 inline" size={15} /></button></form>}
        {menuOpen && <div className="fixed inset-0 z-50 bg-[#1c2822] p-6 text-[#f6f3ee]"><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={24} /></button><div className="mt-20 flex flex-col gap-6 text-2xl"><button className="text-right" onClick={() => nav("/shop?collection=new")}>New Collection</button><button className="text-right" onClick={() => nav("/shop?category=Sets")}>Sets</button><button className="text-right" onClick={() => nav("/shop?category=Skirts%20%2F%20pants")}>Skirts / pants</button><button className="text-right" onClick={() => nav("/shop?category=Blouses%20%2F%20shirts")}>Blouses / shirts</button><button className="text-right" onClick={() => nav("/shop?category=Denims")}>Denims</button><button className="text-right" onClick={() => nav("/shop?category=Dresses")}>Dresses</button></div><button onClick={toggleLanguage} className="absolute bottom-8 left-6 right-6 border border-[#f6f3ee]/30 py-3 text-center text-sm" aria-label={isEnglish ? "Switch to Arabic" : "Switch to English"}>{isEnglish ? "العربية" : "English"}</button></div>}
      </header>
      {children}
      <footer id="journal" className="bg-white px-5 py-16 lg:px-8"><div className="mx-auto max-w-[1240px]"><div className="grid gap-12 border-b border-[#1c2822]/15 pb-14 md:grid-cols-[1.4fr_1fr_1fr_1.5fr]"><div><Link to="/" className="store-logo font-['Times_New_Roman'] text-3xl font-semibold tracking-[0.14em]">No Name</Link><p className="mt-5 max-w-[220px] text-[12px] leading-6 text-[#1c2822]/60">{isEnglish ? "A piece of you, made in Egypt." : "قطعة منك، مصنوعة في مصر."}</p><div className="mt-5 flex gap-4"><a href={siteSettings.socialLinks?.instagram || "https://instagram.com"} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={16} /></a><a href={siteSettings.socialLinks?.facebook || "https://facebook.com"} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={16} /></a><a href={siteSettings.socialLinks?.youtube || "https://youtube.com"} target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={16} /></a><a href={siteSettings.socialLinks?.whatsapp || "https://wa.me/201553003040"} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={16} /></a><a href={siteSettings.socialLinks?.tiktok || "https://tiktok.com"} target="_blank" rel="noreferrer" aria-label="TikTok"><Music2 size={16} /></a><Link to="/admin" className="mt-6 inline-block text-[10px] text-black/35">{isEnglish ? "Admin dashboard" : "لوحة التحكم"}</Link></div></div><div><h3 className="mb-5 text-[11px] font-bold">{isEnglish ? "Shop" : "تسوقي"}</h3><div className="flex flex-col gap-3 text-[12px] text-[#1c2822]/60"><Link to="/shop?collection=new">{isEnglish ? "New collection" : "وصل حديثاً"}</Link><Link to="/shop?category=أطقم">{isEnglish ? "Sets" : "الأطقم"}</Link><Link to="/shop?category=توبس">{isEnglish ? "Blouses / shirts" : "البلوزات والقمصان"}</Link><Link to="/shop?category=بنطال">{isEnglish ? "Skirts / pants" : "التنانير والبناطيل"}</Link><Link to="/shop?category=جينز">{isEnglish ? "Denims" : "الجينز"}</Link><Link to="/shop?category=فساتين">{isEnglish ? "Dresses" : "الفساتين"}</Link></div></div><div><h3 className="mb-5 text-[11px] font-bold">{isEnglish ? "Help" : "مساعدة"}</h3><div className="flex flex-col gap-3 text-[12px] text-[#1c2822]/60"><Link to="/about">{isEnglish ? "About no name" : "عن no name"}</Link><Link to="/shipping">{isEnglish ? "Shipping & returns" : "الشحن والاستبدال"}</Link><Link to="/contact">{isEnglish ? "Contact us" : "تواصلي معنا"}</Link></div></div><div><h3 className="mb-5 text-[11px] font-bold">{isEnglish ? "Stay in the know" : "خليكي على اطلاع"}</h3><p className="mb-4 text-[12px] leading-6 text-[#1c2822]/60">{isEnglish ? "Subscribe for first access to every new drop." : "اشتركي عشان تعرفي كل جديد قبل أي حد."}</p>{subscribed ? <p className="text-[12px] font-bold text-[#d4775c]">{isEnglish ? "You are subscribed. Welcome in." : "تم الاشتراك بنجاح، أهلاً بكِ."}</p> : <form onSubmit={(event) => { event.preventDefault(); if (email) setSubscribed(true); }} className="flex border-b border-[#1c2822]"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="بريدك الإلكتروني" className="min-w-0 flex-1 bg-transparent py-3 text-[12px] outline-none placeholder:text-[#1c2822]/40" /><button aria-label="اشتراك"><ArrowLeft size={17} /></button></form>}</div></div><div className="flex flex-col justify-between gap-3 pt-6 text-[10px] text-[#1c2822]/45 sm:flex-row"><span className="flex flex-col gap-1"><span>صنع بحب في القاهره 2026</span><span>تم التطوير بواسطه فريق</span><a href="https://wa.me/201553003040" target="_blank" rel="noreferrer" className="underline underline-offset-2">Casper.Dev</a></span><span /></div></div></footer>
    </main>
  </StoreContext.Provider>;
}

export function ProductCard({ product, index }: { product: StoreProduct; index: number }) {
  const { liked, toggleLike, addToCart, cartItems, language } = useStore();
  const added = cartItems.some((item) => item.product.id === product.id);
  const navigate = useNavigate();
  const productName = getProductName(product, language);
  const isEnglish = language === "en";
  const colors = getProductColors(product);
  const sizes = product.sizes === undefined ? ["S", "M", "L", "XL", "XXL"] : product.sizes;
  const discount = getProductDiscount(product);
  const hasDiscount = discount !== null;
  const originalPrice = product.originalPrice ?? product.numericPrice;
  const salePrice = product.salePrice ?? product.numericPrice;
  const badge = hasDiscount ? getProductBadge(product) || `-${discount}%` : getProductBadge(product);
  const openProduct = () => navigate(`/product/${product.id}`);
  return <article className="group min-w-0 cursor-pointer" onClick={openProduct} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openProduct(); }} role="link" tabIndex={0}><div className="relative aspect-[.82] overflow-hidden rounded-2xl bg-[#f0f0ee]"><Link to={`/product/${product.id}`} className="block h-full"><img src={product.image} alt={productName} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></Link>{badge && <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold ${hasDiscount ? "bg-[#d4775c] text-white" : "bg-white/90"}`}>{isEnglish ? (badge === "جديد" ? "New" : badge === "الأكثر مبيعاً" ? "Bestseller" : badge) : badge}</span>}<button onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); toggleLike(index); }} className="absolute left-3 top-3 text-lg" aria-label={isEnglish ? "Add to wishlist" : "إضافة للمفضلة"}><span className={liked.includes(index) ? "text-[#d4775c]" : "text-white drop-shadow"}>♥</span></button><button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); addToCart(product); }} className={`absolute right-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-full text-[#171717] transition hover:bg-[#171717] hover:text-white ${added ? "bg-black text-white" : "bg-[#e9e3d7]"}`} aria-label={isEnglish ? "Add to cart" : "إضافة إلى السلة"}><ShoppingBag size={16} strokeWidth={1.5} /></button></div><div className="mt-4 text-center"><h3 className="text-[13px] font-medium"><Link to={`/product/${product.id}`} onClick={(event) => event.stopPropagation()} className="transition hover:underline">{productName}</Link></h3><div className="mt-1 flex items-baseline gap-2 text-[12px]">{hasDiscount && <span className="mx-auto text-black/40 line-through">{formatProductAmount(originalPrice, language)}</span>}<span className={hasDiscount ? "mx-auto font-semibold" : "mx-auto text-black/50"}>{hasDiscount ? formatProductAmount(salePrice, language) : getProductPrice(product, language)}</span></div><div className="mt-2 flex justify-center gap-1.5" aria-label={isEnglish ? "Available colors" : "الألوان المتاحة"}>{colors.map((color) => <span key={color} className="h-3 w-3 rounded-full border border-black/15" style={{ backgroundColor: color }} />)}</div>{sizes.length > 0 && <div className="mt-2 flex flex-wrap justify-center gap-1" aria-label="Available sizes">{sizes.map((size) => <span key={size} className="inline-flex h-5 min-w-6 items-center justify-center border border-black/15 px-1.5 text-[9px] text-black/55">{size}</span>)}</div>}</div></article>;
}
