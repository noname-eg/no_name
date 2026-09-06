# حالة مشروع No Name / Supabase

## الحالة الحالية

المشروع يعمل كمتجر React + Express، وتمت إضافة طبقة Supabase خادمية للبيانات التجارية الأساسية. النسخة الحالية مناسبة للتجربة بعد تطبيق migration وضبط متغيرات البيئة، لكنها ليست جاهزة للإطلاق التجاري النهائي حتى تكتمل حسابات العملاء واختبارات Supabase الخارجية.

## ما تم تنفيذه

- تسجيل دخول الإدارة باستخدام `admin_users` وهاش `scrypt` وجلسة `HttpOnly`.
- مسارات الإدارة الأساسية في `server/auth.ts`.
- migration موحدة في `supabase/migrations/001_admin_security.sql`.
- جداول المنتجات، الإعدادات، الأقسام، الصفحات، الكوبونات، الطلبات، عناصر الطلب، ملفات العملاء، وسجلات التدقيق.
- `POST /api/orders` مع إعادة حساب السعر والمخزون والكوبون على الخادم.
- `Idempotency-Key` لمنع إنشاء الطلب أكثر من مرة.
- دالة SQL ذرّية لتحديث المخزون وزيادة استخدام الكوبون مع إنشاء الطلب.
- CRUD محمي للمنتجات والإعدادات والأقسام والصفحات والكوبونات.
- APIs قراءة المنتجات والإعدادات والأقسام والصفحات والكوبونات.
- رفع إيصالات الدفع إلى Supabase Storage داخل bucket خاص باسم `receipts`.
- استرجاع ملخص الطلب بعد تحديث الصفحة باستخدام رقم الطلب ورقم الهاتف.
- تصدير واستيراد بيانات `localStorage` القديمة من لوحة التحكم.
- تخطي الطلبات القديمة تلقائيًا أثناء الترحيل لأنها ليست سجلات مالية موثوقة.

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
GET  /api/orders/:orderNumber?phone=...
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
SUPABASE_ANON_KEY=<public-auth-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-key>
APP_ORIGIN=https://your-production-domain.example
NODE_ENV=production
```

لا تضع `SUPABASE_SERVICE_ROLE_KEY` في `VITE_*` أو داخل ملفات `client` أو Git.

## الملفات الأساسية

- `server/auth.ts`: جلسات الإدارة وطلبات Supabase ورفع الملفات.
- `server/routes/store.ts`: APIs المتجر والإدارة والطلبات.
- `server/index.ts`: تسجيل Express routes.
- `client/components/store/StoreLayout.tsx`: حالة المتجر وطلبات APIs.
- `client/pages/Admin.tsx`: لوحة الإدارة والتصدير والاستيراد.
- `client/pages/Checkout.tsx`: رفع الإيصال وإنشاء الطلب.
- `client/pages/OrderSummary.tsx`: استرجاع الطلب.
- `client/lib/store-migration.ts`: أدوات الترحيل.
- `supabase/migrations/001_admin_security.sql`: مخطط Supabase ودالة الطلب وbucket الإيصالات.
- `.env.example`: أسماء متغيرات البيئة فقط.

## ما يزال مفتوحًا قبل الإطلاق

- تطبيق Supabase migration فعليًا على مشروع جديد واختبار RLS وStorage.
- إنشاء واجهة تسجيل ودخول العملاء باستخدام Supabase Auth.
- ربط `auth.uid()` بالطلبات وتطبيق سياسات قراءة العميل لطلباته فقط.
- استبدال fallback القديم من `localStorage` بعد التأكد من اكتمال الترحيل.
- تدوير أي مفتاح `service_role` تم كشفه سابقًا.
- اختبار Netlify Function وبيئة الإنتاج الفعلية.
- إضافة اختبارات integration وsecurity للـ APIs.
