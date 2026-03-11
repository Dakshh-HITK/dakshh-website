import { DotOrbit } from "@paper-design/shaders-react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import AdminDashboardClient from "./AdminDashboardClient";
import { getAdminSession } from "@/lib/admin-session";

export default async function AdminDashboardHomePage() {
  const session = await getAdminSession();

  return (
    <>
      <div className="fixed inset-0 w-full h-full z-0">
        <DotOrbit
          width="100%"
          height="100%"
          colors={["#ffffff", "#006aff", "#fff675"]}
          colorBack="#000000"
          stepsPerColor={4}
          size={0.2}
          sizeRange={0.5}
          spreading={1}
          speed={0.5}
          scale={0.35}
        />
      </div>
      <div className="relative z-10 min-h-screen pt-16 sm:pt-20 md:pt-24 px-3 sm:px-4 md:px-6 pb-6 sm:pb-10">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0">
          <HandDrawnCard className="p-4 sm:p-6 md:p-8">
            <h1 className="hand-drawn-title admin-dashboard-title text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-cyan text-sm">
              Welcome, {session?.email ?? "Admin"}.
              {session?.isMaster && " You have full master access."}
            </p>
          </HandDrawnCard>
          <AdminDashboardClient />
        </div>
      </div>
    </>
  );
}
