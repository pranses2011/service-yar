import Link from "next/link";
import { createTechnicianAction } from "@/app/dashboard/technicians/actions";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

export default async function NewTechnicianPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "technicians");

  const params = await searchParams;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <h2>سرویسیار</h2>
          <p>{context.tenant.name}</p>

          <nav>
            <Link href="/dashboard">داشبورد</Link>
            <Link href="/dashboard/customers">مشتریان</Link>
            <Link href="/dashboard/service-requests">درخواست‌های تعمیر</Link>
            <Link href="/dashboard/technicians">تکنسین‌ها</Link>
            <a href="#">فاکتورها</a>
          </nav>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <span className="badge">تکنسین جدید</span>
            <h1>ثبت تکنسین جدید</h1>
            <p className="muted">
              برای تکنسین حساب کاربری ساخته می‌شود تا بتواند وارد پنل شود و گزارش تعمیر ثبت کند.
            </p>
          </div>

          <Link className="ghost-light-button" href="/dashboard/technicians">
            بازگشت
          </Link>
        </header>

        {params?.error ? <div className="alert error">{params.error}</div> : null}

        <section className="panel">
          <form action={createTechnicianAction} className="form two-column">
            <label>
              نام تکنسین
              <input name="name" placeholder="مثلاً رضا محمدی" required />
            </label>

            <label>
              شماره موبایل
              <input name="mobile" placeholder="09120000000" required />
            </label>

            <label>
              ایمیل، اختیاری
              <input name="email" type="email" placeholder="technician@example.com" />
            </label>

            <label>
              رمز عبور
              <input name="password" type="password" placeholder="حداقل ۸ کاراکتر" required />
            </label>

            <button className="button full span-2" type="submit">
              ثبت تکنسین
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
