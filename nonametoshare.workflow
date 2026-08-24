# تقرير جاهزية No Name للربط بقاعدة بيانات حقيقية

## 1. الملخص التنفيذي

المشروع الحالي هو Prototype لمتجر ملابس يعمل كواجهة React/TypeScript مع تخزين محلي في المتصفح. يمكن استخدامه للعرض والتجربة، لكنه غير جاهز حالياً لاستقبال بيانات عملاء أو تشغيل لوحة تحكم إنتاجية؛ لأن المنتجات والإعدادات والكوبونات والطلبات تُحفظ في `localStorage`، وتسجيل دخول الإدارة يتم بالكامل في كود المتصفح، ولا توجد قاعدة بيانات أو API تجارية محمية.

المسار الموصى به هو:




`React SPA → Express API / Netlify Function → Supabase Postgres + Supabase Storage الخاص`

يجب نقل كل قرار حساس إلى الخادم: صلاحية المدير، الأسعار، الخصومات، الشحن، الكوبونات، المخزون، إنشاء الطلب، رفع الإيصال، وروابط الإعدادات. يبقى في المتصفح فقط ما لا يمثل مصدراً موثوقاً أو سراً، مثل تفضيلات اللغة وحالة واجهة مؤقتة.

لا يشمل هذا التقرير تنفيذ الربط أو النشر؛ هو مراجعة وتجهيز وخطة تنفيذ.

---

## 2. حالة المشروع الحالية

| الملف | الحالة الحالية | أثرها قبل الإنتاج |
|---|---|---|
| `client/components/store/StoreLayout.tsx:147-181` | تهيئة المنتجات، الإعدادات، الأقسام، الصفحات، الكوبونات والطلبات من `localStorage`، مع حفظ التغييرات إليه | البيانات محلية لكل جهاز ويمكن تعديلها أو فقدها ولا تظهر بين الأجهزة |
| `client/components/store/StoreLayout.tsx:117-134` | نموذج المنتج يدعم `originalPrice`, `salePrice`, `badge`, `colors`, `sizes`, والمبيعات WhatsApp | النموذج مناسب للواجهة التجريبية، لكنه ليس مخزناً مركزياً أو محمياً |
| `client/components/store/StoreLayout.tsx:147-148` | الرقم الافتراضي للمبيعات هو `201068568250` والرابط `https://wa.me/201068568250` | الرقم ظاهر داخل Bundle العميل وقابل للتغيير محلياً |
| `client/components/store/StoreLayout.tsx:207` | شريط الهيدر في الصفحات الداخلية `sticky`، والصفحة الرئيسية تستخدم `fixed` حسب حالة التمرير | سلوك بصري محلي وليس جزءاً من نظام بيانات |
| `client/pages/AdminLogin.tsx:4-21` | اسم المستخدم وكلمة المرور ثابتان داخل الواجهة ثم تُكتب قيمة نجاح في `sessionStorage` | أي مستخدم يستطيع قراءة القيم أو تزوير جلسة الإدارة من أدوات المتصفح |
| `client/App.tsx:40-43` | حماية `/admin` تعتمد على `sessionStorage.getItem(ADMIN_AUTH_KEY)` | لا توجد مصادقة حقيقية ولا تفويض خادمي؛ يمكن تجاوزها |
| `client/pages/Admin.tsx:57-120` | لوحة التحكم تعدل المنتجات والمقاسات والألوان والأسعار والشارات وإعدادات WhatsApp محلياً | كل تعديل قابل للتلاعب ولا يوجد سجل تغييرات أو صلاحيات |
| `client/pages/Checkout.tsx:28-95` | يحسب الإجمالي، يقرأ رقم التحويل، يحول الإيصال إلى Data URL، يحفظ الطلب محلياً ويفتح WhatsApp | السعر والمخزون غير موثوقين، وحجم الإيصال قد يثقل التخزين، ولا يوجد منع للتكرار |
| `client/pages/OrderSummary.tsx:9-17` | يقرأ الطلب من الحالة ثم من `localStorage` | قد يظهر `Order not found` عند اختلاف التبويب أو فقدان التخزين |
| `server/index.ts:6-22` | Express مع CORS مفتوح و`/api/ping` و`/api/demo` فقط | لا توجد API للمنتجات أو الطلبات أو الإدارة |
| `netlify/functions/api.ts:3-5` | Function تشغل `createServer()` | نقطة مناسبة كبداية، لكنها لا توفر وحدها قاعدة بيانات أو مصادقة |
| `netlify.toml:2-15` | يبني الواجهة ويوجه `/api/*` إلى Function | يلزم إضافة SPA fallback واختبار المسارات المباشرة |
| `client/pages/Shop.tsx:53-83` | صفحة المتجر والفلاتر والبطاقات تعتمد على `catalog` المحلي | المنتجات والفلاتر ليست محدثة مركزياً |
| `client/global.css:120-421` | أنماط لوحة التحكم والهيدر والبطاقات في Tailwind/CSS | النمط منفصل عن مشكلة الأمان والبيانات |
| `package.json:5-14,94` | أوامر البناء والاختبار موجودة، ومدير الحزم المعلن PNPM | يوجد أيضاً `package-lock.json`؛ يجب اعتماد مدير حزم واحد |
| `tsconfig.json:19-24` | `strict: false` وخيارات TypeScript رخوة | أخطاء تكامل مستقبلية قد تمر دون كشف مبكر |

