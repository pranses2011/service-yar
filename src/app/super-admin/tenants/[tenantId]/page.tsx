import Link from "next/link";
import { notFound } from "next/navigation";
import {
  toggleTenantModuleAction,
  updateTenantStatusAction
} from "@/app/super-admin/actions";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminContext } from "@/lib/super-admin-context";

const tenantStatusLabels = {
  ACTIVE: "فعال",
  SUSPENDED: "تعلیق‌شده",
  EXPIRED: "منقضی"
} as const;

const licenseStatusLabels = {
  UNUSED: "استفاده‌نشده",
  ACTIVE: "فعال",
  EXPIRED: "منقضی",
  SUSPENDED: "تعلیق‌شده",
  CANCELLED: "لغوشده"
} as const;

export default async function TenantDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ tenantId: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  await requireSuperAdminContext();

  const { tenantId } = await params;
  const query = await searchParams;

  const [tenant, allModules] = await Promise.all([
    prisma.tenant.findUnique({
      where: {
        id: tenantId
      },
      include: {
        owner: true,
        users: {
          include: {
            user: true
          }
        },
        licenses: {
          include: {
            plan: true
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        tenantModules: {
          include: {
            module: true
          }
        },
        _count: {
          select: {
            customers: true,
            serviceRequests: true,
            invoices: true
          }
        }
      }
    }),
    prisma.module.findMany({
      orderBy: {
        code: "asc"
      }
    })
  ]);

  if (!tenant) {
    notFound();
  }

  const enabledModuleMap = new Map(
    tenant.tenantModules.map((item) => [item.moduleId, item.isEnabled])
  );

  return (
    <main className="container">
      <section className="card">
        <div className="page-header">
          <div>
            <span className="badge">مدیریت کسب‌وکار</span>
            <h1>{tenant.name}</h1>
            <p className="muted">
              مالک: {tenant.owner.name} - <span dir="ltr">{tenant.owner.mobile}</span>
            </p>
          </div>

          <Link className="ghost-light-button" href="/super-admin/tenants">
            بازگشت
          </Link>
        </div>

        {query?.error ? <div className="alert error">{query.error}</div> : null}
        {query?.success ? <div className="alert success">{query.success}</div> : null}
      </section>

      <section className="stats-grid">
        <div className="stat-card small">
          <span>وضعیت</span>
          <strong className="stat-text">{tenantStatusLabels[tenant.status]}</strong>
        </div>

        <div className="stat-card small">
          <span>مشتریان</span>
          <strong>{tenant._count.customers}</strong>
        </div>

        <div className="stat-card small">
          <span>درخواست‌ها</span>
          <strong>{tenant._count.serviceRequests}</strong>
        </div>

        <div className="stat-card small">
          <span>فاکتورها</span>
          <strong>{tenant._count.invoices}</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <h3>وضعیت کسب‌وکار</h3>

          <form action={updateTenantStatusAction} className="form">
            <input type="hidden" name="tenantId" value={tenant.id} />

            <label>
              وضعیت
              <select name="status" defaultValue={tenant.status}>
                <option value="ACTIVE">فعال</option>
                <option value="SUSPENDED">تعلیق‌شده</option>
                <option value="EXPIRED">منقضی</option>
              </select>
            </label>

            <button className="button full" type="submit">
              ذخیره وضعیت
            </button>
          </form>
        </div>

        <div className="panel">
          <h3>اطلاعات کسب‌وکار</h3>

          <div className="info-list">
            <p>
              <strong>نام:</strong> {tenant.name}
            </p>
            <p>
              <strong>شناسه:</strong> {tenant.slug}
            </p>
            <p>
              <strong>موبایل:</strong> {tenant.mobile || "-"}
            </p>
            <p>
              <strong>شهر:</strong> {tenant.city || "-"}
            </p>
            <p>
              <strong>تاریخ ثبت:</strong> {tenant.createdAt.toLocaleDateString("fa-IR")}
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>لایسنس‌های این کسب‌وکار</h3>

        {tenant.licenses.length === 0 ? (
          <p className="muted">هنوز لایسنسی برای این کسب‌وکار ثبت نشده است.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>کد</th>
                  <th>پلن</th>
                  <th>وضعیت</th>
                  <th>شروع</th>
                  <th>پایان</th>
                  <th>محدودیت‌ها</th>
                </tr>
              </thead>

              <tbody>
                {tenant.licenses.map((license) => (
                  <tr key={license.id}>
                    <td>
                      <code>{license.licenseKey}</code>
                    </td>
                    <td>{license.plan.nameFa}</td>
                    <td>{licenseStatusLabels[license.status]}</td>
                    <td>
                      {license.startsAt
                        ? license.startsAt.toLocaleDateString("fa-IR")
                        : "-"}
                    </td>
                    <td>
                      {license.expiresAt
                        ? license.expiresAt.toLocaleDateString("fa-IR")
                        : "-"}
                    </td>
                    <td>
                      کاربر: {license.maxUsers} / تکنسین: {license.maxTechnicians}
                      <br />
                      درخواست ماهانه: {license.maxMonthlyRequests ?? "نامحدود"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h3>ماژول‌های فعال کسب‌وکار</h3>
        <p className="muted">
          از این بخش می‌توانید ماژول‌های خریداری‌شده یا افزونه‌های خاص هر کسب‌وکار را کنترل کنید.
        </p>

        <div className="module-admin-grid">
          {allModules.map((module) => {
            const isEnabled = enabledModuleMap.get(module.id) || false;

            return (
              <article className="module-admin-card" key={module.id}>
                <div>
                  <strong>{module.nameFa}</strong>
                  <p>{module.code}</p>
                  <small>{module.description || ""}</small>
                </div>

                <form action={toggleTenantModuleAction}>
                  <input type="hidden" name="tenantId" value={tenant.id} />
                  <input type="hidden" name="moduleId" value={module.id} />
                  <input
                    type="hidden"
                    name="isEnabled"
                    value={isEnabled ? "false" : "true"}
                  />

                  <button
                    className={isEnabled ? "table-action red" : "table-action green"}
                    type="submit"
                  >
                    {isEnabled ? "غیرفعال کردن" : "فعال کردن"}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h3>کاربران این کسب‌وکار</h3>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>نام</th>
                <th>موبایل</th>
                <th>نقش</th>
                <th>وضعیت</th>
              </tr>
            </thead>

            <tbody>
              {tenant.users.map((membership) => (
                <tr key={membership.id}>
                  <td>{membership.user.name}</td>
                  <td dir="ltr">{membership.user.mobile}</td>
                  <td>{membership.role}</td>
                  <td>{membership.isActive ? "فعال" : "غیرفعال"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
