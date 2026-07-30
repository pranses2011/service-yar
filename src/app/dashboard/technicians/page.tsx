import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";
import { getTenantActiveLicense } from "@/lib/license";

export default async function TechniciansPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; error?: string; success?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "technicians");

  const params = await searchParams;
  const q = String(params?.q || "").trim();

  const [technicians, activeLicense] = await Promise.all([
    prisma.tenantUser.findMany({
      where: {
        tenantId: context.tenantId,
        role: "TECHNICIAN",
        ...(q
          ? {
              user: {
                OR: [
                  {
                    name: {
                      contains: q,
                      mode: "insensitive"
                    }
                  },
                  {
                    mobile: {
                      contains: q
                    }
                  }
                ]
              }
            }
          : {})
      },
      include: {
        user: {
          include: {
            assignedServiceRequests: {
              where: {
                tenantId: context.tenantId
              }
            },
            serviceReports: {
              where: {
                tenantId: context.tenantId
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    getTenantActiveLicense(context.tenantId)
  ]);

  const activeTechniciansCount = technicians.filter((item) => item.isActive).length;

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
            <span className="badge">مدیریت تکنسین‌ها</span>
            <h1>تکنسین‌ها</h1>
            <p className="muted">
              تکنسین‌ها، درخواست‌های ارجاع‌شده و گزارش‌های تعمیر را مدیریت کنید.
            </p>
          </div>

          <Link className="button" href="/dashboard/technicians/new">
            + ثبت تکنسین جدید
          </Link>
        </header>

        {params?.error ? <div className="alert error">{params.error}</div> : null}
        {params?.success ? <div className="alert success">{params.success}</div> : null}

        <section className="stats-grid">
          <div className="stat-card small">
            <span>تکنسین فعال</span>
            <strong>{activeTechniciansCount}</strong>
          </div>

          <div className="stat-card small">
            <span>سقف پلن</span>
            <strong>{activeLicense?.maxTechnicians ?? "-"}</strong>
          </div>

          <div className="stat-card small">
            <span>کل تکنسین‌ها</span>
            <strong>{technicians.length}</strong>
          </div>
        </section>

        <section className="panel">
          <form className="search-form">
            <input
              name="q"
              defaultValue={q}
              placeholder="جستجو با نام یا شماره موبایل تکنسین"
            />
            <button className="button compact" type="submit">
              جستجو
            </button>
            {q ? (
              <Link className="secondary-link" href="/dashboard/technicians">
                حذف فیلتر
              </Link>
            ) : null}
          </form>
        </section>

        <section className="panel">
          {technicians.length === 0 ? (
            <div className="empty-state">
              <h3>هنوز تکنسینی ثبت نشده است</h3>
              <p className="muted">
                برای ارجاع درخواست‌های تعمیر، ابتدا تکنسین‌ها را تعریف کنید.
              </p>
              <Link className="button" href="/dashboard/technicians/new">
                ثبت اولین تکنسین
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>موبایل</th>
                    <th>وضعیت</th>
                    <th>درخواست‌ها</th>
                    <th>گزارش‌ها</th>
                    <th>تاریخ عضویت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {technicians.map((technician) => (
                    <tr key={technician.id}>
                      <td>
                        <strong>{technician.user.name}</strong>
                      </td>
                      <td dir="ltr">{technician.user.mobile}</td>
                      <td>
                        <span className={technician.isActive ? "active-pill" : "inactive-pill"}>
                          {technician.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td>{technician.user.assignedServiceRequests.length}</td>
                      <td>{technician.user.serviceReports.length}</td>
                      <td>{technician.createdAt.toLocaleDateString("fa-IR")}</td>
                      <td>
                        <Link
                          className="table-action"
                          href={`/dashboard/technicians/${technician.userId}`}
                        >
                          مشاهده
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
