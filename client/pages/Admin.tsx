import { useEffect, useState } from "react";
import { BarChart3, ImagePlus, LayoutDashboard, LogOut, Palette, Plus, Save, Settings, Trash2, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore, type PageSettings, type SectionSettings, type SiteSettings, type StoreProduct } from "@/components/store/StoreLayout";
import { exportLegacyStoreData, importLegacyStoreData } from "@/lib/store-migration";

const categories = ["Sets", "Blouses / shirts", "Skirts / pants", "Denims", "Dresses"];
const categoryLabels: Record<string, string> = { Sets: "Sets", "Blouses / shirts": "Blouses / shirts", "Skirts / pants": "Skirts / pants", Denims: "Denims", Dresses: "Dresses" };
const emptyProduct: StoreProduct = {
  id: "",
  name: "",
  price: "",
  numericPrice: 0,
  originalPrice: 0,
  salePrice: undefined,
  badge: "",
  category: "Dresses",
  image: "",
  tag: "",
  stock: 10,
  lowStockThreshold: 3,
  colors: ["#222222"],
  sizes: ["S", "M", "L"],
  images: [""],
};
const sectionOptions = [
  ["arrivals", "New Collection"],
  ["categories", "Shop by category"],
  ["editorial", "Effortless style"],
  ["discover", "Discover your style"],
  ["sets", "Sets"],
  ["tops", "Blouses / shirts"],
  ["pants", "Skirts / pants"],
  ["dresses", "Dresses"],
];
const inputClass = "admin-input";

const readFile = (file: File, callback: (value: string) => void) => {
  const reader = new FileReader();
  reader.onload = () => callback(String(reader.result));
  reader.readAsDataURL(file);
};