تم التحقق من أن عبارة `THE COLLECTION` غير موجودة حالياً في ملفات `client`، لذلك لا توجد إزالة إضافية مطلوبة لهذه العبارة في التقرير الحالي.

---

## 3. المخاطر حسب الأولوية

### P0 — يجب معالجتها قبل استقبال بيانات حقيقية

1. **بيانات اعتماد الإدارة مكشوفة**: القيم موجودة في `client/pages/AdminLogin.tsx:5-6`، وبالتالي تصل إلى المتصفح ويمكن استخراجها من Bundle المصدر.
2. **الحماية قابلة للتجاوز**: قرار السماح بمسار `/admin` في `client/App.tsx:41` يعتمد على `sessionStorage` فقط.
3. **لا توجد قاعدة بيانات مركزية**: حذف التخزين المحلي أو تغيير الجهاز قد يؤدي إلى فقد المنتجات والطلبات.
4. **العميل مصدر الثقة للأسعار والإجمالي**: `client/pages/Checkout.tsx:28-37` يحسب الأسعار والشحن في المتصفح؛ يمكن تعديل الطلب قبل الإرسال.
5. **لا يوجد حجز أو خصم للمخزون**: يمكن بيع نفس المخزون عدة مرات بسبب عدم وجود عملية ذرية خادمية.
6. **الإيصال محفوظ كـ Data URL**: `client/pages/Checkout.tsx:40-45` يخزنه داخل الطلب محلياً، وليس في تخزين ملفات خاص.

### P1 — يجب معالجتها قبل الإطلاق التجاري

1. لا توجد API حقيقية للمنتجات، المتغيرات، الكوبونات، الطلبات أو إعدادات الموقع.
2. لا توجد جلسات HttpOnly أو انتهاء جلسة أو Logout خادمي أو Rate Limiting.
3. لا توجد أدوار أو سياسات RLS أو Audit Log.
4. لا يتم حفظ المقاس واللون وSKU داخل عناصر الطلب؛ النوع الحالي `StoreOrderItem` في `StoreLayout.tsx:128` يحفظ الاسم والكمية والسعر فقط.
5. خصم السلة لا ينتقل بشكل موثوق إلى Checkout النهائي، ويجب إعادة الحساب مركزياً.
6. لا توجد Idempotency Key لمنع إنشاء طلبين عند النقر المتكرر أو إعادة المحاولة.
7. CORS مفتوح في `server/index.ts:10` ولا توجد Helmet أو سياسة أصول أو مراقبة مركزية.
8. `PING_MESSAGE` يُعاد عبر Endpoint عام في `server/index.ts:15-18`؛ يجب ألا يُستخدم لإخراج أي قيمة سرية.
9. لا توجد معالجة تشغيلية موثقة لـ Netlify Preview أو Hostinger/PM2 أو النسخ الاحتياطية.

