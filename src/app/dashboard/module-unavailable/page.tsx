import Link from "next/link";
import { requireTenantContext } from "@/lib/tenant-context";
import { getTenantActiveModules } from "@/lib/modules";
import { getTenantActiveLicense } from "@/lib/license";

const moduleLabels: Record<string, string> = {
  dashboard: "داشبورد",
  customers: "مشتریان",
  appliances: "دستگاه‌ها",
  service_requests: "درخواست‌های تعمیر",
  technicians: "تکنسین‌ها",
  service_reports: "گزارش تعمیر",
  invoices: "فاکتورها",
  licenses: "لایسنس و اشتراک",
  sms: "پیامک",
  inventory: "انبار قطعات",
  warranty: "گارانتی",
  customer_portal: "پنل مشتری",
  ai_assistant: "دستیار هوشمند"
};

export default async function ModuleUnavailablePage({
  searchParams
}: {
  searchParams?: Promise<{ module?: string }>;
}) {
  const context = await requireTenantContext();
  const params = await searchParams;

  const moduleCode = String(params?.module || "");
  const moduleName = moduleLabels[moduleCode] || moduleCode || "این بخش";

  const [activeModules, activeLicense] = await Promise.all([
    getTenantActiveModules(context.tenantId),
    getTenantActiveLicense(context.tenantId)
  ]);

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
          <span className="badge">ماژول غیرفعال</span>
          <h1>دسترسی به «{moduleName}» فعال نیست</h1>

          <p className="muted">
            این بخش در پلن فعلی کسب‌وکار شما فعال نشده است یا لایسنس/ماژول آن هنوز برای این کسب‌وکار تنظیم نشده.
          </p>

          <div className="alert warning">
            اگر در حال تست هستید، بهتر است کسب‌وکار را با لایسنس پلن حرفه‌ای یا سازمانی بسازید.
          </div>

          <div className="info-list">
            <p>
              <strong>کسب‌وکار:</strong> {context.tenant.name}
            </p>

            <p>
              <strong>پلن فعلی:</strong>{" "}
              {activeLicense ? activeLicense.plan.nameFa : "اشتراک فعال پیدا نشد"}
            </p>

            <p>
              <strong>ماژول‌های فعال:</strong>{" "}
              {activeModules.length > 0 ? activeModules.join("، ") : "هیچ ماژولی فعال نیست"}
            </p>
          </div>

          <div className="header-actions">
            <Link className="button" href="/dashboard/subscription">
              مشاهده اشتراک و ماژول‌ها
            </Link>

            <Link className="ghost-light-button" href="/dashboard">
              بازگشت به داشبورد
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
