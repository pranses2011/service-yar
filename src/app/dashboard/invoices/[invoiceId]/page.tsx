import Link from "next/link";
import { notFound } from "next/navigation";
import { updateInvoicePaymentStatusAction } from "@/app/dashboard/invoices/actions";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

const paymentStatusLabels = {
  UNPAID: "پرداخت‌نشده",
  PAID: "پرداخت‌شده",
  PARTIAL: "پرداخت بخشی"
} as const;

export default async function InvoiceDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "invoices");

  const { invoiceId } = await params;
  const query = await searchParams;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId: context.tenantId
    },
    include: {
      customer: true,
      serviceRequest: {
        include: {
          appliance: true,
          address: true
        }
      },
      items: true
    }
  });

  if (!invoice) {
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
            <span className="badge">جزئیات فاکتور</span>
            <h1 dir="ltr">{invoice.invoiceNumber}</h1>
            <p className="muted">
              درخواست:{" "}
              <Link href={`/dashboard/service-requests/${invoice.serviceRequest.id}`}>
                <span dir="ltr">{invoice.serviceRequest.trackingCode}</span>
              </Link>
            </p>
          </div>

          <div className="header-actions">
            <Link className="ghost-light-button" href="/dashboard/invoices">
              بازگشت
            </Link>
            <Link
              className="button"
              href={`/dashboard/invoices/${invoice.id}/print`}
            >
              چاپ فاکتور
            </Link>
          </div>
        </header>

        {query?.error ? <div className="alert error">{query.error}</div> : null}
        {query?.success ? <div className="alert success">{query.success}</div> : null}

        <section className="stats-grid">
          <div className="stat-card small">
            <span>مبلغ نهایی</span>
            <strong className="stat-text">
              {Number(invoice.total).toLocaleString("fa-IR")} تومان
            </strong>
          </div>

          <div className="stat-card small">
            <span>وضعیت پرداخت</span>
            <strong className="stat-text">
              {paymentStatusLabels[invoice.paymentStatus]}
            </strong>
          </div>

          <div className="stat-card small">
            <span>تاریخ صدور</span>
            <strong className="stat-text">
              {invoice.createdAt.toLocaleDateString("fa-IR")}
            </strong>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <h3>اطلاعات مشتری</h3>

            <div className="info-list">
              <p>
                <strong>نام:</strong> {invoice.customer.firstName}{" "}
                {invoice.customer.lastName || ""}
              </p>
              <p>
                <strong>موبایل:</strong>{" "}
                <span dir="ltr">{invoice.customer.mobile}</span>
              </p>
              <p>
                <strong>دستگاه:</strong> {invoice.serviceRequest.appliance.type}
                {invoice.serviceRequest.appliance.brand
                  ? ` - ${invoice.serviceRequest.appliance.brand}`
                  : ""}
                {invoice.serviceRequest.appliance.model
                  ? ` - ${invoice.serviceRequest.appliance.model}`
                  : ""}
              </p>
              <p>
                <strong>آدرس:</strong> {invoice.serviceRequest.address.city} -{" "}
                {invoice.serviceRequest.address.address}
              </p>
            </div>
          </div>

          <div className="panel">
            <h3>تغییر وضعیت پرداخت</h3>

            <form action={updateInvoicePaymentStatusAction} className="form">
              <input type="hidden" name="invoiceId" value={invoice.id} />

              <label>
                وضعیت پرداخت
                <select name="paymentStatus" defaultValue={invoice.paymentStatus}>
                  <option value="UNPAID">پرداخت‌نشده</option>
                  <option value="PARTIAL">پرداخت بخشی</option>
                  <option value="PAID">پرداخت‌شده</option>
                </select>
              </label>

              <button className="button full" type="submit">
                ذخیره وضعیت پرداخت
              </button>
            </form>
          </div>
        </section>

        <section className="panel">
          <h3>آیتم‌های فاکتور</h3>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>تعداد</th>
                  <th>قیمت واحد</th>
                  <th>جمع</th>
                </tr>
              </thead>

              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.quantity}</td>
                    <td>{Number(item.unitPrice).toLocaleString("fa-IR")} تومان</td>
                    <td>{Number(item.total).toLocaleString("fa-IR")} تومان</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoice-summary">
            <p>
              <span>جمع جزء:</span>
              <strong>{Number(invoice.subtotal).toLocaleString("fa-IR")} تومان</strong>
            </p>
            <p>
              <span>تخفیف:</span>
              <strong>{Number(invoice.discount).toLocaleString("fa-IR")} تومان</strong>
            </p>
            <p>
              <span>مالیات:</span>
              <strong>{Number(invoice.tax).toLocaleString("fa-IR")} تومان</strong>
            </p>
            <p className="grand-total">
              <span>مبلغ نهایی:</span>
              <strong>{Number(invoice.total).toLocaleString("fa-IR")} تومان</strong>
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
