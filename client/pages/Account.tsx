import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/components/store/StoreLayout";

type CustomerOrder = { id: string; order_number: string; created_at: string; total: number; status: string };
type Mode = "login" | "register";

export default function Account() {
  const { language } = useStore();
  const isEnglish = language === "en";
  const [mode, setMode] = useState<Mode>("login");
  const [session, setSession] = useState<{ email?: string } | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "", address: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadSession = async () => {
    const response = await fetch("/api/customer/session", { credentials: "include" });
    if (!response.ok) { setSession(null); return; }
    const data = await response.json() as { user?: { email?: string } };
    setSession(data.user || null);
    const ordersResponse = await fetch("/api/customer/orders", { credentials: "include" });
    if (ordersResponse.ok) setOrders((await ordersResponse.json() as { orders?: CustomerOrder[] }).orders || []);
  };

  useEffect(() => { void loadSession(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const endpoint = mode === "login" ? "/api/customer/login" : "/api/customer/register";
    const response = await fetch(endpoint, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).catch(() => null);
    if (!response?.ok) {
      const data = await response?.json().catch(() => null) as { error?: string } | null;
      setError(data?.error || (isEnglish ? "Unable to complete account request." : "تعذر تنفيذ طلب الحساب."));
      setSubmitting(false);
      return;
    }
    await loadSession();
    setSubmitting(false);
  };

  const logout = async () => { await fetch("/api/customer/logout", { method: "POST", credentials: "include" }); setSession(null); setOrders([]); };

  if (session) return <section className="mx-auto max-w-[900px] px-5 py-16 lg:px-8"><div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-7"><div><p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[#d4775c]">ACCOUNT</p><h1 className="font-serif text-5xl">{isEnglish ? "My account" : "حسابي"}</h1><p className="mt-3 text-[12px] text-black/55">{session.email}</p></div><button type="button" onClick={logout} className="border border-black/20 px-4 py-3 text-[11px] font-bold">{isEnglish ? "Sign out" : "تسجيل الخروج"}</button></div><div className="space-y-4"><h2 className="text-2xl">{isEnglish ? "My orders" : "طلباتي"}</h2>{orders.length ? orders.map((order) => <Link key={order.id} to={`/order-summary/${encodeURIComponent(order.order_number)}`} className="flex items-center justify-between gap-4 border-b border-black/10 py-5 text-[12px] hover:bg-[#f6f3ee]"><span><strong>{order.order_number}</strong><span className="ml-4 text-black/50">{new Date(order.created_at).toLocaleDateString(isEnglish ? "en-US" : "ar-EG")}</span></span><span>{Number(order.total).toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</span></Link>) : <p className="text-[12px] text-black/55">{isEnglish ? "You have no orders yet." : "لا توجد طلبات حتى الآن."}</p>}</div></section>;

  return <section className="flex min-h-[calc(100vh-166px)] items-center justify-center bg-[#eeece1] px-5 py-16"><form onSubmit={submit} className="w-full max-w-[450px] bg-white p-7 shadow-sm sm:p-10"><div className="mb-8 border-b border-black/10 pb-6"><p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[#d4775c]">NO NAME ACCOUNT</p><h1 className="font-serif text-4xl">{mode === "login" ? (isEnglish ? "Welcome back" : "أهلًا بعودتك") : (isEnglish ? "Create account" : "إنشاء حساب")}</h1></div>{mode === "register" && <><label className="mb-4 block text-[11px] font-bold">{isEnglish ? "Full name" : "الاسم الكامل"}<input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="admin-input" /></label><label className="mb-4 block text-[11px] font-bold">{isEnglish ? "Phone" : "الهاتف"}<input required inputMode="numeric" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, "") })} className="admin-input" /></label><label className="mb-4 block text-[11px] font-bold">{isEnglish ? "Address" : "العنوان"}<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="admin-input" /></label></>}<label className="mb-4 block text-[11px] font-bold">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="admin-input" /></label><label className="mb-5 block text-[11px] font-bold">{isEnglish ? "Password" : "كلمة المرور"}<input required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="admin-input" /></label>{error && <p role="alert" className="mb-4 text-[11px] text-[#c95f49]">{error}</p>}<button disabled={submitting} className="w-full bg-[#1c2822] py-4 text-[11px] font-bold text-white disabled:opacity-50">{submitting ? "..." : mode === "login" ? (isEnglish ? "Sign in" : "دخول") : (isEnglish ? "Create account" : "إنشاء الحساب")}</button><button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-5 w-full text-[11px] text-black/55 underline underline-offset-4">{mode === "login" ? (isEnglish ? "Create a customer account" : "إنشاء حساب عميل") : (isEnglish ? "I already have an account" : "لدي حساب بالفعل")}</button></form></section>;
}
