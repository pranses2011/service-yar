import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function activateLicense(params: {
  tenantId: string;
  licenseKey: string;
}) {
  const { tenantId, licenseKey } = params;

  const license = await prisma.license.findUnique({
    where: { licenseKey },
    include: {
      plan: {
        include: {
          planModules: {
            include: {
              module: true
            }
          }
        }
      }
    }
  });

  if (!license) {
    throw new Error("کد فعال‌سازی معتبر نیست.");
  }

  if (license.status !== "UNUSED") {
    throw new Error("این کد قبلاً استفاده شده یا قابل فعال‌سازی نیست.");
  }

  const now = new Date();
  const expiresAt = addDays(now, license.durationDays);

  await prisma.$transaction(async (tx) => {
    await tx.license.update({
      where: { id: license.id },
      data: {
        tenantId,
        status: "ACTIVE",
        startsAt: now,
        expiresAt,
        activatedAt: now
      }
    });

    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        status: "ACTIVE"
      }
    });

    for (const planModule of license.plan.planModules) {
      await tx.tenantModule.upsert({
        where: {
          tenantId_moduleId: {
            tenantId,
            moduleId: planModule.moduleId
          }
        },
        update: {
          isEnabled: true
        },
        create: {
          tenantId,
          moduleId: planModule.moduleId,
          isEnabled: true
        }
      });
    }
  });

  return {
    success: true,
    expiresAt,
    plan: license.plan.nameFa
  };
}

export async function getTenantActiveLicense(tenantId: string) {
  return prisma.license.findFirst({
    where: {
      tenantId,
      status: "ACTIVE",
      OR: [
        {
          expiresAt: null
        },
        {
          expiresAt: {
            gt: new Date()
          }
        }
      ]
    },
    include: {
      plan: true
    },
    orderBy: {
      activatedAt: "desc"
    }
  });
}

export async function ensureTenantLicenseIsActive(tenantId: string) {
  const license = await getTenantActiveLicense(tenantId);

  if (!license) {
    throw new Error("اشتراک این کسب‌وکار فعال نیست یا منقضی شده است.");
  }

  return license;
}
