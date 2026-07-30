import { activateExistingTenantLicenseAction } from "@/app/auth/actions";

export default async function ActivatePage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <span className="badge">فعال‌سازی</span>
          <h1>فعال‌سازی یا تمدید اشتراک</h1>
          <p className="muted">
            کد فعال‌سازی جدید را وارد کنید تا ماژول‌ها و اعتبار اشتراک به‌روزرسانی شود.
          </p>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <form action={activateExistingTenantLicenseAction} className="form">
          <label>
            کد فعال‌سازی
            <input
              name="licenseKey"
              type="text"
              placeholder="SERVICYAR-PRO-001-DEMO"
              required
            />
          </label>

          <button className="button full" type="submit">
            فعال‌سازی
          </button>
        </form>
      </section>
    </main>
  );
}
