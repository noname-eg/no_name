# HOST.EXAMPLE — مرجع استخراج المشروع والنشر

## 1. الفكرة الصحيحة للعمل

نعم، التسلسل المقترح صحيح:

1. استخراج المشروع على جهازك.
2. إنشاء مستودع GitHub خاص بالمشروع.
3. رفع الكود إلى GitHub.
4. إنشاء مشروع Supabase وتجهيز قاعدة البيانات.
5. نشر الخادم على Hostinger أو إعداد Netlify Functions إذا أضفت Adapter مناسبًا.
6. إدخال متغيرات البيئة في منصة الاستضافة، وليس داخل GitHub.
7. إنشاء حساب المدير واختبار الموقع والطلبات.

لا ترفع `.env` أو أي مفتاح `service_role` إلى GitHub. ارفع `.env.example` فقط لأنه لا يحتوي أسرارًا.

## 2. قبل الرفع إلى GitHub

من جذر المشروع:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

راجع الملفات التي ستُرفع وتأكد من عدم وجود:

```text
.env
.env.local
SUPABASE_SERVICE_ROLE_KEY
ملفات JSON لتصدير بيانات العملاء أو الطلبات
إيصالات دفع حقيقية
```

أنشئ مستودع GitHub خاصًا، ثم ارفع المشروع من خلال GitHub Desktop أو أوامر Git المعتادة. لا تضع الأسرار في commit أو Issue أو README.

## 3. إعداد Supabase قبل النشر

أنشئ مشروع Supabase جديدًا، ثم شغّل ملفات SQL بالترتيب التالي:

```text
supabase/migrations/001_admin_security.sql
supabase/migrations/002_store_data.sql
supabase/migrations/003_auth_and_customer_access.sql
supabase/migrations/004_product_images.sql
supabase/migrations/005_order_access_and_receipts.sql
supabase/migrations/005a_store_media_variants.sql
supabase/migrations/006_variant_order_stock.sql
```

بعد تطبيقها، خذ القيم التالية من Supabase Dashboard:

- Project URL: يوضع في `SUPABASE_URL` بدون `/rest/v1/`.
- Service Role Key: يوضع في الخادم فقط داخل متغير سري.

دوّر أي Service Role Key تم إرساله أو كشفه سابقًا قبل الإنتاج.

## 4. متغيرات البيئة المطلوبة

