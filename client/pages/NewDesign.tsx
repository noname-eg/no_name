import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { ArrowUpRight, Heart, Plus } from "lucide-react";
import { getProductName, getProductPrice, useStore, type StoreProduct } from "@/components/store/StoreLayout";
import { NewDesignLayout } from "@/components/store/NewDesignLayout";

const designPath = (path: string) => window.location.pathname.startsWith("/new-design") ? `/new-design${path}` : path;

function NewProductCard({ product, index }: { product: StoreProduct; index: number }) {
  const { language, addToCart, liked, toggleLike } = useStore();
  const isEnglish = language === "en";
  const name = getProductName(product, language);
  return <article className="group">
    <div className="relative overflow-hidden rounded-[1.4rem] bg-[#d4cfc3]">
      <Link to={designPath(`/product/${product.id}`)} className="block aspect-[.8]"><img src={product.image} alt={name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></Link>
      <button onClick={() => toggleLike(index)} className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[#e6e1d6]/85" aria-label={isEnglish ? "Add to wishlist" : "إضافة للمفضلة"}><Heart size={15} fill={liked.includes(index) ? "currentColor" : "none"} /></button>
      <button onClick={() => addToCart(product)} className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-[#1c2822] text-[#e6e1d6] transition hover:bg-[#d4775c]" aria-label={isEnglish ? "Add to cart" : "إضافة إلى السلة"}><Plus size={17} /></button>
    </div>
    <div className="mt-4 flex items-start justify-between gap-3"><div><Link to={designPath(`/product/${product.id}`)} className="text-[12px] font-semibold hover:underline">{name}</Link><p className="mt-1 text-[11px] text-[#1c2822]/60">{product.category}</p></div><p className="text-[11px] font-medium">{getProductPrice(product, language)}</p></div>
  </article>;
}

export function NewDesignHome() {
  const { catalog, language, sections } = useStore();
  const isEnglish = language === "en";
  const featured = catalog.slice(0, 4);
  return <NewDesignLayout>
    <section className="mx-auto grid max-w-[1320px] gap-8 px-5 py-10 lg:grid-cols-[1.15fr_.85fr] lg:px-10 lg:py-16">
      <div className="flex min-h-[530px] flex-col justify-between rounded-[2rem] bg-[#1c2822] p-7 text-[#e6e1d6] sm:p-12">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]"><span>Collection 01</span><span>2026</span></div>
        <div><p className="mb-5 text-[11px] uppercase tracking-[0.22em] text-[#d4775c]">{isEnglish ? "Everyday, considered" : "يوميات مدروسة"}</p><h1 className="max-w-[620px] font-serif text-6xl leading-[.92] tracking-[-.06em] sm:text-8xl">{isEnglish ? "Quiet pieces for loud lives." : "قطع هادئة لحياة مليئة."}</h1><p className="mt-7 max-w-[360px] text-[12px] leading-7 text-[#e6e1d6]/65">{sections.arrivals?.description || (isEnglish ? "Designed in Cairo, made to move with you." : "مصممة في القاهرة لتتحرك معكِ.")}</p><Link to={designPath("/shop")} className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#e6e1d6] px-5 py-3 text-[11px] font-semibold text-[#1c2822]">{isEnglish ? "Shop the edit" : "تسوقي المجموعة"}<ArrowUpRight size={15} /></Link></div>
      </div>
      <div className="relative min-h-[530px] overflow-hidden rounded-[2rem] bg-[#c5b5a1]"><img src={catalog[0]?.image} alt="" className="h-full w-full object-cover" /><div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-white"><p className="max-w-[180px] text-[11px] leading-5">{isEnglish ? "Natural textures. Easy silhouettes." : "خامات طبيعية وقصّات سهلة."}</p><span className="rounded-full border border-white/60 px-3 py-2 text-[10px]">01 / 04</span></div></div>
    </section>
    <section className="mx-auto max-w-[1320px] px-5 pb-20 lg:px-10"><div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#1c2822]/50">{isEnglish ? "Selected pieces" : "قطع مختارة"}</p><h2 className="font-serif text-4xl tracking-[-.04em]">{isEnglish ? "The current mood" : "مزاج الموسم"}</h2></div><Link to={designPath("/shop")} className="text-[11px] underline underline-offset-4">{isEnglish ? "View all" : "شاهدي الكل"}</Link></div><div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-4 sm:gap-6">{featured.map((product) => <NewProductCard key={product.id} product={product} index={catalog.indexOf(product)} />)}</div></section>
  </NewDesignLayout>;
}

export function NewDesignShop() {
  const { catalog, language } = useStore();
  const [params, setParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(params.get("category") || "All");
  const isEnglish = language === "en";
  const categories = ["All", ...Array.from(new Set(catalog.map((product) => product.category)))];
  const filtered = useMemo(() => activeCategory === "All" ? catalog : catalog.filter((product) => product.category === activeCategory), [catalog, activeCategory]);
  const chooseCategory = (category: string) => { setActiveCategory(category); const next = new URLSearchParams(params); category === "All" ? next.delete("category") : next.set("category", category); setParams(next); };
  return <NewDesignLayout><section className="mx-auto max-w-[1320px] px-5 py-12 lg:px-10 lg:py-16"><div className="max-w-2xl"><p className="text-[10px] uppercase tracking-[0.2em] text-[#d4775c]">{isEnglish ? "The collection" : "المجموعة"}</p><h1 className="mt-4 font-serif text-6xl tracking-[-.06em] sm:text-8xl">{isEnglish ? "Made for your rhythm." : "مصممة على إيقاعكِ."}</h1><p className="mt-6 max-w-md text-[12px] leading-7 text-[#1c2822]/65">{isEnglish ? "Pieces that work hard, feel good, and stay with you." : "قطع عملية ومريحة وتعيش معكِ."}</p></div><div className="mt-14 flex flex-wrap gap-2 border-b border-[#1c2822]/15 pb-5">{categories.map((category) => <button key={category} onClick={() => chooseCategory(category)} className={`rounded-full border px-4 py-2 text-[10px] ${activeCategory === category ? "border-[#1c2822] bg-[#1c2822] text-[#e6e1d6]" : "border-[#1c2822]/20"}`}>{category === "All" ? (isEnglish ? "All pieces" : "كل القطع") : category}</button>)}</div><p className="py-6 text-[11px] text-[#1c2822]/55">{filtered.length} {isEnglish ? "pieces" : "قطع"}</p><div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:grid-cols-3 sm:gap-7">{filtered.map((product) => <NewProductCard key={product.id} product={product} index={catalog.indexOf(product)} />)}</div></section></NewDesignLayout>;
}

export function NewDesignProduct() {
  const { id } = useParams();
  const { catalog, language, addToCart } = useStore();
  const product = catalog.find((item) => item.id === id) || catalog[0];
  const isEnglish = language === "en";
  if (!product) return null;
  const name = getProductName(product, language);
  return <NewDesignLayout><section className="mx-auto grid max-w-[1320px] gap-10 px-5 py-10 lg:grid-cols-2 lg:px-10 lg:py-16"><div className="overflow-hidden rounded-[2rem] bg-[#d4cfc3]"><img src={product.image} alt={name} className="aspect-[.85] h-full w-full object-cover" /></div><div className="flex flex-col justify-center lg:px-10"><p className="text-[10px] uppercase tracking-[.2em] text-[#d4775c]">{product.category}</p><h1 className="mt-5 font-serif text-6xl tracking-[-.06em]">{name}</h1><p className="mt-5 text-xl">{getProductPrice(product, language)}</p><p className="mt-8 max-w-md text-[12px] leading-8 text-[#1c2822]/65">{(isEnglish ? product.descriptionEn : product.description) || (isEnglish ? "A considered piece made for everyday movement." : "قطعة مدروسة ومصممة ليومكِ.")}</p><button onClick={() => addToCart(product)} className="mt-10 flex w-full items-center justify-center rounded-full bg-[#1c2822] py-4 text-[11px] font-semibold text-[#e6e1d6] transition hover:bg-[#d4775c]">{isEnglish ? "Add to bag" : "أضيفي إلى السلة"}</button><Link to="/cart" className="mt-3 text-center text-[11px] underline underline-offset-4">{isEnglish ? "Go to bag" : "الذهاب إلى السلة"}</Link></div></section></NewDesignLayout>;
}
