import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

const paymentStatusLabels = {
  UNPAID: "پرداخت‌نشده",
  PAID: "پرداخت‌شده",
  PARTIAL: "پرداخت بخشی"
} as const;

export default async function PrintInvoicePage({
  params
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "invoices");

  const { invoiceId } = await params;

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
      items: true,
      tenant: true
    }
  });

  if (!invoice) {
    notFound();
  }

  return (
    <main className="print-page">
      <div className="print-actions no-print">
        <Link className="ghost-light-button" href={`/dashboard/invoices/${invoice.id}`}>
          بازگشت
        </Link>
        <button className="button" type="button" onClick={undefined}>
          از منوی مرورگر چاپ کنید
        </button>
      </div>

      <section className="print-invoice">
        <header className="print-header">
          <div>
            <h1>{invoice.tenant.name}</h1>
            <p>فاکتور خدمات تعمیر و سرویس لوازم خانگی</p>
          </div>

          <div className="print-meta">
            <p>
              <strong>شماره فاکتور:</strong>{" "}
              <span dir="ltr">{invoice.invoiceNumber}</span>
            </p>
            <p>
              <strong>تاریخ:</strong>{" "}
              {invoice.createdAt.toLocaleDateString("fa-IR")}
            </p>
            <p>
              <strong>وضعیت پرداخت:</strong>{" "}
              {paymentStatusLabels[invoice.paymentStatus]}
            </p>
          </div>
        </header>

        <section className="print-grid">
          <div>
            <h3>مشخصات مشتری</h3>
            <p>
              <strong>نام:</strong> {invoice.customer.firstName}{" "}
              {invoice.customer.lastName || ""}
            </p>
            <p>
              <strong>موبایل:</strong>{" "}
              <span dir="ltr">{invoice.customer.mobile}</span>
            </p>
            <p>
              <strong>آدرس:</strong> {invoice.serviceRequest.address.city} -{" "}
              {invoice.serviceRequest.address.address}
            </p>
          </div>

          <div>
            <h3>مشخصات درخواست</h3>
            <p>
              <strong>کد پیگیری:</strong>{" "}
              <span dir="ltr">{invoice.serviceRequest.trackingCode}</span>
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
              <strong>شرح مشکل:</strong>{" "}
              {invoice.serviceRequest.problemDescription}
            </p>
          </div>
        </section>

        <section>
          <h3>اقلام فاکتور</h3>

          <table className="print-table">
            <thead>
              <tr>
                <th>ردیف</th>
                <th>شرح</th>
                <th>تعداد</th>
                <th>قیمت واحد</th>
                <th>جمع</th>
              </tr>
            </thead>

            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.title}</td>
                  <td>{item.quantity}</td>
                  <td>{Number(item.unitPrice).toLocaleString("fa-IR")} تومان</td>
                  <td>{Number(item.total).toLocaleString("fa-IR")} تومان</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="print-summary">
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
        </section>

        <footer className="print-footer">
          <div>
            <p>امضای مشتری</p>
          </div>
          <div>
            <p>مهر و امضای مرکز خدمات</p>
          </div>
        </footer>
      </section>
    </main>
  );
}
