"use server";

import { redirect } from "next/navigation";
import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules";
import { requirePermission } from "@/lib/permissions";
import { requireTenantContext } from "@/lib/tenant-context";

function cleanText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function toMoney(value: FormDataEntryValue | null) {
  const raw = String(value || "0")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const number = Number(raw);

  if (Number.isNaN(number) || number < 0) {
    return 0;
  }

  return number;
}

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function generateInvoiceNumber(tenantId: string) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}`;

  const count = await prisma.invoice.count({
    where: {
      tenantId,
      invoiceNumber: {
        startsWith: prefix
      }
    }
  });

  const number = String(count + 1).padStart(5, "0");

  return `${prefix}-${number}`;
}

const validPaymentStatuses: PaymentStatus[] = ["UNPAID", "PAID", "PARTIAL"];

export async function createInvoiceAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "invoices");
  requirePermission(context.role, "invoices.create");

  const requestId = cleanText(formData.get("requestId"));
  const discount = toMoney(formData.get("discount"));
  const tax = toMoney(formData.get("tax"));
  const paymentStatusRaw = cleanText(formData.get("paymentStatus")) as PaymentStatus;

  const paymentStatus: PaymentStatus = validPaymentStatuses.includes(paymentStatusRaw)
    ? paymentStatusRaw
    : "UNPAID";

  if (!requestId) {
    errorRedirect("/dashboard/service-requests", "شناسه درخواست معتبر نیست.");
  }

  const request = await prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      tenantId: context.tenantId
    },
    include: {
      invoice: true,
      customer: true
    }
  });

  if (!request) {
    errorRedirect("/dashboard/service-requests", "درخواست تعمیر پیدا نشد.");
  }

  if (request.invoice) {
    errorRedirect(
      `/dashboard/service-requests/${requestId}`,
      "برای این درخواست قبلاً فاکتور صادر شده است."
    );
  }

  const titles = formData.getAll("itemTitle").map((item) => String(item || "").trim());
  const quantities = formData.getAll("itemQuantity");
  const unitPrices = formData.getAll("itemUnitPrice");

  const items = titles
    .map((title, index) => {
      const quantityRaw = Number(String(quantities[index] || "1"));
      const quantity = Number.isNaN(quantityRaw) || quantityRaw <= 0 ? 1 : quantityRaw;
      const unitPrice = toMoney(unitPrices[index] || "0");
      const total = quantity * unitPrice;

      return {
        title,
        quantity,
        unitPrice,
        total
      };
    })
    .filter((item) => item.title && item.total > 0);

  if (items.length === 0) {
    errorRedirect(
      `/dashboard/service-requests/${requestId}/invoice`,
      "حداقل یک آیتم معتبر برای فاکتور وارد کنید."
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(subtotal - discount + tax, 0);
  const invoiceNumber = await generateInvoiceNumber(context.tenantId);

  const invoice = await prisma.$transaction(async (tx) => {
    const createdInvoice = await tx.invoice.create({
      data: {
        tenantId: context.tenantId,
        serviceRequestId: request.id,
        customerId: request.customerId,
        invoiceNumber,
        subtotal,
        discount,
        tax,
        total,
        paymentStatus
      }
    });

    for (const item of items) {
      await tx.invoiceItem.create({
        data: {
          tenantId: context.tenantId,
          invoiceId: createdInvoice.id,
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        }
      });
    }

    await tx.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.user.id,
        action: "invoice.created",
        entityType: "Invoice",
        entityId: createdInvoice.id,
        metadata: {
          invoiceNumber,
          serviceRequestId: request.id,
          total
        }
      }
    });

    return createdInvoice;
  });

  redirect(`/dashboard/invoices/${invoice.id}`);
}

export async function updateInvoicePaymentStatusAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "invoices");
  requirePermission(context.role, "invoices.update_payment");

  const invoiceId = cleanText(formData.get("invoiceId"));
  const paymentStatusRaw = cleanText(formData.get("paymentStatus")) as PaymentStatus;

  if (!invoiceId || !validPaymentStatuses.includes(paymentStatusRaw)) {
    errorRedirect("/dashboard/invoices", "اطلاعات وضعیت پرداخت معتبر نیست.");
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId: context.tenantId
    }
  });

  if (!invoice) {
    errorRedirect("/dashboard/invoices", "فاکتور پیدا نشد.");
  }

  await prisma.invoice.update({
    where: {
      id: invoiceId
    },
    data: {
      paymentStatus: paymentStatusRaw
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "invoice.payment_status_updated",
      entityType: "Invoice",
      entityId: invoiceId,
      metadata: {
        from: invoice.paymentStatus,
        to: paymentStatusRaw
      }
    }
  });

  redirect(
    `/dashboard/invoices/${invoiceId}?success=${encodeURIComponent(
      "وضعیت پرداخت فاکتور ذخیره شد."
    )}`
  );
}
