import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getCurrentSession() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("servicyar_user_id")?.value;
  const tenantId = cookieStore.get("servicyar_tenant_id")?.value;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user || !user.isActive) {
    return null;
  }

  const membership = tenantId
    ? await prisma.tenantUser.findFirst({
        where: {
          userId,
          tenantId,
          isActive: true
        },
        include: {
          tenant: true
        }
      })
    : null;

  return {
    user,
    tenantId,
    membership,
    tenant: membership?.tenant || null
  };
}
