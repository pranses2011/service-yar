import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant-context";
import { getTenantActiveLicense } from "@/lib/license";

export default async function SubscriptionPage() {
  const context = await requireTenantContext();

  const [activeLicense, tenantModules] = await Promise.all([
    getTenantActiveLicense(context.tenantId),
    prisma.tenantModule.findMany({
      where: {
        tenantId: context.tenantId
      },
      include: {
        module: true
      },
      orderBy: {
        createdAt: "asc"
      }
    })
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
        <header className="page-header">
          <div>
            <span className="badge">اشتراک</span>
            <h1>اشتراک و ماژول‌های فعال</h1>
            <p className="muted">
              وضعیت پلن، لایسنس و امکانات فعال کسب‌وکار شما.
            </p>
          </div>

          <Link className="button" href="/auth/activate">
            فعال‌سازی یا تمدید
          </Link>
        </header>

        <section className="dashboard-grid">
          <div className="panel">
            <h3>وضعیت لایسنس</h3>

            {activeLicense ? (
              <div className="info-list">
                <p>
                  <strong>پلن:</strong> {activeLicense.plan.nameFa}
                </p>

                <p>
                  <strong>کد لایسنس:</strong>{" "}
                  <code>{activeLicense.licenseKey}</code>
                </p>

                <p>
                  <strong>وضعیت:</strong> {activeLicense.status}
                </p>

                <p>
                  <strong>تاریخ شروع:</strong>{" "}
                  {activeLicense.startsAt
                    ? activeLicense.startsAt.toLocaleDateString("fa-IR")
                    : "-"}
                </p>

                <p>
                  <strong>تاریخ پایان:</strong>{" "}
                  {activeLicense.expiresAt
                    ? activeLicense.expiresAt.toLocaleDateString("fa-IR")
                    : "-"}
                </p>

                <p>
                  <strong>حداکثر کاربران:</strong> {activeLicense.maxUsers}
                </p>

                <p>
                  <strong>حداکثر تکنسین‌ها:</strong> {activeLicense.maxTechnicians}
                </p>

                <p>
                  <strong>سقف درخواست ماهانه:</strong>{" "}
                  {activeLicense.maxMonthlyRequests ?? "نامحدود"}
                </p>
              </div>
            ) : (
              <div className="alert warning">
                اشتراک فعالی برای این کسب‌وکار پیدا نشد. لطفاً لایسنس را فعال کنید.
              </div>
            )}
          </div>

          <div className="panel">
            <h3>ماژول‌های فعال</h3>

            {tenantModules.length === 0 ? (
              <p className="muted">هنوز ماژولی برای این کسب‌وکار فعال نشده است.</p>
            ) : (
              <div className="module-admin-grid">
                {tenantModules.map((item) => (
                  <article className="module-admin-card" key={item.id}>
                    <div>
                      <strong>{item.module.nameFa}</strong>
                      <p>{item.module.code}</p>
                      <small>{item.module.description || ""}</small>
                    </div>

                    <span className={item.isEnabled ? "active-pill" : "inactive-pill"}>
                      {item.isEnabled ? "فعال" : "غیرفعال"}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <h3>راهنمای تست</h3>
          <p className="muted">
            اگر می‌خواهید همه بخش‌ها مثل تکنسین‌ها و فاکتورها را تست کنید، کسب‌وکار تستی را با پلن حرفه‌ای یا سازمانی بسازید.
          </p>

          <div className="hint-box">
            <strong>کدهای مناسب تست:</strong>
            <code>SERVICYAR-PRO-001-DEMO</code>
            <code>SERVICYAR-PRO-002-DEMO</code>
            <code>SERVICYAR-ENTERPRISE-001-DEMO</code>
          </div>
        </section>
      </section>
    </main>
  );
}
