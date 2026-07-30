"use server";

import { redirect } from "next/navigation";
import type {
  RequestPriority,
  ServiceRequestStatus
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requirePermission } from "@/lib/permissions";
import { requireTenantContext } from "@/lib/tenant-context";

function cleanText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function parseDateTimeLocal(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

async function generateTrackingCode(tenantId: string) {
  const year = new Date().getFullYear();
  const prefix = `SR-${year}`;

  const count = await prisma.serviceRequest.count({
    where: {
      tenantId,
      trackingCode: {
        startsWith: prefix
      }
    }
  });

  const number = String(count + 1).padStart(5, "0");

  return `${prefix}-${number}`;
}

const validStatuses: ServiceRequestStatus[] = [
  "NEW",
  "PENDING_CALL",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_PART",
  "COMPLETED",
  "CANCELLED"
];

const validPriorities: RequestPriority[] = ["NORMAL", "URGENT"];

export async function createServiceRequestAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "service_requests");
  requirePermission(context.role, "service_requests.create");

  const customerId = cleanText(formData.get("customerId"));
  const addressId = cleanText(formData.get("addressId"));
  const applianceId = cleanText(formData.get("applianceId"));
  const problemDescription = cleanText(formData.get("problemDescription"));
  const priorityRaw = cleanText(formData.get("priority")) as RequestPriority;
  const scheduledAtRaw = cleanText(formData.get("scheduledAt"));
  const internalNotes = cleanText(formData.get("internalNotes"));

  const priority: RequestPriority = validPriorities.includes(priorityRaw)
    ? priorityRaw
    : "NORMAL";

  if (!customerId || !addressId || !applianceId || !problemDescription) {
    errorRedirect(
      "/dashboard/service-requests/new",
      "مشتری، آدرس، دستگاه و شرح مشکل الزامی است."
    );
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenantId: context.tenantId
    }
  });

  if (!customer) {
    errorRedirect("/dashboard/service-requests/new", "مشتری انتخاب‌شده معتبر نیست.");
  }

  const address = await prisma.customerAddress.findFirst({
    where: {
      id: addressId,
      tenantId: context.tenantId,
      customerId
    }
  });

  if (!address) {
    errorRedirect("/dashboard/service-requests/new", "آدرس انتخاب‌شده معتبر نیست.");
  }

  const appliance = await prisma.appliance.findFirst({
    where: {
      id: applianceId,
      tenantId: context.tenantId,
      customerId
    }
  });

  if (!appliance) {
    errorRedirect("/dashboard/service-requests/new", "دستگاه انتخاب‌شده معتبر نیست.");
  }

  const trackingCode = await generateTrackingCode(context.tenantId);

  const request = await prisma.serviceRequest.create({
    data: {
      tenantId: context.tenantId,
      customerId,
      addressId,
      applianceId,
      createdByUserId: context.user.id,
      trackingCode,
      problemDescription,
      priority,
      scheduledAt: parseDateTimeLocal(scheduledAtRaw),
      internalNotes: internalNotes || null,
      status: "NEW"
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "service_request.created",
      entityType: "ServiceRequest",
      entityId: request.id,
      metadata: {
        trackingCode
      }
    }
  });

  redirect(`/dashboard/service-requests/${request.id}`);
}

export async function updateServiceRequestAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "service_requests");
  requirePermission(context.role, "service_requests.update");

  const requestId = cleanText(formData.get("requestId"));
  const problemDescription = cleanText(formData.get("problemDescription"));
  const priorityRaw = cleanText(formData.get("priority")) as RequestPriority;
  const scheduledAtRaw = cleanText(formData.get("scheduledAt"));
  const internalNotes = cleanText(formData.get("internalNotes"));

  const priority: RequestPriority = validPriorities.includes(priorityRaw)
    ? priorityRaw
    : "NORMAL";

  if (!requestId || !problemDescription) {
    errorRedirect(
      `/dashboard/service-requests/${requestId}`,
      "شناسه درخواست و شرح مشکل الزامی است."
    );
  }

  const request = await prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      tenantId: context.tenantId
    }
  });

  if (!request) {
    errorRedirect("/dashboard/service-requests", "درخواست تعمیر پیدا نشد.");
  }

  await prisma.serviceRequest.update({
    where: {
      id: requestId
    },
    data: {
      problemDescription,
      priority,
      scheduledAt: parseDateTimeLocal(scheduledAtRaw),
      internalNotes: internalNotes || null
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "service_request.updated",
      entityType: "ServiceRequest",
      entityId: requestId
    }
  });

  redirect(
    `/dashboard/service-requests/${requestId}?success=${encodeURIComponent(
      "اطلاعات درخواست ذخیره شد."
    )}`
  );
}

export async function updateServiceRequestStatusAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "service_requests");
  requirePermission(context.role, "service_requests.update");

  const requestId = cleanText(formData.get("requestId"));
  const statusRaw = cleanText(formData.get("status")) as ServiceRequestStatus;

  if (!requestId || !validStatuses.includes(statusRaw)) {
    errorRedirect(
      `/dashboard/service-requests/${requestId}`,
      "وضعیت انتخاب‌شده معتبر نیست."
    );
  }

  const request = await prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      tenantId: context.tenantId
    }
  });

  if (!request) {
    errorRedirect("/dashboard/service-requests", "درخواست تعمیر پیدا نشد.");
  }

  await prisma.serviceRequest.update({
    where: {
      id: requestId
    },
    data: {
      status: statusRaw
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "service_request.status_updated",
      entityType: "ServiceRequest",
      entityId: requestId,
      metadata: {
        from: request.status,
        to: statusRaw
      }
    }
  });

  redirect(
    `/dashboard/service-requests/${requestId}?success=${encodeURIComponent(
      "وضعیت درخواست تغییر کرد."
    )}`
  );
}

export async function assignTechnicianAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "service_requests");
  requirePermission(context.role, "service_requests.assign");

  const requestId = cleanText(formData.get("requestId"));
  const technicianUserId = cleanText(formData.get("technicianUserId"));

  if (!requestId) {
    errorRedirect("/dashboard/service-requests", "شناسه درخواست معتبر نیست.");
  }

  const request = await prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      tenantId: context.tenantId
    }
  });

  if (!request) {
    errorRedirect("/dashboard/service-requests", "درخواست تعمیر پیدا نشد.");
  }

  if (!technicianUserId) {
    await prisma.serviceRequest.update({
      where: {
        id: requestId
      },
      data: {
        assignedTechnicianUserId: null,
        status: "NEW"
      }
    });

    redirect(
      `/dashboard/service-requests/${requestId}?success=${encodeURIComponent(
        "ارجاع تکنسین حذف شد."
      )}`
    );
  }

  const technician = await prisma.tenantUser.findFirst({
    where: {
      tenantId: context.tenantId,
      userId: technicianUserId,
      role: "TECHNICIAN",
      isActive: true
    }
  });

  if (!technician) {
    errorRedirect(
      `/dashboard/service-requests/${requestId}`,
      "تکنسین انتخاب‌شده معتبر نیست."
    );
  }

  await prisma.serviceRequest.update({
    where: {
      id: requestId
    },
    data: {
      assignedTechnicianUserId: technicianUserId,
      status: request.status === "NEW" ? "ASSIGNED" : request.status
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "service_request.assigned",
      entityType: "ServiceRequest",
      entityId: requestId,
      metadata: {
        technicianUserId
      }
    }
  });

  redirect(
    `/dashboard/service-requests/${requestId}?success=${encodeURIComponent(
      "درخواست به تکنسین ارجاع شد."
    )}`
  );
}
