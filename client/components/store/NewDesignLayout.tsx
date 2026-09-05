import { ArrowUpRight, Menu, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useStore } from "./StoreLayout";

export function NewDesignLayout({ children }: { children: React.ReactNode }) {
  const { cart, language, toggleLanguage, siteSettings } = useStore();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isEnglish = language === "en";
  const links = [
    { href: "/new-design", label: isEnglish ? "Home" : "الرئيسية" },
    { href: "/new-design/shop", label: isEnglish ? "Collection" : "المجموعة" },
    { href: "/about", label: isEnglish ? "Our story" : "قصتنا" },
  ];

  return (
    <div className="new-design-shell bg-[#e6e1d6] text-[#1c2822]">
      <header className="border-b border-[#1c2822]/15 px-5 py-5 lg:px-10">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-5">
          <Link to="/new-design" className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#1c2822] text-[#e6e1d6]">NN</span>
            <span className="hidden sm:inline">No Name Studio</span>
          </Link>
          <nav className="hidden items-center gap-8 text-[11px] font-medium md:flex">
            {links.map((link) => <Link key={link.href} to={link.href} className={location.pathname === link.href ? "underline underline-offset-8" : "hover:underline hover:underline-offset-8"}>{link.label}</Link>)}
          </nav>
          <div className="flex items-center gap-3 text-[11px]">
            <button onClick={toggleLanguage} className="hidden rounded-full border border-[#1c2822]/25 px-3 py-1.5 md:inline-flex">{isEnglish ? "العربية" : "English"}</button>
            <Link to="/cart" className="relative rounded-full border border-[#1c2822]/25 p-2" aria-label={isEnglish ? "Shopping bag" : "حقيبة التسوق"}><ShoppingBag size={15} />{cart > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#d4775c] px-1 text-[9px] text-white">{cart}</span>}</Link>
            <button onClick={() => setMenuOpen((open) => !open)} className="rounded-full border border-[#1c2822]/25 p-2 md:hidden" aria-label={isEnglish ? "Open menu" : "فتح القائمة"}><Menu size={15} /></button>
          </div>
        </div>
        {menuOpen && <nav className="mx-auto mt-5 flex max-w-[1320px] flex-col gap-4 border-t border-[#1c2822]/15 pt-5 text-[12px] md:hidden">{links.map((link) => <Link key={link.href} to={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}<button onClick={() => { toggleLanguage(); setMenuOpen(false); }} className="text-start">{isEnglish ? "العربية" : "English"}</button></nav>}
      </header>
      <main>{children}</main>
      <footer className="border-t border-[#1c2822]/15 px-5 py-12 lg:px-10">
        <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div><p className="font-serif text-3xl italic">A piece of you.</p><p className="mt-2 text-[11px] text-[#1c2822]/60">{siteSettings.announcement || (isEnglish ? "Made slowly in Egypt." : "مصنوعة بهدوء في مصر.")}</p></div>
          <Link to="/new-design/shop" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">{isEnglish ? "Explore collection" : "استكشفي المجموعة"}<ArrowUpRight size={15} /></Link>
        </div>
      </footer>
    </div>
  );
}
