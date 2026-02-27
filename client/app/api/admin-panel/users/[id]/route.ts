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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session || (!session.isMaster && session.role !== "master" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const role = body.role;
    const permissions = body.permissions;

    await connect();

    const adminUser = await AdminUser.findById(id);
    if (!adminUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (role !== undefined) {
      if (!isValidRole(role)) {
        return NextResponse.json(
          { error: "Invalid role. Use admin, crewmate, or imposter." },
          { status: 400 }
        );
      }
      adminUser.role = role;
    }

    if (permissions !== undefined) {
      const validPermissions = isValidPermissions(permissions);
      if (adminUser.role === "imposter" && validPermissions.length === 0) {
        return NextResponse.json(
          { error: "Imposter role requires at least one permission." },
          { status: 400 }
        );
      }
      adminUser.permissions = validPermissions;
    }

    await adminUser.save();

    return NextResponse.json({
      success: true,
      user: {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.permissions,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session || (!session.isMaster && session.role !== "master" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await connect();

    const adminUser = await AdminUser.findById(id);
    if (!adminUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await AdminUser.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to remove user." },
      { status: 500 }
    );
  }
}
