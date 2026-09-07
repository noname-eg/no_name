# حالة مشروع No Name / Supabase

## الحالة الحالية

المشروع يعمل كمتجر React + Express، وتمت إضافة طبقة Supabase خادمية للبيانات التجارية الأساسية. النسخة الحالية مناسبة للتجربة بعد تطبيق migration وضبط متغيرات البيئة، لكنها ليست جاهزة للإطلاق التجاري النهائي حتى تكتمل حسابات العملاء واختبارات Supabase الخارجية.

## ما تم تنفيذه

- تسجيل دخول الإدارة باستخدام Supabase Auth و`admin_profiles` وجلسة `HttpOnly`.
- مسارات الإدارة الأساسية في `server/auth.ts`.
- migrations مرتبة للمخطط والمصادقة والإيصالات والوسائط، وآخرها `006_variant_order_stock.sql` لتوحيد خصم مخزون المتغيرات.
- جداول المنتجات، الإعدادات، الأقسام، الصفحات، الكوبونات، الطلبات، عناصر الطلب، ملفات العملاء، وسجلات التدقيق.
- `POST /api/orders` مع إعادة حساب السعر والمخزون والكوبون على الخادم.
- `Idempotency-Key` لمنع إنشاء الطلب أكثر من مرة.
- دالة SQL ذرّية لتحديث المخزون وزيادة استخدام الكوبون مع إنشاء الطلب.
- CRUD محمي للمنتجات والإعدادات والأقسام والصفحات والكوبونات.
- APIs قراءة المنتجات والإعدادات والأقسام والصفحات والكوبونات.
- رفع إيصالات الدفع إلى Supabase Storage داخل bucket خاص باسم `receipts`.
- استرجاع ملخص الطلب بعد تحديث الصفحة باستخدام access token قصير العمر محفوظ في sessionStorage أو جلسة العميل.
- تصدير واستيراد بيانات `localStorage` القديمة من لوحة التحكم.
- ترحيل الطلبات القديمة عبر endpoint محمي مع رفض السجلات غير الصالحة وإرجاع تفاصيل الرفض.

## المسارات المهمة

- `/`, `/shop`, `/product/:id`, `/cart`
- `/checkout`
- `/order-summary/:id`
- `/admin/login`
- `/admin`

## APIs الحالية

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
```

### الإدارة

```text
POST   /api/admin/products
PATCH  /api/admin/products/:id
DELETE /api/admin/products/:id
PUT    /api/admin/store-settings
PUT    /api/admin/sections/:key
PUT    /api/admin/pages
POST   /api/admin/coupons
DELETE /api/admin/coupons/:code
GET    /api/admin/orders
PATCH  /api/admin/orders/:id
POST   /api/admin/migrate
POST   /api/admin/seed-products
POST   /api/admin/product-images
POST   /api/admin/product-videos
GET    /api/admin/orders/:id
GET    /api/admin/orders/:id/receipt-url
POST   /api/admin/products/:id/inventory
```

مسارات الإدارة محمية بجلسة الإدارة ولا تعتمد على إخفاء الأزرار في React فقط.

## التشغيل

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

ملف الإنتاج الناتج:

```text
dist/server/node-build.mjs
```

## متغيرات البيئة

في ملف `.env` المحلي أو إعدادات الاستضافة:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-key>
APP_ORIGIN=https://your-production-domain.example
NODE_ENV=production
```

لا تضع `SUPABASE_SERVICE_ROLE_KEY` في `VITE_*` أو داخل ملفات `client` أو Git.

## الملفات الأساسية

- `server/auth.ts`: جلسات الإدارة وطلبات Supabase ورفع الملفات.
- `server/routes/store.ts`: APIs المتجر والإدارة والطلبات واستيراد المنتجات ورفع صورها.
- `shared/seed-products.ts`: مصدر المنتجات التجريبية الـ36 للاستيراد الأولي.
- `server/index.ts`: تسجيل Express routes.
- `client/components/store/StoreLayout.tsx`: حالة المتجر وطلبات APIs.
- `client/pages/Admin.tsx`: لوحة الإدارة والتصدير والاستيراد.
- `client/pages/Checkout.tsx`: رفع الإيصال وإنشاء الطلب.
- `client/pages/OrderSummary.tsx`: استرجاع الطلب.
- `client/lib/store-migration.ts`: أدوات الترحيل.
- `supabase/migrations/001_admin_security.sql`: الجداول الأساسية ودالة الطلب.
- `supabase/migrations/005_order_access_and_receipts.sql`: الوصول الآمن للطلب ورفع الإيصالات.
- `supabase/migrations/20260324_store_media_variants.sql`: وسائط المنتجات وvariants.
- `supabase/migrations/006_variant_order_stock.sql`: التسعير والشحن وخصم مخزون variants داخل transaction.
- `.env.example`: أسماء متغيرات البيئة فقط.

## ما يزال مفتوحًا قبل الإطلاق

- تطبيق Supabase migrations فعليًا على مشروع جديد واختبار RLS وStorage.
- إبقاء localStorage للسلة واللغة فقط، مع اختبار زرع المنتجات الـ36 مرة واحدة ثم تعديل منتج وصورة من لوحة التحكم.
- اختبار حفظ variants متعددة الألوان والمقاسات وخصمها من المخزون.
- تدوير أي مفتاح `service_role` تم كشفه سابقًا.
- اختبار Netlify Function وبيئة الإنتاج الفعلية.
- إضافة اختبارات integration وsecurity للـ APIs.
