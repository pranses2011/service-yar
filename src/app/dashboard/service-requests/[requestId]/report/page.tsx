import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServiceReportAction } from "@/app/dashboard/service-reports/actions";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

export default async function NewServiceReportPage({
  params,
  searchParams
}: {
  params: Promise<{ requestId: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "service_reports");

  const { requestId } = await params;
  const query = await searchParams;

  const request = await prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      tenantId: context.tenantId
    },
    include: {
      customer: true,
      appliance: true,
      assignedTechnician: true
    }
  });

  if (!request) {
    notFound();
  }

  if (
    context.role === "TECHNICIAN" &&
    request.assignedTechnicianUserId !== context.user.id
  ) {
    redirect("/dashboard/service-requests");
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
            <a href="#">فاکتورها</a>
          </nav>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <span className="badge">گزارش تعمیر</span>
            <h1>ثبت گزارش تعمیر</h1>
            <p className="muted">
              درخواست: <span dir="ltr">{request.trackingCode}</span> - مشتری:{" "}
              {request.customer.firstName} {request.customer.lastName || ""}
            </p>
          </div>

          <Link
            className="ghost-light-button"
            href={`/dashboard/service-requests/${request.id}`}
          >
            بازگشت به درخواست
          </Link>
        </header>

        {query?.error ? <div className="alert error">{query.error}</div> : null}

        <section className="dashboard-grid">
          <div className="panel">
            <h3>خلاصه درخواست</h3>

            <div className="info-list">
              <p>
                <strong>کد پیگیری:</strong>{" "}
                <span dir="ltr">{request.trackingCode}</span>
              </p>
              <p>
                <strong>مشتری:</strong> {request.customer.firstName}{" "}
                {request.customer.lastName || ""}
              </p>
              <p>
                <strong>دستگاه:</strong> {request.appliance.type}
                {request.appliance.brand ? ` - ${request.appliance.brand}` : ""}
                {request.appliance.model ? ` - ${request.appliance.model}` : ""}
              </p>
              <p>
                <strong>شرح مشکل:</strong> {request.problemDescription}
              </p>
              <p>
                <strong>تکنسین ارجاع‌شده:</strong>{" "}
                {request.assignedTechnician?.name || "ثبت نشده"}
              </p>
            </div>
          </div>

          <div className="panel">
            <h3>فرم گزارش</h3>

            <form action={createServiceReportAction} className="form">
              <input type="hidden" name="requestId" value={request.id} />

              <label>
                ایراد تشخیص داده‌شده
                <textarea
                  name="diagnosis"
                  placeholder="مثلاً خرابی پمپ تخلیه، ایراد برد، نشتی شلنگ..."
                  required
                ></textarea>
              </label>

              <label>
                کار انجام‌شده
                <textarea
                  name="workDone"
                  placeholder="شرح دقیق کار انجام‌شده توسط تکنسین"
                  required
                ></textarea>
              </label>

              <label>
                قطعات مصرفی
                <textarea
                  name="partsUsedText"
                  placeholder="مثلاً پمپ تخلیه، تسمه، سنسور..."
                ></textarea>
              </label>

              <label>
                پیشنهاد یا توضیحات بعدی
                <textarea
                  name="recommendations"
                  placeholder="مثلاً نیاز به سرویس دوره‌ای، تعویض قطعه در آینده..."
                ></textarea>
              </label>

              <label>
                وضعیت بعد از ثبت گزارش
                <select name="nextStatus" defaultValue="COMPLETED">
                  <option value="IN_PROGRESS">در حال انجام</option>
                  <option value="WAITING_FOR_PART">در انتظار قطعه</option>
                  <option value="COMPLETED">تکمیل‌شده</option>
                </select>
              </label>

              <button className="button full" type="submit">
                ثبت گزارش تعمیر
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
