import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const modules = [
  ["dashboard", "داشبورد", "نمایش آمار کلی"],
  ["customers", "مشتریان", "مدیریت مشتریان"],
  ["appliances", "دستگاه‌ها", "مدیریت دستگاه‌های مشتریان"],
  ["service_requests", "درخواست‌های تعمیر", "ثبت و پیگیری درخواست تعمیر"],
  ["technicians", "تکنسین‌ها", "مدیریت تکنسین‌ها"],
  ["service_reports", "گزارش تعمیر", "ثبت گزارش تعمیر"],
  ["invoices", "فاکتورها", "صدور و مدیریت فاکتور"],
  ["licenses", "لایسنس و اشتراک", "مدیریت فعال‌سازی"],
  ["sms", "پیامک", "ارسال پیامک اطلاع‌رسانی"],
  ["inventory", "انبار قطعات", "مدیریت قطعات"],
  ["warranty", "گارانتی", "مدیریت گارانتی خدمات"],
  ["customer_portal", "پنل مشتری", "پیگیری وضعیت توسط مشتری"],
  ["ai_assistant", "دستیار هوشمند", "کمک هوشمند به تعمیرکار"]
] as const;

const plans = [
  {
    code: "basic",
    nameFa: "پایه",
    description: "مناسب تعمیرکار مستقل",
    priceMonthly: "490000",
    priceYearly: "4900000",
    maxUsers: 1,
    maxTechnicians: 1,
    maxMonthlyRequests: 100,
    moduleCodes: [
      "dashboard",
      "customers",
      "appliances",
      "service_requests",
      "service_reports",
      "invoices",
      "licenses"
    ]
  },
  {
    code: "pro",
    nameFa: "حرفه‌ای",
    description: "مناسب تیم‌های کوچک خدماتی",
    priceMonthly: "990000",
    priceYearly: "9900000",
    maxUsers: 5,
    maxTechnicians: 5,
    maxMonthlyRequests: 1000,
    moduleCodes: [
      "dashboard",
      "customers",
      "appliances",
      "service_requests",
      "technicians",
      "service_reports",
      "invoices",
      "licenses"
    ]
  },
  {
    code: "enterprise",
    nameFa: "سازمانی",
    description: "مناسب شرکت‌ها و نمایندگی‌ها",
    priceMonthly: "2900000",
    priceYearly: "29000000",
    maxUsers: 20,
    maxTechnicians: 20,
    maxMonthlyRequests: null,
    moduleCodes: [
      "dashboard",
      "customers",
      "appliances",
      "service_requests",
      "technicians",
      "service_reports",
      "invoices",
      "licenses",
      "sms",
      "inventory",
      "warranty",
      "customer_portal",
      "ai_assistant"
    ]
  }
];

async function main() {
  console.log("شروع Seed دیتابیس سرویسیار...");

  for (const [code, nameFa, description] of modules) {
    await prisma.module.upsert({
      where: { code },
      update: { nameFa, description, isActive: true },
      create: { code, nameFa, description, isActive: true }
    });
  }

  for (const item of plans) {
    await prisma.plan.upsert({
      where: { code: item.code },
      update: {
        nameFa: item.nameFa,
        description: item.description,
        priceMonthly: item.priceMonthly,
        priceYearly: item.priceYearly,
        maxUsers: item.maxUsers,
        maxTechnicians: item.maxTechnicians,
        maxMonthlyRequests: item.maxMonthlyRequests,
        isActive: true
      },
      create: {
        code: item.code,
        nameFa: item.nameFa,
        description: item.description,
        priceMonthly: item.priceMonthly,
        priceYearly: item.priceYearly,
        maxUsers: item.maxUsers,
        maxTechnicians: item.maxTechnicians,
        maxMonthlyRequests: item.maxMonthlyRequests,
        isActive: true
      }
    });
  }

  for (const planItem of plans) {
    const plan = await prisma.plan.findUniqueOrThrow({
      where: { code: planItem.code }
    });

    for (const moduleCode of planItem.moduleCodes) {
      const module = await prisma.module.findUniqueOrThrow({
        where: { code: moduleCode }
      });

      await prisma.planModule.upsert({
        where: {
          planId_moduleId: {
            planId: plan.id,
            moduleId: module.id
          }
        },
        update: {},
        create: {
          planId: plan.id,
          moduleId: module.id
        }
      });
    }
  }

  const adminName = process.env.SEED_ADMIN_NAME || "مدیر کل سرویسیار";
  const adminMobile = process.env.SEED_ADMIN_MOBILE || "09120000000";
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@servicyar.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { mobile: adminMobile },
    update: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      globalRole: "SUPER_ADMIN",
      isActive: true
    },
    create: {
      name: adminName,
      mobile: adminMobile,
      email: adminEmail,
      passwordHash,
      globalRole: "SUPER_ADMIN",
      isActive: true
    }
  });

  for (const planItem of plans) {
    const plan = await prisma.plan.findUniqueOrThrow({
      where: { code: planItem.code }
    });

    for (let i = 1; i <= 3; i++) {
      const licenseKey = `SERVICYAR-${planItem.code.toUpperCase()}-${String(i).padStart(3, "0")}-DEMO`;

      await prisma.license.upsert({
        where: { licenseKey },
        update: {},
        create: {
          licenseKey,
          status: "UNUSED",
          planId: plan.id,
          durationDays: 365,
          maxUsers: plan.maxUsers,
          maxTechnicians: plan.maxTechnicians,
          maxMonthlyRequests: plan.maxMonthlyRequests
        }
      });
    }
  }

  console.log("Seed با موفقیت انجام شد.");
}

main()
  .catch((error) => {
    console.error("خطا در Seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
