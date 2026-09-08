# حالة مشروع No Name — المرجع الحالي

## 1. الحالة الحالية

المشروع متجر React SPA مع Express API وخادم Supabase. بيانات المنتجات والإعدادات والأقسام والصفحات والكوبونات والطلبات تمر عبر APIs الخادم، بينما تبقى السلة واللغة فقط في `localStorage` كحالة متصفح.

الحالة الحالية: **جاهز للاختبار بعد تطبيق migrations وضبط متغيرات البيئة، وليس جاهزًا للإطلاق التجاري قبل اختبار Supabase والإنتاج فعليًا.**

## 2. ما تم تنفيذه

- تسجيل دخول الإدارة عبر Supabase Auth و`admin_profiles` مع جلسة آمنة.
- حماية مسارات الإدارة على الخادم، وليس بإخفاء الأزرار في React فقط.
- CRUD محمي للمنتجات، مع الصور والفيديو والخصائص والمتغيرات.
- تعديل إعدادات الموقع والأقسام والصفحات والكوبونات من لوحة التحكم.
- عرض الطلبات وتصفيتها وفتح تفاصيلها وتحديث حالتها.
- فتح إيصالات الدفع عبر Signed URL من Supabase Storage الخاص.
- إعادة حساب السعر والخصم والشحن والمخزون على الخادم.
- خصم مخزون اللون والمقاس المحدد داخل transaction عند وجود `variants`.
- منع الطلب المكرر باستخدام `Idempotency-Key`.
- ترحيل بيانات `localStorage` القديمة من لوحة التحكم.
- أدوات تصدير واستيراد البيانات القديمة.
- دعم حسابات العملاء وربط طلباتهم بحساباتهم.
- دعم رفع صور المنتجات وفيديوهاتها إلى Supabase Storage.
- فحوص TypeScript والاختبارات والبناء ناجحة محليًا.

## 3. ترتيب migrations الحالي

نفّذ الملفات بهذا الترتيب في SQL Editor أو عبر Supabase CLI:

```text
supabase/migrations/001_admin_security.sql
supabase/migrations/002_store_data.sql
supabase/migrations/003_auth_and_customer_access.sql
supabase/migrations/004_product_images.sql
supabase/migrations/005_order_access_and_receipts.sql
supabase/migrations/005a_store_media_variants.sql
supabase/migrations/006_variant_order_stock.sql
```

لا تعِد تسمية migrations بعد تشغيلها على مشروع مشترك. إذا تم تشغيلها بالفعل، أضف migration جديدة بدل تعديل تاريخ سابق.

## 4. المسارات المهمة

```text
/                    الصفحة الرئيسية
/shop                المتجر
/product/:id         تفاصيل المنتج
/cart                السلة
/checkout            إتمام الطلب
/order-summary/:id  ملخص الطلب
/account             حساب العميل
/admin/login         تسجيل دخول الإدارة
/admin               لوحة التحكم
```

## 5. APIs الحالية

### عامة

```text
GET  /api/products
GET  /api/store-settings
GET  /api/sections
GET  /api/pages
GET  /api/coupons
POST /api/order-receipts
POST /api/orders
GET  /api/orders/:orderNumber?token=...
GET  /api/customer/orders
```

### الإدارة

```text
POST   /api/admin/products
PATCH  /api/admin/products/:id
DELETE /api/admin/products/:id
POST   /api/admin/products/:id/inventory
PUT    /api/admin/store-settings
PUT    /api/admin/sections/:key
PUT    /api/admin/pages
POST   /api/admin/coupons
DELETE /api/admin/coupons/:code
GET    /api/admin/orders
GET    /api/admin/orders/:id
GET    /api/admin/orders/:id/receipt-url
PATCH  /api/admin/orders/:id
POST   /api/admin/migrate
POST   /api/admin/seed-products
POST   /api/admin/product-images
POST   /api/admin/product-videos
```

## 6. قواعد التجارة والمخزون

