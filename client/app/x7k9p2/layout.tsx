import type { Metadata } from "next";
import { getAdminBasePath } from "@/lib/admin-config";
import AdminPWAProvider from "./AdminPWAProvider";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
  manifest: `/${getAdminBasePath()}/manifest`,
};

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const basePath = getAdminBasePath();
  return (
    <>
      <AdminPWAProvider basePath={basePath} />
      {children}
    </>
  );
}
