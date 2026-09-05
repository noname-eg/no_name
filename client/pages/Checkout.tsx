import { ChangeEvent, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Upload } from "lucide-react";
import { getProductName, getProductUnitPrice, getSalesWhatsAppUrl, type PaymentMethod, type StoreOrder, useStore } from "@/components/store/StoreLayout";

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
  const { cartItems, siteSettings, addOrder, clearCart, language, coupons, appliedCouponCode } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const isEnglish = language === "en";
  const [form, setForm] = useState<CheckoutForm>({ customerName: "", phone: "", address: "", notes: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [receipt, setReceipt] = useState("");
  const [attempted, setAttempted] = useState(false);

  const appliedCoupon = coupons.find((coupon) => coupon.code === appliedCouponCode && coupon.active) || null;
  const subtotal = cartItems.reduce((total, item) => total + getProductUnitPrice(item.product) * item.quantity, 0);
  const shipping = subtotal >= 2500 || subtotal === 0 ? 0 : 80;
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0;
  const total = Math.max(0, subtotal - discountAmount + shipping);
  const transferNumber = paymentMethod === "wallet" ? siteSettings.walletNumber : siteSettings.instapayNumber;
  const paymentLabel = paymentOptions.find((option) => option.value === paymentMethod);
  const nameIsValid = /^\p{L}+(?:\s+\p{L}+)*$/u.test(form.customerName.trim());
  const phoneIsValid = /^\d{7,15}$/.test(form.phone.trim());
  const addressIsValid = Boolean(form.address.trim());
  const paymentIsValid = paymentMethod === "cod" || (Boolean(transferNumber?.trim()) && Boolean(receipt));
  const isFormValid = nameIsValid && phoneIsValid && addressIsValid && paymentIsValid;

  const updateField = (field: keyof CheckoutForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const uploadReceipt = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 1_000_000) {
      setSubmitError(isEnglish ? "Choose an image smaller than 1 MB." : "اختاري صورة أقل من 1 ميجابايت.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReceipt(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    setSubmitError("");
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({
        customerName: form.customerName.trim(), phone: form.phone.trim(), address: form.address.trim(), notes: form.notes.trim(),
        paymentMethod, transferNumber: paymentMethod === "cod" ? undefined : transferNumber, receipt: paymentMethod === "cod" ? undefined : receipt,
        couponCode: appliedCoupon?.code, items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      }),
    });
    if (!response.ok) {
      setSubmitError(isEnglish ? "We could not confirm the order. Please try again." : "تعذر تأكيد الطلب. حاولي مرة أخرى.");
      setSubmitting(false);
      return;
    }
    const result = await response.json() as { order: { id: string; order_number: string; total: number } };
    const order: StoreOrder = {
      id: result.order.order_number,
      date: new Date().toISOString(),
      total: Number(result.order.total),
      subtotal,
      discountAmount,
      shippingAmount: shipping,
      couponCode: appliedCoupon?.code,
      status: "جديد",
      items: cartItems.reduce((count, item) => count + item.quantity, 0),
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      paymentMethod,
      transferNumber: paymentMethod === "cod" ? undefined : transferNumber,
      receipt: paymentMethod === "cod" ? undefined : receipt,
      orderItems: cartItems.map(({ product, quantity }) => {
        const unitPrice = getProductUnitPrice(product);
        return {
          name: getProductName(product, language),
          quantity,
          unitPrice,
          originalUnitPrice: product.originalPrice,
          discountAmount: (product.originalPrice && product.originalPrice > unitPrice ? product.originalPrice - unitPrice : 0) * quantity,
          total: unitPrice * quantity,
        };
      }),
    };

    addOrder(order);
    clearCart();
    setSubmitting(false);

    const message = [
      `New order: ${order.id}`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.phone}`,
      `Address: ${order.address}`,
      order.notes ? `Notes: ${order.notes}` : "",
      `Payment: ${paymentLabel?.label || paymentMethod}`,
      order.transferNumber ? `Transfer number: ${order.transferNumber}` : "",
      order.receipt ? "Transfer receipt: attached to the order summary" : "",
      `Subtotal: ${subtotal.toLocaleString("en-US")} EGP`,
      discountAmount > 0 ? `Discount: -${discountAmount.toLocaleString("en-US")} EGP` : "",
      "Items:",
      ...order.orderItems!.map((item) => `- ${item.name} x${item.quantity} — ${item.total.toLocaleString("en-US")} EGP`),
      `Shipping: ${shipping === 0 ? "Free" : `${shipping} EGP`}`,
      `Total: ${total.toLocaleString("en-US")} EGP`,
    ].filter(Boolean).join("\n");
    const whatsapp = getSalesWhatsAppUrl(siteSettings);
    const separator = whatsapp.includes("?") ? "&" : "?";
    const whatsappUrl = `${whatsapp}${separator}text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    navigate(`/order-summary/${order.id}`);
  };

  if (cartItems.length === 0) {
    return <section className="mx-auto max-w-[900px] px-5 py-20 text-center lg:px-8"><p className="font-serif text-4xl">{isEnglish ? "Your bag is empty" : "السلة فاضية حالياً"}</p><Link to="/shop" className="mt-8 inline-flex items-center gap-5 border-b border-[#1c2822] pb-3 text-[11px] font-bold">{isEnglish ? "Continue shopping" : "اذهبي إلى المتجر"}<ArrowLeft size={16} /></Link></section>;
  }

  return (
    <section className="mx-auto max-w-[1100px] px-5 py-12 lg:px-8 lg:py-20">
      <div className="mb-10 border-b border-[#1c2822]/15 pb-8"><p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[#d4775c]">CHECKOUT</p><h1 className="font-serif text-5xl tracking-[-0.05em]">{isEnglish ? "Complete your order" : "إتمام الطلب"}</h1></div>
      <form onSubmit={submitOrder} className="grid gap-12 lg:grid-cols-[1fr_340px] lg:gap-20">
        <div className="space-y-8">
          <div className="space-y-4"><h2 className="text-xl">{isEnglish ? "Delivery details" : "بيانات التوصيل"}</h2><label className="block text-[11px] font-bold">{isEnglish ? "Full name" : "الاسم الكامل"}<input required pattern="[\p{L}\s]+" value={form.customerName} onChange={(event) => updateField("customerName", event.target.value.replace(/[^\p{L}\s]/gu, ""))} className="mt-2 w-full border border-black/15 bg-white px-3 py-3 text-[12px] outline-none" />{attempted && !nameIsValid && <span className="mt-1 block text-[10px] font-normal text-[#c95f49]">{isEnglish ? "Use letters and spaces only." : "استخدمي الحروف والمسافات فقط."}</span>}</label><label className="block text-[11px] font-bold">{isEnglish ? "Phone number" : "رقم الهاتف"}<input required type="tel" inputMode="numeric" pattern="[0-9]{7,15}" value={form.phone} onChange={(event) => updateField("phone", event.target.value.replace(/\D/g, ""))} className="mt-2 w-full border border-black/15 bg-white px-3 py-3 text-[12px] outline-none" />{attempted && !phoneIsValid && <span className="mt-1 block text-[10px] font-normal text-[#c95f49]">{isEnglish ? "Enter 7–15 digits only." : "أدخلي من ٧ إلى ١٥ رقمًا فقط."}</span>}</label><label className="block text-[11px] font-bold">{isEnglish ? "Detailed address" : "العنوان بالتفصيل"}<textarea required value={form.address} onChange={(event) => updateField("address", event.target.value)} className="mt-2 min-h-28 w-full border border-black/15 bg-white px-3 py-3 text-[12px] outline-none" />{attempted && !addressIsValid && <span className="mt-1 block text-[10px] font-normal text-[#c95f49]">{isEnglish ? "Enter your delivery address." : "أدخلي عنوان التوصيل."}</span>}</label><label className="block text-[11px] font-bold">{isEnglish ? "Additional notes (optional)" : "ملاحظات إضافية (اختياري)"}<textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} className="mt-2 min-h-20 w-full border border-black/15 bg-white px-3 py-3 text-[12px] outline-none" /></label></div>
          <div className="space-y-4"><h2 className="text-xl">{isEnglish ? "Payment method" : "طريقة الدفع"}</h2><div className="grid gap-3 sm:grid-cols-3">{paymentOptions.map((option) => <label key={option.value} className={`cursor-pointer border p-4 text-[11px] ${paymentMethod === option.value ? "border-black bg-[#f6f3ee]" : "border-black/15"}`}><input type="radio" name="paymentMethod" value={option.value} checked={paymentMethod === option.value} onChange={() => setPaymentMethod(option.value)} className="sr-only" /><span className="font-bold">{isEnglish ? option.label : option.labelAr}</span></label>)}</div>{paymentMethod !== "cod" && <div className="space-y-4 bg-[#f6f3ee] p-5"><div><p className="text-[11px] font-bold">{isEnglish ? `${paymentLabel?.label} transfer number` : `رقم تحويل ${paymentLabel?.labelAr}`}</p><p className="mt-2 border border-black/10 bg-white px-3 py-3 text-[13px] tracking-wide">{transferNumber || (isEnglish ? "Not configured yet" : "لم يتم ضبط الرقم بعد")}</p></div><label className="flex cursor-pointer items-center gap-3 border border-dashed border-black/25 bg-white px-4 py-4 text-[11px] font-bold"><Upload size={16} />{receipt ? (isEnglish ? "Receipt attached" : "تم إرفاق الإيصال") : (isEnglish ? "Upload transfer receipt" : "إرفاق صورة إيصال التحويل")}<input required type="file" accept="image/*" onChange={uploadReceipt} className="hidden" /></label></div>}</div>
        </div>
        <aside className="h-fit bg-[#f6f3ee] p-6">{submitError && <p className="mb-3 text-[10px] leading-5 text-[#c95f49]">{submitError}</p>}<h2 className="mb-6 text-xl">{isEnglish ? "Order summary" : "ملخص الطلب"}</h2><div className="space-y-4 border-b border-black/10 pb-5 text-[12px]">{cartItems.map(({ product, quantity }) => <div key={product.id} className="flex justify-between gap-4"><span>{getProductName(product, language)} × {quantity}</span><span className="shrink-0">{(getProductUnitPrice(product) * quantity).toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</span></div>)}{discountAmount > 0 && <div className="flex justify-between text-[#1c2822]"><span className="text-black/55">{isEnglish ? "Discount" : "الخصم"}</span><span>-{discountAmount.toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</span></div>}<div className="flex justify-between"><span className="text-black/55">{isEnglish ? "Shipping" : "الشحن"}</span><span>{shipping === 0 ? (isEnglish ? "Free" : "مجاني") : `${shipping} ${isEnglish ? "EGP" : "ج.م"}`}</span></div></div><div className="flex justify-between py-5 text-sm font-bold"><span>{isEnglish ? "Total" : "الإجمالي"}</span><span>{total.toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</span></div>{!isFormValid && <p className="mb-3 text-[10px] leading-5 text-[#c95f49]">{isEnglish ? "Complete all required fields to confirm your order." : "أكملي جميع البيانات المطلوبة لتأكيد الطلب."}</p>}<button type="submit" disabled={!isFormValid || submitting} className="flex w-full items-center justify-center gap-2 bg-[#1c2822] py-4 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Check size={15} />{isEnglish ? "Confirm order" : "تأكيد الطلب"}</button><button type="button" onClick={() => navigate("/cart")} className="mt-5 block w-full text-center text-[11px] underline underline-offset-4">{isEnglish ? "Back to bag" : "العودة للسلة"}</button></aside>
      </form>
    </section>
  );
}