- السعر النهائي مصدره Supabase وليس المتصفح.
- الشحن يقرأ `shippingAmount` و`freeShippingThreshold` من إعدادات Supabase.
- لا يُقبل الطلب إذا لم تتوفر الكمية المطلوبة.
- عند وجود variants يتم الخصم من تركيبة اللون والمقاس نفسها.
- لا يسمح محرر الإدارة بتكرار نفس `(color, size)` للمنتج.
- المنتجات التي لا تحتوي variants تستخدم `products.stock`.
- إيصالات الدفع تحفظ في Storage ولا تحفظ Base64 داخل الطلب.
- تغيير حالة الطلب من لوحة الإدارة يتم عبر API محمي.

## 7. التشغيل والفحص

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

ملف الخادم الناتج:

```text
dist/server/node-build.mjs
```

## 8. متغيرات البيئة

يجب إنشاء `.env` محليًا أو إدخال القيم في إعدادات الاستضافة:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-key>
APP_ORIGIN=https://your-production-domain.example
NODE_ENV=production
```

لا تضع `SUPABASE_SERVICE_ROLE_KEY` داخل React أو أي متغير `VITE_*` أو GitHub.

## 9. إنشاء حساب المدير

بعد تطبيق migrations وضبط `.env`:

```bash
pnpm admin:create admin@example.com
```

سيطلب السكربت كلمة المرور مرتين، ويشترط ألا تقل عن 12 حرفًا. لا تضع كلمة المرور داخل Git أو ملفات Markdown.

## 10. الملفات الأساسية ووظيفة كل ملف

- `client/pages/Admin.tsx`: واجهة لوحة التحكم وإدارة المنتجات والمحتوى والطلبات.
- `client/components/store/StoreLayout.tsx`: حالة المتجر، تحميل البيانات، السلة، وإرسال الطلبات إلى APIs.
- `client/pages/Checkout.tsx`: التحقق من بيانات العميل، رفع الإيصال، وإنشاء الطلب.
- `client/pages/OrderSummary.tsx`: عرض ملخص الطلب بعد إنشائه أو إعادة فتحه.
- `server/index.ts`: إنشاء خادم Express وتسجيل المسارات.
- `server/auth.ts`: المصادقة، الجلسات، صلاحيات الإدارة، وطلبات Supabase.
- `server/routes/store.ts`: APIs المنتجات والطلبات والإعدادات والكوبونات والرفع والمخزون.
- `scripts/create-admin.ts`: إنشاء مستخدم Auth وربطه بملف الإدارة.
- `client/lib/store-migration.ts`: تصدير واستيراد بيانات `localStorage` القديمة.
- `shared/seed-products.ts`: المنتجات التجريبية التي يمكن زرعها مرة واحدة.
- `supabase/migrations/*.sql`: مخطط الجداول والدوال والسياسات وStorage.
- `.env.example`: أسماء متغيرات البيئة بدون أسرار.
- `HOST.EXAMPLE.md`: خطوات تجهيز GitHub والنشر على Hostinger وNetlify ومتغيرات البيئة المطلوبة.

## 11. ما يزال مطلوبًا قبل الإطلاق

- تطبيق migrations على مشروع Supabase جديد والتحقق من نجاح كل ملف.
- اختبار RLS وStorage والطلبات والمخزون فعليًا على Supabase.
- تدوير أي `service_role` تم كشفه سابقًا.
- اختبار إنشاء حساب المدير وتسجيل الدخول في بيئة الإنتاج.
- اختبار رفع صورة وفيديو وإيصال في الإنتاج.
- إعداد نسخ احتياطية لقاعدة البيانات.
- اختبار النطاق النهائي و`APP_ORIGIN` وملفات cookies.
- تشغيل اختبارات أمن وتكامل خارجية قبل استقبال العملاء.

## 12. مرجع هذا الملف

وظيفة `plane.md` هي توثيق الحالة الفنية الحالية، ترتيب migrations، المسارات، APIs، قواعد التجارة، الملفات الأساسية، وما تبقى قبل الإطلاق.
