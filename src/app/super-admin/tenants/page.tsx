import Link from "next/link";
import type { TenantStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminContext } from "@/lib/super-admin-context";

const statusLabels: Record<TenantStatus, string> = {
  ACTIVE: "فعال",
  SUSPENDED: "تعلیق‌شده",
  EXPIRED: "منقضی"
};

export default async function SuperAdminTenantsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; error?: string; success?: string }>;
}) {
  await requireSuperAdminContext();

  const params = await searchParams;
  const q = String(params?.q || "").trim();

  const tenants = await prisma.tenant.findMany({
    where: {
      ...(q
        ? {
            OR: [
              {
                name: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                mobile: {
                  contains: q
                }
              },
              {
                city: {
                  contains: q,
                  mode: "insensitive"
                }
              }
            ]
          }
        : {})
    },
    include: {
      owner: true,
      licenses: {
        include: {
          plan: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      },
      _count: {
        select: {
          users: true,
          customers: true,
          serviceRequests: true,
          invoices: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 200
  });

  return (
    <main className="container">
      <section className="card">
        <div className="page-header">
          <div>
            <span className="badge">کسب‌وکارها</span>
            <h1>مشتریان نرم‌افزار سرویسیار</h1>
            <p className="muted">
              تعمیرکاران، شرکت‌ها و نمایندگی‌هایی که از سرویسیار استفاده می‌کنند.
            </p>
          </div>

          <Link className="ghost-light-button" href="/super-admin">
            بازگشت
          </Link>
        </div>

        <form className="search-form">
          <input
            name="q"
            defaultValue={q}
            placeholder="جستجو با نام کسب‌وکار، موبایل یا شهر"
          />
          <button className="button compact" type="submit">
            جستجو
          </button>
          {q ? (
            <Link className="secondary-link" href="/super-admin/tenants">
              حذف فیلتر
            </Link>
          ) : null}
        </form>
      </section>

      <section className="panel">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>نام کسب‌وکار</th>
                <th>مالک</th>
                <th>شهر</th>
                <th>وضعیت</th>
                <th>پلن فعلی</th>
                <th>آمار</th>
                <th>عملیات</th>
              </tr>
            </thead>

            <tbody>
              {tenants.map((tenant) => {
                const latestLicense = tenant.licenses[0];

                return (
                  <tr key={tenant.id}>
                    <td>
                      <strong>{tenant.name}</strong>
                      <br />
                      <small>{tenant.mobile || "موبایل ثبت نشده"}</small>
                    </td>
                    <td>
                      {tenant.owner.name}
                      <br />
                      <small dir="ltr">{tenant.owner.mobile}</small>
                    </td>
                    <td>{tenant.city || "-"}</td>
                    <td>{statusLabels[tenant.status]}</td>
                    <td>
                      {latestLicense ? (
                        <>
                          {latestLicense.plan.nameFa}
                          <br />
                          <small>{latestLicense.status}</small>
                        </>
                      ) : (
                        "بدون لایسنس"
                      )}
                    </td>
                    <td>
                      کاربر: {tenant._count.users}
                      <br />
                      مشتری: {tenant._count.customers}
                      <br />
                      درخواست: {tenant._count.serviceRequests}
                      <br />
                      فاکتور: {tenant._count.invoices}
                    </td>
                    <td>
                      <Link
                        className="table-action"
                        href={`/super-admin/tenants/${tenant.id}`}
                      >
                        مدیریت
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
