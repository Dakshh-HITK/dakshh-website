import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import User from "@/lib/models/User";
import AdminUser from "@/lib/models/AdminUser";
import { getAdminSession } from "@/lib/admin-session";

function canAccessParticipants(
  session: { role: string; permissions: string[]; isMaster?: boolean } | null
): boolean {
  if (!session) return false;
  if (session.isMaster || session.role === "master") return true;
  if (session.role === "admin") return true;
  if (session.role === "camsguy") return true;
  if (session.role === "imposter")
    return session.permissions.includes("users");
  return false;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session || !canAccessParticipants(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";

    await connect();

    const adminEmails = await AdminUser.find({})
      .select("email")
      .lean();
    const excludeEmails = new Set(
      adminEmails.map((a) => (a as { email?: string }).email?.toLowerCase()).filter(Boolean)
    );

    const query: Record<string, unknown> = {
      email: { $nin: Array.from(excludeEmails) },
    };

    if (search) {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      query.$or = [
        { email: searchRegex },
        { username: searchRegex },
        { fullName: searchRegex },
      ];
    }

    const users = await User.find(query)
      .select(
        "username email fullName phoneNumber college stream avatar amongUsScore verified roles isProfileComplete createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      participants: users.map((u) => {
        const uAny = u as Record<string, unknown>;
        return {
          id: String(uAny._id ?? ""),
          username: uAny.username ?? "",
          email: uAny.email ?? "",
          fullName: uAny.fullName ?? "",
          phoneNumber: uAny.phoneNumber ?? "",
          college: uAny.college ?? "",
          stream: uAny.stream ?? "",
          avatar: uAny.avatar ?? null,
          amongUsScore: uAny.amongUsScore ?? 0,
          verified: uAny.verified ?? false,
          roles: (uAny.roles as string[]) ?? ["participant"],
          isProfileComplete: uAny.isProfileComplete ?? false,
          createdAt: uAny.createdAt,
          updatedAt: uAny.updatedAt,
        };
      }),
    });
  } catch (err) {
    console.error("Admin participants list error:", err);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
