# بي بلاي (BeePlay)

منصة حجز ملاعب كرة القدم — واجهة عربية كاملة (RTL) مع تصميم داكن مستوحى من Spotify.

## الهيكل

```
beeplay/
├── apps/
│   ├── web/      # المنصة الرئيسية (مستخدم + مالك ملعب) — :3000
│   ├── admin/    # لوحة الإدارة — :3001
│   └── api/      # REST API + Prisma — :4000
├── packages/
│   ├── validation/  # Zod schemas
│   ├── types/       # أنواع مشتركة
│   └── ...
└── docs/            # PRD, UX, user stories
```

## المتطلبات

- Node.js 20+
- pnpm 10+
- Docker (لـ PostgreSQL)

## التشغيل السريع

```bash
# 1. تثبيت الاعتماديات
pnpm install

# 2. إعداد البيئة
cp .env.example .env

# 3. تشغيل PostgreSQL (شغّل Docker Desktop أولاً)
docker compose up -d
pnpm db:test    # تحقق من الاتصال
pnpm db:push
pnpm db:seed

# 4. تشغيل كل التطبيقات
pnpm dev
```

## الحسابات التجريبية (بعد seed)

| الدور     | البريد           | كلمة المرور  |
| --------- | ---------------- | ------------ |
| إدارة     | admin@beeplay.sy | Password123! |
| مالك ملعب | owner@beeplay.sy | Password123! |
| مستخدم    | user@beeplay.sy  | Password123! |

## الروابط

- الويب: http://localhost:3000
- الإدارة: http://localhost:3001
- API: http://localhost:4000/api/v1
- Health: http://localhost:4000/health

## الميزات المنجزة

- تسجيل / دخول / OTP / استعادة كلمة المرور
- تصفح الملاعب مع بحث وفلترة
- صفحة ملعب + نموذج حجز
- حجوزات المستخدم (إلغاء، إعادة حجز)
- لوحة مالك الملعب (قبول/رفض، تقويم، تحليلات)
- لوحة إدارة (مستخدمون، حظر)
- إشعارات داخلية
- منع تعارض المواعيد
- عربي RTL + خط Tajawal + ثيم Spotify الداكن

## التوثيق

راجع `docs/PRD.md` و `docs/UX-FLOW.md` و `DESIGN.md`.
