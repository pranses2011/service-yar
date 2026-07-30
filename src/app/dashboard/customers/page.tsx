import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

export default async function CustomersPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; error?: string; success?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "customers");

  const params = await searchParams;
  const q = String(params?.q || "").trim();

  const customers = await prisma.customer.findMany({
    where: {
      tenantId: context.tenantId,
      ...(q
        ? {
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
        : {})
    },
    include: {
      _count: {
        select: {
          addresses: true,
          appliances: true,
          serviceRequests: true
        }
      }
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
            <span className="badge">مدیریت مشتریان</span>
            <h1>مشتریان</h1>
            <p className="muted">
              مشتریان نهایی، آدرس‌ها، دستگاه‌ها و سوابق تعمیر را از این بخش مدیریت کنید.
            </p>
          </div>

          <Link className="button" href="/dashboard/customers/new">
            + ثبت مشتری جدید
          </Link>
        </header>

        {params?.error ? <div className="alert error">{params.error}</div> : null}
        {params?.success ? <div className="alert success">{params.success}</div> : null}

        <section className="panel">
          <form className="search-form">
            <input
              name="q"
              defaultValue={q}
              placeholder="جستجو با نام، نام خانوادگی یا شماره موبایل"
            />
            <button className="button compact" type="submit">
              جستجو
            </button>
            {q ? (
              <Link className="secondary-link" href="/dashboard/customers">
                حذف فیلتر
              </Link>
            ) : null}
          </form>
        </section>

        <section className="panel">
          {customers.length === 0 ? (
            <div className="empty-state">
              <h3>هنوز مشتری ثبت نشده است</h3>
              <p className="muted">
                برای شروع، اولین مشتری را ثبت کنید تا بعداً بتوانید برای او دستگاه و درخواست تعمیر بسازید.
              </p>
              <Link className="button" href="/dashboard/customers/new">
                ثبت اولین مشتری
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>نام مشتری</th>
                    <th>موبایل</th>
                    <th>آدرس‌ها</th>
                    <th>دستگاه‌ها</th>
                    <th>درخواست‌ها</th>
                    <th>تاریخ ثبت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <strong>
                          {customer.firstName} {customer.lastName || ""}
                        </strong>
                      </td>
                      <td dir="ltr">{customer.mobile}</td>
                      <td>{customer._count.addresses}</td>
                      <td>{customer._count.appliances}</td>
                      <td>{customer._count.serviceRequests}</td>
                      <td>{customer.createdAt.toLocaleDateString("fa-IR")}</td>
                      <td>
                        <Link className="table-action" href={`/dashboard/customers/${customer.id}`}>
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
