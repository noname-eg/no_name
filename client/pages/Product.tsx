import { useEffect, useState } from "react";
import { Check, Heart, MessageCircle, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getCategoryName, getProductName, getProductPrice, ProductCard, useStore } from "@/components/store/StoreLayout";

const sizes = ["XXL", "XL", "L", "M", "S"];

export default function Product() {
  const { id } = useParams();
  const { catalog, addToCart, liked, toggleLike, language } = useStore();
  const isEnglish = language === "en";
  const product = catalog.find((item) => item.id === id) || catalog[0];
  const productName = getProductName(product, language);
  const productDescription = (isEnglish ? product.descriptionEn : product.description) || (isEnglish ? "A thoughtful everyday piece designed for comfort, ease, and effortless styling." : "قطعة مصممة عشان تكمل يومك بسهولة. خامة مريحة وقصّة مدروسة، تتلبس بطريقتك وفي كل مناسبة.");
  const galleryImages = product.images?.length ? product.images.slice(0, 5) : [product.image, product.image, product.image];
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("L");
  const availableColors = product.colors?.length ? product.colors : ["#eeeae0", "#202320"];
  const availableSizes = product.sizes?.length ? product.sizes : sizes;
  const [selectedColor, setSelectedColor] = useState(availableColors[0]);
  const [added, setAdded] = useState(false);
  const index = catalog.indexOf(product);
  useEffect(() => { setSelectedThumbnail(0); }, [product.id]);

  const add = () => {
    for (let count = 0; count < quantity; count += 1) addToCart(product);
    setAdded(true);
  };

  return (
    <>
      <section className="mx-auto max-w-[1120px] px-5 pb-16 pt-8 lg:px-8 lg:pb-24 lg:pt-12">
        <div className="mb-8 text-[10px] text-black/45">
          <Link to="/" className="transition hover:text-black">{isEnglish ? "Home" : "الرئيسية"}</Link>
          <span className="mx-2 text-black/25">/</span>
          <Link to="/shop" className="transition hover:text-black">{isEnglish ? "Shop" : "المتجر"}</Link>
          <span className="mx-2 text-black/25">/</span>
          <span>{productName}</span>
        </div>

        <div className="grid items-start gap-9 lg:grid-cols-[1.08fr_.92fr] lg:gap-14">
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="aspect-[.94] overflow-hidden rounded-[5px] bg-[#e5e3dc]">
              {product.video && selectedThumbnail === 0 ? <video src={product.video} poster={galleryImages[0]} autoPlay muted loop playsInline className="h-full w-full object-cover" aria-label={productName} /> : <img src={galleryImages[selectedThumbnail]} alt={productName} className={`h-full w-full object-cover ${selectedThumbnail === 1 ? "object-left" : selectedThumbnail === 2 ? "object-right" : "object-center"}`} />}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {galleryImages.map((image, thumbnail) => (
                <button type="button" key={`${image}-${thumbnail}`} onClick={() => setSelectedThumbnail(thumbnail)} className={`aspect-square overflow-hidden rounded-[3px] border bg-[#e5e3dc] ${thumbnail === selectedThumbnail ? "border-black" : "border-transparent"}`} aria-label={isEnglish ? `Product image ${thumbnail + 1}` : `صورة المنتج ${thumbnail + 1}`}>
                  <img src={image} alt="" className={`h-full w-full object-cover ${thumbnail === 1 ? "object-left" : thumbnail === 2 ? "object-right" : ""}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:pt-3">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="mb-3 text-[10px] font-medium text-black/45">{getCategoryName(product.category, language)} · {isEnglish ? "Made in Egypt" : "صناعة مصرية"}</p>
                <h1 className="text-[25px] font-semibold leading-[1.5] tracking-[-0.03em] sm:text-[30px]">{productName}</h1>
                <p className="mt-2 text-[16px] font-medium">{getProductPrice(product, language)}</p>
              </div>
              <button onClick={() => toggleLike(index)} className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10" aria-label={isEnglish ? "Add to wishlist" : "إضافة للمفضلة"}>
                <Heart size={17} fill={liked.includes(index) ? "currentColor" : "none"} className={liked.includes(index) ? "text-[#d4775c]" : "text-black/65"} />
              </button>
            </div>

            <div className="mt-5 space-y-2 rounded-[3px] bg-[#eff8ee] px-4 py-3 text-[10px] leading-6 text-[#3f7545]">
              <p><Check className="ml-1 inline-block" size={13} /> {isEnglish ? "Free shipping on orders over EGP 2,500" : "شحن مجاني للطلبات فوق ٢٥٠٠ جنيه"}</p>
              <p><Truck className="ml-1 inline-block" size={13} /> {isEnglish ? "Ready to ship within 2–48 hours" : "متوفر للشحن خلال ٢–٤٨ ساعة"}</p>
            </div>

            <div className="mt-6 border-b border-black/10 pb-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] font-semibold">{isEnglish ? "Color" : "اللون"}: <span className="font-normal text-black/60">{selectedColor}</span></span>
                <button className="text-[10px] text-black/45 underline">{isEnglish ? "Size guide" : "دليل المقاسات"}</button>
              </div>
              <div className="flex gap-2">
                {availableColors.map((color) => (
                  <button key={color} onClick={() => setSelectedColor(color)} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] ${selectedColor === color ? "border-black" : "border-black/10"}`}>
                    <span className="h-4 w-4 rounded-full border border-black/15" style={{ backgroundColor: color }} />{color}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b border-black/10 py-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] font-semibold">{isEnglish ? "Size" : "المقاس"}</span>
                <span className="text-[10px] text-[#c95f49]">{isEnglish ? "Choose your size" : "اختاري المقاس المناسب"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button key={size} onClick={() => setSelectedSize(size)} className={`min-w-[48px] rounded-[3px] border px-3 py-2.5 text-[10px] transition ${selectedSize === size ? "border-black bg-black text-white" : "border-black/15 hover:border-black"}`}>{size}</button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-[4px] bg-[#fff7eb] px-4 py-3 text-[10px] leading-6 text-[#94612e]">
              <span className="ml-1">⏳</span> {isEnglish ? "More than 5 shoppers are viewing this piece" : "أكثر من ٥ عميلات يشاهدن هذا المنتج الآن"}
            </div>

            <div className="mt-5 flex gap-2">
              <div className="flex h-12 items-center rounded-[4px] border border-black/15">
                <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-full w-10 items-center justify-center" aria-label={isEnglish ? "Decrease quantity" : "تقليل الكمية"}><Minus size={14} /></button>
                <span className="w-8 text-center text-[12px]">{quantity}</span>
                <button onClick={() => setQuantity((value) => value + 1)} className="flex h-full w-10 items-center justify-center" aria-label={isEnglish ? "Increase quantity" : "زيادة الكمية"}><Plus size={14} /></button>
              </div>
              <button onClick={add} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[4px] bg-[#171717] text-[12px] font-semibold text-white transition hover:bg-[#d4775c]">
                <ShoppingBag size={16} />{added ? (isEnglish ? "Added to bag" : "تمت الإضافة إلى السلة") : (isEnglish ? "Add to bag" : "أضيفي إلى السلة")}
              </button>
            </div>
            <Link to="/cart" className="mt-3 flex h-12 items-center justify-center rounded-[4px] border border-black/60 text-[12px] font-medium transition hover:bg-black hover:text-white">{isEnglish ? "Buy now" : "اشتري الآن"}</Link>

            <div className="mt-5 flex items-center justify-center gap-3 text-[9px] text-black/50">
              <span className="h-4 w-7 rounded-sm border border-black/20 bg-[#e9e9e9]" />
              <span className="h-4 w-7 rounded-sm border border-black/20 bg-[#f6d9a5]" />
              <span className="h-4 w-7 rounded-sm border border-black/20 bg-[#c9dcf2]" />
              {isEnglish ? "Secure encrypted payment" : "دفع آمن ومشفر"}
            </div>

            <div className="mt-7 border-t border-black/10 pt-6">
              <h2 className="mb-4 text-[13px] font-semibold">{isEnglish ? "Description" : "الوصف"}</h2>
              <p className="text-[11px] leading-7 text-black/65">{productDescription}</p>
              <ul className="mt-3 space-y-1 text-[11px] leading-6 text-black/65">
                <li>• {isEnglish ? "100% made in Egypt" : "صناعة مصرية ١٠٠٪"}</li>
                <li>• {isEnglish ? "Comfortable fabric for everyday wear" : "خامة مريحة ومناسبة للاستخدام اليومي"}</li>
                <li>• {isEnglish ? "Ships within 2–4 business days" : "الشحن خلال ٢–٤ أيام عمل"}</li>
                <li>• {isEnglish ? "Free exchange within 14 days" : "استبدال مجاني خلال ١٤ يوم"}</li>
              </ul>
            </div>

            <div className="mt-8 border-t border-black/10 pt-5">
              <div className="flex gap-5 border-b border-black/10 text-[11px] font-semibold">
                <button className="border-b-2 border-black pb-3">{isEnglish ? "Shipping" : "شحن"}</button>
                <button className="pb-3 text-black/45">{isEnglish ? "Returns" : "المرتجعات"}</button>
              </div>
              <div className="pt-5 text-[10px] leading-7 text-black/70">
                <p className="font-semibold text-black">{isEnglish ? "Fast, reliable delivery" : "توصيل سريع وموثوق"}</p>
                <ul className="mt-2 list-disc space-y-0.5 pr-5">
                  <li>{isEnglish ? "Delivery across Egypt" : "التوصيل في جميع أنحاء مصر"}</li>
                  <li>{isEnglish ? "Orders ship within 2–5 business days" : "يتم شحن الطلبات خلال ٢–٥ أيام عمل"}</li>
                  <li>{isEnglish ? "Packed safely to protect your piece" : "تم تغليفها بطريقة آمنة للحفاظ على القطعة"}</li>
                </ul>
                <p className="mt-4">{isEnglish ? "Our support team is happy to help with delivery questions." : "لأي استفسارات تتعلق بالتوصيل، يسعد فريق الدعم لدينا بتقديم المساعدة."}</p>
              </div>
            </div>

            <div className="mt-10">
              <p className="mb-4 text-[10px] font-semibold text-black/65">{isEnglish ? "Complete the look" : "أكملي الإطلالة"}</p>
              <div className="space-y-2">
                {catalog.filter((item) => item.id !== product.id).slice(0, 3).map((item, suggestionIndex) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-[#e8e6dc] p-2.5">
                    <Link to={`/product/${item.id}`} className="h-[58px] w-[58px] shrink-0 overflow-hidden rounded-xl bg-[#d7d5cc]">
                      <img src={item.image} alt={getProductName(item, language)} className="h-full w-full object-cover" />
                    </Link>
                    <Link to={`/product/${item.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold">{getProductName(item, language)}</p>
                      <p className="mt-1 text-[10px]">{getProductPrice(item, language)}</p>
                      <span className="mt-1 inline-flex rounded-full bg-white/75 px-2 py-0.5 text-[8px] text-black/55">{suggestionIndex === 1 ? (isEnglish ? "Off-white / M" : "أوف وايت / مقاس متوسط") : (isEnglish ? "Black / L" : "أسود / L")}</span>
                    </Link>
                    {suggestionIndex === 1 ? (
                      <button onClick={() => addToCart(item)} className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-[#222] px-3 text-[9px] font-semibold text-white"><Plus size={12} /> {isEnglish ? "Add" : "يضاف"}</button>
                    ) : (
                      <Link to={`/product/${item.id}`} className="flex h-9 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d7d7d3] text-[9px] text-black/55">{isEnglish ? "View" : "تنفيذ"}</Link>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => window.alert(isEnglish ? "Our support team will contact you on WhatsApp soon." : "سيتواصل معك فريق الدعم عبر واتساب قريبًا.")} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] text-[11px] font-semibold text-white"><MessageCircle size={15} /> {isEnglish ? "Chat with us on WhatsApp" : "تواصلي معنا عبر واتساب"}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 bg-[#f7f7f4] px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-9 flex items-end justify-between">
            <div><p className="mb-2 text-[10px] text-black/45">{isEnglish ? "More from this collection" : "اختيارات من نفس المجموعة"}</p><h2 className="text-[25px] font-semibold tracking-[-0.03em]">{isEnglish ? "You may also like" : "ممكن يعجبك كمان"}</h2></div>
            <Link to="/shop" className="text-[11px] underline underline-offset-4">{isEnglish ? "View all" : "شاهدي الكل"}</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {catalog.filter((item) => item.id !== product.id).slice(0, 4).map((item) => <ProductCard key={item.id} product={item} index={catalog.indexOf(item)} />)}
          </div>
        </div>
      </section>
    </>
  );
}
