# عيادة د. حسام منصور أبوكل — منصة حجز المواعيد الطبية

منصة حجز إلكتروني متكاملة لعيادتي **د. حسام منصور أبوكل** (استشاري جراحة العظام بالقوات المسلحة) في **طنطا** و**زفتى** — حجز جديد ومتابعة، دفع نقدي أو عبر InstaPay، ولوحة تحكم كاملة للطبيب.

**Dr. Hossam Mansour Abokl — Orthopedic Clinic Booking Platform (Tanta & Zefta, Egypt)**

---

## ✨ المميزات

### للمرضى
- حجز إلكتروني بخطوات بسيطة: نوع الكشف ← الفرع ← التاريخ والساعة ← البيانات ← مراجعة الدفع
- عرض المواعيد المتاحة لآخر 30 يوم حسب أيام عمل كل فرع (8 دقائق لكل كشف)
- منع الحجز المكرر للموعد الواحد (حماية بمعاملات Firestore الذرية)
- الدفع نقداً في العيادة أو عبر **InstaPay** مع رفع إيصال التحويل
- إضافة الموعد تلقائياً إلى **Google Calendar**
- إشعارات واتساب للتأكيد + صفحة نجاح برقم الحجز
- دعم كامل للعربية (RTL) وتجربة موبايل ممتازة + تطبيق PWA قابل للتثبيت

### للطبيب / الإدارة (`/admin`)
- تسجيل دخول آمن (Firebase Auth)
- إدارة الحجوزات: تأكيد، تسجيل حضور/غياب، إتمام، إلغاء
- مراجعة مدفوعات InstaPay (قبول/رفض مع عرض الإيصال)
- حذف الحجوزات مع رسالة تأكيد احترافية
- إشعارات فورية (Toast) عند كل تحديث
- إعدادات مركزية: الفروع، الأسعار، المواعيد، أرقام التواصل، InstaPay
- تحديث تلقائي للبيانات كل 30 ثانية + إشعارات تليجرام فورية لكل حجز جديد

### تقنياً
- تحسين شامل للـ **SEO**: عناوين عربية/إنجليزية، Open Graph، بيانات Schema.org (طبيب/عيادة/أسئلة شائعة)، `sitemap.xml` و `robots.txt`
- صفحات الإدارة محجوبة عن محركات البحث (noindex على 3 مستويات)
- تقسيم الكود (Code Splitting) للوحة الإدارة لسرعة تحميل صفحة الحجز

---

## 🛠️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---|---|
| React 19 + TypeScript + Vite | واجهة المستخدم |
| Tailwind CSS 4 | التصميم |
| Firebase (Auth / Firestore / Storage / Hosting) | قاعدة البيانات والاستضافة |
| Express (Node.js) | سيرفر الـ API وإرسال إشعارات التليجرام |
| Telegram Bot API | إشعارات الحجوزات الفورية (من السيرفر فقط) |
| PWA + Service Worker | العمل أوفلاين والتثبيت على الموبايل |

---

## 📁 هيكل المشروع

```
├── src/
│   ├── patient/            # تطبيق الحجز (الصفحة الرئيسية /)
│   │   └── components/     # BookingHero, ClinicPicker, SlotPicker, ...
│   ├── admin/              # لوحة التحكم (/admin)
│   │   ├── components/     # AdminLogin, AdminSidebar
│   │   └── pages/          # AppointmentsPage, SettingsPage, DashboardHome
│   ├── shared/
│   │   ├── components/     # AppNavbar, LegalPagesModal, ...
│   │   ├── services/       # bookingService, telegramService
│   │   ├── data/           # الإعدادات الافتراضية (الفروع، الأسعار، الأرقام)
│   │   └── utils/          # أدوات التاريخ والتنسيق العربي
│   ├── config/firebase.ts  # إعداد Firebase
│   ├── App.tsx             # التوجيه بين المريض والإدارة
│   └── main.tsx
├── public/                 # الأيقونات، robots.txt, sitemap.xml, manifest
├── server.js               # سيرفر Express (إشعارات التليجرام + استضافة الإنتاج)
├── firestore.rules         # قواعد أمان Firestore
└── firebase.json           # إعدادات Firebase Hosting
```

---

## 🚀 التشغيل محلياً

### 1. تثبيت الاعتماديات

```bash
npm install
```

### 2. إعداد متغيرات البيئة

انسخ ملف `.env.example` إلى `.env` واملأ القيم:

```bash
cp .env.example .env
```

| المتغير | الوصف |
|---|---|
| `VITE_FIREBASE_API_KEY` | مفتاح Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | نطاق المصادقة |
| `VITE_FIREBASE_PROJECT_ID` | اسم مشروع Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | حزمة التخزين |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | رقم المرسل |
| `VITE_FIREBASE_APP_ID` | معرف التطبيق |
| `TELEGRAM_BOT_TOKEN` | توكن بوت التليجرام (سيرفر فقط — بدون بادئة `VITE_`) |
| `TELEGRAM_CHAT_ID` | معرف الشات المستقبل للإشعارات |

> ⚠️ ملف `.env` مستبعد من Git — لا تشاركه أبداً. القيم التي تبدأ بـ `VITE_` تظهر في المتصفح، أما توكن التليجرام فيبقى على السيرفر فقط.

### 3. التشغيل

```bash
npm run dev        # واجهة المريض (الافتراضي)
npm run dev:all    # الواجهة + سيرفر التليجرام معاً
npm run build      # بناء نسخة الإنتاج
npm start          # تشغيل سيرفر الإنتاج (يخدم dist + API)
npm run lint       # فحص TypeScript
```

- صفحة الحجز: `http://localhost:3000/`
- لوحة الإدارة: `http://localhost:3000/admin`

---

## 🌐 النشر (Deployment)

### Firebase Hosting + Firestore

```bash
npm run build
firebase deploy
```

ملف `firebase.json` مضبوط مسبقاً: توجيه SPA، حجب `/admin` عن الفهرسة، وتخزين مؤقت للأصول.

### سيرفر Node (إشعارات التليجرام)

سيرفر `server.js` يخدم نسخة `dist` ويوفّر `POST /api/notify-booking`. اضبط متغيرات `TELEGRAM_BOT_TOKEN` و `TELEGRAM_CHAT_ID` في بيئة الاستضافة ثم:

```bash
npm run build
npm start
```

---

## 🏥 بيانات العيادة

| الفرع | العنوان | المواعيد |
|---|---|---|
| عيادة طنطا | شارع البحر الرئيسي مع طه الحكيم | السبت والأربعاء (7 — 10 مساءً) |
| عيادة زفتى | شارع الجيش، أعلى صيدلية الجمهورية | الأحد والخميس (6 — 10 مساءً) |

- الحجز الجديد: **300 جنيه** — المتابعة: **200 جنيه**
- الحجز والاستفسار: 01100171817 — 01100171917 — 01000111819 — 0404724242
- واتساب: 01100171817

---

## 📄 الرخصة

Apache-2.0