function AssetField({ label, value, accept, onChange, isEnglish }: { label: string; value: string; accept: string; onChange: (value: string) => void; isEnglish: boolean }) {
  return (
    <label className="block text-[11px] font-bold">
      {label}
      <div className="mt-2 flex gap-2">
        <input value={value.startsWith("data:") ? "ملف محلي مرفوع" : value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} mt-0`} placeholder={isEnglish ? "Or paste a direct file URL" : "أو الصقي رابط الملف"} />
        <label className="flex shrink-0 cursor-pointer items-center justify-center border border-[#1c2822]/15 px-3 text-[10px] font-normal">
          <Upload size={14} />
          <input type="file" accept={accept} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) readFile(file, onChange); }} />
        </label>
      </div>
    </label>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { catalog, siteSettings, sections, pageSettings, coupons, orders, addProduct, updateProduct, deleteProduct, updateSiteSettings, updateSection, updatePageSettings, addCoupon, deleteCoupon } = useStore();
  const isEnglish = true;
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState<StoreProduct>(emptyProduct);
  const [sizesInput, setSizesInput] = useState((emptyProduct.sizes || []).join(", "));
  const [imagesInput, setImagesInput] = useState<string[]>(emptyProduct.images || [emptyProduct.image]);
  const [editing, setEditing] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(siteSettings);
  const [sectionKey, setSectionKey] = useState("arrivals");
  const [pageKey, setPageKey] = useState<keyof PageSettings>("about");
  const [pageDraft, setPageDraft] = useState<PageSettings>(pageSettings);
  const [coupon, setCoupon] = useState({ code: "", discount: 10 });
  const [saved, setSaved] = useState(false);

  useEffect(() => setSettings(siteSettings), [siteSettings]);
  useEffect(() => setPageDraft(pageSettings), [pageSettings]);

  const lowStock = catalog.filter((product) => (product.stock ?? 0) <= (product.lowStockThreshold ?? 3));
  const sales = orders.reduce((total, order) => total + order.total, 0);
  const currentSection: SectionSettings = sections[sectionKey] || { title: "", description: "", image: "" };
  const notify = () => { setSaved(true); window.setTimeout(() => setSaved(false), 2200); };
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    navigate("/admin/login", { replace: true });
  };
  const importData = async (file: File) => {
    try {
      const result = await importLegacyStoreData(file);
      window.alert(`${result.imported.products} products and ${result.imported.coupons} coupons imported. ${result.ordersSkipped} old orders skipped.`);
      window.location.reload();
    } catch {
      window.alert(isEnglish ? "Unable to import legacy data." : "تعذر استيراد البيانات القديمة.");
    }
  };
  const updateField = <K extends keyof StoreProduct>(field: K, value: StoreProduct[K]) => setForm((current) => ({ ...current, [field]: value }));
  const updateColor = (index: number, value: string) => setForm((current) => ({ ...current, colors: (current.colors || []).map((color, colorIndex) => colorIndex === index ? value : color) }));
  const updateImage = (index: number, value: string) => {
    setImagesInput((current) => current.map((image, imageIndex) => imageIndex === index ? value : image));
    if (index === 0) updateField("image", value);
  };
  const setImageCount = (value: string) => {
    const count = Math.min(5, Math.max(1, Number(value) || 1));
    setImagesInput((current) => Array.from({ length: count }, (_, index) => current[index] || ""));
  };
  const addColor = () => setForm((current) => ({ ...current, colors: [...(current.colors || []), "#222222"] }));
  const removeColor = (index: number) => setForm((current) => ({ ...current, colors: (current.colors || []).filter((_, colorIndex) => colorIndex !== index) }));
  const updateDiscoverVideo = (index: number, value: string) => setSettings((current) => { const discoverVideos = [...(current.discoverVideos || [])]; while (discoverVideos.length < 4) discoverVideos.push(""); discoverVideos[index] = value; return { ...current, discoverVideos }; });
  const startNewProduct = () => { setForm(emptyProduct); setSizesInput((emptyProduct.sizes || []).join(", ")); setImagesInput(emptyProduct.images || [emptyProduct.image]); setEditing(false); setActiveTab("products"); window.scrollTo(0, 0); };
  const editProduct = (product: StoreProduct) => { const images = product.images?.length ? [...product.images] : [product.image]; setForm({ ...product, image: images[0] || product.image, images, colors: product.colors?.length ? product.colors : ["#222222"], sizes: product.sizes || [] }); setSizesInput((product.sizes || []).join(", ")); setImagesInput(images); setEditing(true); setActiveTab("products"); window.scrollTo(0, 0); };
  const removeProduct = async (id: string) => { if (window.confirm(isEnglish ? "Delete this product?" : "هل تريدين حذف هذا المنتج؟")) { try { await deleteProduct(id); if (form.id === id) { setForm(emptyProduct); setEditing(false); } notify(); } catch { window.alert(isEnglish ? "Unable to save changes." : "تعذر حفظ التغييرات."); } } };
  const submitProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    const originalPrice = Number(form.originalPrice || form.numericPrice);
    const enteredSalePrice = Number(form.salePrice || 0);
    const hasDiscount = enteredSalePrice > 0 && enteredSalePrice < originalPrice;
    const currentPrice = hasDiscount ? enteredSalePrice : originalPrice;
    const product: StoreProduct = {
      ...form,
      id: form.id || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `product-${Date.now()}`,
      price: `${currentPrice.toLocaleString("en-US")} ج.م`,
      numericPrice: currentPrice,
      originalPrice,
      salePrice: hasDiscount ? enteredSalePrice : undefined,
      badge: form.badge?.trim() || undefined,
      stock: Number(form.stock || 0),
      lowStockThreshold: Number(form.lowStockThreshold || 3),
      colors: form.colors?.length ? form.colors : ["#222222"],
      sizes: sizesInput.split(",").map((size) => size.trim()).filter(Boolean),
      image: imagesInput[0] || form.image,
      images: imagesInput.filter(Boolean),
    };
    try { if (editing) await updateProduct(product); else await addProduct(product); } catch { window.alert(isEnglish ? "Unable to save product." : "تعذر حفظ المنتج."); return; }
    setForm(emptyProduct);
    setSizesInput((emptyProduct.sizes || []).join(", "));
    setImagesInput(emptyProduct.images || [emptyProduct.image]);
    setEditing(false);
    notify();
  };
  const saveSettings = async (event: React.FormEvent) => { event.preventDefault(); try { await updateSiteSettings(settings); notify(); } catch { window.alert(isEnglish ? "Unable to save settings." : "تعذر حفظ الإعدادات."); } };
  const saveSection = async (event: React.FormEvent) => { event.preventDefault(); try { await updateSection(sectionKey, currentSection); notify(); } catch { window.alert(isEnglish ? "Unable to save section." : "تعذر حفظ القسم."); } };
  const currentPage = pageDraft[pageKey] as Record<string, string>;
  const updatePageField = (field: string, value: string) => setPageDraft((current) => ({ ...current, [pageKey]: { ...(current[pageKey] as Record<string, string>), [field]: value } } as PageSettings));
  const savePage = async (event: React.FormEvent) => { event.preventDefault(); try { await updatePageSettings(pageDraft); notify(); } catch { window.alert(isEnglish ? "Unable to save pages." : "تعذر حفظ الصفحات."); } };
  const updateSectionField = (field: keyof SectionSettings, value: string) => updateSection(sectionKey, { ...currentSection, [field]: value });
  const createCoupon = async (event: React.FormEvent) => { event.preventDefault(); const code = coupon.code.trim().toUpperCase(); if (!code) return; try { await addCoupon({ code, discount: Number(coupon.discount), uses: 0, active: true }); setCoupon({ code: "", discount: 10 }); notify(); } catch { window.alert(isEnglish ? "Unable to create coupon." : "تعذر إنشاء الكوبون."); } };
  const removeCoupon = async (code: string) => { if (window.confirm(isEnglish ? "Delete this coupon?" : "هل تريدين حذف هذا الكوبون؟")) { try { await deleteCoupon(code); notify(); } catch { window.alert(isEnglish ? "Unable to delete coupon." : "تعذر حذف الكوبون."); } } };
  const pageFields = pageKey === "about" ? ["titleAr", "titleEn", "introAr", "introEn", "beliefTitleAr", "beliefTitleEn", "bodyAr", "bodyEn", "body2Ar", "body2En", "image1", "image2"] : pageKey === "contact" ? ["titleAr", "titleEn", "contentAr", "contentEn", "recipientEmail"] : ["titleAr", "titleEn", "contentAr", "contentEn"];
  const pageLabel = (field: string) => field === "image1" ? (isEnglish ? "About image 1" : "صورة About الأولى") : field === "image2" ? (isEnglish ? "About image 2" : "صورة About الثانية") : field === "recipientEmail" ? (isEnglish ? "Recipient email" : "البريد المستلم") : field.endsWith("Ar") ? `${isEnglish ? "Arabic" : "العربية"} ${field.replace("Ar", "")}` : `${isEnglish ? "English" : "الإنجليزية"} ${field.replace("En", "")}`;
  const tabs = [
    { id: "overview", label: isEnglish ? "Overview" : "نظرة عامة", icon: LayoutDashboard },
    { id: "products", label: isEnglish ? "Products & inventory" : "المنتجات والمخزون", icon: ImagePlus },
    { id: "content", label: isEnglish ? "Content & design" : "محتوى وتصميم", icon: Settings },
    { id: "pages", label: isEnglish ? "Pages" : "الصفحات", icon: LayoutDashboard },
    { id: "coupons", label: isEnglish ? "Coupons" : "كوبونات", icon: Palette },
    { id: "reports", label: isEnglish ? "Sales & orders" : "المبيعات والطلبات", icon: BarChart3 },
  ];
  const tabGroups = [
    { title: isEnglish ? "Control center" : "مركز التحكم", items: [tabs[0], tabs[1]] },
    { title: isEnglish ? "Content" : "المحتوى", items: [tabs[2], tabs[3]] },
    { title: isEnglish ? "Marketing" : "التسويق", items: [tabs[4], tabs[5]] },
  ];
  const totalCouponUses = coupons.reduce((sum, coupon) => sum + coupon.uses, 0);
  const bestProduct = catalog.reduce<{ product: StoreProduct | null; score: number }>((best, product) => {
    const score = (product.numericPrice || 0) * Math.max(1, product.stock || 0);
    return score > best.score ? { product, score } : best;
  }, { product: null, score: 0 });
  const categoryPerformance = Object.entries(
    catalog.reduce<Record<string, number>>((result, product) => {
      const category = product.category || "غير محدد";
      result[category] = (result[category] || 0) + (product.numericPrice || 0) * Math.max(1, product.stock || 0);
      return result;
    }, {})
  ).sort(([, a], [, b]) => b - a).slice(0, 4);
  const couponPerformance = coupons.length
    ? coupons.map((coupon) => {
        const share = totalCouponUses ? coupon.uses / totalCouponUses : 0;
        const estimatedSales = Math.round((sales || 0) * share * (1 + coupon.discount / 100));
        return {
          ...coupon,
          estimatedSales,
          share,
        };
      })
    : [];
  const highestCoupon = couponPerformance.reduce<{ code: string; estimatedSales: number }>((best, coupon) => {
    if (coupon.estimatedSales > best.estimatedSales) return { code: coupon.code, estimatedSales: coupon.estimatedSales };
    return best;
  }, { code: isEnglish ? "No code" : "لا يوجد", estimatedSales: 0 });

  return (
    <section className="admin-shell min-h-[calc(100vh-110px)] px-5 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1320px]">
        <div className="dashboard-topbar mb-8">
          <div>
            <p className="dashboard-kicker">NO NAME CONTROL</p>
            <h1 className="dashboard-title">{isEnglish ? "Admin dashboard" : "لوحة التحكم"}</h1>
            <p className="dashboard-subtitle">{isEnglish ? "Manage content, products, and sales from one place." : "إدارة المحتوى والمنتجات والمبيعات من مكان واحد."}</p>
          </div>
          <div className="dashboard-actions">
            {saved && <div className="dashboard-toast">{isEnglish ? "Saved successfully" : "تم الحفظ بنجاح"}</div>}
            <button type="button" onClick={exportLegacyStoreData} className="dashboard-action-button">{isEnglish ? "Export legacy data" : "تصدير البيانات القديمة"}</button><label className="dashboard-action-button cursor-pointer">{isEnglish ? "Import legacy data" : "استيراد البيانات القديمة"}<input type="file" accept="application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importData(file); }} /></label><button type="button" onClick={() => navigate("/")} className="dashboard-action-button">{isEnglish ? "View site" : "عرض الموقع"}</button><button type="button" onClick={logout} className="dashboard-action-button flex items-center gap-2"><LogOut size={14} />{isEnglish ? "Sign out" : "تسجيل الخروج"}</button>
          </div>
        </div>

        <div className="admin-layout"><aside className="admin-sidebar"><div className="mb-5 px-2 text-[9px] font-bold tracking-[0.2em] text-[#d8c799]">NO NAME / CONTROL</div>{tabGroups.map((group) => <div key={group.title} className="sidebar-group"><div className="sidebar-group-title">{group.title}</div>{group.items.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => setActiveTab(id)} className={`admin-tab flex shrink-0 items-center gap-3 px-4 py-3 text-[11px] ${activeTab === id ? "admin-tab-active" : ""}`}><Icon size={15} />{label}</button>)}</div>)}</aside><div className="admin-workspace min-w-0">

        {activeTab === "overview" && <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[[isEnglish ? "Total products" : "إجمالي المنتجات", catalog.length, ""], [isEnglish ? "Stock alerts" : "تنبيهات المخزون", lowStock.length, "text-[#c95f49]"], [isEnglish ? "Total orders" : "إجمالي الطلبات", orders.length, ""], [isEnglish ? "Total sales" : "إجمالي المبيعات", `${sales.toLocaleString("en-US")} ج.م`, ""]].map(([label, value, color]) => <div key={String(label)} className="dashboard-stat-card"><p className="stat-label">{label}</p><p className={`stat-value ${color}`}>{value}</p></div>)}</div>
          <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="admin-panel p-6">
              <div className="panel-header"><h2>{isEnglish ? "Sales overview" : "ملخص المبيعات"}</h2><span>{isEnglish ? "This month" : "هذا الشهر"}</span></div>
              <div className="sales-grid mt-5">
                {[{ label: isEnglish ? "Gross revenue" : "إجمالي الإيرادات", value: `${sales.toLocaleString("en-US")} ج.م`, tone: "gold" }, { label: isEnglish ? "Avg. order" : "متوسط الطلب", value: `${Math.round(sales / Math.max(1, orders.length)).toLocaleString("en-US")} ج.م`, tone: "dark" }, { label: isEnglish ? "Best coupon" : "أفضل كوبون", value: highestCoupon.code, tone: "accent" }, { label: isEnglish ? "Top category" : "أفضل قسم", value: categoryPerformance[0]?.[0] || "-", tone: "soft" }].map((item) => <div key={item.label} className={`sales-metric sales-metric-${item.tone}`}><span>{item.label}</span><strong>{item.value}</strong></div>)}
              </div>
            </div>
            <div className="admin-panel p-6">
              <div className="panel-header"><h2>{isEnglish ? "Best performer" : "الأكثر ربحية"}</h2></div>
              <div className="top-product-box">
                <div className="top-product-image" style={{ backgroundImage: `url(${bestProduct.product?.image || ""})` }} />
                <div>
                  <p className="top-product-label">{isEnglish ? "Top product" : "المنتج الأعلى ربحاً"}</p>
                  <h3>{bestProduct.product?.name || (isEnglish ? "No product" : "لا يوجد منتج")}</h3>
                  <p>{isEnglish ? "Estimated value" : "القيمة المقدرة"}: <strong>{bestProduct.product ? `${((bestProduct.product.numericPrice || 0) * Math.max(1, bestProduct.product.stock || 0)).toLocaleString("en-US")} ج.م` : "0 ج.م"}</strong></p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-8 lg:grid-cols-2"><div className="admin-panel p-6"><h2 className="mb-5 text-xl">{isEnglish ? "Stock alerts" : "تنبيهات المنتجات"}</h2>{lowStock.length ? <div className="space-y-3">{lowStock.slice(0, 8).map((product) => <div key={product.id} className="flex items-center justify-between border-b border-black/10 pb-3 text-[11px]"><span>{product.name}</span><span className="font-bold text-[#c95f49]">{isEnglish ? `${product.stock ?? 0} left` : `متبقي ${product.stock ?? 0}`}</span></div>)}</div> : <p className="text-[12px] text-black/50">{isEnglish ? "No low-stock products." : "لا توجد منتجات منخفضة المخزون."}</p>}</div><div className="admin-panel p-6"><h2 className="mb-5 text-xl">{isEnglish ? "Quick actions" : "إجراءات سريعة"}</h2><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={startNewProduct} className="quick-action flex items-center gap-3 p-4 text-right text-[11px]"><Plus size={16} />{isEnglish ? "Add product" : "إضافة منتج"}</button><button type="button" onClick={() => setActiveTab("content")} className="quick-action flex items-center gap-3 p-4 text-right text-[11px]"><Settings size={16} />{isEnglish ? "Edit site content" : "تعديل محتوى الموقع"}</button><button type="button" onClick={() => setActiveTab("coupons")} className="quick-action flex items-center gap-3 p-4 text-right text-[11px]"><Palette size={16} />{isEnglish ? "Create coupon" : "إنشاء كوبون"}</button><button type="button" onClick={() => setActiveTab("reports")} className="quick-action flex items-center gap-3 p-4 text-right text-[11px]"><BarChart3 size={16} />{isEnglish ? "View reports" : "عرض التقارير"}</button></div></div></div>
        </div>}

        {activeTab === "products" && <div className="space-y-8"><form onSubmit={submitProduct} className="bg-[#f6f3ee] p-6 shadow-sm sm:p-8"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl">{editing ? (isEnglish ? "Edit product" : "تعديل المنتج") : (isEnglish ? "Add product" : "إضافة منتج")}</h2><p className="mt-2 text-[11px] text-black/50">{isEnglish ? "Add images from your device or use a direct link." : "أضيفي الصور من الجهاز أو من رابط مباشر."}</p></div><div className="flex gap-2"><button type="button" onClick={startNewProduct} className="border border-black/15 p-2" aria-label={isEnglish ? "Clear form" : "مسح النموذج"}><X size={16} /></button><ImagePlus className="text-[#d4775c]" size={23} /></div></div><div className="grid gap-4 md:grid-cols-2"><label className="block text-[11px] font-bold">{isEnglish ? "Arabic product name" : "اسم المنتج"}<input required value={form.name} onChange={(event) => updateField("name", event.target.value)} className={inputClass} /></label><label className="block text-[11px] font-bold">{isEnglish ? "English product name" : "اسم المنتج بالإنجليزية"}<input value={form.nameEn || ""} onChange={(event) => updateField("nameEn", event.target.value)} className={inputClass} placeholder="Optional" /></label><label className="block text-[11px] font-bold">{isEnglish ? "Original price" : "السعر الأساسي قبل الخصم"}<input required type="number" min="0" value={form.originalPrice || form.numericPrice || ""} onChange={(event) => updateField("originalPrice", Number(event.target.value))} className={inputClass} /></label><label className="block text-[11px] font-bold">{isEnglish ? "Sale price" : "السعر الجديد بعد الخصم"}<input type="number" min="0" value={form.salePrice ?? ""} onChange={(event) => updateField("salePrice", event.target.value ? Number(event.target.value) : undefined)} className={inputClass} placeholder={isEnglish ? "Optional" : "اختياري"} /></label><label className="block text-[11px] font-bold">{isEnglish ? "Category" : "القسم"}<select value={form.category} onChange={(event) => updateField("category", event.target.value as StoreProduct["category"])} className={inputClass}>{categories.map((category) => <option key={category} value={category}>{isEnglish ? categoryLabels[category] : category}</option>)}</select></label><label className="block text-[11px] font-bold">{isEnglish ? "Stock" : "الكمية"}<input type="number" min="0" value={form.stock ?? 0} onChange={(event) => updateField("stock", Number(event.target.value))} className={inputClass} /></label><label className="block text-[11px] font-bold">{isEnglish ? "Low-stock threshold" : "حد التنبيه"}<input type="number" min="0" value={form.lowStockThreshold ?? 0} onChange={(event) => updateField("lowStockThreshold", Number(event.target.value))} className={inputClass} /></label><label className="block text-[11px] font-bold">{isEnglish ? "Product badge" : "شارة المنتج"}<input value={form.badge ?? form.tag ?? ""} onChange={(event) => updateField("badge", event.target.value)} className={inputClass} placeholder={isEnglish ? "NEW or -40%" : "مثال: NEW أو -40%"} /></label><div className="block text-[11px] font-bold"><div className="flex items-center justify-between"><span>{isEnglish ? "Available colors" : "الألوان المتاحة"}</span><button type="button" onClick={addColor} className="text-[#d4775c]">+ {isEnglish ? "Add color" : "إضافة لون"}</button></div><div className="mt-2 space-y-2">{(form.colors || []).map((color, colorIndex) => <div key={`${color}-${colorIndex}`} className="flex items-center gap-2"><input type="color" value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#222222"} onChange={(event) => updateColor(colorIndex, event.target.value)} className="h-10 w-12 cursor-pointer border-0 bg-transparent p-0" /><input value={color} onChange={(event) => updateColor(colorIndex, event.target.value)} className={`${inputClass} mt-0`} placeholder="#222222" /><button type="button" onClick={() => removeColor(colorIndex)} className="p-2 text-[#c95f49]" aria-label={isEnglish ? "Remove color" : "حذف اللون"}><Trash2 size={14} /></button></div>)}</div></div><label className="block text-[11px] font-bold">{isEnglish ? "Sizes" : "المقاسات"}<input type="text" value={sizesInput} onChange={(event) => setSizesInput(event.target.value)} className={inputClass} placeholder="S, M, L, XL, XXL" /></label><label className="block text-[11px] font-bold">{isEnglish ? "Arabic description" : "الوصف"}<textarea value={form.description || ""} onChange={(event) => updateField("description", event.target.value)} className={`${inputClass} min-h-24`} /></label><label className="block text-[11px] font-bold">{isEnglish ? "English description" : "الوصف بالإنجليزية"}<textarea value={form.descriptionEn || ""} onChange={(event) => updateField("descriptionEn", event.target.value)} className={`${inputClass} min-h-24`} /></label><div className="md:col-span-2 space-y-4"><label className="block text-[11px] font-bold">{isEnglish ? "Number of product images" : "عدد صور المنتج"}<select value={imagesInput.length} onChange={(event) => setImageCount(event.target.value)} className={inputClass}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label><div className="grid gap-4 md:grid-cols-2">{imagesInput.map((image, index) => <AssetField key={index} isEnglish={isEnglish} label={isEnglish ? `Product image ${index + 1}` : `صورة المنتج ${index + 1}`} value={image} accept="image/*" onChange={(value) => updateImage(index, value)} />)}</div></div><div className="md:col-span-2"><AssetField isEnglish={isEnglish} label={isEnglish ? "Product video" : "فيديو المنتج"} value={form.video || ""} accept="video/*" onChange={(value) => updateField("video", value)} /></div></div><button className="mt-6 flex w-full items-center justify-center gap-2 bg-[#1c2822] py-3 text-[11px] font-bold text-white"><Save size={15} />{editing ? (isEnglish ? "Update product" : "حفظ تعديل المنتج") : (isEnglish ? "Save product" : "حفظ المنتج")}</button></form><div className="bg-[#f6f3ee] p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-2xl">{isEnglish ? "Catalog" : "المنتجات الحالية"}</h2><span className="text-[11px] text-black/50">{catalog.length} {isEnglish ? "products" : "منتج"}</span></div><div className="grid gap-3">{catalog.map((product) => <div key={product.id} className="flex items-center gap-4 border-b border-black/10 pb-3"><img src={product.image} alt="" className="h-16 w-14 object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold">{product.name}</p><p className="mt-1 text-[10px] text-black/50">{product.price} · {isEnglish ? `${product.stock ?? 0} in stock` : `المخزون ${product.stock ?? 0}`}</p></div><button type="button" onClick={() => editProduct(product)} className="border border-black/15 px-3 py-2 text-[10px]">{isEnglish ? "Edit" : "تعديل"}</button><button type="button" onClick={() => removeProduct(product.id)} className="p-2 text-[#c95f49]" aria-label={isEnglish ? "Delete product" : "حذف المنتج"}><Trash2 size={16} /></button></div>)}</div></div></div>}

        {activeTab === "content" && <div className="grid gap-8 lg:grid-cols-2"><form onSubmit={saveSettings} className="space-y-4 bg-[#f6f3ee] p-6"><h2 className="mb-4 text-2xl">{isEnglish ? "Site settings" : "إعدادات الموقع"}</h2><label className="block text-[11px] font-bold">{isEnglish ? "Announcement" : "الإعلان العلوي"}<textarea value={settings.announcement} onChange={(event) => setSettings({ ...settings, announcement: event.target.value })} className={`${inputClass} min-h-24`} /></label><label className="block text-[11px] font-bold">{isEnglish ? "Hero title" : "عنوان الهيرو"}<input value={settings.heroTitle || ""} onChange={(event) => setSettings({ ...settings, heroTitle: event.target.value })} className={inputClass} /></label><label className="block text-[11px] font-bold">{isEnglish ? "Hero description" : "وصف الهيرو"}<textarea value={settings.heroDescription || ""} onChange={(event) => setSettings({ ...settings, heroDescription: event.target.value })} className={`${inputClass} min-h-24`} /></label><label className="block text-[11px] font-bold">{isEnglish ? "Accent color" : "اللون الأساسي"}<input type="color" value={settings.accent} onChange={(event) => setSettings({ ...settings, accent: event.target.value })} className="mt-2 h-12 w-full cursor-pointer" /></label><label className="block text-[11px] font-bold">{isEnglish ? "E-wallet transfer number" : "رقم تحويل المحفظة الإلكترونية"}<input type="text" value={settings.walletNumber || ""} onChange={(event) => setSettings({ ...settings, walletNumber: event.target.value })} className={inputClass} placeholder="01xxxxxxxxx" /></label><label className="block text-[11px] font-bold">{isEnglish ? "InstaPay transfer number" : "رقم تحويل InstaPay"}<input type="text" value={settings.instapayNumber || ""} onChange={(event) => setSettings({ ...settings, instapayNumber: event.target.value })} className={inputClass} placeholder="InstaPay address or number" /></label><label className="block text-[11px] font-bold">{isEnglish ? "Sales WhatsApp number" : "رقم واتساب المبيعات"}<input type="text" inputMode="numeric" value={settings.salesWhatsappNumber || ""} onChange={(event) => setSettings({ ...settings, salesWhatsappNumber: event.target.value.replace(/\D/g, "") })} className={inputClass} placeholder="201xxxxxxxxx" /></label><label className="block text-[11px] font-bold">{isEnglish ? "Sales WhatsApp URL" : "رابط واتساب المبيعات"}<input type="url" value={settings.salesWhatsappUrl || ""} onChange={(event) => setSettings({ ...settings, salesWhatsappUrl: event.target.value })} className={inputClass} placeholder="https://wa.me/201xxxxxxxxx" /></label><div className="space-y-3 border-t border-black/10 pt-4"><h3 className="text-[12px] font-bold">{isEnglish ? "Social account links" : "روابط حسابات التواصل"}</h3>{(["instagram", "facebook", "youtube", "whatsapp", "tiktok"] as const).map((social) => <label key={social} className="block text-[11px] font-bold">{social}<input type="url" value={settings.socialLinks?.[social] || ""} onChange={(event) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, [social]: event.target.value } })} className={inputClass} placeholder="https://" /></label>)}</div><div className="space-y-4 border-t border-black/10 pt-4"><div><h3 className="text-[12px] font-bold">{isEnglish ? "Discover your style videos" : "فيديوهات اكتشفي أسلوبك"}</h3><p className="mt-1 text-[10px] text-black/50">{isEnglish ? "Each video controls one card in the Discover section." : "كل فيديو يتحكم في بطاقة مستقلة داخل قسم اكتشفي أسلوبك."}</p></div>{[0, 1, 2, 3].map((videoIndex) => <AssetField key={videoIndex} isEnglish={isEnglish} label={`${isEnglish ? "Video" : "الفيديو"} ${videoIndex + 1}`} value={settings.discoverVideos?.[videoIndex] || ""} accept="video/*" onChange={(value) => updateDiscoverVideo(videoIndex, value)} />)}</div><button className="flex w-full items-center justify-center gap-2 bg-[#1c2822] py-3 text-[11px] font-bold text-white"><Save size={15} />{isEnglish ? "Save site settings" : "حفظ إعدادات الموقع"}</button></form><form onSubmit={saveSection} className="space-y-4 bg-[#f6f3ee] p-6"><h2 className="mb-4 text-2xl">{isEnglish ? "Section content" : "محتوى الأقسام"}</h2><select value={sectionKey} onChange={(event) => setSectionKey(event.target.value)} className={`${inputClass} mt-0`}>{sectionOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><label className="block text-[11px] font-bold">{isEnglish ? "Section title" : "عنوان القسم"}<input value={currentSection.title} onChange={(event) => updateSectionField("title", event.target.value)} className={inputClass} /></label><label className="block text-[11px] font-bold">{isEnglish ? "Section description" : "وصف القسم"}<textarea value={currentSection.description} onChange={(event) => updateSectionField("description", event.target.value)} className={`${inputClass} min-h-28`} /></label><AssetField isEnglish={isEnglish} label={isEnglish ? "Section image" : "صورة القسم"} value={currentSection.image} accept="image/*" onChange={(value) => updateSectionField("image", value)} /><AssetField isEnglish={isEnglish} label={isEnglish ? "Section video" : "فيديو القسم"} value={currentSection.video || ""} accept="video/*" onChange={(value) => updateSectionField("video", value)} /><button className="flex w-full items-center justify-center gap-2 bg-[#1c2822] py-3 text-[11px] font-bold text-white"><Save size={15} />{isEnglish ? "Save section" : "حفظ القسم"}</button></form></div>}

        {activeTab === "pages" && <form onSubmit={savePage} className="space-y-6 bg-[#f6f3ee] p-6 sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-2xl">{isEnglish ? "Informational pages" : "صفحات الموقع"}</h2><p className="mt-2 text-[11px] text-black/50">{isEnglish ? "Edit About, shipping, and contact content." : "عدّلي محتوى About والشحن والتواصل."}</p></div><select value={pageKey} onChange={(event) => setPageKey(event.target.value as keyof PageSettings)} className={`${inputClass} mt-0 max-w-xs`}><option value="about">{isEnglish ? "About no name" : "عن no name"}</option><option value="shipping">{isEnglish ? "Shipping & returns" : "الشحن والاستبدال"}</option><option value="contact">{isEnglish ? "Contact us" : "تواصلي معنا"}</option></select></div><div className="grid gap-4 md:grid-cols-2">{pageFields.map((field) => field === "image1" || field === "image2" ? <AssetField key={field} label={pageLabel(field)} value={currentPage[field] || ""} accept="image/*" onChange={(value) => updatePageField(field, value)} isEnglish={isEnglish} /> : <label key={field} className="block text-[11px] font-bold">{pageLabel(field)}{field.includes("body") || field.includes("intro") || field.includes("content") ? <textarea value={currentPage[field] || ""} onChange={(event) => updatePageField(field, event.target.value)} className={`${inputClass} min-h-28`} /> : <input type={field === "recipientEmail" ? "email" : "text"} value={currentPage[field] || ""} onChange={(event) => updatePageField(field, event.target.value)} className={inputClass} placeholder={field === "recipientEmail" ? "name@example.com" : undefined} />}</label>)}</div><button className="flex items-center gap-2 bg-[#1c2822] px-6 py-3 text-[11px] font-bold text-white"><Save size={15} />{isEnglish ? "Save page" : "حفظ الصفحة"}</button></form>}

        {activeTab === "coupons" && <div className="grid gap-8 xl:grid-cols-[.7fr_1.3fr]"><form onSubmit={createCoupon} className="admin-panel p-6"><h2 className="mb-5 text-2xl">{isEnglish ? "Create coupon" : "إنشاء كود خصم"}</h2><label className="block text-[11px] font-bold">{isEnglish ? "Code" : "الكود"}<input required value={coupon.code} onChange={(event) => setCoupon({ ...coupon, code: event.target.value })} className={inputClass} placeholder="WELCOME10" /></label><label className="mt-4 block text-[11px] font-bold">{isEnglish ? "Discount percentage" : "نسبة الخصم"}<input required type="number" min="1" max="100" value={coupon.discount} onChange={(event) => setCoupon({ ...coupon, discount: Number(event.target.value) })} className={inputClass} /></label><button className="mt-5 flex w-full items-center justify-center gap-2 bg-[#1c2822] py-3 text-[11px] font-bold text-white"><Plus size={15} />{isEnglish ? "Create coupon" : "إنشاء الكود"}</button></form><div className="space-y-4">{coupons.length ? coupons.map((item) => { const couponSale = Math.round((sales * (item.uses / Math.max(1, totalCouponUses || 1))) * (1 + item.discount / 120)); return <div key={item.code} className="admin-panel p-4"><div className="flex items-center justify-between gap-3"><div><div className="coupon-code">{item.code}</div><div className="coupon-meta">{item.discount}% · {item.uses} {isEnglish ? "uses" : "استخدامات"}</div></div><button type="button" onClick={() => removeCoupon(item.code)} className="text-[#c95f49]" aria-label={isEnglish ? "Delete coupon" : "حذف الكوبون"}><Trash2 size={15} /></button></div><div className="mt-4 coupon-report-strip"><span>{isEnglish ? "Estimated sales" : "المبيعات المقدرة"}</span><strong>{couponSale.toLocaleString("en-US")} ج.م</strong></div></div>; }) : <div className="admin-panel p-8 text-center text-[12px] text-black/50">{isEnglish ? "No coupons yet." : "لا توجد أكواد خصم حتى الآن."}</div>}</div></div>}

        {activeTab === "reports" && <div className="space-y-8"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="dashboard-stat-card"><p className="stat-label">{isEnglish ? "Gross sales" : "إجمالي المبيعات"}</p><p className="stat-value">{sales.toLocaleString("en-US")} ج.م</p></div><div className="dashboard-stat-card"><p className="stat-label">{isEnglish ? "Orders" : "الطلبات"}</p><p className="stat-value">{orders.length}</p></div><div className="dashboard-stat-card"><p className="stat-label">{isEnglish ? "Average order" : "متوسط الطلب"}</p><p className="stat-value">{orders.length ? `${Math.round(sales / orders.length).toLocaleString("en-US")} ج.م` : "0 ج.م"}</p></div><div className="dashboard-stat-card"><p className="stat-label">{isEnglish ? "Top category" : "أفضل قسم"}</p><p className="stat-value">{categoryPerformance[0]?.[0] || (isEnglish ? "N/A" : "غير متوفر")}</p></div></div><div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]"><div className="admin-panel p-6"><div className="panel-header"><h2>{isEnglish ? "Products performance" : "أداء المنتجات"}</h2><span>{isEnglish ? "Revenue score" : "نقاط الربح"}</span></div><div className="performance-list mt-5">{catalog.slice(0, 6).map((product) => { const value = (product.numericPrice || 0) * Math.max(1, product.stock || 0); const bar = Math.min(100, Math.max(18, (value / Math.max(1, (catalog.reduce((sum, item) => sum + ((item.numericPrice || 0) * Math.max(1, item.stock || 0)), 0)) || 1)) * 100)); return <div key={product.id} className="mini-list-row"><div className="mini-labels"><span>{product.name}</span><small>{value.toLocaleString("en-US")} ج.م</small></div><div className="mini-bar"><span style={{ width: `${bar}%` }} /></div></div>; }).filter(Boolean)}</div></div><div className="admin-panel p-6"><div className="panel-header"><h2>{isEnglish ? "Coupon report" : "تقرير الكوبونات"}</h2><span>{isEnglish ? "by revenue" : "حسب الإيراد"}</span></div><div className="coupon-list mt-5">{couponPerformance.length ? couponPerformance.slice(0, 5).map((coupon) => <div key={coupon.code} className="coupon-row"><div><strong>{coupon.code}</strong><small>{coupon.discount}% · {coupon.uses} {isEnglish ? "uses" : "استخدام"}</small></div><span>{coupon.estimatedSales.toLocaleString("en-US")} ج.م</span></div>) : <p className="text-[12px] text-black/50">{isEnglish ? "No coupons created yet." : "لا توجد كوبونات منشأة بعد."}</p>}</div></div></div><div className="overflow-x-auto admin-panel p-6"><div className="panel-header"><h2>{isEnglish ? "Recent orders" : "آخر الطلبات"}</h2><span>{isEnglish ? "Latest updates" : "آخر التحديثات"}</span></div>{orders.length ? <table className="w-full min-w-[1300px] text-right text-[11px] mt-5"><thead><tr className="border-b border-black/10 text-black/45"><th className="pb-3">{isEnglish ? "Order" : "رقم الطلب"}</th><th className="pb-3">{isEnglish ? "Date" : "التاريخ"}</th><th className="pb-3">{isEnglish ? "Customer" : "العميل"}</th><th className="pb-3">{isEnglish ? "Phone" : "الهاتف"}</th><th className="pb-3">{isEnglish ? "Address" : "العنوان"}</th><th className="pb-3">{isEnglish ? "Notes" : "ملاحظات"}</th><th className="pb-3">{isEnglish ? "Items" : "المنتجات"}</th><th className="pb-3">{isEnglish ? "Total" : "الإجمالي"}</th><th className="pb-3">{isEnglish ? "Payment" : "الدفع"}</th><th className="pb-3">{isEnglish ? "Transfer number" : "رقم التحويل"}</th><th className="pb-3">{isEnglish ? "Receipt" : "الإيصال"}</th><th className="pb-3">{isEnglish ? "Status" : "الحالة"}</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-black/5"><td className="py-4">{order.id}</td><td>{new Date(order.date).toLocaleString("en-US")}</td><td>{order.customerName || "-"}</td><td>{order.phone || "-"}</td><td className="max-w-56 truncate">{order.address || "-"}</td><td className="max-w-56 truncate">{order.notes || "-"}</td><td>{order.orderItems?.map((item) => `${item.name} × ${item.quantity}`).join(", ") || order.items}</td><td>{order.total.toLocaleString("en-US")} ج.م</td><td>{order.paymentMethod === "wallet" ? "E-wallet" : order.paymentMethod === "instapay" ? "InstaPay" : "Cash on delivery"}</td><td>{order.transferNumber || "-"}</td><td>{order.receipt ? <a href={order.receipt} target="_blank" rel="noreferrer" className="underline">{isEnglish ? "View" : "عرض"}</a> : "-"}</td><td>{order.status}</td></tr>)}</tbody></table> : <p className="text-[12px] text-black/50 mt-4">{isEnglish ? "Orders will appear here after checkout." : "ستظهر الطلبات هنا بعد إتمام عمليات البيع."}</p>}</div></div>}
        </div></div>
      </div>
    </section>
  );
}
