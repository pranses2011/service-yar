import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";

export async function requireSuperAdminContext() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.globalRole !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return {
    user: session.user
  };
}
