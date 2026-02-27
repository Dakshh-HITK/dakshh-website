import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import AdminUser from "@/lib/models/AdminUser";
import { getAdminSession } from "@/lib/admin-session";
import {
  IMPOSTER_PERMISSIONS,
  type AdminRole,
  type ImposterPermission,
} from "@/lib/models/AdminUser";

function isValidRole(r: unknown): r is AdminRole {
  return r === "admin" || r === "crewmate" || r === "imposter" || r === "camsguy";
}

function isValidPermissions(p: unknown): ImposterPermission[] {
  if (!Array.isArray(p)) return [];
  return p.filter((x): x is ImposterPermission =>
    IMPOSTER_PERMISSIONS.includes(x)
  );
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session || (!session.isMaster && session.role !== "master" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const role = body.role;
    const permissions = body.permissions;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isValidRole(role)) {
      return NextResponse.json(
        { error: "Invalid role. Use admin, crewmate, imposter, or camsguy." },
        { status: 400 }
      );
    }

    const validPermissions = isValidPermissions(permissions);
    if (role === "imposter" && validPermissions.length === 0) {
      return NextResponse.json(
        { error: "Imposter role requires at least one permission." },
        { status: 400 }
      );
    }

    await connect();

    const existing = await AdminUser.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An admin user with this email already exists." },
        { status: 409 }
      );
    }

    const inviter = session.email === "master" ? "master" : session.email;
    await AdminUser.create({
      email,
      role,
      permissions: role === "imposter" ? validPermissions : [],
      invitedBy: inviter,
    });

    return NextResponse.json({ success: true, email });
  } catch {
    return NextResponse.json(
      { error: "Failed to invite user." },
      { status: 500 }
    );
  }
}
