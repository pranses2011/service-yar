import type { TenantRole } from "@prisma/client";

type Permission =
  | "customers.read"
  | "customers.create"
  | "customers.update"
  | "customers.delete"
  | "service_requests.read"
  | "service_requests.create"
  | "service_requests.update"
  | "service_requests.assign"
  | "service_requests.read_assigned"
  | "service_reports.create"
  | "invoices.read"
  | "invoices.create"
  | "invoices.update_payment"
  | "users.manage"
  | "settings.manage"
  | "*";

const permissionsByRole: Record<TenantRole, Permission[]> = {
  OWNER: ["*"],
  ADMIN: [
    "customers.read",
    "customers.create",
    "customers.update",
    "service_requests.read",
    "service_requests.create",
    "service_requests.update",
    "service_requests.assign",
    "service_reports.create",
    "invoices.read",
    "invoices.create",
    "invoices.update_payment",
    "users.manage",
    "settings.manage"
  ],
  OPERATOR: [
    "customers.read",
    "customers.create",
    "customers.update",
    "service_requests.read",
    "service_requests.create"
  ],
  TECHNICIAN: [
    "service_requests.read_assigned",
    "service_requests.update",
    "service_reports.create"
  ],
  ACCOUNTANT: [
    "customers.read",
    "service_requests.read",
    "invoices.read",
    "invoices.create",
    "invoices.update_payment"
  ]
};

export function can(role: TenantRole, permission: Permission) {
  const permissions = permissionsByRole[role];
  return permissions.includes("*") || permissions.includes(permission);
}

export function requirePermission(role: TenantRole, permission: Permission) {
  if (!can(role, permission)) {
    throw new Error("شما دسترسی لازم برای انجام این عملیات را ندارید.");
  }

  return true;
}
