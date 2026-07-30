import { prisma } from "@/lib/prisma";

export async function getTenantActiveModules(tenantId: string) {
  const tenantModules = await prisma.tenantModule.findMany({
    where: {
      tenantId,
      isEnabled: true,
      module: {
        isActive: true
      }
    },
    include: {
      module: true
    }
  });

  return tenantModules.map((item) => item.module.code);
}

export function hasModule(activeModules: string[], moduleCode: string) {
  return activeModules.includes(moduleCode);
}

export async function requireModule(tenantId: string, moduleCode: string) {
  const activeModules = await getTenantActiveModules(tenantId);

  if (!hasModule(activeModules, moduleCode)) {
    throw new Error(`ماژول ${moduleCode} برای این کسب‌وکار فعال نیست.`);
  }

  return true;
}
