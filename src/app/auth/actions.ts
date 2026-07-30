"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { activateLicense } from "@/lib/license";

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function createTenantSlug(name: string) {
  const random = Math.random().toString(36).substring(2, 8);
  const cleaned = name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-_]/g, "");

  return `${cleaned || "tenant"}-${random}`.toLowerCase();
}

async function setAuthCookies(params: {
  userId: string;
  tenantId?: string;
}) {
  const cookieStore = await cookies();

  cookieStore.set("servicyar_user_id", params.userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  if (params.tenantId) {
    cookieStore.set("servicyar_tenant_id", params.tenantId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }
}

export async function loginAction(formData: FormData) {
  const identifier = String(formData.get("identifier") || "").trim();
  const password = String(formData.get("password") || "");

  if (!identifier || !password) {
    errorRedirect("/auth/login", "شماره موبایل/ایمیل و رمز عبور الزامی است.");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { mobile: identifier },
        { email: identifier }
      ],
      isActive: true
    },
    include: {
      tenantMemberships: {
        where: {
          isActive: true
        },
        include: {
          tenant: true
        },
        take: 1
      }
    }
  });

  if (!user) {
    errorRedirect("/auth/login", "کاربری با این مشخصات پیدا نشد.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    errorRedirect("/auth/login", "رمز عبور اشتباه است.");
  }

  const membership = user.tenantMemberships[0];

  if (!membership && user.globalRole === "SUPER_ADMIN") {
    await setAuthCookies({
      userId: user.id
    });

    redirect("/super-admin");
  }

  if (!membership) {
    errorRedirect("/auth/login", "برای این کاربر کسب‌وکاری تعریف نشده است.");
  }

  await setAuthCookies({
    userId: user.id,
    tenantId: membership.tenantId
  });

  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const mobile = String(formData.get("mobile") || "").trim();
  const emailRaw = String(formData.get("email") || "").trim();
  const email = emailRaw || null;
  const password = String(formData.get("password") || "");
  const businessName = String(formData.get("businessName") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const licenseKey = String(formData.get("licenseKey") || "").trim().toUpperCase();

  if (!name || !mobile || !password || !businessName || !licenseKey) {
    errorRedirect("/auth/register", "نام، موبایل، رمز، نام کسب‌وکار و کد فعال‌سازی الزامی است.");
  }

  if (password.length < 8) {
    errorRedirect("/auth/register", "رمز عبور باید حداقل ۸ کاراکتر باشد.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { mobile }
  });

  if (existingUser) {
    errorRedirect("/auth/register", "این شماره موبایل قبلاً ثبت شده است.");
  }

  const license = await prisma.license.findUnique({
    where: { licenseKey },
    include: {
      plan: {
        include: {
          planModules: true
        }
      }
    }
  });

  if (!license) {
    errorRedirect("/auth/register", "کد فعال‌سازی معتبر نیست.");
  }

  if (license.status !== "UNUSED") {
    errorRedirect("/auth/register", "این کد قبلاً استفاده شده یا قابل فعال‌سازی نیست.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const expiresAt = addDays(now, license.durationDays);

  let createdUserId = "";
  let createdTenantId = "";

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        mobile,
        email,
        passwordHash,
        globalRole: "USER",
        isActive: true
      }
    });

    const tenant = await tx.tenant.create({
      data: {
        name: businessName,
        slug: createTenantSlug(businessName),
        ownerUserId: user.id,
        mobile,
        city: city || null,
        status: "ACTIVE"
      }
    });

    await tx.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: "OWNER",
        isActive: true
      }
    });

    await tx.license.update({
      where: { id: license.id },
      data: {
        tenantId: tenant.id,
        status: "ACTIVE",
        startsAt: now,
        expiresAt,
        activatedAt: now
      }
    });

    for (const planModule of license.plan.planModules) {
      await tx.tenantModule.create({
        data: {
          tenantId: tenant.id,
          moduleId: planModule.moduleId,
          isEnabled: true
        }
      });
    }

    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: "tenant.registered",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: {
          planId: license.planId,
          licenseKey: license.licenseKey
        }
      }
    });

    createdUserId = user.id;
    createdTenantId = tenant.id;
  });

  await setAuthCookies({
    userId: createdUserId,
    tenantId: createdTenantId
  });

  redirect("/dashboard");
}

export async function activateExistingTenantLicenseAction(formData: FormData) {
  const licenseKey = String(formData.get("licenseKey") || "").trim().toUpperCase();
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("servicyar_tenant_id")?.value;

  if (!tenantId) {
    errorRedirect("/auth/login", "ابتدا وارد حساب کاربری شوید.");
  }

  if (!licenseKey) {
    errorRedirect("/auth/activate", "کد فعال‌سازی را وارد کنید.");
  }

  try {
    await activateLicense({
      tenantId,
      licenseKey
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در فعال‌سازی لایسنس.";
    errorRedirect("/auth/activate", message);
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.delete("servicyar_user_id");
  cookieStore.delete("servicyar_tenant_id");

  redirect("/auth/login");
}
