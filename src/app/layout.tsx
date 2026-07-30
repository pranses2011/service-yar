import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سرویسیار | سامانه مدیریت خدمات پس از فروش",
  description: "وب اپلیکیشن فارسی و ماژولار برای مدیریت تعمیرات و خدمات پس از فروش لوازم خانگی"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