أنشئ `.env` محليًا أو أضف القيم نفسها في إعدادات الاستضافة:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ضع_المفتاح_السري_هنا
APP_ORIGIN=https://your-production-domain.example
NODE_ENV=production
```

وظيفة كل متغير:

| المتغير | الوظيفة | مكانه |
|---|---|---|
| `SUPABASE_URL` | رابط مشروع Supabase الأساسي | الخادم |
| `SUPABASE_SERVICE_ROLE_KEY` | تنفيذ طلبات الخادم وعمليات الإدارة | سر على الخادم فقط |
| `APP_ORIGIN` | النطاق المسموح به للـ CORS والكوكيز | الخادم |
| `NODE_ENV` | تشغيل وضع الإنتاج | الخادم |

لا تستخدم أسماء `VITE_SUPABASE_SERVICE_ROLE_KEY` أو أي متغير يبدأ بـ`VITE_` للمفتاح السري. متغيرات Vite قد تصل إلى المتصفح.

## 5. إنشاء حساب المدير

بعد ضبط متغيرات البيئة وتشغيل migrations:

```bash
pnpm admin:create admin@example.com
```

أدخل كلمة المرور عند طلبها مرتين. يجب ألا تقل عن 12 حرفًا. لا تكتب كلمة المرور داخل هذا الملف أو داخل GitHub.

بعد الإنشاء افتح:

```text
/admin/login
```

ثم اختبر الوصول إلى:

```text
/admin
```

## 6. النشر على Hostinger — الخيار الموصى به

هذا المشروع يحتاج Node.js وExpress API، لذلك Hostinger بخدمة Node.js هو المسار الأبسط للنسخة الحالية.

### 6.1 تجهيز المشروع

```bash
pnpm install --frozen-lockfile
pnpm build
```

أو استخدم أمر البناء الذي توفره لوحة Hostinger:

```bash
pnpm install
pnpm build
```

### 6.2 إعداد تطبيق Node.js في Hostinger

من لوحة Hostinger:

1. أنشئ Node.js Web App أو تطبيق Node.js.
2. اربط المستودع من GitHub أو ارفع ملفات المشروع.
3. اختر إصدار Node.js متوافقًا مع المشروع.
4. اجعل مجلد المشروع هو جذر المستودع.
5. اجعل أمر البناء `pnpm build` أو الأمر المعتمد في لوحة Hostinger.
6. اجعل أمر التشغيل `pnpm start`.
7. اجعل منفذ التطبيق هو المنفذ الذي توفره Hostinger عبر `PORT` إن كانت اللوحة تطلبه.
8. أضف متغيرات البيئة الأربعة من القسم السابق.
9. اربط النطاق النهائي بالتطبيق.
10. فعّل HTTPS.

إذا كانت بيئة Hostinger لا توفر `pnpm`، استخدم مدير الحزم المتاح لديها أو فعّل pnpm أولًا. لا تغيّر منطق التطبيق لتجاوز إعداد المنصة دون اختبار.

### 6.3 قيمة `APP_ORIGIN`

استخدم النطاق النهائي بدون مسار إضافي:

```env
APP_ORIGIN=https://example.com
```

لا تستخدم:

```env
APP_ORIGIN=https://example.com/
APP_ORIGIN=http://localhost:8080
APP_ORIGIN=https://example.com/admin
```

في الإنتاج يجب أن يكون HTTPS ونطاقًا واحدًا فقط.

## 7. النشر على Netlify

### تنبيه مهم

نسخة المشروع الحالية تحتوي Express API داخل خادم Node. نشر ملفات React الثابتة فقط على Netlify سيعرض الواجهة، لكنه لن يشغل مسارات `/api/*` ولن يعمل تسجيل الدخول أو الطلبات بشكل كامل.

لكي يعمل Netlify في الإنتاج، يجب إضافة Adapter/Netlify Functions وتحويل Express API إلى Functions. هذا يتطلب تغييرًا برمجيًا وإضافة إعدادات Netlify، ولم يتم ضمن تحديث التوثيق الحالي.

### المسار العام بعد إضافة Adapter

1. اربط مستودع GitHub في Netlify.
2. استخدم أمر البناء الخاص بالـ Adapter.
3. حدّد مجلد النشر الناتج، غالبًا `dist/spa` حسب إعداد Adapter.
4. أضف Rewrite لمسارات `/api/*` إلى Function الخادم.
5. أضف متغيرات البيئة:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ضع_المفتاح_السري_هنا
APP_ORIGIN=https://your-site.netlify.app
NODE_ENV=production
```

6. أعد النشر.
7. اختبر `GET /api/products` و`/admin/login` وإنشاء طلب قبل اعتماد الموقع.

إذا لم تضف Adapter وRewrite، استخدم Netlify للواجهة فقط مع خادم Express منفصل، واضبط عنوان API في طبقة ربط مناسبة قبل الإنتاج. لا تعتبر Netlify جاهزًا لهذا المشروع بمجرد نجاح نشر ملفات `dist/spa`.

## 8. بعد النشر

اختبر بالترتيب:

- الصفحة الرئيسية والمتجر وتفاصيل المنتج.
- تسجيل دخول المدير.
- ظهور المنتجات الحقيقية من Supabase.
- تعديل منتج من لوحة التحكم وظهور التعديل في المتجر.
- رفع صورة وفيديو.
- إنشاء variant بلون ومقاس وكمية.
- إضافة المنتج إلى السلة بالاختيار الصحيح.
- إنشاء طلب وخصم المخزون.
- رفض الطلب عند نفاد variant.
- ظهور الطلب في لوحة الإدارة وفتح تفاصيله.
- فتح إيصال الدفع بصلاحية مؤقتة.
- تسجيل خروج المدير.
- عدم ظهور المفتاح السري في View Source أو JavaScript bundle.

## 9. تحديثات الكود بعد النشر

التسلسل الآمن:

1. عدّل الكود محليًا.
2. شغّل `pnpm typecheck` و`pnpm test` و`pnpm build`.
3. ارفع commit إلى GitHub.
4. راجع CI أو سجل البناء.
5. انشر النسخة الجديدة من Hostinger أو Netlify.
6. راجع logs بعد النشر.
7. اختبر مسارًا تجاريًا كاملًا.

لا تعدّل `.env` داخل GitHub. غيّر متغيرات البيئة من لوحة الاستضافة فقط.

## 10. ملفات المرجع

- `HOST.EXAMPLE.md`: هذا الملف، مرجع GitHub وSupabase وHostinger وNetlify.
- `plane.md`: الحالة الفنية الحالية والـ APIs والمسارات والملفات.
- `plane 2.md`: قائمة الجاهزية والاختبارات قبل الإطلاق.
- `.env.example`: أسماء متغيرات البيئة المحلية بدون قيم سرية.
- `supabase/migrations/*.sql`: ملفات إنشاء قاعدة البيانات والدوال والسياسات.
- `scripts/create-admin.ts`: إنشاء حساب المدير بعد تجهيز Supabase.
- `package.json`: أوامر التثبيت والبناء والاختبار والتشغيل.

## 11. قرار الاستضافة

لنسخة الكود الحالية: **Hostinger Node.js هو الخيار المباشر الموصى به.**

Netlify مناسب بعد إضافة Adapter/Functions وربط مسارات `/api/*`، وليس كاستضافة Static فقط. إذا كان المطلوب عدم تعديل الكود، استخدم Hostinger للخادم والواجهة معًا.

## 12. مرجع هذا الملف

وظيفة `HOST.EXAMPLE.md` هي تقديم خطوات قابلة للتنفيذ لاستخراج المشروع، رفعه إلى GitHub، إعداد Supabase، إنشاء حساب المدير، ونشر النسخة الحالية على Hostinger أو تجهيز Netlify بعد توفير Adapter مناسب.
