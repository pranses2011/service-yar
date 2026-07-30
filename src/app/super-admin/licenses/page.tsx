import Link from "next/link";
import type { LicenseStatus } from "@prisma/client";
import { updateLicenseStatusAction } from "@/app/super-admin/actions";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminContext } from "@/lib/super-admin-context";

const statusLabels: Record<LicenseStatus, string> = {
  UNUSED: "استفاده‌نشده",
  ACTIVE: "فعال",
  EXPIRED: "منقضی",
  SUSPENDED: "تعلیق‌شده",
  CANCELLED: "لغوشده"
};

const statusOptions: Array<{ value: LicenseStatus | ""; label: string }> = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "UNUSED", label: "استفاده‌نشده" },
  { value: "ACTIVE", label: "فعال" },
  { value: "EXPIRED", label: "منقضی" },
  { value: "SUSPENDED", label: "تعلیق‌شده" },
  { value: "CANCELLED", label: "لغوشده" }
];

const validStatuses = statusOptions
  .map((item) => item.value)
  .filter(Boolean) as LicenseStatus[];

export default async function SuperAdminLicensesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string; error?: string; success?: string }>;
}) {
  await requireSuperAdminContext();

  const params = await searchParams;
  const q = String(params?.q || "").trim();
  const statusRaw = String(params?.status || "").trim() as LicenseStatus;
  const status = validStatuses.includes(statusRaw) ? statusRaw : undefined;

  const licenses = await prisma.license.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              {
                licenseKey: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                tenant: {
                  name: {
                    contains: q,
                    mode: "insensitive"
                  }
                }
              },
              {
                plan: {
                  nameFa: {
                    contains: q,
                    mode: "insensitive"
                  }
                }
              }
            ]
          }
        : {})
    },
    include: {
      plan: true,
      tenant: true
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
            <span className="badge">مدیریت لایسنس‌ها</span>
            <h1>لایسنس‌ها و کدهای فعال‌سازی</h1>
            <p className="muted">
              این کدها را می‌توانید به تعمیرکاران بفروشید تا پلن و ماژول‌هایشان فعال شود.
            </p>
          </div>

          <div className="header-actions">
            <Link className="ghost-light-button" href="/super-admin">
              بازگشت
            </Link>
            <Link className="button" href="/super-admin/licenses/new">
              ساخت لایسنس جدید
            </Link>
          </div>
        </div>

        {params?.error ? <div className="alert error">{params.error}</div> : null}
        {params?.success ? <div className="alert success">{params.success}</div> : null}

        <form className="search-form service-search">
          <input
            name="q"
            defaultValue={q}
            placeholder="جستجو با کد لایسنس، نام کسب‌وکار یا پلن"
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
            <Link className="secondary-link" href="/super-admin/licenses">
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
                <th>کد لایسنس</th>
                <th>پلن</th>
                <th>وضعیت</th>
                <th>کسب‌وکار</th>
                <th>محدودیت‌ها</th>
                <th>اعتبار</th>
                <th>تغییر وضعیت</th>
              </tr>
            </thead>

            <tbody>
              {licenses.map((license) => (
                <tr key={license.id}>
                  <td>
                    <code>{license.licenseKey}</code>
                  </td>
                  <td>{license.plan.nameFa}</td>
                  <td>{statusLabels[license.status]}</td>
                  <td>
                    {license.tenant ? (
                      <Link href={`/super-admin/tenants/${license.tenant.id}`}>
                        {license.tenant.name}
                      </Link>
                    ) : (
                      "هنوز فعال نشده"
                    )}
                  </td>
                  <td>
                    کاربر: {license.maxUsers} / تکنسین: {license.maxTechnicians}
                    <br />
                    درخواست ماهانه: {license.maxMonthlyRequests ?? "نامحدود"}
                  </td>
                  <td>
                    {license.expiresAt
                      ? license.expiresAt.toLocaleDateString("fa-IR")
                      : `${license.durationDays} روز پس از فعال‌سازی`}
                  </td>
                  <td>
                    <form action={updateLicenseStatusAction} className="inline-form">
                      <input type="hidden" name="licenseId" value={license.id} />
                      <select name="status" defaultValue={license.status}>
                        <option value="UNUSED">استفاده‌نشده</option>
                        <option value="ACTIVE">فعال</option>
                        <option value="EXPIRED">منقضی</option>
                        <option value="SUSPENDED">تعلیق‌شده</option>
                        <option value="CANCELLED">لغوشده</option>
                      </select>
                      <button className="table-action" type="submit">
                        ذخیره
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
