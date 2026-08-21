import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/components/store/StoreLayout";

export function InfoPage({ type }: { type: "shipping" | "contact" }) {
  const { language, pageSettings } = useStore();
  const isEnglish = language === "en";
  const page = pageSettings[type];
  const contactPage = pageSettings.contact;
  const [form, setForm] = useState({ name: "", email: "", details: "", message: "" });
  const [sent, setSent] = useState(false);
  const submitContact = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (type !== "contact" || !contactPage.recipientEmail) return;
    const subject = encodeURIComponent(`${isEnglish ? "Website contact" : "رسالة من الموقع"} - ${form.name}`);
    const body = encodeURIComponent(`${isEnglish ? "Name" : "الاسم"}: ${form.name}\n${isEnglish ? "Email" : "البريد الإلكتروني"}: ${form.email}\n${isEnglish ? "Contact details" : "بيانات التواصل"}: ${form.details}\n\n${isEnglish ? "Message" : "الرسالة"}:\n${form.message}`);
    window.location.href = `mailto:${contactPage.recipientEmail}?subject=${subject}&body=${body}`;
    setSent(true);
  };
  return (
    <section className="mx-auto min-h-[calc(100vh-110px)] max-w-[900px] px-5 pb-24 pt-20 lg:px-8 lg:pt-28">
      <p className="mb-5 text-[10px] font-bold tracking-[0.2em] text-[#d4775c]">NO NAME</p>
      <h1 className="font-serif text-6xl tracking-[-0.05em] sm:text-8xl">{isEnglish ? page.titleEn : page.titleAr}</h1>
      <div className="mt-12 max-w-[650px] whitespace-pre-line text-[15px] leading-9 text-[#1c2822]/70">{isEnglish ? page.contentEn : page.contentAr}</div>
      {type === "contact" && <form onSubmit={submitContact} className="mt-12 max-w-[650px] space-y-4 border-t border-black/10 pt-8"><div className="grid gap-4 sm:grid-cols-2"><label className="text-[11px] font-bold">{isEnglish ? "Name" : "الاسم"}<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="admin-input" /></label><label className="text-[11px] font-bold">{isEnglish ? "Email" : "البريد الإلكتروني"}<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="admin-input" /></label></div><label className="block text-[11px] font-bold">{isEnglish ? "Contact details" : "بيانات التواصل"}<input value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} className="admin-input" placeholder={isEnglish ? "Phone or preferred contact method" : "رقم الهاتف أو طريقة التواصل المفضلة"} /></label><label className="block text-[11px] font-bold">{isEnglish ? "Message" : "الرسالة"}<textarea required value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="admin-input min-h-36" /></label>{sent && <p className="text-[11px] text-[#d4775c]">{isEnglish ? "Your email draft is ready to send." : "تم تجهيز رسالة البريد للإرسال."}</p>}<button type="submit" className="bg-[#1c2822] px-7 py-3 text-[11px] font-bold text-white">{isEnglish ? "Send message" : "إرسال الرسالة"}</button></form>}
      <Link to="/" className="mt-12 inline-flex items-center gap-4 border-b border-black pb-3 text-[11px] font-bold">{isEnglish ? "Back home" : "العودة للرئيسية"}<ArrowLeft size={16} /></Link>
    </section>
  );
}

export default function About() {
  const { language, pageSettings } = useStore();
  const isEnglish = language === "en";
  const page = pageSettings.about;
  return (
    <>
      <section className="mx-auto max-w-[1240px] px-5 pb-24 pt-16 lg:px-8 lg:pt-24">
        <div className="grid items-end gap-12 lg:grid-cols-[1fr_.8fr]">
          <div><p className="mb-5 text-[10px] font-bold tracking-[0.2em] text-[#d4775c]">THE NO NAME STORY</p><h1 className="max-w-[700px] font-serif text-6xl leading-[1.05] tracking-[-0.05em]">{isEnglish ? page.titleEn : page.titleAr}</h1></div>
          <p className="max-w-[320px] whitespace-pre-line text-[14px] leading-8 text-[#1c2822]/65">{isEnglish ? page.introEn : page.introAr}</p>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-[1.2fr_.8fr]"><img src={page.image1} alt={isEnglish ? "The no name team working on a design" : "فريق no name يعمل على التصميم"} className="aspect-[1.25] h-full w-full object-cover" /><img src={page.image2} alt={isEnglish ? "no name fabrics and details" : "خامات وتفاصيل no name"} className="aspect-[.8] h-full w-full object-cover" /></div>
      </section>
      <section className="bg-[#1c2822] px-5 py-20 text-[#f6f3ee] lg:px-8 lg:py-28"><div className="mx-auto grid max-w-[1000px] gap-16 lg:grid-cols-2"><div><p className="mb-5 text-[10px] font-bold tracking-[0.2em] text-[#d4775c]">WHAT WE BELIEVE</p><h2 className="font-serif text-5xl leading-tight whitespace-pre-line">{isEnglish ? page.beliefTitleEn : page.beliefTitleAr}</h2></div><div className="space-y-8 text-[14px] leading-8 text-[#f6f3ee]/65"><p>{isEnglish ? page.bodyEn : page.bodyAr}</p><p>{isEnglish ? page.body2En : page.body2Ar}</p><Link to="/shop" className="inline-flex items-center gap-5 border-b border-[#f6f3ee]/50 pb-3 text-[11px] font-bold text-[#f6f3ee]">{isEnglish ? "Discover the pieces" : "اكتشفي القطع"}<ArrowLeft size={16} /></Link></div></div></section>
      <section className="mx-auto max-w-[1000px] px-5 py-20 lg:px-8 lg:py-28"><div className="grid gap-10 text-center sm:grid-cols-3"><div><p className="font-serif text-5xl text-[#d4775c]">٢٠٢٤</p><p className="mt-3 text-[11px] text-[#1c2822]/55">{isEnglish ? "Founded" : "سنة التأسيس"}</p></div><div><p className="font-serif text-5xl text-[#d4775c]">١٠٠٪</p><p className="mt-3 text-[11px] text-[#1c2822]/55">{isEnglish ? "Made in Egypt" : "صناعة مصرية"}</p></div><div><p className="font-serif text-5xl text-[#d4775c]">∞</p><p className="mt-3 text-[11px] text-[#1c2822]/55">{isEnglish ? "Endless ways" : "طريقة لا تنتهي"}</p></div></div></section>
    </>
  );
}
