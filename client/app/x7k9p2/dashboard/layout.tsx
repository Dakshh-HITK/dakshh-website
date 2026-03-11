import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { getAdminBasePath } from "@/lib/admin-config";
import AdminDashboardNav from "./AdminDashboardNav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect(`/${getAdminBasePath()}`);
  }

  return (
    <div className="w-full min-h-screen relative overflow-x-hidden" data-main-content>
      <AdminDashboardNav session={session} />
      {children}
    </div>
  );
}
