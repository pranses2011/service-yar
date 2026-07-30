import Link from "next/link";
import { createCustomerAction } from "@/app/dashboard/customers/actions";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

export default async function NewCustomerPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "customers");

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
            <a href="#">درخواست‌های تعمیر</a>
            <a href="#">تکنسین‌ها</a>
            <a href="#">فاکتورها</a>
          </nav>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <span className="badge">مشتری جدید</span>
            <h1>ثبت مشتری جدید</h1>
            <p className="muted">
              اطلاعات اولیه مشتری را وارد کنید. بعد از ثبت، می‌توانید آدرس و دستگاه‌های او را اضافه کنید.
            </p>
          </div>

          <Link className="ghost-light-button" href="/dashboard/customers">
            بازگشت
          </Link>
        </header>

        {params?.error ? <div className="alert error">{params.error}</div> : null}

        <section className="panel">
          <form action={createCustomerAction} className="form two-column">
            <label>
              نام
              <input name="firstName" placeholder="مثلاً علی" required />
            </label>

            <label>
              نام خانوادگی، اختیاری
              <input name="lastName" placeholder="مثلاً احمدی" />
            </label>

            <label>
              شماره موبایل
              <input name="mobile" placeholder="09120000000" required />
            </label>

            <label>
              تلفن ثابت، اختیاری
              <input name="phone" placeholder="021..." />
            </label>

            <label className="span-2">
              توضیحات
              <textarea name="notes" placeholder="توضیحات داخلی درباره مشتری"></textarea>
            </label>

            <button className="button full span-2" type="submit">
              ثبت مشتری
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
