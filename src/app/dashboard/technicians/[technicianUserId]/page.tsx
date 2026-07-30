import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTechnicianStatusAction } from "@/app/dashboard/technicians/actions";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

const statusLabels = {
  NEW: "جدید",
  PENDING_CALL: "در انتظار تماس",
  ASSIGNED: "ارجاع‌شده",
  IN_PROGRESS: "در حال انجام",
  WAITING_FOR_PART: "در انتظار قطعه",
  COMPLETED: "تکمیل‌شده",
  CANCELLED: "لغوشده"
} as const;

export default async function TechnicianDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ technicianUserId: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "technicians");

  const { technicianUserId } = await params;
  const query = await searchParams;

  const technician = await prisma.tenantUser.findFirst({
    where: {
      tenantId: context.tenantId,
      userId: technicianUserId,
      role: "TECHNICIAN"
    },
    include: {
      user: {
        include: {
          assignedServiceRequests: {
            where: {
              tenantId: context.tenantId
            },
            include: {
              customer: true,
              appliance: true
            },
            orderBy: {
              createdAt: "desc"
            }
          },
          serviceReports: {
            where: {
              tenantId: context.tenantId
            },
            include: {
              serviceRequest: {
                include: {
                  customer: true,
                  appliance: true
                }
              }
            },
            orderBy: {
              createdAt: "desc"
            },
            take: 20
          }
        }
      }
    }
  });

  if (!technician) {
    notFound();
  }

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
          </nav>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <span className="badge">پرونده تکنسین</span>
            <h1>{technician.user.name}</h1>
            <p className="muted">
              موبایل: <span dir="ltr">{technician.user.mobile}</span>
            </p>
          </div>

          <Link className="ghost-light-button" href="/dashboard/technicians">
            بازگشت به تکنسین‌ها
          </Link>
        </header>

        {query?.error ? <div className="alert error">{query.error}</div> : null}
        {query?.success ? <div className="alert success">{query.success}</div> : null}

        <section className="dashboard-grid">
          <div className="panel">
            <h3>اطلاعات تکنسین</h3>

            <div className="info-list">
              <p>
                <strong>نام:</strong> {technician.user.name}
              </p>
              <p>
                <strong>موبایل:</strong> <span dir="ltr">{technician.user.mobile}</span>
              </p>
              <p>
                <strong>ایمیل:</strong> {technician.user.email || "ثبت نشده"}
              </p>
              <p>
                <strong>وضعیت:</strong>{" "}
                {technician.isActive ? "فعال" : "غیرفعال"}
              </p>
            </div>

            <form action={updateTechnicianStatusAction} className="form">
              <input type="hidden" name="technicianUserId" value={technician.userId} />

              <label>
                وضعیت تکنسین
                <select name="isActive" defaultValue={technician.isActive ? "true" : "false"}>
                  <option value="true">فعال</option>
                  <option value="false">غیرفعال</option>
                </select>
              </label>

              <button className="button full" type="submit">
                ذخیره وضعیت
              </button>
            </form>
          </div>

          <div className="panel">
            <h3>آمار عملکرد</h3>

            <div className="stats-grid inner">
              <div className="stat-card small">
                <span>درخواست‌های ارجاع‌شده</span>
                <strong>{technician.user.assignedServiceRequests.length}</strong>
              </div>

              <div className="stat-card small">
                <span>گزارش‌های ثبت‌شده</span>
                <strong>{technician.user.serviceReports.length}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <h3>درخواست‌های ارجاع‌شده</h3>

          {technician.user.assignedServiceRequests.length === 0 ? (
            <p className="muted">هنوز درخواستی به این تکنسین ارجاع نشده است.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>کد پیگیری</th>
                    <th>مشتری</th>
                    <th>دستگاه</th>
                    <th>وضعیت</th>
                    <th>تاریخ ثبت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {technician.user.assignedServiceRequests.map((request) => (
                    <tr key={request.id}>
                      <td dir="ltr">
                        <strong>{request.trackingCode}</strong>
                      </td>
                      <td>
                        {request.customer.firstName} {request.customer.lastName || ""}
                        <br />
                        <small dir="ltr">{request.customer.mobile}</small>
                      </td>
                      <td>
                        {request.appliance.type}
                        <br />
                        <small>{request.appliance.brand || "برند نامشخص"}</small>
                      </td>
                      <td>{statusLabels[request.status]}</td>
                      <td>{request.createdAt.toLocaleDateString("fa-IR")}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            className="table-action"
                            href={`/dashboard/service-requests/${request.id}`}
                          >
                            مشاهده
                          </Link>
                          <Link
                            className="table-action green"
                            href={`/dashboard/service-requests/${request.id}/report`}
                          >
                            ثبت گزارش
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h3>آخرین گزارش‌های تعمیر</h3>

          {technician.user.serviceReports.length === 0 ? (
            <p className="muted">هنوز گزارشی توسط این تکنسین ثبت نشده است.</p>
          ) : (
            <div className="stack-list">
              {technician.user.serviceReports.map((report) => (
                <article className="list-card" key={report.id}>
                  <strong>{report.serviceRequest.trackingCode}</strong>
                  <p>
                    {report.serviceRequest.customer.firstName}{" "}
                    {report.serviceRequest.customer.lastName || ""} -{" "}
                    {report.serviceRequest.appliance.type}
                  </p>
                  <p>{report.diagnosis}</p>
                  <small>{report.createdAt.toLocaleString("fa-IR")}</small>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
