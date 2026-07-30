# راهنمای Deploy سرویسیار روی سرویس‌های قابل استفاده در ایران

اگر Vercel برای شما قابل استفاده نیست، پیشنهاد اصلی استفاده از Liara است.

## گزینه پیشنهادی: Liara

آدرس:

```text
https://liara.ir
```

## مسیر کلی Deploy

1. در Liara ثبت‌نام کنید.
2. یک سرویس جدید از نوع Node.js یا Docker بسازید.
3. پروژه GitHub سرویسیار را متصل کنید، یا فایل ZIP پروژه را آپلود کنید.
4. Environment Variables را وارد کنید.
5. پروژه را Deploy کنید.
6. مسیر `/api/health` را تست کنید.

---

## Environment Variables لازم

مهم‌ترین مقدار:

```text
DATABASE_URL
```

اگر Seed قبلاً از طریق GitHub Actions اجرا شده، این موارد فقط برای سازگاری باقی می‌مانند:

```text
SEED_ADMIN_NAME
SEED_ADMIN_MOBILE
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
```

نمونه:

```text
SEED_ADMIN_NAME=مدیر کل سرویسیار
SEED_ADMIN_MOBILE=09120000000
SEED_ADMIN_EMAIL=admin@servicyar.local
SEED_ADMIN_PASSWORD=یک رمز قوی
```

> مقدار واقعی DATABASE_URL و رمزها را داخل GitHub، README یا چت قرار ندهید.

---

## اگر سرویس Node.js انتخاب کردید

Build Command:

```bash
npm install && npx prisma generate && npm run build
```

Start Command:

```bash
npm run start
```

اگر سرویس از PORT اختصاصی استفاده کند، اسکریپت start پروژه آن را می‌خواند.

---

## اگر سرویس Docker انتخاب کردید

پروژه یک فایل آماده دارد:

```text
Dockerfile
```

کافی است هاست شما Dockerfile را Build کند.

---

## تست سلامت

بعد از Deploy، این مسیر را باز کنید:

```text
/api/health
```

اگر پاسخ شبیه زیر بود، پروژه بالا آمده است:

```json
{
  "ok": true,
  "app": "servicyar"
}
```

---

## ورود مدیر کل

مسیر:

```text
/auth/login
```

اطلاعات ورود همان مقادیری است که هنگام Seed در GitHub Secrets تعریف کرده‌اید.

---

## نکته مهم درباره دیتابیس

اگر قبلاً دیتابیس را با Workflow زیر آماده کرده‌اید:

```text
Database Push and Seed
```

لازم نیست روی هاست دوباره Seed اجرا کنید.

فقط کافی است همان `DATABASE_URL` را در هاست وارد کنید.

اگر دیتابیس جدید در Liara ساختید، باید مقدار `DATABASE_URL` جدید را هم در GitHub Secrets و هم در هاست تنظیم کنید و دوباره Workflow دیتابیس را اجرا کنید.

---

## خطاهای رایج

### خطای DATABASE_URL

یعنی متغیر محیطی دیتابیس تعریف نشده یا اشتباه است.

### خطای Prisma Client

مطمئن شوید دستور زیر قبل از Build اجرا می‌شود:

```bash
npx prisma generate
```

### خطای اتصال به دیتابیس

بررسی کنید دیتابیس اجازه اتصال از بیرون را می‌دهد و Connection String درست است.
