import SeminarRegistration from "@/lib/models/SeminarRegistration";
import connect from "@/lib/mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  await connect();
  try {
    let registrationData = await SeminarRegistration.find()
      .populate("seminarId", "title date")
      .populate("participant", "username email");
    return NextResponse.json(
      {
        success: true,
        data: registrationData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching seminar registration data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch seminar registration data",
      },
      { status: 500 },
    );
  }
}
