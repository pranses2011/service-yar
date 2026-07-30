import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";

export async function requireTenantContext() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!session.tenant || !session.membership) {
    redirect("/super-admin");
  }

  return {
    user: session.user,
    tenant: session.tenant,
    membership: session.membership,
    tenantId: session.tenant.id,
    role: session.membership.role
  };
}
