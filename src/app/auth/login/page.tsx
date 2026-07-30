import Link from "next/link";
import { loginAction } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <span className="badge">سرویسیار</span>
          <h1>ورود به پنل</h1>
          <p className="muted">
            برای مدیریت مشتریان، درخواست‌ها و فاکتورها وارد حساب خود شوید.
          </p>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <form action={loginAction} className="form">
          <label>
            شماره موبایل یا ایمیل
            <input
              name="identifier"
              type="text"
              placeholder="مثلاً 09120000000"
              required
            />
          </label>

          <label>
            رمز عبور
            <input
              name="password"
              type="password"
              placeholder="رمز عبور"
              required
            />
          </label>

          <button className="button full" type="submit">
            ورود
          </button>
        </form>

        <p className="auth-footer">
          هنوز حساب ندارید؟{" "}
          <Link href="/auth/register">ثبت‌نام کسب‌وکار</Link>
        </p>
      </section>
    </main>
  );
}
