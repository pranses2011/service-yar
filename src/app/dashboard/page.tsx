import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { getTenantActiveLicense } from "@/lib/license";
import { getTenantActiveModules } from "@/lib/modules";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!session.tenant) {
    redirect("/super-admin");
  }

  const tenantId = session.tenant.id;

  const [
    customersCount,
    requestsCount,
    invoicesCount,
    techniciansCount,
    activeLicense,
    activeModules
  ] = await Promise.all([
    prisma.customer.count({ where: { tenantId } }),
    prisma.serviceRequest.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
    prisma.tenantUser.count({
      where: {
        tenantId,
        role: "TECHNICIAN",
        isActive: true
      }
    }),
    getTenantActiveLicense(tenantId),
    getTenantActiveModules(tenantId)
  ]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <h2>سرویسیار</h2>
          <p>{session.tenant.name}</p>
        </div>

        <nav>
          <Link href="/dashboard">داشبورد</Link>
          <a href="#">مشتریان</a>
          <Link href="/dashboard/service-requests">درخواست‌های تعمیر</Link>
          <Link href="/dashboard/technicians">تکنسین‌ها</Link>
          <a href="#">فاکتورها</a>
          <Link href="/auth/activate">اشتراک و لایسنس</Link>
        </nav>

        <form action={logoutAction}>
          <button className="ghost-button" type="submit">
            خروج
          </button>
        </form>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="badge">داشبورد مدیریتی</span>
            <h1>سلام، {session.user.name}</h1>
            <p className="muted">
              وضعیت کلی کسب‌وکار خدماتی شما در یک نگاه.
            </p>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <span>مشتریان</span>
            <strong>{customersCount}</strong>
          </div>

          <div className="stat-card">
            <span>درخواست‌های تعمیر</span>
            <strong>{requestsCount}</strong>
          </div>

          <div className="stat-card">
            <span>فاکتورها</span>
            <strong>{invoicesCount}</strong>
          </div>

          <div className="stat-card">
            <span>تکنسین‌های فعال</span>
            <strong>{techniciansCount}</strong>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <h3>وضعیت اشتراک</h3>

            {activeLicense ? (
              <div className="info-list">
                <p>
                  <strong>پلن:</strong> {activeLicense.plan.nameFa}
                </p>
                <p>
                  <strong>اعتبار تا:</strong>{" "}
                  {activeLicense.expiresAt
                    ? activeLicense.expiresAt.toLocaleDateString("fa-IR")
                    : "نامحدود"}
                </p>
                <p>
                  <strong>حداکثر کاربران:</strong> {activeLicense.maxUsers}
                </p>
                <p>
                  <strong>حداکثر تکنسین:</strong> {activeLicense.maxTechnicians}
                </p>
              </div>
            ) : (
              <div className="alert warning">
                اشتراک فعال پیدا نشد. برای ادامه، لایسنس را فعال کنید.
              </div>
            )}
          </div>

          <div className="panel">
            <h3>ماژول‌های فعال</h3>

            <div className="module-list">
              {activeModules.length > 0 ? (
                activeModules.map((module) => (
                  <span key={module}>{module}</span>
                ))
              ) : (
                <p className="muted">ماژولی فعال نیست.</p>
              )}
            </div>
          </div>
        </section>

        <section className="panel">
          <h3>قدم بعدی توسعه</h3>
          <p className="muted">
            در مرحله بعد صفحات مدیریت مشتریان، ثبت آدرس، ثبت دستگاه و ثبت درخواست تعمیر را اضافه می‌کنیم.
          </p>
        </section>
      </section>
    </main>
  );
}
