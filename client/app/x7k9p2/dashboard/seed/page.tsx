import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { getAdminBasePath } from "@/lib/admin-config";
import { DotOrbit } from "@paper-design/shaders-react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import AdminSeedClient from "./AdminSeedClient";

export default async function AdminSeedPage() {
  const session = await getAdminSession();
  const basePath = getAdminBasePath();
  if (!session) redirect(`/${basePath}`);

  const isMaster = session.isMaster || session.role === "master";
  if (!isMaster) redirect(`/${basePath}/dashboard`);

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
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0">
          <HandDrawnCard className="p-4 sm:p-6 md:p-8">
            <h1 className="hand-drawn-title text-white text-2xl sm:text-3xl mb-2">
              Seed Controls
            </h1>
            <p className="text-cyan text-sm">
              Ensure Super Admin role for main app user. Master key only.
            </p>
          </HandDrawnCard>
          <AdminSeedClient />
        </div>
      </div>
    </>
  );
}
