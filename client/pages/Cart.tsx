import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCategoryName, getProductName, getProductPrice, useStore } from "@/components/store/StoreLayout";

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, language, coupons } = useStore();
  const isEnglish = language === "en";
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  const appliedCoupon = useMemo(() => {
    if (!appliedCouponCode) return null;
    return coupons.find((coupon) => coupon.code === appliedCouponCode && coupon.active) || null;
  }, [appliedCouponCode, coupons]);

  const subtotal = cartItems.reduce((total, item) => total + item.product.numericPrice * item.quantity, 0);
  const shipping = subtotal >= 2500 || subtotal === 0 ? 0 : 80;
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0;
  const total = Math.max(0, subtotal - discountAmount + shipping);

  const applyCoupon = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = couponInput.trim().toUpperCase();
    const foundCoupon = coupons.find((coupon) => coupon.code.toUpperCase() === normalizedCode && coupon.active);

    if (!normalizedCode) {
      setCouponError(isEnglish ? "Please enter a coupon code." : "يرجى إدخال كود الخصم.");
      return;
    }

    if (!foundCoupon) {
      setCouponError(isEnglish ? "This coupon code is not valid." : "كود الخصم غير صالح.");
      return;
    }

    setAppliedCouponCode(foundCoupon.code);
    setCouponError("");
  };

  const removeCoupon = () => {
    setAppliedCouponCode("");
    setCouponInput("");
    setCouponError("");
  };

  return (
    <section className="mx-auto max-w-[1100px] px-5 py-16 lg:px-8 lg:py-24">
      <div className="mb-12 flex items-end justify-between border-b border-[#1c2822]/15 pb-8"><div><p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[#d4775c]">{isEnglish ? "YOUR BAG" : "حقيبتك"}</p><h1 className="font-serif text-6xl tracking-[-0.05em]">{isEnglish ? "Shopping bag" : "سلة الشراء"}</h1></div><span className="text-[12px] text-[#1c2822]/55">{cartItems.length} {isEnglish ? "items" : "منتجات"}</span></div>
      {cartItems.length === 0 ? <div className="py-20 text-center"><p className="font-serif text-4xl">{isEnglish ? "Your bag is empty" : "السلة فاضية حالياً"}</p><p className="mt-4 text-[13px] text-[#1c2822]/55">{isEnglish ? "Choose your favorite pieces and start your look." : "اختاري قطعك المفضلة وابدئي إطلالتك."}</p><Link to="/shop" className="mt-8 inline-flex items-center gap-5 border-b border-[#1c2822] pb-3 text-[11px] font-bold">{isEnglish ? "Continue shopping" : "اذهبي إلى المتجر"} <ArrowLeft size={16} /></Link></div> : <div className="grid gap-14 lg:grid-cols-[1fr_340px] lg:gap-20">
        <div className="space-y-6">{cartItems.map(({ product, quantity }) => <article key={product.id} className="flex gap-4 border-b border-[#1c2822]/15 pb-6"><img src={product.image} alt={getProductName(product, language)} className="h-36 w-28 object-cover sm:h-44 sm:w-36" /><div className="flex min-w-0 flex-1 flex-col justify-between py-1"><div className="flex justify-between gap-3"><div><p className="text-[10px] text-[#d4775c]">{getCategoryName(product.category, language)}</p><h2 className="mt-2 text-[15px] font-semibold">{getProductName(product, language)}</h2><p className="mt-2 text-[12px] text-black/55">{getProductPrice(product, language)}</p></div><button onClick={() => removeFromCart(product.id)} className="text-black/45 hover:text-[#c95f49]" aria-label={isEnglish ? "Remove item" : "حذف المنتج"}><Trash2 size={16} /></button></div><div className="flex items-center justify-between"><div className="flex h-9 items-center border border-black/15"><button onClick={() => updateQuantity(product.id, quantity - 1)} className="flex h-full w-9 items-center justify-center" aria-label={isEnglish ? "Decrease quantity" : "تقليل الكمية"}><Minus size={13} /></button><span className="w-8 text-center text-[11px]">{quantity}</span><button onClick={() => updateQuantity(product.id, quantity + 1)} className="flex h-full w-9 items-center justify-center" aria-label={isEnglish ? "Increase quantity" : "زيادة الكمية"}><Plus size={13} /></button></div><p className="text-[12px] font-semibold">{(product.numericPrice * quantity).toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</p></div></div></article>)}</div>
        <aside className="h-fit bg-[#f6f3ee] p-6"><h2 className="mb-6 text-xl">{isEnglish ? "Order summary" : "ملخص الطلب"}</h2>
          <form onSubmit={applyCoupon} className="mb-5 border-b border-black/10 pb-5">
            <label className="block text-[11px] font-bold tracking-[0.08em] text-black/65">{isEnglish ? "Coupon code" : "كود الخصم"}</label>
            <div className="mt-2 flex gap-2">
              <input
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                placeholder={isEnglish ? "Enter voucher code" : "أدخل كود الخصم"}
                className="w-full border border-black/10 bg-white px-3 py-2 text-[12px] outline-none placeholder:text-black/30"
              />
              <button type="submit" className="bg-[#1c2822] px-3 py-2 text-[10px] font-bold text-white">
                {isEnglish ? "Apply" : "تفعيل"}
              </button>
            </div>
            {appliedCoupon && (
              <div className="mt-3 flex items-center justify-between rounded bg-white px-3 py-2 text-[11px]">
                <span>{appliedCoupon.code} · {appliedCoupon.discount}%</span>
                <button type="button" onClick={removeCoupon} className="text-[#c95f49]">{isEnglish ? "Remove" : "حذف"}</button>
              </div>
            )}
            {couponError && <p className="mt-2 text-[10px] text-[#c95f49]">{couponError}</p>}
          </form>
          <div className="space-y-4 border-b border-black/10 pb-5 text-[12px]">
            <div className="flex justify-between"><span className="text-black/55">{isEnglish ? "Subtotal" : "المجموع الفرعي"}</span><span>{subtotal.toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</span></div>
            {appliedCoupon && (
              <div className="flex justify-between text-[#1c2822]">
                <span className="text-black/55">{isEnglish ? "Discount" : "الخصم"}</span>
                <span>-{discountAmount.toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</span>
              </div>
            )}
            <div className="flex justify-between"><span className="text-black/55">{isEnglish ? "Shipping" : "الشحن"}</span><span>{shipping === 0 ? (isEnglish ? "Free" : "مجاني") : `${shipping} ${isEnglish ? "EGP" : "ج.م"}`}</span></div>
          </div>
          <div className="flex justify-between py-5 text-sm font-bold"><span>{isEnglish ? "Total" : "الإجمالي"}</span><span>{total.toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</span></div><button className="w-full bg-[#1c2822] py-4 text-[11px] font-bold text-white">{isEnglish ? "Checkout" : "إتمام الشراء"}</button><Link to="/shop" className="mt-5 block text-center text-[11px] underline underline-offset-4">{isEnglish ? "Continue shopping" : "متابعة التسوق"}</Link></aside>
      </div>}
    </section>
  );
}
