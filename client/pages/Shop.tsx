import { useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getProductColors, getProductName, ProductCard, useStore } from "@/components/store/StoreLayout";

const filters = ["All pieces", "Sets", "Skirts / pants", "Blouses / shirts", "Denims", "Dresses"];
const categoryNames: Record<string, { ar: string; en: string }> = {
  "All pieces": { ar: "All pieces", en: "All pieces" },
  Sets: { ar: "Sets", en: "Sets" },
  "Blouses / shirts": { ar: "Blouses / shirts", en: "Blouses / shirts" },
  "Skirts / pants": { ar: "Skirts / pants", en: "Skirts / pants" },
  Jackets: { ar: "Jackets", en: "Jackets" },
  Denims: { ar: "Denims", en: "Denims" },
  Dresses: { ar: "Dresses", en: "Dresses" },
  "New Collection": { ar: "New Collection", en: "New Collection" },
};

const filterOptions = {
  Size: ["XS", "S", "M", "L", "XL"],
  Color: ["#222222", "#d8d1c2", "#91b6d6", "#f4f1e8", "#7d8a76"],
  Type: ["New", "Best sellers"],
  Availability: ["In stock"],
  Price: ["Under 1,500", "1,500 and above"],
};

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const { catalog, catalogStatus, catalogError, language, sections } = useStore();
  const isEnglish = language === "en";
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("");
  const selected = params.get("category") || "All pieces";
  const collection = params.get("collection");
  const search = params.get("search")?.toLowerCase() || "";
  const normalizedSelected = selected === "الكل" ? "All pieces" : selected === "أطقم" ? "Sets" : selected === "توبس" ? "Blouses / shirts" : selected === "بنطال" ? "Skirts / pants" : selected === "جينز" ? "Denims" : selected === "فساتين" ? "Dresses" : selected;
  const currentCategory = collection === "new" ? "New Collection" : normalizedSelected;
  const title = categoryNames[currentCategory] || categoryNames["All pieces"];
  const sectionKey = currentCategory === "New Collection" ? "arrivals" : currentCategory === "Sets" ? "sets" : currentCategory === "Blouses / shirts" ? "tops" : currentCategory === "Skirts / pants" ? "pants" : currentCategory === "Dresses" ? "dresses" : currentCategory === "All pieces" ? "categories" : "";
  const section = sectionKey ? sections[sectionKey] : undefined;
  const displayTitle = section?.title || (isEnglish ? title.en : title.ar);
  const displayDescription = section?.description || (isEnglish ? "Choose pieces that feel like you. Every design is thoughtfully made in Cairo to last beyond the season." : "اختاري القطع اللي تشبهك. كل تصميم مصنوع بعناية في القاهرة عشان يعيش معك أطول.");
  const filteredProducts = useMemo(() => catalog.filter((product) => {
    const normalizedProductCategory = product.category === "أطقم" ? "Sets" : product.category === "توبس" ? "Blouses / shirts" : product.category === "بنطال" ? "Skirts / pants" : product.category === "جينز" ? "Denims" : product.category === "فساتين" ? "Dresses" : product.category === "جاكيتات" ? "Jackets" : product.category;
    return (!collection || (collection === "new" && product.tag === "جديد")) && (normalizedSelected === "All pieces" || normalizedProductCategory === normalizedSelected) && (!search || product.name.toLowerCase().includes(search) || getProductName(product, language).toLowerCase().includes(search)) && (!selectedColor || getProductColors(product).includes(selectedColor));
  }), [catalog, normalizedSelected, collection, search, selectedColor, language]);
  const chooseCategory = (filter: string) => {
    const next = new URLSearchParams(params);
    next.delete("collection");
    filter === "All pieces" ? next.delete("category") : next.set("category", filter);
    setParams(next);
  };

  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-24 pt-16 lg:px-8 lg:pt-20">
      <div className="border-b border-[#1c2822]/15 pb-10 text-center">
        <h1 className="font-serif text-5xl tracking-[-0.05em] sm:text-7xl">{displayTitle}</h1>
        <p className="mx-auto mt-5 max-w-[430px] text-[13px] leading-8 text-[#1c2822]/60">{displayDescription}</p>
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-[#1c2822]/10 py-6">
        <p className="text-[11px] text-[#1c2822]/55">{filteredProducts.length} {isEnglish ? "pieces" : "قطع"}</p>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium">
          {Object.entries(filterOptions).map(([filter, options]) => (
            <div key={filter} className="relative">
              <button onClick={() => setOpenFilter((current) => current === filter ? null : filter)} className={`flex items-center gap-1 border-b px-2 py-2 ${openFilter === filter ? "border-black" : "border-transparent"}`}>{isEnglish ? filter : ({ Size: "المقاس", Color: "اللون", Type: "النوع", Availability: "التوفر", Price: "السعر" }[filter] || filter)} <ChevronDown size={12} /></button>
              {openFilter === filter && <div className="absolute left-0 top-10 z-20 min-w-36 border border-black/10 bg-white p-2 shadow-lg">
                {options.map((option) => filter === "Color" ? <button key={option} onClick={() => { setSelectedColor(selectedColor === option ? "" : option); setOpenFilter(null); }} className="flex w-full items-center gap-2 px-2 py-2 text-left text-[10px]"><span className={`h-3.5 w-3.5 rounded-full border ${selectedColor === option ? "ring-1 ring-black ring-offset-1" : ""}`} style={{ backgroundColor: option }} />{selectedColor === option ? (isEnglish ? "Selected" : "محدد") : ""}</button> : <button key={option} onClick={() => setOpenFilter(null)} className="block w-full px-2 py-2 text-left text-[10px] hover:bg-[#f5f3ed]">{option}</button>)}
              </div>}
            </div>
          ))}
          <button onClick={() => setOpenFilter((current) => current === "categories" ? null : "categories")} className="hidden items-center gap-1 border-b border-transparent px-2 py-2 md:flex">{isEnglish ? "Category" : "القسم"}<SlidersHorizontal size={13} /></button>
        </div>
      </div>

      <div className="flex items-center justify-between py-5">
        <button onClick={() => setOpenFilter((current) => current === "categories" ? null : "categories")} className="flex items-center gap-2 text-[11px] font-bold md:hidden"><SlidersHorizontal size={16} /> {isEnglish ? "Filter" : "تصفية"}</button>
        <button className="mr-auto flex items-center gap-2 text-[11px] font-bold">{isEnglish ? "Sort by" : "ترتيب حسب"} <ChevronDown size={15} /></button>
      </div>

      {openFilter === "categories" && <div className="mb-6 flex flex-wrap gap-2 border-b border-black/10 pb-5">{filters.map((filter) => <button key={filter} onClick={() => { chooseCategory(filter); setOpenFilter(null); }} className={`rounded-full border px-4 py-2 text-[10px] ${normalizedSelected === filter ? "border-black bg-black text-white" : "border-black/15"}`}>{isEnglish ? (categoryNames[filter]?.en || filter) : (categoryNames[filter]?.ar || filter)}</button>)}</div>}

      {catalogStatus === "loading" ? <div className="py-24 text-center"><p className="font-serif text-3xl">{isEnglish ? "Loading pieces..." : "جارٍ تحميل المنتجات..."}</p></div> : catalogStatus === "error" ? <div className="py-24 text-center"><p className="font-serif text-3xl">{isEnglish ? "Products are unavailable" : "المنتجات غير متاحة حالياً"}</p><p className="mx-auto mt-4 max-w-md text-[12px] leading-7 text-black/55">{isEnglish ? "Check the Supabase connection and make sure the products table is configured." : "تحققي من اتصال Supabase وتطبيق الجداول وإضافة منتجات نشطة."}</p><p className="mt-3 text-[10px] text-black/40">{catalogError}</p></div> : filteredProducts.length > 0 ? <div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:grid-cols-3 sm:gap-6">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} index={catalog.indexOf(product)} />)}</div> : <div className="py-24 text-center"><p className="font-serif text-3xl">{catalog.length === 0 ? (isEnglish ? "No products yet" : "لا توجد منتجات بعد") : (isEnglish ? "No pieces found" : "لم نجد قطعاً مطابقة")}</p><p className="mx-auto mt-4 max-w-md text-[12px] leading-7 text-black/55">{catalog.length === 0 ? (isEnglish ? "Add an active product from the admin dashboard or import your legacy data." : "أضيفي منتجاً نشطاً من لوحة التحكم أو استوردي البيانات القديمة.") : ""}</p><button onClick={() => { setSelectedColor(""); setParams({}); }} className="mt-6 border-b border-black pb-2 text-[11px]">{isEnglish ? "Clear filters" : "مسح الفلاتر"}</button></div>}
    </section>
  );
}
