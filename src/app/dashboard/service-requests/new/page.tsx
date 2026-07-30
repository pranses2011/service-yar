import Link from "next/link";
import { createServiceRequestAction } from "@/app/dashboard/service-requests/actions";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

export default async function NewServiceRequestPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "service_requests");

  const params = await searchParams;

  const customers = await prisma.customer.findMany({
    where: {
      tenantId: context.tenantId
    },
    include: {
      addresses: {
        orderBy: {
          createdAt: "desc"
        }
      },
      appliances: {
        orderBy: {
          createdAt: "desc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 200
  });

  const hasUsableCustomer = customers.some(
    (customer) => customer.addresses.length > 0 && customer.appliances.length > 0
  );

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
            <span className="badge">درخواست جدید</span>
            <h1>ثبت درخواست تعمیر</h1>
            <p className="muted">
              مشتری، آدرس، دستگاه و شرح مشکل را انتخاب کنید تا درخواست تعمیر ساخته شود.
            </p>
          </div>

          <Link className="ghost-light-button" href="/dashboard/service-requests">
            بازگشت
          </Link>
        </header>

        {params?.error ? <div className="alert error">{params.error}</div> : null}

        {!hasUsableCustomer ? (
          <section className="panel">
            <div className="empty-state">
              <h3>برای ثبت درخواست، ابتدا مشتری کامل بسازید</h3>
              <p className="muted">
                هر درخواست تعمیر به مشتری، آدرس و دستگاه نیاز دارد. ابتدا مشتری را ثبت کنید و در پرونده او حداقل یک آدرس و یک دستگاه اضافه کنید.
              </p>
              <Link className="button" href="/dashboard/customers/new">
                ثبت مشتری جدید
              </Link>
            </div>
          </section>
        ) : (
          <section className="panel">
            <form action={createServiceRequestAction} className="form two-column">
              <label className="span-2">
                مشتری
                <select name="customerId" required defaultValue="">
                  <option value="" disabled>
                    انتخاب مشتری
                  </option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName || ""} - {customer.mobile}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                آدرس مشتری
                <select name="addressId" required defaultValue="">
                  <option value="" disabled>
                    انتخاب آدرس
                  </option>
                  {customers.flatMap((customer) =>
                    customer.addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {customer.firstName} {customer.lastName || ""} - {address.city} - {address.address}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label>
                دستگاه مشتری
                <select name="applianceId" required defaultValue="">
                  <option value="" disabled>
                    انتخاب دستگاه
                  </option>
                  {customers.flatMap((customer) =>
                    customer.appliances.map((appliance) => (
                      <option key={appliance.id} value={appliance.id}>
                        {customer.firstName} {customer.lastName || ""} - {appliance.type}
                        {appliance.brand ? ` - ${appliance.brand}` : ""}
                        {appliance.model ? ` - ${appliance.model}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label>
                اولویت
                <select name="priority" defaultValue="NORMAL">
                  <option value="NORMAL">عادی</option>
                  <option value="URGENT">فوری</option>
                </select>
              </label>

              <label>
                زمان مراجعه، اختیاری
                <input name="scheduledAt" type="datetime-local" />
              </label>

              <label className="span-2">
                شرح مشکل
                <textarea
                  name="problemDescription"
                  placeholder="مثلاً ماشین لباسشویی آب تخلیه نمی‌کند..."
                  required
                ></textarea>
              </label>

              <label className="span-2">
                توضیحات داخلی
                <textarea
                  name="internalNotes"
                  placeholder="توضیحات فقط برای تیم شما نمایش داده می‌شود."
                ></textarea>
              </label>

              <button className="button full span-2" type="submit">
                ثبت درخواست تعمیر
              </button>
            </form>

            <div className="alert warning form-note">
              نکته: در نسخه بعد، انتخاب آدرس و دستگاه را هوشمندتر می‌کنیم تا با انتخاب مشتری، فقط آدرس‌ها و دستگاه‌های همان مشتری نمایش داده شود.
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
