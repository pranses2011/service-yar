import { redirect } from "next/navigation";
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

/**
 * اگر ماژول فعال نباشد، به جای throw خام، کاربر را به صفحه راهنما منتقل می‌کنیم.
 * این کار مخصوص پنل‌های Next.js است تا روی Netlify خطای 500 دیده نشود.
 */
export async function requireModule(tenantId: string, moduleCode: string) {
  const activeModules = await getTenantActiveModules(tenantId);

  if (!hasModule(activeModules, moduleCode)) {
    redirect(`/dashboard/module-unavailable?module=${encodeURIComponent(moduleCode)}`);
  }

  return true;
}
