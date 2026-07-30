import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminContext } from "@/lib/super-admin-context";

export default async function SuperAdminPage() {
  await requireSuperAdminContext();

  const [
    tenantsCount,
    usersCount,
    licensesCount,
    activeLicensesCount,
    unusedLicensesCount,
    modulesCount,
    plansCount
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.license.count(),
    prisma.license.count({
      where: {
        status: "ACTIVE"
      }
    }),
    prisma.license.count({
      where: {
        status: "UNUSED"
      }
    }),
    prisma.module.count(),
    prisma.plan.count()
  ]);

  return (
    <main className="container">
      <section className="card">
        <span className="badge">Super Admin</span>
        <h1>پنل مدیر کل سرویسیار</h1>
        <p className="muted">
          این پنل برای مالک نرم‌افزار است. برای تست مشتریان، تعمیرات و تکنسین‌ها باید یک کسب‌وکار جداگانه از مسیر ثبت‌نام بسازید.
        </p>

        <div className="alert warning">
          اگر می‌خواهید بخش‌های عملیاتی مثل مشتریان، درخواست تعمیر و فاکتور را تست کنید، ابتدا از حساب مدیر کل خارج شوید و از مسیر ثبت‌نام، یک کسب‌وکار تستی با کد لایسنس حرفه‌ای بسازید.
        </div>

        <div className="hint-box">
          <strong>کدهای پیشنهادی برای تست کسب‌وکار:</strong>
          <code>SERVICYAR-PRO-001-DEMO</code>
          <code>SERVICYAR-PRO-002-DEMO</code>
          <code>SERVICYAR-ENTERPRISE-001-DEMO</code>
        </div>

        <div className="admin-nav">
          <Link href="/super-admin/tenants">کسب‌وکارها</Link>
          <Link href="/super-admin/licenses">لایسنس‌ها</Link>
          <Link href="/super-admin/licenses/new">ساخت لایسنس</Link>
          <Link href="/super-admin/plans">پلن‌ها</Link>
          <Link href="/super-admin/modules">ماژول‌ها</Link>
          <Link href="/auth/register">ثبت کسب‌وکار تستی</Link>
        </div>

        <form action={logoutAction}>
          <button className="button" type="submit">
            خروج
          </button>
        </form>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>کسب‌وکارها</span>
          <strong>{tenantsCount}</strong>
        </div>

        <div className="stat-card">
          <span>کاربران</span>
          <strong>{usersCount}</strong>
        </div>

        <div className="stat-card">
          <span>کل لایسنس‌ها</span>
          <strong>{licensesCount}</strong>
        </div>

        <div className="stat-card">
          <span>لایسنس فعال</span>
          <strong>{activeLicensesCount}</strong>
        </div>

        <div className="stat-card">
          <span>لایسنس آماده فروش</span>
          <strong>{unusedLicensesCount}</strong>
        </div>

        <div className="stat-card">
          <span>ماژول‌ها</span>
          <strong>{modulesCount}</strong>
        </div>

        <div className="stat-card">
          <span>پلن‌ها</span>
          <strong>{plansCount}</strong>
        </div>
      </section>
    </main>
  );
}
