"use server";

import { redirect } from "next/navigation";
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

export async function createCustomerAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "customers");
  requirePermission(context.role, "customers.create");

  const firstName = cleanText(formData.get("firstName"));
  const lastName = cleanText(formData.get("lastName"));
  const mobile = cleanText(formData.get("mobile"));
  const phone = cleanText(formData.get("phone"));
  const notes = cleanText(formData.get("notes"));

  if (!firstName || !mobile) {
    errorRedirect("/dashboard/customers/new", "نام و شماره موبایل مشتری الزامی است.");
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: {
      tenantId_mobile: {
        tenantId: context.tenantId,
        mobile
      }
    }
  });

  if (existingCustomer) {
    errorRedirect("/dashboard/customers/new", "مشتری با این شماره موبایل قبلاً ثبت شده است.");
  }

  const customer = await prisma.customer.create({
    data: {
      tenantId: context.tenantId,
      firstName,
      lastName: lastName || null,
      mobile,
      phone: phone || null,
      notes: notes || null
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "customer.created",
      entityType: "Customer",
      entityId: customer.id,
      metadata: {
        mobile
      }
    }
  });

  redirect(`/dashboard/customers/${customer.id}`);
}

export async function updateCustomerAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "customers");
  requirePermission(context.role, "customers.update");

  const customerId = cleanText(formData.get("customerId"));
  const firstName = cleanText(formData.get("firstName"));
  const lastName = cleanText(formData.get("lastName"));
  const mobile = cleanText(formData.get("mobile"));
  const phone = cleanText(formData.get("phone"));
  const notes = cleanText(formData.get("notes"));

  if (!customerId) {
    errorRedirect("/dashboard/customers", "شناسه مشتری معتبر نیست.");
  }

  if (!firstName || !mobile) {
    errorRedirect(`/dashboard/customers/${customerId}`, "نام و شماره موبایل مشتری الزامی است.");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenantId: context.tenantId
    }
  });

  if (!customer) {
    errorRedirect("/dashboard/customers", "مشتری پیدا نشد.");
  }

  const duplicateMobile = await prisma.customer.findFirst({
    where: {
      tenantId: context.tenantId,
      mobile,
      id: {
        not: customerId
      }
    }
  });

  if (duplicateMobile) {
    errorRedirect(`/dashboard/customers/${customerId}`, "این شماره موبایل برای مشتری دیگری ثبت شده است.");
  }

  await prisma.customer.update({
    where: {
      id: customerId
    },
    data: {
      firstName,
      lastName: lastName || null,
      mobile,
      phone: phone || null,
      notes: notes || null
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "customer.updated",
      entityType: "Customer",
      entityId: customerId
    }
  });

  redirect(`/dashboard/customers/${customerId}?success=${encodeURIComponent("اطلاعات مشتری ذخیره شد.")}`);
}

export async function createCustomerAddressAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "customers");
  requirePermission(context.role, "customers.update");

  const customerId = cleanText(formData.get("customerId"));
  const city = cleanText(formData.get("city"));
  const address = cleanText(formData.get("address"));
  const postalCode = cleanText(formData.get("postalCode"));
  const plate = cleanText(formData.get("plate"));
  const unit = cleanText(formData.get("unit"));
  const description = cleanText(formData.get("description"));

  if (!customerId || !city || !address) {
    errorRedirect(`/dashboard/customers/${customerId}`, "شهر و آدرس کامل الزامی است.");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenantId: context.tenantId
    }
  });

  if (!customer) {
    errorRedirect("/dashboard/customers", "مشتری پیدا نشد.");
  }

  const createdAddress = await prisma.customerAddress.create({
    data: {
      tenantId: context.tenantId,
      customerId,
      city,
      address,
      postalCode: postalCode || null,
      plate: plate || null,
      unit: unit || null,
      description: description || null
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "customer_address.created",
      entityType: "CustomerAddress",
      entityId: createdAddress.id
    }
  });

  redirect(`/dashboard/customers/${customerId}?success=${encodeURIComponent("آدرس مشتری ثبت شد.")}`);
}

export async function createApplianceAction(formData: FormData) {
  const context = await requireTenantContext();

  await requireModule(context.tenantId, "appliances");
  requirePermission(context.role, "customers.update");

  const customerId = cleanText(formData.get("customerId"));
  const type = cleanText(formData.get("type"));
  const brand = cleanText(formData.get("brand"));
  const model = cleanText(formData.get("model"));
  const serialNumber = cleanText(formData.get("serialNumber"));
  const notes = cleanText(formData.get("notes"));

  if (!customerId || !type) {
    errorRedirect(`/dashboard/customers/${customerId}`, "نوع دستگاه الزامی است.");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenantId: context.tenantId
    }
  });

  if (!customer) {
    errorRedirect("/dashboard/customers", "مشتری پیدا نشد.");
  }

  const appliance = await prisma.appliance.create({
    data: {
      tenantId: context.tenantId,
      customerId,
      type,
      brand: brand || null,
      model: model || null,
      serialNumber: serialNumber || null,
      notes: notes || null
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.user.id,
      action: "appliance.created",
      entityType: "Appliance",
      entityId: appliance.id
    }
  });

  redirect(`/dashboard/customers/${customerId}?success=${encodeURIComponent("دستگاه مشتری ثبت شد.")}`);
}