### P2 — تحسينات قبل التوسع

1. رفع TypeScript تدريجياً إلى `strict: true`.
2. إضافة اختبارات API وواجهة واختبارات E2E للمسارات المباشرة وتدفق Checkout.
3. إضافة مراقبة أخطاء وسجلات منظمة وتنبيهات.
4. إضافة تصدير واستيراد آمن للبيانات المحلية خلال مرحلة الترحيل.
5. تحسين بحث المتجر والفلاتر لتعمل من API مع Pagination عند زيادة عدد المنتجات.

---

## 4. تصميم قاعدة بيانات Supabase المقترح

### الجداول الأساسية

#### `admin_users`

- `id uuid primary key`
- `username text unique not null` أو بريد إلكتروني فريد
- `password_hash text not null`
- `role text not null check (role in ('admin', 'editor'))`
- `is_active boolean not null default true`
- `last_login_at timestamptz`
- `created_at`, `updated_at`

لا يُحفظ Password خاماً. يستخدم الخادم Hashing مناسباً مثل Argon2id أو bcrypt مع إعدادات قوية.

#### `admin_sessions`

- `id uuid primary key`
- `admin_user_id uuid references admin_users(id)`
- `token_hash text unique not null`
- `expires_at timestamptz not null`
- `created_at`, `revoked_at`
- بيانات تدقيق اختيارية مثل IP hash وUser-Agent مختصر

يُرسل Token الجلسة في Cookie تحمل `HttpOnly`, `Secure`, `SameSite=Lax` مع مدة انتهاء محددة.

#### `categories`

- `id uuid primary key`
- `slug text unique not null`
- `name_ar text not null`
- `name_en text not null`
- `sort_order integer not null default 0`
- `is_active boolean not null default true`

#### `products`

- `id uuid primary key`
- `slug text unique not null`
- `name_ar`, `name_en`
- `description_ar`, `description_en`
- `category_id uuid references categories(id)`
- `original_price numeric(12,2) not null`
- `sale_price numeric(12,2)`
- `badge text`
- `is_active boolean not null default true`
- `created_at`, `updated_at`

قاعدة العمل: السعر المستخدم للبيع هو `sale_price` فقط إذا كان موجوداً وأقل من `original_price`؛ وإلا يستخدم `original_price`.

#### `product_variants`

- `id uuid primary key`
- `product_id uuid references products(id) on delete cascade`
- `size text not null`
- `color text not null`
- `sku text unique`
- `stock integer not null default 0 check (stock >= 0)`
- `reserved_stock integer not null default 0 check (reserved_stock >= 0)`
- Unique على `(product_id, size, color)`

هذا الجدول هو مصدر المقاسات والألوان المتاحة. ما يدخله المدير هو ما يظهر للمنتج، ولا تستخدم الواجهة قائمة ثابتة كمرجع نهائي.

#### `product_media`

- `id uuid primary key`
- `product_id uuid references products(id) on delete cascade`
- `storage_key text not null`
- `alt_ar`, `alt_en`
- `sort_order integer`
- `is_primary boolean`

#### `orders`

- `id uuid primary key`
- `public_reference text unique not null`
- `customer_name text not null`
- `phone text not null`
- `address text not null`
- `notes text`
- `payment_method text check (payment_method in ('cod','wallet','instapay'))`
- `payment_status text check (payment_status in ('pending','submitted','verified','rejected'))`
- `fulfillment_status text check (fulfillment_status in ('new','processing','completed','cancelled'))`
- `subtotal numeric(12,2) not null`
- `discount_amount numeric(12,2) not null default 0`
- `shipping_amount numeric(12,2) not null default 0`
- `total numeric(12,2) not null`
- `coupon_code text`
- `transfer_number_snapshot text`
- `receipt_storage_key text`
- `idempotency_key text unique`
- `created_at`, `updated_at`

