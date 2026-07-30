import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

export default async function SuperAdminPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.globalRole !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const [tenantsCount, usersCount, licensesCount, activeLicensesCount] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.license.count(),
      prisma.license.count({
        where: {
          status: "ACTIVE"
        }
      })
    ]);

  return (
    <main className="container">
      <section className="card">
        <span className="badge">Super Admin</span>
        <h1>پنل مدیر کل سرویسیار</h1>
        <p className="muted">
          این صفحه نسخه اولیه پنل مالک پلتفرم است. در مراحل بعد مدیریت لایسنس‌ها، پلن‌ها و کسب‌وکارها کامل می‌شود.
        </p>

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
      </section>
    </main>
  );
}
