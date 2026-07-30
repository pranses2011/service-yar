import Link from "next/link";
import type { ServiceRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

const statusLabels: Record<ServiceRequestStatus, string> = {
  NEW: "جدید",
  PENDING_CALL: "در انتظار تماس",
  ASSIGNED: "ارجاع‌شده",
  IN_PROGRESS: "در حال انجام",
  WAITING_FOR_PART: "در انتظار قطعه",
  COMPLETED: "تکمیل‌شده",
  CANCELLED: "لغوشده"
};

const statusOptions: Array<{
  value: ServiceRequestStatus | "";
  label: string;
}> = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "NEW", label: "جدید" },
  { value: "PENDING_CALL", label: "در انتظار تماس" },
  { value: "ASSIGNED", label: "ارجاع‌شده" },
  { value: "IN_PROGRESS", label: "در حال انجام" },
  { value: "WAITING_FOR_PART", label: "در انتظار قطعه" },
  { value: "COMPLETED", label: "تکمیل‌شده" },
  { value: "CANCELLED", label: "لغوشده" }
];

const validStatuses = statusOptions
  .map((item) => item.value)
  .filter(Boolean) as ServiceRequestStatus[];

export default async function ServiceRequestsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string; error?: string; success?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "service_requests");

  const params = await searchParams;
  const q = String(params?.q || "").trim();
  const statusRaw = String(params?.status || "").trim() as ServiceRequestStatus;
  const status = validStatuses.includes(statusRaw) ? statusRaw : undefined;

  const requests = await prisma.serviceRequest.findMany({
    where: {
      tenantId: context.tenantId,
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              {
                trackingCode: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                problemDescription: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                customer: {
                  OR: [
                    {
                      firstName: {
                        contains: q,
                        mode: "insensitive"
                      }
                    },
                    {
                      lastName: {
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
            ]
          }
        : {})
    },
    include: {
      customer: true,
      appliance: true,
      assignedTechnician: true,
      invoice: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 100
  });

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
            <Link href="/auth/activate">اشتراک و لایسنس</Link>
          </nav>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <span className="badge">مدیریت تعمیرات</span>
            <h1>درخواست‌های تعمیر</h1>
            <p className="muted">
              همه درخواست‌های ثبت‌شده، وضعیت کار، مشتری، دستگاه و تکنسین را از این بخش مدیریت کنید.
            </p>
          </div>

          <Link className="button" href="/dashboard/service-requests/new">
            + ثبت درخواست جدید
          </Link>
        </header>

        {params?.error ? <div className="alert error">{params.error}</div> : null}
        {params?.success ? <div className="alert success">{params.success}</div> : null}

        <section className="panel">
          <form className="search-form service-search">
            <input
              name="q"
              defaultValue={q}
              placeholder="جستجو با کد پیگیری، نام مشتری، موبایل یا شرح مشکل"
            />

            <select name="status" defaultValue={status || ""}>
              {statusOptions.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <button className="button compact" type="submit">
              جستجو
            </button>

            {(q || status) ? (
              <Link className="secondary-link" href="/dashboard/service-requests">
                حذف فیلتر
              </Link>
            ) : null}
          </form>
        </section>

        <section className="panel">
          {requests.length === 0 ? (
            <div className="empty-state">
              <h3>هنوز درخواست تعمیری ثبت نشده است</h3>
              <p className="muted">
                برای شروع، یک درخواست تعمیر برای مشتری ثبت کنید.
              </p>
              <Link className="button" href="/dashboard/service-requests/new">
                ثبت اولین درخواست
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>کد پیگیری</th>
                    <th>مشتری</th>
                    <th>دستگاه</th>
                    <th>وضعیت</th>
                    <th>اولویت</th>
                    <th>تکنسین</th>
                    <th>زمان مراجعه</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
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
                      <td>
                        <span className={`status-pill status-${request.status.toLowerCase()}`}>
                          {statusLabels[request.status]}
                        </span>
                      </td>
                      <td>{request.priority === "URGENT" ? "فوری" : "عادی"}</td>
                      <td>{request.assignedTechnician?.name || "ارجاع نشده"}</td>
                      <td>
                        {request.scheduledAt
                          ? request.scheduledAt.toLocaleString("fa-IR")
                          : "ثبت نشده"}
                      </td>
                      <td>
                        <Link
                          className="table-action"
                          href={`/dashboard/service-requests/${request.id}`}
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