#### `order_items`

- `id uuid primary key`
- `order_id uuid references orders(id) on delete cascade`
- `product_id uuid`
- `variant_id uuid`
- `product_name_snapshot text not null`
- `sku_snapshot text`
- `size_snapshot text`
- `color_snapshot text`
- `unit_price numeric(12,2) not null`
- `quantity integer not null check (quantity > 0)`
- `line_total numeric(12,2) not null`

يجب حفظ Snapshot وقت الطلب حتى لا تتغير الفاتورة القديمة عند تعديل المنتج لاحقاً.

#### `coupons`

- `id uuid primary key`
- `code text unique not null`
- `discount_percent numeric(5,2) not null`
- `max_uses integer`
- `used_count integer not null default 0`
- `starts_at`, `ends_at`
- `is_active boolean not null default true`

#### `coupon_redemptions`

- `id uuid primary key`
- `coupon_id uuid references coupons(id)`
- `order_id uuid references orders(id)`
- Unique على `(coupon_id, order_id)`

#### `site_settings`

- `key text primary key`
- `value_json jsonb not null`
- `updated_by uuid references admin_users(id)`
- `updated_at timestamptz not null default now()`

يحتوي على `salesWhatsappNumber`, `salesWhatsappUrl`, `walletNumber`, `instapayNumber` والإعلانات، مع عدم وضع مفاتيح سرية داخله.

#### `uploads`

- `id uuid primary key`
- `storage_key text unique not null`
- `owner_type text not null`
- `owner_id uuid not null`
- `mime_type text not null`
- `size_bytes integer not null`
- `created_at`, `expires_at`

#### `audit_logs`

- `id uuid primary key`
- `admin_user_id uuid`
- `action text not null`
- `entity_type`, `entity_id`
- `metadata jsonb`
- `created_at`

---

## 5. خطة الأمان والصلاحيات

1. إنشاء Login API خادمية والتحقق من المدخلات بـ Zod.
2. إزالة `ADMIN_USERNAME` و`ADMIN_PASSWORD` من Bundle العميل وعدم استخدام `sessionStorage` كإثبات صلاحية.
3. تخزين Hash كلمة المرور فقط في Supabase.
4. إضافة Middleware مركزي:
   - `requireSession`
   - `requireAdmin`
   - `requireRole('admin')` للأعمال الحساسة
5. إرجاع `401` عند غياب الجلسة و`403` عند عدم كفاية الدور قبل تنفيذ التعديل.
6. رسائل دخول عامة لا توضح هل اسم المستخدم موجود.
7. Rate Limiting لمسار الدخول وإنشاء الطلب ورفع الملفات.
8. Cookie آمنة: `HttpOnly`, `Secure` في الإنتاج، `SameSite=Lax`, انتهاء جلسة وLogout.
9. تقييد CORS إلى النطاقات المعروفة أو استخدام نفس النطاق دون CORS مفتوح.
10. تفعيل RLS في Supabase:
    - القراءة العامة للمنتجات النشطة فقط عبر API عامة أو سياسة محدودة.
    - الكتابة والتعديل للإدارة الموثقة فقط.
    - الطلبات لا يقرأها العميل مباشرة؛ الإدارة تقرأها عبر API خادمية مصرح بها.
11. Bucket الإيصالات خاص، والروابط Signed URLs قصيرة العمر للإدارة فقط.
12. عدم وضع Service Role Key أو أي سر في `VITE_*` أو كود المتصفح.
13. تسجيل الدخول وتغيير الأسعار والمخزون والإعدادات والطلبات في `audit_logs`.
14. إضافة Helmet، حدود Body، التحقق من Origin عند الحاجة، وسجلات أخطاء لا تسرب بيانات حساسة.

