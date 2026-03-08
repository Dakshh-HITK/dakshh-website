import { UNSTOP_LINKS } from "@/constants/unstop";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(UNSTOP_LINKS);
}
