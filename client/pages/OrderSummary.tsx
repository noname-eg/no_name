import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useStore, type StoreOrder } from "@/components/store/StoreLayout";

export default function OrderSummary() {
  const { id } = useParams();
  const { orders, language } = useStore();
  const isEnglish = language === "en";
  const storedOrder = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem("no-name-orders") || "[]") as StoreOrder[];
      return saved.find((item) => item.id === id);
    } catch {
      return undefined;
    }
  })();
  const order = orders.find((item) => item.id === id) || storedOrder;

  if (!order) {
    return <section className="mx-auto max-w-[760px] px-5 py-20 text-center lg:px-8"><h1 className="font-serif text-4xl">{isEnglish ? "Order not found" : "الطلب غير موجود"}</h1><Link to="/shop" className="mt-8 inline-flex items-center gap-5 border-b border-[#1c2822] pb-3 text-[11px] font-bold">{isEnglish ? "Continue shopping" : "متابعة التسوق"}<ArrowLeft size={16} /></Link></section>;
  }

  const payment = order.paymentMethod === "wallet" ? (isEnglish ? "E-wallet" : "محفظة إلكترونية") : order.paymentMethod === "instapay" ? "InstaPay" : (isEnglish ? "Cash on delivery" : "دفع عند الاستلام");

  return <section className="mx-auto max-w-[900px] px-5 py-12 lg:px-8 lg:py-20"><div className="mb-10 border-b border-[#1c2822]/15 pb-8"><p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[#d4775c]">ORDER CONFIRMED</p><h1 className="font-serif text-5xl tracking-[-0.05em]">{isEnglish ? "Order summary" : "ملخص الطلب"}</h1><p className="mt-3 text-[12px] text-black/55">{order.id} · {new Date(order.date).toLocaleString(isEnglish ? "en-US" : "ar-EG")}</p></div><div className="grid gap-8 lg:grid-cols-[1fr_300px]"><div className="space-y-8"><div className="border-b border-black/10 pb-6"><h2 className="mb-4 text-xl">{isEnglish ? "Delivery details" : "بيانات التوصيل"}</h2><dl className="grid gap-3 text-[12px]"><div className="flex justify-between gap-5"><dt className="text-black/50">{isEnglish ? "Name" : "الاسم"}</dt><dd className="text-right font-medium">{order.customerName || "-"}</dd></div><div className="flex justify-between gap-5"><dt className="text-black/50">{isEnglish ? "Phone" : "الهاتف"}</dt><dd className="text-right font-medium">{order.phone || "-"}</dd></div><div className="flex justify-between gap-5"><dt className="text-black/50">{isEnglish ? "Address" : "العنوان"}</dt><dd className="max-w-[70%] text-right font-medium">{order.address || "-"}</dd></div>{order.notes && <div className="flex justify-between gap-5"><dt className="text-black/50">{isEnglish ? "Notes" : "ملاحظات"}</dt><dd className="max-w-[70%] text-right font-medium">{order.notes}</dd></div>}</dl></div><div><h2 className="mb-4 text-xl">{isEnglish ? "Items" : "المنتجات"}</h2><div className="space-y-3">{(order.orderItems || []).map((item) => <div key={`${item.name}-${item.quantity}`} className="flex justify-between gap-5 border-b border-black/10 pb-3 text-[12px]"><span>{item.name} × {item.quantity}</span><span className="shrink-0">{item.total.toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</span></div>)}</div></div></div><aside className="h-fit bg-[#f6f3ee] p-6"><h2 className="mb-5 text-xl">{isEnglish ? "Payment" : "الدفع"}</h2><p className="text-[12px] font-medium">{payment}</p>{order.transferNumber && <p className="mt-3 text-[11px] text-black/55">{isEnglish ? "Transfer number" : "رقم التحويل"}: {order.transferNumber}</p>}{order.receipt && <img src={order.receipt} alt={isEnglish ? "Transfer receipt" : "إيصال التحويل"} className="mt-5 max-h-64 w-full object-contain border border-black/10 bg-white p-2" />}<div className="mt-6 flex justify-between border-t border-black/10 pt-5 text-sm font-bold"><span>{isEnglish ? "Total" : "الإجمالي"}</span><span>{order.total.toLocaleString("en-US")} {isEnglish ? "EGP" : "ج.م"}</span></div></aside></div><Link to="/shop" className="mt-10 inline-flex items-center gap-5 border-b border-[#1c2822] pb-3 text-[11px] font-bold">{isEnglish ? "Continue shopping" : "متابعة التسوق"}<ArrowLeft size={16} /></Link></section>;
}
