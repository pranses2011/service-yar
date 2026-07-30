import Link from "next/link";
import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: "پرداخت‌نشده",
  PAID: "پرداخت‌شده",
  PARTIAL: "پرداخت بخشی"
};

const paymentOptions: Array<{ value: PaymentStatus | ""; label: string }> = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "UNPAID", label: "پرداخت‌نشده" },
  { value: "PAID", label: "پرداخت‌شده" },
  { value: "PARTIAL", label: "پرداخت بخشی" }
];

const validPaymentStatuses = paymentOptions
  .map((item) => item.value)
  .filter(Boolean) as PaymentStatus[];

export default async function InvoicesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; paymentStatus?: string; error?: string; success?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "invoices");

  const params = await searchParams;
  const q = String(params?.q || "").trim();
  const paymentStatusRaw = String(params?.paymentStatus || "").trim() as PaymentStatus;
  const paymentStatus = validPaymentStatuses.includes(paymentStatusRaw)
    ? paymentStatusRaw
    : undefined;

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: context.tenantId,
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(q
        ? {
            OR: [
              {
                invoiceNumber: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                serviceRequest: {
                  trackingCode: {
                    contains: q,
                    mode: "insensitive"
                  }
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
      serviceRequest: {
        include: {
          appliance: true
        }
      },
      items: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 100
  });

  const totalAmount = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0
  );

  const paidAmount = invoices
    .filter((invoice) => invoice.paymentStatus === "PAID")
    .reduce((sum, invoice) => sum + Number(invoice.total), 0);

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
            <span className="badge">مدیریت مالی</span>
            <h1>فاکتورها</h1>
            <p className="muted">
              فاکتورهای صادرشده برای درخواست‌های تعمیر را مشاهده و مدیریت کنید.
            </p>
          </div>
        </header>

        {params?.error ? <div className="alert error">{params.error}</div> : null}
        {params?.success ? <div className="alert success">{params.success}</div> : null}

        <section className="stats-grid">
          <div className="stat-card small">
            <span>تعداد فاکتورها</span>
            <strong>{invoices.length}</strong>
          </div>

          <div className="stat-card small">
            <span>مجموع فاکتورها</span>
            <strong className="stat-text">
              {totalAmount.toLocaleString("fa-IR")} تومان
            </strong>
          </div>

          <div className="stat-card small">
            <span>پرداخت‌شده</span>
            <strong className="stat-text">
              {paidAmount.toLocaleString("fa-IR")} تومان
            </strong>
          </div>
        </section>

        <section className="panel">
          <form className="search-form service-search">
            <input
              name="q"
              defaultValue={q}
              placeholder="جستجو با شماره فاکتور، کد پیگیری، نام یا موبایل مشتری"
            />

            <select name="paymentStatus" defaultValue={paymentStatus || ""}>
              {paymentOptions.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <button className="button compact" type="submit">
              جستجو
            </button>

            {(q || paymentStatus) ? (
              <Link className="secondary-link" href="/dashboard/invoices">
                حذف فیلتر
              </Link>
            ) : null}
          </form>
        </section>

        <section className="panel">
          {invoices.length === 0 ? (
            <div className="empty-state">
              <h3>هنوز فاکتوری صادر نشده است</h3>
              <p className="muted">
                برای صدور فاکتور، وارد جزئیات یک درخواست تعمیر شوید و گزینه صدور فاکتور را انتخاب کنید.
              </p>
              <Link className="button" href="/dashboard/service-requests">
                مشاهده درخواست‌های تعمیر
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>شماره فاکتور</th>
                    <th>کد درخواست</th>
                    <th>مشتری</th>
                    <th>دستگاه</th>
                    <th>مبلغ نهایی</th>
                    <th>وضعیت پرداخت</th>
                    <th>تاریخ صدور</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td dir="ltr">
                        <strong>{invoice.invoiceNumber}</strong>
                      </td>
                      <td dir="ltr">{invoice.serviceRequest.trackingCode}</td>
                      <td>
                        {invoice.customer.firstName} {invoice.customer.lastName || ""}
                        <br />
                        <small dir="ltr">{invoice.customer.mobile}</small>
                      </td>
                      <td>
                        {invoice.serviceRequest.appliance.type}
                        <br />
                        <small>{invoice.serviceRequest.appliance.brand || "برند نامشخص"}</small>
                      </td>
                      <td>{Number(invoice.total).toLocaleString("fa-IR")} تومان</td>
                      <td>
                        <span className={`payment-pill payment-${invoice.paymentStatus.toLowerCase()}`}>
                          {paymentStatusLabels[invoice.paymentStatus]}
                        </span>
                      </td>
                      <td>{invoice.createdAt.toLocaleDateString("fa-IR")}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            className="table-action"
                            href={`/dashboard/invoices/${invoice.id}`}
                          >
                            مشاهده
                          </Link>
                          <Link
                            className="table-action green"
                            href={`/dashboard/invoices/${invoice.id}/print`}
                          >
                            چاپ
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
      </section>
    </main>
  );
}
