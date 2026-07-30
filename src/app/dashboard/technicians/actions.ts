"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requirePermission } from "@/lib/permissions";
import { requireTenantContext } from "@/lib/tenant-context";
import { getTenantActiveLicense } from "@/lib/license";

function cleanText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createTechnicianAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "technicians");
  requirePermission(context.role, "users.manage");

  const name = cleanText(formData.get("name"));
  const mobile = cleanText(formData.get("mobile"));
  const emailRaw = cleanText(formData.get("email"));
  const email = emailRaw || null;
  const password = cleanText(formData.get("password"));

  if (!name || !mobile || !password) {
    errorRedirect("/dashboard/technicians/new", "نام، شماره موبایل و رمز عبور تکنسین الزامی است.");
  }

  if (password.length < 8) {
    errorRedirect("/dashboard/technicians/new", "رمز عبور باید حداقل ۸ کاراکتر باشد.");
  }

  const activeLicense = await getTenantActiveLicense(context.tenantId);

  if (!activeLicense) {
    errorRedirect("/dashboard/technicians/new", "اشتراک فعال پیدا نشد.");
  }

  const currentTechniciansCount = await prisma.tenantUser.count({
    where: {
      tenantId: context.tenantId,
      role: "TECHNICIAN",
      isActive: true
    }
  });

  if (currentTechniciansCount >= activeLicense.maxTechnicians) {
    errorRedirect(
      "/dashboard/technicians/new",
      `سقف تعداد تکنسین در پلن فعلی شما ${activeLicense.maxTechnicians} نفر است.`
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user = await prisma.user.findUnique({
    where: {
      mobile
    }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        mobile,
        email,
        passwordHash,
        globalRole: "USER",
        isActive: true
      }
    });
  } else {
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        name,
        email,
        isActive: true
      }
    });
  }

  const existingMembership = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId: context.tenantId,
        userId: user.id
      }
    }
  });

  if (existingMembership) {
    if (existingMembership.role === "TECHNICIAN") {
      errorRedirect("/dashboard/technicians/new", "این تکنسین قبلاً برای این کسب‌وکار ثبت شده است.");
    }

    errorRedirect(
      "/dashboard/technicians/new",
      "این کاربر قبلاً با نقش دیگری در کسب‌وکار شما عضو شده است."
    );
  }

  await prisma.tenantUser.create({
    data: {
      tenantId: context.tenantId,
      userId: user.id,
      role: "TECHNICIAN",
      isActive: true
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "technician.created",
      entityType: "User",
      entityId: user.id,
      metadata: {
        mobile
      }
    }
  });

  redirect(`/dashboard/technicians/${user.id}`);
}

export async function updateTechnicianStatusAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "technicians");
  requirePermission(context.role, "users.manage");

  const technicianUserId = cleanText(formData.get("technicianUserId"));
  const nextStatus = cleanText(formData.get("isActive"));

  if (!technicianUserId) {
    errorRedirect("/dashboard/technicians", "شناسه تکنسین معتبر نیست.");
  }

  const membership = await prisma.tenantUser.findFirst({
    where: {
      tenantId: context.tenantId,
      userId: technicianUserId,
      role: "TECHNICIAN"
    }
  });

  if (!membership) {
    errorRedirect("/dashboard/technicians", "تکنسین پیدا نشد.");
  }

  await prisma.tenantUser.update({
    where: {
      id: membership.id
    },
    data: {
      isActive: nextStatus === "true"
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "technician.status_updated",
      entityType: "User",
      entityId: technicianUserId,
      metadata: {
        isActive: nextStatus === "true"
      }
    }
  });

  redirect(
    `/dashboard/technicians/${technicianUserId}?success=${encodeURIComponent(
      "وضعیت تکنسین به‌روزرسانی شد."
    )}`
  );
}
