export default function HomePage() {
  return (
    <main className="container">
      <section className="card">
        <span className="badge">نسخه MVP سرویسیار</span>

        <h1>سرویسیار؛ سامانه جامع مدیریت خدمات پس از فروش لوازم خانگی</h1>

        <p className="muted">
          این پروژه پایه اولیه وب اپلیکیشن سرویسیار است. هدف محصول، مدیریت مشتریان،
          درخواست‌های تعمیر، تکنسین‌ها، فاکتورها، گزارش تعمیر، لایسنس و ماژول‌های قابل فروش است.
        </p>

        <a className="button" href="https://github.com" target="_blank">
          شروع توسعه محصول
        </a>
      </section>

      <section className="grid">
        <div className="feature">
          <h3>مدیریت مشتریان</h3>
          <p className="muted">ثبت مشتری، شماره موبایل، آدرس‌ها و سوابق تعمیر.</p>
        </div>

        <div className="feature">
          <h3>درخواست تعمیر</h3>
          <p className="muted">ثبت مشکل دستگاه، وضعیت کار، تکنسین و کد پیگیری.</p>
        </div>

        <div className="feature">
          <h3>فاکتور و گزارش</h3>
          <p className="muted">ثبت گزارش تعمیر و صدور فاکتور ساده برای مشتری.</p>
        </div>

        <div className="feature">
          <h3>لایسنس و ماژول</h3>
          <p className="muted">فعال‌سازی کسب‌وکارها با کد لایسنس و پلن‌های قابل فروش.</p>
        </div>
      </section>
    </main>
  );
}
