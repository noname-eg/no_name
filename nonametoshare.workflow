# No Name — سير العمل المحدث

## 1. الوضع الحالي

المشروع عبارة عن React SPA مع Express API. تم نقل الجزء الأساسي من منطق التجارة إلى خادم متصل بـ Supabase، ولم يعد السعر أو المخزون أو الكوبون القادم من المتصفح مصدر الحقيقة.

الحالة الحالية: **جاهز للتجربة بعد تطبيق migration وضبط البيئة، وليس جاهزًا للإطلاق التجاري النهائي قبل اختبار Supabase والإنتاج وحسابات العملاء.**

المسار العام:


React SPA
  → Express API / Netlify Function
  → Supabase REST + Postgres + Storage خاص
```

## 2. ما تم تنفيذه

### الإدارة

- تسجيل دخول الإدارة عبر `admin_users`.
- هاش كلمات المرور باستخدام `scrypt` على الخادم.
- جلسة `HttpOnly` مع إبطال الجلسة عند تسجيل الخروج.
- حماية المسارات الإدارية بواسطة `requireSession` و`requireAdmin`.
- تسجيل العمليات الحساسة في `audit_logs`.

### البيانات

ملف المخطط الحالي:

```text
supabase/migrations/001_admin_security.sql
```

الجداول:

```text
admin_users
admin_sessions
audit_logs
products
site_settings
site_sections
page_settings
coupons
customer_profiles
orders
order_items
```

كما يحتوي الملف على:

- قيود الأسعار والمخزون وحالات الطلب.
- فهارس للمنتجات والطلبات.
- RLS ومنع الوصول المباشر للجداول الحساسة.
- دالة `create_store_order` لإنشاء الطلب وتحديث المخزون والكوبون ذريًا.
- bucket خاص للإيصالات باسم `receipts`.

### APIs العامة

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

### APIs الإدارة

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

كل API إدارية تتطلب جلسة إدارة صحيحة. لا تعتمد حماية `/admin` على إخفاء الواجهة فقط.

## 3. تدفق الطلب الحالي

```text
تصفح المنتجات
→ إضافة المنتج إلى السلة
→ إدخال بيانات العميل
→ اختيار طريقة الدفع
→ رفع الإيصال عند الحاجة
→ POST /api/order-receipts
→ POST /api/orders مع Idempotency-Key
→ التحقق من البيانات على الخادم
→ جلب السعر والمخزون من Supabase
→ التحقق من الكوبون
→ حساب subtotal والخصم والشحن والإجمالي
→ إنشاء orders وorder_items
→ خصم المخزون وزيادة استخدام الكوبون
→ إرجاع رقم الطلب
→ حفظ ملخص مؤقت في sessionStorage
→ فتح Order Summary وWhatsApp
```

القواعد:

- لا يقبل الخادم `total` القادم من العميل كمصدر للحقيقة.
- يمنع الطلب إذا كانت الكمية أكبر من المخزون.
- يمنع الطلب المكرر عند إعادة الإرسال بنفس `Idempotency-Key`.
- لا يعتمد حفظ الطلب على نجاح فتح WhatsApp.
- الإيصال لا يخزن Base64 داخل الطلب؛ يرفع إلى Storage خاص.

## 4. تدفق لوحة التحكم

```text
تسجيل الدخول
→ فحص جلسة الإدارة
→ تحميل المنتجات والإعدادات والمحتوى والطلبات عبر API
→ تعديل البيانات
→ إرسال mutation إلى Express
→ التحقق بـ Zod
→ الكتابة إلى Supabase باستخدام service role على الخادم
→ تسجيل العملية في audit_logs
→ تحديث الواجهة بعد نجاح الخادم
```

عمليات لوحة التحكم الحالية:

- إضافة وتعديل وأرشفة المنتجات.
- تعديل المخزون والسعر والصور والخصائص.
- حفظ إعدادات الموقع.
- حفظ الأقسام والصفحات.
- إنشاء وأرشفة الكوبونات.
- عرض الطلبات وتحديث حالتها.

## 5. ترحيل البيانات القديمة

أدوات الترحيل:

```text
client/lib/store-migration.ts
```

الأزرار موجودة في لوحة التحكم:

```text
Export legacy data
Import legacy data
```

المفاتيح التي يتم تصديرها:

```text
no-name-products
no-name-settings
no-name-sections
no-name-pages
no-name-coupons
no-name-orders
```

يتم إرسال الملف إلى:

```text
POST /api/admin/migrate
```

سياسة الترحيل:

- المنتجات والكوبونات تستخدم upsert بعد التحقق.
- الإعدادات والأقسام والصفحات تكتب في جداولها المركزية.
- الطلبات القديمة يتم تخطيها تلقائيًا ولا تعتبر سجلات مالية مكتملة.
- يجب الاحتفاظ بملف التصدير خارج المستودع.
- بعد نجاح الترحيل يمكن إزالة fallback الخاص بالبيانات التجارية من `localStorage`.

## 6. متغيرات البيئة

الملف المرجعي:

```text
.env.example
```

أنشئ ملفًا محليًا باسم `.env` في جذر المشروع:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<public-auth-key>
SUPABASE_SERVICE_ROLE_KEY=<new-server-only-key>
APP_ORIGIN=http://localhost:8080
NODE_ENV=development
```