---

## 6. نقل منطق الأعمال إلى API

### API عامة

- `GET /api/products`
- `GET /api/products/:slug`
- `GET /api/categories`
- `GET /api/site/public-settings` للإعدادات العامة المسموح بها فقط

### API الإدارة

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET/POST/PATCH/DELETE /api/admin/products`
- `GET/POST/PATCH/DELETE /api/admin/products/:id/variants`
- `GET/PATCH /api/admin/settings`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `GET /api/admin/uploads/:id/signed-url`

### API إنشاء الطلب

- `POST /api/orders`
- يستقبل بيانات العميل، عناصر السلة، المقاس، اللون، الكوبون، طريقة الدفع و`Idempotency-Key`.
- يعيد حساب المنتج والمتغير والسعر والخصم والشحن على الخادم.
- يتحقق من توفر المخزون ويحجزه داخل Transaction أو عملية ذرية.
- يرفع الإيصال بعد التحقق من النوع والحجم.
- يحفظ الطلب والعناصر وSnapshot الأسعار.
- يعيد `orderId`, `publicReference`, `orderSummary` وبيانات WhatsApp المعتمدة.

لا يُقبل `total` القادم من العميل كمصدر للحقيقة.

---

## 7. الإيصالات والملفات

1. قبول صور فقط من MIME allowlist واضح مثل `image/jpeg`, `image/png`, `image/webp`.
2. تحديد حجم أقصى، مثال مبدئي 5MB، قبل القراءة والرفع.
3. فحص الامتداد والمحتوى الفعلي وعدم الوثوق باسم الملف.
4. إعادة تسمية الملف بمفتاح عشوائي وعدم استخدام اسم العميل في المسار.
5. التخزين في Supabase Storage Bucket خاص باسم مثل `order-receipts`.
6. حفظ `storage_key` وبيانات الملف فقط داخل `orders/uploads`.
7. توليد Signed URL قصيرة العمر عند فتحها من لوحة التحكم.
8. عدم جعل Bucket عاماً وعدم تخزين Data URL في قاعدة البيانات.
9. سياسة احتفاظ وحذف للإيصالات القديمة حسب سياسة العمل.

---

## 8. إصلاح تدفق Checkout وWhatsApp

### عند الضغط على Confirm Order

1. يتحقق العميل من الحقول لأجل تجربة الاستخدام، ثم يرسل الطلب إلى API.
2. يعيد الخادم التحقق من الاسم والهاتف والعنوان وطريقة الدفع.
3. الاسم يقبل الحروف والمسافات فقط وفق قواعد المنتج واللغة المطلوبة.
4. الهاتف يقبل أرقاماً فقط بطول محدد ومتفق عليه.
5. لا يُسمح بالطلب إذا كان المنتج أو المتغير غير متاح.
6. بعد نجاح الحفظ فقط:
   - تفتح صفحة `/order-summary/:id` داخل الموقع.
   - تعرض رسالة شكر وبيانات التوصيل والمنتجات والأسعار وطريقة الدفع والإيصال إن وجد.
   - تفتح محادثة WhatsApp في تبويب جديد برسالة منظمة.
7. رقم WhatsApp المستخدم يأتي من إعداد خادمي معتمد، وليس من قيمة يرسلها العميل.
8. يفضل استخدام `salesWhatsappNumber` لتكوين الرابط في الخادم، مع التحقق من الأرقام، واعتبار `salesWhatsappUrl` قيمة تواصل اختيارية لا تستبدل الرقم دون تحقق.
9. يظل الرابط المطلوب الحالي:


https://wa.me/201068568250


ويضاف إليه `?text=` بعد ترميز الرسالة.

### الفرق بين حقلي WhatsApp

- **Sales WhatsApp number**: الرقم الخام بصيغة دولية بدون `+` أو مسافات، مثال `201068568250`. يستخدمه النظام للتحقق والتكوين.
- **Sales WhatsApp URL**: رابط جاهز للتواصل، مثال `https://wa.me/201068568250`. يستخدمه النظام كرابط نهائي بعد التحقق.

