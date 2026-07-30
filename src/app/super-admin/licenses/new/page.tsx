import Link from "next/link";
import { createLicenseAction } from "@/app/super-admin/actions";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminContext } from "@/lib/super-admin-context";

export default async function NewLicensePage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  await requireSuperAdminContext();

  const params = await searchParams;

  const plans = await prisma.plan.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      priceYearly: "asc"
    }
  });

  return (
    <main className="container">
      <section className="card">
        <div className="page-header">
          <div>
            <span className="badge">ساخت لایسنس</span>
            <h1>ایجاد کد فعال‌سازی جدید</h1>
            <p className="muted">
              این کد را بعد از فروش به تعمیرکار می‌دهید تا هنگام ثبت‌نام یا تمدید وارد کند.
            </p>
          </div>

          <Link className="ghost-light-button" href="/super-admin/licenses">
            بازگشت
          </Link>
        </div>

        {params?.error ? <div className="alert error">{params.error}</div> : null}

        <form action={createLicenseAction} className="form two-column">
          <label>
            پلن
            <select name="planId" required defaultValue="">
              <option value="" disabled>
                انتخاب پلن
              </option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nameFa} - {Number(plan.priceYearly || 0).toLocaleString("fa-IR")} تومان سالانه
                </option>
              ))}
            </select>
          </label>

          <label>
            مدت اعتبار، روز
            <input name="durationDays" type="number" min="1" defaultValue="365" />
          </label>

          <label className="span-2">
            کد دلخواه، اختیاری
            <input
              name="licenseKey"
              placeholder="اگر خالی بماند، سیستم خودکار کد می‌سازد."
            />
          </label>

          <label>
            حداکثر کاربر، اختیاری
            <input name="maxUsers" type="number" min="1" placeholder="پیش‌فرض از پلن" />
          </label>

          <label>
            حداکثر تکنسین، اختیاری
            <input name="maxTechnicians" type="number" min="0" placeholder="پیش‌فرض از پلن" />
          </label>

          <label className="span-2">
            سقف درخواست ماهانه، اختیاری
            <input
              name="maxMonthlyRequests"
              type="number"
              min="0"
              placeholder="اگر خالی بماند، مقدار پلن استفاده می‌شود."
            />
          </label>

          <button className="button full span-2" type="submit">
            ساخت لایسنس
          </button>
        </form>
      </section>
    </main>
  );
}
