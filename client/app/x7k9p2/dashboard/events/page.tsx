import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { getAdminBasePath } from "@/lib/admin-config";
import { DotOrbit } from "@paper-design/shaders-react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import AdminEventsClient from "./AdminEventsClient";

function canAccessEvents(
  session: { role: string; permissions: string[]; isMaster?: boolean } | null
): boolean {
  if (!session) return false;
  if (session.isMaster || session.role === "master") return true;
  if (session.role === "admin") return true;
  if (session.role === "camsguy") return true;
  if (session.role === "imposter")
    return session.permissions.includes("events");
  return false;
}

export default async function AdminEventsPage() {
  const session = await getAdminSession();
  const basePath = getAdminBasePath();
  if (!session) redirect(`/${basePath}`);

  if (!canAccessEvents(session)) redirect(`/${basePath}/dashboard`);

  const canWrite = session !== null && session.role !== "camsguy" && canAccessEvents(session);

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
      <div className="relative z-10 min-h-screen pt-24 px-4 pb-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <HandDrawnCard className="p-6 sm:p-8">
            <h1 className="hand-drawn-title text-white text-3xl mb-2">
              Events Management
            </h1>
            <p className="text-cyan text-sm">
              Create and edit event details. Imposter permission required.
            </p>
          </HandDrawnCard>
          <AdminEventsClient canWrite={canWrite} />
        </div>
      </div>
    </>
  );
}
