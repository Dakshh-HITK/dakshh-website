import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import AdminUser from "@/lib/models/AdminUser";
import { getAdminSession } from "@/lib/admin-session";

export async function GET() {
  const session = await getAdminSession();
  if (!session || (!session.isMaster && session.role !== "master" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connect();

  const users = await AdminUser.find({})
    .select("email role permissions invitedBy passwordSetAt createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    users: users.map((u) => ({
      id: String((u as { _id?: unknown })._id ?? ""),
      email: u.email,
      role: u.role,
      permissions: u.permissions ?? [],
      invitedBy: u.invitedBy,
      hasPassword: !!u.passwordSetAt,
      createdAt: u.createdAt,
    })),
  });
}
