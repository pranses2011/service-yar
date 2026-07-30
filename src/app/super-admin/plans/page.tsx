import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminContext } from "@/lib/super-admin-context";

export default async function SuperAdminPlansPage() {
  await requireSuperAdminContext();

  const plans = await prisma.plan.findMany({
    include: {
      planModules: {
        include: {
          module: true
        }
      },
      _count: {
        select: {
          licenses: true
        }
      }
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
            <span className="badge">پلن‌ها</span>
            <h1>پلن‌های فروش سرویسیار</h1>
            <p className="muted">
              این پلن‌ها از Seed اولیه ساخته شده‌اند. در مرحله‌های بعد ویرایش پلن‌ها را هم اضافه می‌کنیم.
            </p>
          </div>

          <Link className="ghost-light-button" href="/super-admin">
            بازگشت
          </Link>
        </div>
      </section>

      <section className="pricing-grid">
        {plans.map((plan) => (
          <article className="pricing-card" key={plan.id}>
            <h3>{plan.nameFa}</h3>
            <p className="muted">{plan.description}</p>

            <div className="price">
              {Number(plan.priceYearly || 0).toLocaleString("fa-IR")}
              <span> تومان / سالانه</span>
            </div>

            <ul>
              <li>حداکثر کاربر: {plan.maxUsers}</li>
              <li>حداکثر تکنسین: {plan.maxTechnicians}</li>
              <li>درخواست ماهانه: {plan.maxMonthlyRequests ?? "نامحدود"}</li>
              <li>لایسنس‌های ساخته‌شده: {plan._count.licenses}</li>
            </ul>

            <div className="module-list">
              {plan.planModules.map((item) => (
                <span key={item.id}>{item.module.nameFa}</span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
