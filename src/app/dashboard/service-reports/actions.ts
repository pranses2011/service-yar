"use server";

import { redirect } from "next/navigation";
import type { ServiceRequestStatus } from "@prisma/client";
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

const allowedNextStatuses: ServiceRequestStatus[] = [
  "IN_PROGRESS",
  "WAITING_FOR_PART",
  "COMPLETED"
];

export async function createServiceReportAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "service_reports");
  requirePermission(context.role, "service_reports.create");

  const requestId = cleanText(formData.get("requestId"));
  const diagnosis = cleanText(formData.get("diagnosis"));
  const workDone = cleanText(formData.get("workDone"));
  const partsUsedText = cleanText(formData.get("partsUsedText"));
  const recommendations = cleanText(formData.get("recommendations"));
  const nextStatusRaw = cleanText(formData.get("nextStatus")) as ServiceRequestStatus;

  if (!requestId || !diagnosis || !workDone) {
    errorRedirect(
      `/dashboard/service-requests/${requestId}/report`,
      "ایراد تشخیص داده‌شده و شرح کار انجام‌شده الزامی است."
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

  if (
    context.role === "TECHNICIAN" &&
    request.assignedTechnicianUserId !== context.user.id
  ) {
    errorRedirect(
      "/dashboard/service-requests",
      "شما فقط برای درخواست‌های ارجاع‌شده به خودتان می‌توانید گزارش ثبت کنید."
    );
  }

  const nextStatus = allowedNextStatuses.includes(nextStatusRaw)
    ? nextStatusRaw
    : request.status;

  const report = await prisma.serviceReport.create({
    data: {
      tenantId: context.tenantId,
      serviceRequestId: request.id,
      technicianUserId:
        context.role === "TECHNICIAN"
          ? context.user.id
          : request.assignedTechnicianUserId || context.user.id,
      diagnosis,
      workDone,
      partsUsedText: partsUsedText || null,
      recommendations: recommendations || null
    }
  });

  await prisma.serviceRequest.update({
    where: {
      id: request.id
    },
    data: {
      status: nextStatus
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "service_report.created",
      entityType: "ServiceReport",
      entityId: report.id,
      metadata: {
        serviceRequestId: request.id,
        nextStatus
      }
    }
  });

  redirect(
    `/dashboard/service-requests/${request.id}?success=${encodeURIComponent(
      "گزارش تعمیر ثبت شد."
    )}`
  );
}