القرار المقترح: يكون الرقم هو المصدر الأساسي، ويُعرض الرابط تلقائياً أو يحفظ كرابط اختياري مُتحقق منه. لا تُخزن هذه الإعدادات في كود ثابت عند الانتقال للإنتاج.

---

## 9. إدارة المقاسات والألوان والأسعار

### المقاسات

تنتقل المقاسات من حقل نصي محلي مثل `S, M, L` إلى متغيرات منتج في `product_variants`. يوفر المدير حقلاً أو قائمة لإضافة كل مقاس متاح، وما يتم حفظه هو ما يظهر في بطاقة المنتج وصفحة المنتج وCart والطلب.

يجب حفظ المقاس المختار داخل `CartItem` ثم داخل `order_items.size_snapshot`. لا يكفي عرض المقاسات بصرياً دون ربطها بالعنصر المطلوب.

### الألوان

كل لون يضاف من لوحة التحكم إلى المتغير المناسب ويظهر فقط للمنتج الذي يملكه. يجب ألا تعتمد البطاقة على ألوان القسم الافتراضية بعد وجود ألوان مخصصة في قاعدة البيانات.

### السعر والخصم

يحفظ المنتج:

- السعر الأساسي قبل الخصم `original_price`
- السعر بعد الخصم `sale_price`
- الشارة `badge`

عند وجود خصم:

- تظهر شارة الخصم.
- يظهر السعر الأساسي مشطوباً.
- يظهر السعر بعد الخصم في المنتصف وبوزن واضح.
- يطبق نفس العرض على جميع الأقسام والبطاقات.

عند عدم وجود خصم يظهر السعر الأساسي فقط والشارة العادية إن وجدت. يجب أن يعيد الخادم حساب ذلك عند Checkout.

---

## 10. ترحيل بيانات `localStorage`

1. إضافة زر تصدير JSON داخل لوحة الإدارة القديمة قبل إيقافها.
2. تصدير:
   - المنتجات
   - المتغيرات المستخلصة من المقاسات والألوان
   - الإعدادات
   - الأقسام والصفحات
   - الكوبونات
   - الطلبات القديمة في ملف منفصل
3. التحقق من الملف بـ Zod.
4. تنظيف الأسعار والمعرفات والـ slugs والألوان والمقاسات.
5. رفض العناصر غير الصالحة مع تقرير واضح بدلاً من إدخالها بصمت.
6. استيراد المنتجات والإعدادات والكوبونات عبر Endpoint إدارة محمي.
7. مراجعة الطلبات القديمة يدوياً؛ لا تعتبر مرجعاً مالياً كاملاً لأنها تفتقد Snapshot المقاس واللون وقد تكون قابلة للتعديل محلياً.
8. أخذ نسخة احتياطية من ملف التصدير وتخزينه خارج المستودع.
9. تشغيل النظام فترة تحقق مزدوجة إن لزم، ثم إيقاف الكتابة التجارية إلى `localStorage`.
10. الإبقاء على `localStorage` فقط لتفضيلات مثل اللغة أو حالة واجهة مؤقتة.

---

## 11. خطة Netlify — المسار الأساسي

### إعداد البناء

