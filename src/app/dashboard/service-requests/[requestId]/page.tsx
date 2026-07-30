import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assignTechnicianAction,
  updateServiceRequestAction,
  updateServiceRequestStatusAction
} from "@/app/dashboard/service-requests/actions";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";
import type { ServiceRequestStatus } from "@prisma/client";

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
  value: ServiceRequestStatus;
  label: string;
}> = [
  { value: "NEW", label: "جدید" },
  { value: "PENDING_CALL", label: "در انتظار تماس" },
  { value: "ASSIGNED", label: "ارجاع‌شده" },
  { value: "IN_PROGRESS", label: "در حال انجام" },
  { value: "WAITING_FOR_PART", label: "در انتظار قطعه" },
  { value: "COMPLETED", label: "تکمیل‌شده" },
  { value: "CANCELLED", label: "لغوشده" }
];

function toDateTimeLocalValue(date: Date | null) {
  if (!date) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);

  return localDate.toISOString().slice(0, 16);
}

export default async function ServiceRequestDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ requestId: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "service_requests");

  const { requestId } = await params;
  const query = await searchParams;

  const request = await prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      tenantId: context.tenantId
    },
    include: {
      customer: true,
      address: true,
      appliance: true,
      assignedTechnician: true,
      createdBy: true,
      reports: {
        include: {
          technician: true
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      invoice: {
        include: {
          items: true
        }
      }
    }
  });

  if (!request) {
    notFound();
  }

  const technicians = await prisma.tenantUser.findMany({
    where: {
      tenantId: context.tenantId,
      role: "TECHNICIAN",
      isActive: true
    },
    include: {
      user: true
    },
    orderBy: {
      createdAt: "desc"
    }
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
          </nav>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <span className="badge">پرونده درخواست</span>
            <h1 dir="ltr">{request.trackingCode}</h1>
            <p className="muted">
              مشتری: {request.customer.firstName} {request.customer.lastName || ""} -{" "}
              <span dir="ltr">{request.customer.mobile}</span>
            </p>
          </div>

          <Link className="ghost-light-button" href="/dashboard/service-requests">
            بازگشت به درخواست‌ها
          </Link>
        </header>

        {query?.error ? <div className="alert error">{query.error}</div> : null}
        {query?.success ? <div className="alert success">{query.success}</div> : null}

        <section className="stats-grid">
          <div className="stat-card small">
            <span>وضعیت</span>
            <strong className="stat-text">{statusLabels[request.status]}</strong>
          </div>

          <div className="stat-card small">
            <span>اولویت</span>
            <strong className="stat-text">
              {request.priority === "URGENT" ? "فوری" : "عادی"}
            </strong>
          </div>

          <div className="stat-card small">
            <span>تکنسین</span>
            <strong className="stat-text">
              {request.assignedTechnician?.name || "ارجاع نشده"}
            </strong>
          </div>

          <div className="stat-card small">
            <span>زمان مراجعه</span>
            <strong className="stat-text">
              {request.scheduledAt
                ? request.scheduledAt.toLocaleString("fa-IR")
                : "ثبت نشده"}
            </strong>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <h3>اطلاعات مشتری و دستگاه</h3>

            <div className="info-list">
              <p>
                <strong>مشتری:</strong>{" "}
                <Link href={`/dashboard/customers/${request.customer.id}`}>
                  {request.customer.firstName} {request.customer.lastName || ""}
                </Link>
              </p>

              <p>
                <strong>موبایل:</strong>{" "}
                <span dir="ltr">{request.customer.mobile}</span>
              </p>

              <p>
                <strong>دستگاه:</strong> {request.appliance.type}
                {request.appliance.brand ? ` - ${request.appliance.brand}` : ""}
                {request.appliance.model ? ` - ${request.appliance.model}` : ""}
              </p>

              <p>
                <strong>آدرس:</strong> {request.address.city} - {request.address.address}
              </p>

              <p>
                <strong>ثبت‌کننده:</strong> {request.createdBy.name}
              </p>
            </div>
          </div>

          <div className="panel">
            <h3>تغییر وضعیت</h3>

            <form action={updateServiceRequestStatusAction} className="form">
              <input type="hidden" name="requestId" value={request.id} />

              <label>
                وضعیت درخواست
                <select name="status" defaultValue={request.status}>
                  {statusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <button className="button full" type="submit">
                ذخیره وضعیت
              </button>
            </form>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <h3>ویرایش اطلاعات درخواست</h3>

            <form action={updateServiceRequestAction} className="form">
              <input type="hidden" name="requestId" value={request.id} />

              <label>
                اولویت
                <select name="priority" defaultValue={request.priority}>
                  <option value="NORMAL">عادی</option>
                  <option value="URGENT">فوری</option>
                </select>
              </label>

              <label>
                زمان مراجعه
                <input
                  name="scheduledAt"
                  type="datetime-local"
                  defaultValue={toDateTimeLocalValue(request.scheduledAt)}
                />
              </label>

              <label>
                شرح مشکل
                <textarea
                  name="problemDescription"
                  defaultValue={request.problemDescription}
                  required
                ></textarea>
              </label>

              <label>
                توضیحات داخلی
                <textarea
                  name="internalNotes"
                  defaultValue={request.internalNotes || ""}
                ></textarea>
              </label>

              <button className="button full" type="submit">
                ذخیره تغییرات
              </button>
            </form>
          </div>

          <div className="panel">
            <h3>ارجاع به تکنسین</h3>

            {technicians.length === 0 ? (
              <div className="alert warning">
                هنوز تکنسینی تعریف نشده است. در مرحله بعد ماژول مدیریت تکنسین‌ها را اضافه می‌کنیم.
              </div>
            ) : (
              <form action={assignTechnicianAction} className="form">
                <input type="hidden" name="requestId" value={request.id} />

                <label>
                  تکنسین
                  <select
                    name="technicianUserId"
                    defaultValue={request.assignedTechnicianUserId || ""}
                  >
                    <option value="">بدون تکنسین</option>
                    {technicians.map((technician) => (
                      <option key={technician.userId} value={technician.userId}>
                        {technician.user.name} - {technician.user.mobile}
                      </option>
                    ))}
                  </select>
                </label>

                <button className="button full" type="submit">
                  ارجاع درخواست
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <h3>گزارش‌های تعمیر</h3>

            {request.reports.length === 0 ? (
              <p className="muted">
                هنوز گزارشی برای این درخواست ثبت نشده است. این بخش در مرحله تکنسین‌ها کامل می‌شود.
              </p>
            ) : (
              <div className="stack-list">
                {request.reports.map((report) => (
                  <article className="list-card" key={report.id}>
                    <strong>{report.technician.name}</strong>
                    <p>{report.diagnosis}</p>
                    <p>{report.workDone}</p>
                    <small>{report.createdAt.toLocaleString("fa-IR")}</small>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h3>فاکتور</h3>

            {request.invoice ? (
              <div className="info-list">
                <p>
                  <strong>شماره فاکتور:</strong>{" "}
                  <Link href={`/dashboard/invoices/${request.invoice.id}`}>
                    {request.invoice.invoiceNumber}
                  </Link>
                </p>
                <p>
                  <strong>مبلغ کل:</strong>{" "}
                  {Number(request.invoice.total).toLocaleString("fa-IR")} تومان
                </p>
                <p>
                  <strong>وضعیت پرداخت:</strong> {request.invoice.paymentStatus}
                </p>
              </div>
            ) : (
              <div>
                <p className="muted">
                  هنوز فاکتوری برای این درخواست صادر نشده است.
                </p>
                <Link
                  className="button"
                  href={`/dashboard/service-requests/${request.id}/invoice`}
                >
                  صدور فاکتور
                </Link>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
