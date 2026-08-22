import { ChangeEvent, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Upload } from "lucide-react";
import { getProductName, type PaymentMethod, type StoreOrder, useStore } from "@/components/store/StoreLayout";

type CheckoutForm = {
  customerName: string;
  phone: string;
  address: string;
  notes: string;
};

const paymentOptions: { value: PaymentMethod; label: string; labelAr: string }[] = [
  { value: "cod", label: "Cash on delivery", labelAr: "دفع عند الاستلام" },
  { value: "wallet", label: "E-wallet", labelAr: "محفظة إلكترونية" },
  { value: "instapay", label: "InstaPay", labelAr: "InstaPay" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, siteSettings, addOrder, clearCart, language } = useStore();
  const isEnglish = language === "en";
  const [form, setForm] = useState<CheckoutForm>({ customerName: "", phone: "", address: "", notes: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [receipt, setReceipt] = useState("");

  const subtotal = cartItems.reduce((total, item) => total + item.product.numericPrice * item.quantity, 0);
  const shipping = subtotal >= 2500 || subtotal === 0 ? 0 : 80;
  const total = subtotal + shipping;
  const transferNumber = paymentMethod === "wallet" ? siteSettings.walletNumber : siteSettings.instapayNumber;
  const paymentLabel = paymentOptions.find((option) => option.value === paymentMethod);

  const updateField = (field: keyof CheckoutForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const uploadReceipt = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReceipt(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submitOrder = (event: FormEvent) => {
    event.preventDefault();
    const order: StoreOrder = {
      id: `NN-${Date.now()}`,
      date: new Date().toISOString(),
      total,
      status: "جديد",
      items: cartItems.reduce((count, item) => count + item.quantity, 0),
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      paymentMethod,
      transferNumber: paymentMethod === "cod" ? undefined : transferNumber,
      receipt: paymentMethod === "cod" ? undefined : receipt,
      orderItems: cartItems.map(({ product, quantity }) => ({
        name: getProductName(product, language),
        quantity,
        unitPrice: product.numericPrice,
        total: product.numericPrice * quantity,
      })),
    };

    addOrder(order);
    clearCart();

    const message = [
      `New order: ${order.id}`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.phone}`,
      `Address: ${order.address}`,
      order.notes ? `Notes: ${order.notes}` : "",
      `Payment: ${paymentLabel?.label || paymentMethod}`,
      "Items:",
      ...order.orderItems!.map((item) => `- ${item.name} x${item.quantity} — ${item.total.toLocaleString("en-US")} EGP`),
      `Shipping: ${shipping === 0 ? "Free" : `${shipping} EGP`}`,
      `Total: ${total.toLocaleString("en-US")} EGP`,
    ].filter(Boolean).join("\n");
    const whatsapp = siteSettings.socialLinks?.whatsapp || "https://wa.me/201553003040";
    const separator = whatsapp.includes("?") ? "&" : "?";
    window.location.href = `${whatsapp}${separator}text=${encodeURIComponent(message)}`;
  };

  if (cartItems.length === 0) {
    return <section className="mx-auto max-w-[900px] px-5 py-20 text-center lg:px-8"><p className="font-serif text-4xl">{isEnglish ? "Your bag is empty" : "السلة فاضية حالياً"}</p><Link to="/shop" className="mt-8 inline-flex items-center gap-5 border-b border-[#1c2822] pb-3 text-[11px] font-bold">{isEnglish ? "Continue shopping" : "اذهبي إلى المتجر"}<ArrowLeft size={16} /></Link></section>;
  }

  return (
    <section className="mx-auto max-w-[1100px] px-5 py-12 lg:px-8 lg:py-20">
      <div className="mb-10 border-b border-[#1c2822]/15 pb-8"><p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[#d4775c]">CHECKOUT</p><h1 className="font-serif text-5xl tracking-[-0.05em]">{isEnglish ? "Complete your order" : "إتمام الطلب"}</h1></div>
      <form onSubmit={submitOrder} className="grid gap-12 lg:grid-cols-[1fr_340px] lg:gap-20">
        <div className="space-y-8">
          <div className="space-y-4"><h2 className="text-xl">{isEnglish ? "Delivery details" : "بيانات التوصيل"}</h2><label className="block text-[11px] font-bold">{isEnglish ? "Full name" : "الاسم الكامل"}<input required value={form.customerName} onChange={(event) => updateField("customerName", event.target.value)} className="mt-2 w-full border border-black/15 bg-white px-3 py-3 text-[12px] outline-none" /></label><label className="block text-[11px] font-bold">{isEnglish ? "Phone number" : "رقم الهاتف"}<input required type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="mt-2 w-full border border-black/15 bg-white px-3 py-3 text-[12px] outline-none" /></label><label className="block text-[11px] font-bold">{isEnglish ? "Detailed address" : "العنوان بالتفصيل"}<textarea required value={form.address} onChange={(event) => updateField("address", event.target.value)} className="mt-2 min-h-28 w-full border border-black/15 bg-white px-3 py-3 text-[12px] outline-none" /></label><label className="block text-[11px] font-bold">{isEnglish ? "Additional notes (optional)" : "ملاحظات إضافية (اختياري)"}<textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} className="mt-2 min-h-20 w-full border border-black/15 bg-white px-3 py-3 text-[12px] outline-none" /></label></div>
          <div className="space-y-4"><h2 className="text-xl">{isEnglish ? "Payment method" : "طريقة الدفع"}</h2><div className="grid gap-3 sm:grid-cols-3">{paymentOptions.map((option) => <label key={option.value} className={`cursor-pointer border p-4 text-[11px] ${paymentMethod === option.value ? "border-black bg-[#f6f3ee]" : "border-black/15"}`}><input type="radio" name="paymentMethod" value={option.value} checked={paymentMethod === option.value} onChange={() => setPaymentMethod(option.value)} className="sr-only" /><span className="font-bold">{isEnglish ? option.label : option.labelAr}</span></label>)}</div>{paymentMethod !== "cod" && <div className="space-y-4 bg-[#f6f3ee] p-5"><div><p className="text-[11px] font-bold">{isEnglish ? `${paymentLabel?.label} transfer number` : `رقم تحويل ${paymentLabel?.labelAr}`}</p><p className="mt-2 border border-black/10 bg-white px-3 py-3 text-[13px] tracking-wide">{transferNumber || (isEnglish ? "Not configured yet" : "لم يتم ضبط الرقم بعد")}</p></div><label className="flex cursor-pointer items-center gap-3 border border-dashed border-black/25 bg-white px-4 py-4 text-[11px] font-bold"><Upload size={16} />{receipt ? (isEnglish ? "Receipt attached" : "تم إرفاق الإيصال") : (isEnglish ? "Upload transfer receipt" : "إرفاق صورة إيصال التحويل")}<input required type="file" accept="image/*" onChange={uploadReceipt} className="hidden" /></label></div>}</div>
        </div>
        <aside className="h-fit bg-[#f6f3ee] p-6"><h2 className="mb-6 text-xl">{isEnglish ? "Order summary" : "ملخص الطلب"}</h2><div className="space-y-4 border-b border-black/10 pb-5 text-[12px]">{cartItems.map(({ product, quantity }) => <div key={product.id} className="flex justify-between gap-4"><span>{getProductName(product, language)} × {quantity}</span><span className="shrink-0">{(product.numericPrice * quantity).toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</span></div>)}<div className="flex justify-between"><span className="text-black/55">{isEnglish ? "Shipping" : "الشحن"}</span><span>{shipping === 0 ? (isEnglish ? "Free" : "مجاني") : `${shipping} ${isEnglish ? "EGP" : "ج.م"}`}</span></div></div><div className="flex justify-between py-5 text-sm font-bold"><span>{isEnglish ? "Total" : "الإجمالي"}</span><span>{total.toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</span></div><button type="submit" className="flex w-full items-center justify-center gap-2 bg-[#1c2822] py-4 text-[11px] font-bold text-white"><Check size={15} />{isEnglish ? "Confirm order" : "تأكيد الطلب"}</button><button type="button" onClick={() => navigate("/cart")} className="mt-5 block w-full text-center text-[11px] underline underline-offset-4">{isEnglish ? "Back to bag" : "العودة للسلة"}</button></aside>
      </form>
    </section>
  );
}