- استخدام PNPM فقط، وحذف أو عدم اعتماد `package-lock.json` بعد التحقق من `pnpm-lock.yaml`.
- إبقاء `pnpm run build` هو أمر البناء الموحد.
- ضبط Environment Variables في Netlify UI، وليس داخل المستودع.
- المتغيرات المتوقعة على الخادم:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ANON_KEY` عند الحاجة وبحسب مكان الاستخدام
  - `SESSION_SECRET`
  - `APP_ORIGIN`
  - `NODE_ENV=production`

لا يوضع `SUPABASE_SERVICE_ROLE_KEY` أو `SESSION_SECRET` في `VITE_*`.

### Function وRouting

- إبقاء `netlify/functions/api.ts` نقطة تشغيل Express الحالية بعد إضافة المسارات الحقيقية.
- الإبقاء على توجيه `/api/*` إلى `/.netlify/functions/api/:splat`.
- إضافة SPA fallback صريح يعيد `/index.html` للمسارات غير API، مع استثناء `/api/*`.
- اختبار الفتح المباشر للمسارات:
  - `/shop`
  - `/product/:id`
  - `/checkout`
  - `/admin/login`
  - `/admin`
  - `/order-summary/:id`

### تشغيل آمن

- تقييد CORS إلى `APP_ORIGIN`.
- إضافة Health Check لا يعرض أسراراً.
- تفعيل Logs وError Monitoring.
- اختبار رفع الإيصال، انتهاء الجلسة، صلاحيات `401/403`، وتكرار `Idempotency-Key` في Preview قبل الإنتاج.

---

## 12. خطة Hostinger — البديل

1. تفعيل Node.js 22 أو الإصدار المدعوم المتوافق.
2. تثبيت dependencies بواسطة PNPM أو استخدام Artefact بناء موحد.
3. تنفيذ:

```text
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

4. ضبط `PORT` وEnvironment Variables من لوحة الاستضافة.
5. تشغيل Node عبر Node App أو PM2 حسب الخطة المتاحة.
6. وضع Reverse Proxy أمام التطبيق مع HTTPS.
7. توثيق Restart Policy وLogs وBackups وRollback.
8. ضبط React Router fallback داخل Express واختبار كل المسارات المباشرة.
9. إبقاء Supabase Storage لتخزين الإيصالات بدلاً من filesystem المحلي؛ filesystem المحلي قد يُفقد عند إعادة النشر أو تغيير الخادم.
10. تقييد الوصول الإداري عبر الجلسة الخادمية حتى لو كان المسار معروفاً.

---

## 13. مراحل التنفيذ المقترحة

### المرحلة 1 — تثبيت الخط الأساسي

- اعتماد PNPM وإزالة الازدواج في lockfiles.
- إضافة `.env.example` دون قيم سرية.
- إضافة اختبارات API وCheckout وSPA fallback.
- تشغيل `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm start` وتسجيل النتائج.

### المرحلة 2 — تأمين الإدارة

- Login/Logout/Session API.
- Hashing وجلسة HttpOnly.
- Middleware الأدوار وRate Limiting وAudit Log.
- إزالة الاعتماد على `sessionStorage` والقيم الثابتة.

### المرحلة 3 — Supabase

- إنشاء migrations والجداول والفهارس والقيود.
- إضافة RLS وBucket خاص للإيصالات.
- إنشاء Supabase client خادمي لا يخرج Service Role Key للمتصفح.

### المرحلة 4 — API ومنطق الأعمال

- API المنتجات والأقسام والإعدادات.
- API الإدارة للمنتجات والمتغيرات والأسعار والمخزون.
- Checkout خادمي مع إعادة حساب السعر والكوبون والشحن.
- Transaction أو حجز ذري للمخزون وIdempotency.

### المرحلة 5 — تحديث الواجهة

- استبدال مصادر البيانات التجارية بـ API.
- ربط المقاس واللون بـ Cart Item والطلب.
- ربط الإيصال بـ Storage الخاص.
- إصلاح Order Summary لتقرأ من API وتتعامل مع حالات عدم وجود الطلب.
- ربط WhatsApp بالإعداد الخادمي.

### المرحلة 6 — الترحيل والإطلاق

- تصدير بيانات `localStorage` والتحقق منها.
- استيرادها ومراجعتها.
- اختبار Netlify Preview ثم الإنتاج.
- إعداد النسخ الاحتياطية والمراقبة وخطة rollback.

---

## 14. قائمة القبول قبل الإنتاج

### الأمان

- [ ] لا توجد كلمة مرور أو Service Role Key داخل Bundle العميل.
- [ ] لا يمكن دخول `/admin` بتعديل `sessionStorage` أو فتح الرابط مباشرة.
- [ ] كل Endpoint إداري يعيد `401/403` عند غياب الصلاحية.
- [ ] كلمات المرور Hash فقط والجلسات HttpOnly منتهية الصلاحية.
- [ ] يوجد Rate Limiting وCORS مقيد وHelmet وسجلات آمنة.

### البيانات والتجارة

- [ ] المنتجات والمتغيرات والكوبونات والإعدادات والطلبات في Supabase.
- [ ] المقاس واللون وSKU محفوظة في كل عنصر طلب.
- [ ] السعر والخصم والشحن والكوبون يعاد حسابها خادمياً.
- [ ] المخزون يُحجز أو يُخصم ذرياً ولا يسمح بالبيع الزائد.
- [ ] يوجد Idempotency يمنع الطلبات المكررة.
- [ ] حالة الدفع منفصلة عن حالة تجهيز الطلب.

### الملفات

- [ ] الإيصال في Bucket خاص وليس Data URL.
- [ ] فحص MIME والحجم والامتداد.
- [ ] الإدارة فقط تحصل على Signed URL مؤقت.
- [ ] توجد سياسة احتفاظ وحذف للملفات.

### الواجهة والتشغيل

- [ ] يعمل `pnpm typecheck`.
- [ ] تعمل اختبارات `pnpm test`.
- [ ] ينجح `pnpm build` و`pnpm start`.
- [ ] تعمل مسارات `/shop`, `/product/:id`, `/checkout`, `/admin/login`, `/order-summary/:id` عند الفتح المباشر.
- [ ] Confirm Order يحفظ أولاً ثم يفتح Summary وWhatsApp برسالة صحيحة.
- [ ] رقم WhatsApp قابل للتعديل من إعدادات الإدارة ويُستخدم ديناميكياً.
- [ ] يوجد Health Check وLogs وError Monitoring وBackup.

---

## 15. قرارات يجب اعتمادها قبل بدء التنفيذ

1. هل سيكون تسجيل الدخول ببريد إلكتروني أم اسم مستخدم؟
2. ما الأدوار المطلوبة غير `admin`؟
3. ما الحد الأقصى لحجم الإيصال ومدة الاحتفاظ به؟
4. هل الطلب عبر COD يحتاج تأكيداً هاتفياً قبل التجهيز؟
5. ما سياسة حجز المخزون ومدة انتهاء الحجز؟
6. هل الأسعار بالجنيه المصري فقط، وهل نحتاج عملات مستقبلية؟
7. ما قواعد التحقق المقبولة لأرقام الهاتف المصرية؟
8. هل `salesWhatsappNumber` هو المصدر الوحيد أم يسمح برابط مخصص؟
9. ما أصل الواجهة الرسمي المسموح به في CORS وCookies؟
10. هل Netlify هو الإنتاج الأساسي وHostinger خطة بديلة؟
11. ما سياسة إلغاء واسترجاع الطلبات وتعديلها من لوحة التحكم؟
12. من يراجع إيصالات المحفظة وInstaPay، وما حالة الدفع الافتراضية؟

---

## الخلاصة

لا ينقص المشروع تعديل بصري رئيسي بقدر ما ينقصه فصل واضح بين الواجهة ومصدر البيانات الموثوق. الأولوية هي إزالة أسرار الإدارة من المتصفح، بناء Login/API خادمية، تصميم Supabase مع متغيرات المنتج والطلبات، نقل الحسابات والمخزون إلى الخادم، وتخزين الإيصالات في Bucket خاص. بعد ذلك يتم ترحيل البيانات المحلية واختبار Netlify، مع إبقاء Hostinger خيار تشغيل بديل موثق.
