import Link from "next/link";
import { requireTenantContext } from "@/lib/tenant-context";

export default async function DashboardHelpPage() {
  const context = await requireTenantContext();

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
            <Link href="/dashboard/invoices">فاکتورها</Link>
            <Link href="/dashboard/subscription">اشتراک و ماژول‌ها</Link>
          </nav>
        </div>
      </aside>

      <section className="content">
        <section className="panel">
          <span className="badge">راهنمای تست MVP</span>
          <h1>چطور سرویسیار را تست کنیم؟</h1>

          <ol className="guide-list">
            <li>یک مشتری جدید ثبت کنید.</li>
            <li>برای مشتری، حداقل یک آدرس اضافه کنید.</li>
            <li>برای مشتری، حداقل یک دستگاه اضافه کنید.</li>
            <li>از بخش درخواست‌های تعمیر، درخواست جدید بسازید.</li>
            <li>اگر پلن شما حرفه‌ای یا سازمانی است، تکنسین تعریف کنید.</li>
            <li>درخواست را به تکنسین ارجاع دهید.</li>
            <li>گزارش تعمیر ثبت کنید.</li>
            <li>فاکتور صادر کنید و صفحه چاپ را ببینید.</li>
          </ol>
        </section>
      </section>
    </main>
  );
}