للإنتاج:

```env
APP_ORIGIN=https://your-real-domain.com
NODE_ENV=production
```

القواعد الأمنية:

- لا تضع `SUPABASE_SERVICE_ROLE_KEY` في `VITE_*`.
- لا تضع المفتاح داخل ملفات `client`.
- لا ترفع `.env` أو مفاتيح الإنتاج إلى Git.
- يجب تدوير مفتاح الخدمة الذي تم كشفه سابقًا قبل الإنتاج.

## 7. أوامر التشغيل

من جذر المشروع:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

لتطبيق قاعدة البيانات:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
pnpm admin:create <username>
```

ملف تشغيل الإنتاج:

```text
dist/server/node-build.mjs
```

## 8. الاختبارات الحالية

تم التحقق محليًا من:

```text
pnpm typecheck  ناجح
pnpm test       ناجح — 5 اختبارات
pnpm build      ناجح
```

هذه الاختبارات لا تعني أن migration طُبقت على مشروع Supabase خارجي أو أن Netlify Function اختُبرت في الإنتاج.

## 9. البنود المفتوحة

### حسابات العملاء

- واجهة التسجيل والدخول والخروج عبر Supabase Auth.
- إنشاء `customer_profiles` بعد التسجيل.
- ربط الطلب بحساب العميل عبر `auth.uid()`.
- سياسات RLS تسمح للعميل برؤية طلباته فقط.
- صفحات الحساب وطلباتي.

### Supabase والإنتاج

- تشغيل migration على مشروع Supabase جديد.
- اختبار RLS وStorage من مستخدم مجهول ومستخدم مصادق.
- مراجعة bucket `receipts` وسياسة Signed URLs.
- إضافة متغيرات البيئة في Netlify أو Hostinger.
- اختبار `/api/*` وSPA fallback على النطاق المنشور.
- تدوير مفتاح `service_role` القديم.

### تحسينات الأمان

- rate limiting مركزي بدل محدد الذاكرة.
- CSRF/Origin protection للعمليات المعتمدة على Cookie.
- اختبارات integration وsecurity.
- عدم تسجيل بيانات الدفع أو مفاتيح الخدمة في logs.

### البيانات والمنتجات

- إضافة `product_variants` إذا اختلف المخزون حسب اللون أو المقاس.
- نقل صور Data URLs القديمة إلى Storage عند الحاجة.
- استخدام Signed URLs لعرض الإيصالات الخاصة داخل الإدارة.

## 10. معيار الإطلاق

لا يعتبر المشروع جاهزًا للإطلاق النهائي قبل تحقق البنود التالية:

- migration مطبقة على مشروع Supabase الإنتاجي.
- `.env` ومتغيرات الاستضافة مضبوطة بمفتاح خدمة جديد.
- المنتجات والإعدادات والكوبونات والطلبات تعمل من APIs.
- الأسعار والكوبونات والمخزون يعاد التحقق منها خادميًا.
- الطلبات idempotent والمخزون يتغير مرة واحدة فقط.
- الإيصالات في Storage خاص وليست Base64.
- حسابات العملاء وسياسات RLS مختبرة.
- صلاحيات الإدارة تختبر عبر 401 و403.
- Netlify أو Hostinger اختُبر فعليًا.
- لا يظهر مفتاح الخدمة في حزمة العميل أو السجلات.
