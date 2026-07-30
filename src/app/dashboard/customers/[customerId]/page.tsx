import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createApplianceAction,
  createCustomerAddressAction,
  updateCustomerAction
} from "@/app/dashboard/customers/actions";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requireTenantContext } from "@/lib/tenant-context";

const applianceTypes = [
  "یخچال",
  "فریزر",
  "ماشین لباسشویی",
  "ماشین ظرفشویی",
  "کولر گازی",
  "اجاق گاز",
  "مایکروفر",
  "جاروبرقی",
  "پکیج",
  "سایر"
];

export default async function CustomerDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ customerId: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const context = await requireTenantContext();
  await requireModule(context.tenantId, "customers");

  const { customerId } = await params;
  const query = await searchParams;

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
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
      },
      serviceRequests: {
        orderBy: {
          createdAt: "desc"
        },
        take: 10
      }
    }
  });

  if (!customer) {
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
            <a href="#">فاکتورها</a>
          </nav>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <span className="badge">پرونده مشتری</span>
            <h1>
              {customer.firstName} {customer.lastName || ""}
            </h1>
            <p className="muted">
              موبایل: <span dir="ltr">{customer.mobile}</span>
            </p>
          </div>

          <Link className="ghost-light-button" href="/dashboard/customers">
            بازگشت به مشتریان
          </Link>
        </header>

        {query?.error ? <div className="alert error">{query.error}</div> : null}
        {query?.success ? <div className="alert success">{query.success}</div> : null}

        <section className="dashboard-grid">
          <div className="panel">
            <h3>ویرایش اطلاعات مشتری</h3>

            <form action={updateCustomerAction} className="form">
              <input type="hidden" name="customerId" value={customer.id} />

              <label>
                نام
                <input name="firstName" defaultValue={customer.firstName} required />
              </label>

              <label>
                نام خانوادگی
                <input name="lastName" defaultValue={customer.lastName || ""} />
              </label>

              <label>
                شماره موبایل
                <input name="mobile" defaultValue={customer.mobile} required />
              </label>

              <label>
                تلفن ثابت
                <input name="phone" defaultValue={customer.phone || ""} />
              </label>

              <label>
                توضیحات
                <textarea name="notes" defaultValue={customer.notes || ""}></textarea>
              </label>

              <button className="button full" type="submit">
                ذخیره اطلاعات
              </button>
            </form>
          </div>

          <div className="panel">
            <h3>ثبت آدرس جدید</h3>

            <form action={createCustomerAddressAction} className="form">
              <input type="hidden" name="customerId" value={customer.id} />

              <label>
                شهر
                <input name="city" placeholder="مثلاً تبریز" required />
              </label>

              <label>
                آدرس کامل
                <textarea name="address" placeholder="خیابان، کوچه، پلاک..." required></textarea>
              </label>

              <div className="mini-grid">
                <label>
                  پلاک
                  <input name="plate" />
                </label>

                <label>
                  واحد
                  <input name="unit" />
                </label>
              </div>

              <label>
                کد پستی
                <input name="postalCode" />
              </label>

              <label>
                توضیحات مسیر
                <textarea name="description"></textarea>
              </label>

              <button className="button full" type="submit">
                ثبت آدرس
              </button>
            </form>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <h3>آدرس‌های مشتری</h3>

            {customer.addresses.length === 0 ? (
              <p className="muted">هنوز آدرسی برای این مشتری ثبت نشده است.</p>
            ) : (
              <div className="stack-list">
                {customer.addresses.map((address) => (
                  <article className="list-card" key={address.id}>
                    <strong>{address.city}</strong>
                    <p>{address.address}</p>
                    <small>
                      {address.plate ? `پلاک ${address.plate}` : ""}
                      {address.unit ? ` - واحد ${address.unit}` : ""}
                    </small>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h3>ثبت دستگاه جدید</h3>

            <form action={createApplianceAction} className="form">
              <input type="hidden" name="customerId" value={customer.id} />

              <label>
                نوع دستگاه
                <select name="type" required defaultValue="">
                  <option value="" disabled>
                    انتخاب کنید
                  </option>
                  {applianceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                برند
                <input name="brand" placeholder="مثلاً سامسونگ، ال‌جی، اسنوا" />
              </label>

              <label>
                مدل
                <input name="model" />
              </label>

              <label>
                شماره سریال
                <input name="serialNumber" />
              </label>

              <label>
                توضیحات
                <textarea name="notes"></textarea>
              </label>

              <button className="button full" type="submit">
                ثبت دستگاه
              </button>
            </form>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <h3>دستگاه‌های مشتری</h3>

            {customer.appliances.length === 0 ? (
              <p className="muted">هنوز دستگاهی برای این مشتری ثبت نشده است.</p>
            ) : (
              <div className="stack-list">
                {customer.appliances.map((appliance) => (
                  <article className="list-card" key={appliance.id}>
                    <strong>{appliance.type}</strong>
                    <p>
                      {appliance.brand || "برند نامشخص"}
                      {appliance.model ? ` - مدل ${appliance.model}` : ""}
                    </p>
                    {appliance.serialNumber ? (
                      <small>سریال: {appliance.serialNumber}</small>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h3>سوابق درخواست تعمیر</h3>

            {customer.serviceRequests.length === 0 ? (
              <div>
                <p className="muted">
                  هنوز درخواست تعمیری برای این مشتری ثبت نشده است.
                </p>
                <p className="muted">
                  در مرحله بعد، ماژول ثبت درخواست تعمیر را اضافه می‌کنیم.
                </p>
              </div>
            ) : (
              <div className="stack-list">
                {customer.serviceRequests.map((request) => (
                  <article className="list-card" key={request.id}>
                    <strong>{request.trackingCode}</strong>
                    <p>{request.problemDescription}</p>
                    <small>{request.status}</small>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
