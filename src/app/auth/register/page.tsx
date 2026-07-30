import Link from "next/link";
import { registerAction } from "@/app/auth/actions";

export default async function RegisterPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="auth-page">
      <section className="auth-card wide">
        <div className="auth-header">
          <span className="badge">شروع استفاده از سرویسیار</span>
          <h1>ثبت‌نام کسب‌وکار خدماتی</h1>
          <p className="muted">
            اطلاعات مالک کسب‌وکار و کد فعال‌سازی را وارد کنید.
          </p>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <form action={registerAction} className="form two-column">
          <label>
            نام و نام خانوادگی مالک
            <input name="name" type="text" placeholder="مثلاً علی احمدی" required />
          </label>

          <label>
            شماره موبایل
            <input name="mobile" type="text" placeholder="09120000000" required />
          </label>

          <label>
            ایمیل، اختیاری
            <input name="email" type="email" placeholder="name@example.com" />
          </label>

          <label>
            رمز عبور
            <input name="password" type="password" placeholder="حداقل ۸ کاراکتر" required />
          </label>

          <label>
            نام کسب‌وکار
            <input name="businessName" type="text" placeholder="مثلاً تعمیرات احمدی" required />
          </label>

          <label>
            شهر
            <input name="city" type="text" placeholder="مثلاً تبریز" />
          </label>

          <label className="span-2">
            کد فعال‌سازی
            <input
              name="licenseKey"
              type="text"
              placeholder="مثلاً SERVICYAR-BASIC-001-DEMO"
              required
            />
          </label>

          <button className="button full span-2" type="submit">
            ثبت‌نام و فعال‌سازی
          </button>
        </form>

        <div className="hint-box">
          <strong>کدهای تست ساخته‌شده توسط Seed:</strong>
          <code>SERVICYAR-BASIC-001-DEMO</code>
          <code>SERVICYAR-PRO-001-DEMO</code>
          <code>SERVICYAR-ENTERPRISE-001-DEMO</code>
        </div>

        <p className="auth-footer">
          قبلاً ثبت‌نام کرده‌اید؟ <Link href="/auth/login">ورود به پنل</Link>
        </p>
      </section>
    </main>
  );
}
