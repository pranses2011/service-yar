# راهنمای Deploy آنلاین سرویسیار

برای اجرای آنلاین سرویسیار بدون کامپیوتر، پیشنهاد می‌شود از این ترکیب استفاده کنید:

- GitHub برای نگهداری کد
- Supabase یا Neon برای PostgreSQL
- Vercel برای اجرای Next.js

## مرحله 1: ساخت دیتابیس

یکی از سرویس‌های زیر را انتخاب کنید:

- https://supabase.com
- https://neon.tech

بعد از ساخت دیتابیس، مقدار `DATABASE_URL` را دریافت کنید.

## مرحله 2: ثبت Environment Variable در Vercel

در Vercel، هنگام Deploy پروژه، این مقدار را اضافه کنید:

```text
DATABASE_URL
```

همچنین این مقادیر برای Seed اولیه لازم هستند:

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
SEED_ADMIN_PASSWORD=Admin@123456
```

## مرحله 3: Deploy روی Vercel

1. وارد https://vercel.com شوید.
2. با GitHub لاگین کنید.
3. روی Add New Project بزنید.
4. Repository سرویسیار را انتخاب کنید.
5. Environment Variables را وارد کنید.
6. Deploy را بزنید.

## تست سلامت پروژه

بعد از Deploy این مسیر را باز کنید:

```text
/api/health
```

اگر پاسخ شامل `ok: true` بود، پروژه زنده است.

## هشدار امنیتی

هیچ‌وقت این موارد را داخل GitHub Commit نکنید:

- GitHub Token
- DATABASE_URL واقعی
- رمز دیتابیس
- رمز مدیر کل
- کلید پیامک
- کلید درگاه پرداخت
