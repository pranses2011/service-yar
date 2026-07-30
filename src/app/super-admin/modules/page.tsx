import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminContext } from "@/lib/super-admin-context";

export default async function SuperAdminModulesPage() {
  await requireSuperAdminContext();

  const modules = await prisma.module.findMany({
    include: {
      _count: {
        select: {
          planModules: true,
          tenantModules: true
        }
      }
    },
    orderBy: {
      code: "asc"
    }
  });

  return (
    <main className="container">
      <section className="card">
        <div className="page-header">
          <div>
            <span className="badge">ماژول‌ها</span>
            <h1>ماژول‌های قابل فروش</h1>
            <p className="muted">
              هر ماژول می‌تواند در پلن‌ها یا برای کسب‌وکارهای خاص فعال شود.
            </p>
          </div>

          <Link className="ghost-light-button" href="/super-admin">
            بازگشت
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>کد</th>
                <th>نام فارسی</th>
                <th>توضیح</th>
                <th>وضعیت</th>
                <th>تعداد پلن</th>
                <th>تعداد کسب‌وکار</th>
              </tr>
            </thead>

            <tbody>
              {modules.map((module) => (
                <tr key={module.id}>
                  <td>
                    <code>{module.code}</code>
                  </td>
                  <td>{module.nameFa}</td>
                  <td>{module.description || "-"}</td>
                  <td>{module.isActive ? "فعال" : "غیرفعال"}</td>
                  <td>{module._count.planModules}</td>
                  <td>{module._count.tenantModules}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
