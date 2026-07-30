import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createInvoiceAction } from "@/app/dashboard/invoices/actions";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

export default async function CreateInvoiceForRequestPage({
  params,
  searchParams
}: {
  params: Promise<{ requestId: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "invoices");

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
      address: true,
      invoice: true,
      reports: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    }
  });

  if (!request) {
    notFound();
  }

  if (request.invoice) {
    redirect(`/dashboard/invoices/${request.invoice.id}`);
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
            <span className="badge">صدور فاکتور</span>
            <h1>صدور فاکتور برای درخواست</h1>
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
                <strong>موبایل:</strong>{" "}
                <span dir="ltr">{request.customer.mobile}</span>
              </p>
              <p>
                <strong>دستگاه:</strong> {request.appliance.type}
                {request.appliance.brand ? ` - ${request.appliance.brand}` : ""}
                {request.appliance.model ? ` - ${request.appliance.model}` : ""}
              </p>
              <p>
                <strong>شرح مشکل:</strong> {request.problemDescription}
              </p>
              {request.reports[0] ? (
                <p>
                  <strong>آخرین گزارش:</strong> {request.reports[0].workDone}
                </p>
              ) : null}
            </div>
          </div>

          <div className="panel">
            <h3>فرم فاکتور</h3>

            <form action={createInvoiceAction} className="form">
              <input type="hidden" name="requestId" value={request.id} />

              <div className="invoice-items-box">
                <h4>آیتم‌های فاکتور</h4>

                <div className="invoice-item-row header">
                  <span>عنوان</span>
                  <span>تعداد</span>
                  <span>قیمت واحد، تومان</span>
                </div>

                <div className="invoice-item-row">
                  <input name="itemTitle" defaultValue="اجرت تعمیر" />
                  <input name="itemQuantity" type="number" min="1" defaultValue="1" />
                  <input name="itemUnitPrice" type="number" min="0" placeholder="0" />
                </div>

                <div className="invoice-item-row">
                  <input name="itemTitle" defaultValue="قطعه مصرفی" />
                  <input name="itemQuantity" type="number" min="1" defaultValue="1" />
                  <input name="itemUnitPrice" type="number" min="0" placeholder="0" />
                </div>

                <div className="invoice-item-row">
                  <input name="itemTitle" defaultValue="ایاب و ذهاب" />
                  <input name="itemQuantity" type="number" min="1" defaultValue="1" />
                  <input name="itemUnitPrice" type="number" min="0" placeholder="0" />
                </div>

                <div className="invoice-item-row">
                  <input name="itemTitle" placeholder="سایر" />
                  <input name="itemQuantity" type="number" min="1" defaultValue="1" />
                  <input name="itemUnitPrice" type="number" min="0" placeholder="0" />
                </div>
              </div>

              <div className="mini-grid">
                <label>
                  تخفیف، تومان
                  <input name="discount" type="number" min="0" defaultValue="0" />
                </label>

                <label>
                  مالیات، تومان
                  <input name="tax" type="number" min="0" defaultValue="0" />
                </label>
              </div>

              <label>
                وضعیت پرداخت
                <select name="paymentStatus" defaultValue="UNPAID">
                  <option value="UNPAID">پرداخت‌نشده</option>
                  <option value="PARTIAL">پرداخت بخشی</option>
                  <option value="PAID">پرداخت‌شده</option>
                </select>
              </label>

              <button className="button full" type="submit">
                صدور فاکتور
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
