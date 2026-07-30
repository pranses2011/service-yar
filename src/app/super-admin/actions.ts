"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import type { LicenseStatus, TenantStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminContext } from "@/lib/super-admin-context";

function cleanText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function toInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(String(value || ""));

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function generateLicenseKey(planCode: string) {
  const year = new Date().getFullYear();
  const part1 = randomBytes(3).toString("hex").toUpperCase();
  const part2 = randomBytes(3).toString("hex").toUpperCase();

  return `SERVICYAR-${planCode.toUpperCase()}-${year}-${part1}-${part2}`;
}

const validLicenseStatuses: LicenseStatus[] = [
  "UNUSED",
  "ACTIVE",
  "EXPIRED",
  "SUSPENDED",
  "CANCELLED"
];

const validTenantStatuses: TenantStatus[] = [
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED"
];

export async function createLicenseAction(formData: FormData) {
  const context = await requireSuperAdminContext();

  const planId = cleanText(formData.get("planId"));
  const customLicenseKey = cleanText(formData.get("licenseKey")).toUpperCase();
  const durationDays = toInt(formData.get("durationDays"), 365);
  const maxUsersRaw = cleanText(formData.get("maxUsers"));
  const maxTechniciansRaw = cleanText(formData.get("maxTechnicians"));
  const maxMonthlyRequestsRaw = cleanText(formData.get("maxMonthlyRequests"));

  if (!planId) {
    errorRedirect("/super-admin/licenses/new", "انتخاب پلن الزامی است.");
  }

  const plan = await prisma.plan.findUnique({
    where: {
      id: planId
    }
  });

  if (!plan) {
    errorRedirect("/super-admin/licenses/new", "پلن انتخاب‌شده معتبر نیست.");
  }

  const licenseKey = customLicenseKey || generateLicenseKey(plan.code);

  const existingLicense = await prisma.license.findUnique({
    where: {
      licenseKey
    }
  });

  if (existingLicense) {
    errorRedirect("/super-admin/licenses/new", "این کد لایسنس قبلاً ساخته شده است.");
  }

  const maxUsers = maxUsersRaw ? toInt(maxUsersRaw, plan.maxUsers) : plan.maxUsers;
  const maxTechnicians = maxTechniciansRaw
    ? toInt(maxTechniciansRaw, plan.maxTechnicians)
    : plan.maxTechnicians;

  const maxMonthlyRequests =
    maxMonthlyRequestsRaw === ""
      ? plan.maxMonthlyRequests
      : toInt(maxMonthlyRequestsRaw, plan.maxMonthlyRequests || 0);

  const license = await prisma.license.create({
    data: {
      licenseKey,
      status: "UNUSED",
      planId: plan.id,
      durationDays,
      maxUsers,
      maxTechnicians,
      maxMonthlyRequests
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: context.user.id,
      action: "super_admin.license.created",
      entityType: "License",
      entityId: license.id,
      metadata: {
        licenseKey,
        planCode: plan.code
      }
    }
  });

  redirect(`/super-admin/licenses?success=${encodeURIComponent("لایسنس جدید ساخته شد.")}`);
}

export async function updateLicenseStatusAction(formData: FormData) {
  const context = await requireSuperAdminContext();

  const licenseId = cleanText(formData.get("licenseId"));
  const statusRaw = cleanText(formData.get("status")) as LicenseStatus;

  if (!licenseId || !validLicenseStatuses.includes(statusRaw)) {
    errorRedirect("/super-admin/licenses", "وضعیت لایسنس معتبر نیست.");
  }

  const license = await prisma.license.findUnique({
    where: {
      id: licenseId
    }
  });

  if (!license) {
    errorRedirect("/super-admin/licenses", "لایسنس پیدا نشد.");
  }

  await prisma.license.update({
    where: {
      id: licenseId
    },
    data: {
      status: statusRaw
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: context.user.id,
      tenantId: license.tenantId,
      action: "super_admin.license.status_updated",
      entityType: "License",
      entityId: licenseId,
      metadata: {
        from: license.status,
        to: statusRaw
      }
    }
  });

  redirect(`/super-admin/licenses?success=${encodeURIComponent("وضعیت لایسنس به‌روزرسانی شد.")}`);
}

export async function updateTenantStatusAction(formData: FormData) {
  const context = await requireSuperAdminContext();

  const tenantId = cleanText(formData.get("tenantId"));
  const statusRaw = cleanText(formData.get("status")) as TenantStatus;

  if (!tenantId || !validTenantStatuses.includes(statusRaw)) {
    errorRedirect("/super-admin/tenants", "وضعیت کسب‌وکار معتبر نیست.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId
    }
  });

  if (!tenant) {
    errorRedirect("/super-admin/tenants", "کسب‌وکار پیدا نشد.");
  }

  await prisma.tenant.update({
    where: {
      id: tenantId
    },
    data: {
      status: statusRaw
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: context.user.id,
      tenantId,
      action: "super_admin.tenant.status_updated",
      entityType: "Tenant",
      entityId: tenantId,
      metadata: {
        from: tenant.status,
        to: statusRaw
      }
    }
  });

  redirect(`/super-admin/tenants/${tenantId}?success=${encodeURIComponent("وضعیت کسب‌وکار ذخیره شد.")}`);
}

export async function toggleTenantModuleAction(formData: FormData) {
  const context = await requireSuperAdminContext();

  const tenantId = cleanText(formData.get("tenantId"));
  const moduleId = cleanText(formData.get("moduleId"));
  const isEnabled = cleanText(formData.get("isEnabled")) === "true";

  if (!tenantId || !moduleId) {
    errorRedirect("/super-admin/tenants", "اطلاعات ماژول معتبر نیست.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId
    }
  });

  if (!tenant) {
    errorRedirect("/super-admin/tenants", "کسب‌وکار پیدا نشد.");
  }

  await prisma.tenantModule.upsert({
    where: {
      tenantId_moduleId: {
        tenantId,
        moduleId
      }
    },
    update: {
      isEnabled
    },
    create: {
      tenantId,
      moduleId,
      isEnabled
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: context.user.id,
      tenantId,
      action: "super_admin.tenant_module.toggled",
      entityType: "TenantModule",
      metadata: {
        moduleId,
        isEnabled
      }
    }
  });

  redirect(`/super-admin/tenants/${tenantId}?success=${encodeURIComponent("وضعیت ماژول ذخیره شد.")}`);
}
