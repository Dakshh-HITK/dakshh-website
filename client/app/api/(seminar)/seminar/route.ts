import { auth } from "@/auth";
import Seminar from "@/lib/models/Seminar";
import SeminarRegistration from "@/lib/models/SeminarRegistration";
import connect from "@/lib/mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connect();

    const session = await auth();
    const userId = session?.user?.id;

    let userRegisteredSeminars: string[] = [];

    if (userId) {
      const registrations = await SeminarRegistration.find({
        participant: userId,
      }).select("seminarId");

      userRegisteredSeminars = registrations.map((reg) =>
        reg.seminarId.toString()
      );
    }

    const allSeminarsData = await Seminar.find();

    return NextResponse.json(
      {
        SeminarData: allSeminarsData,
        userRegisteredSeminars,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch seminar data" },
      { status: 500 }
    );
  }
}