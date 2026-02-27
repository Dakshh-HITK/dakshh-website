import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connect from "@/lib/mongoose";
import Team from "@/lib/models/Team";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        await connect();
        const { id } = await params;

        const { teamName } = await req.json();

        if (!id || !teamName) {
            return NextResponse.json(
                { success: false, message: "Team ID and Team Name are required" },
                { status: 400 }
            );
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid Team ID" },
                { status: 400 }
            );
        }

        const updatedTeam = await Team.findByIdAndUpdate(
            id,
            { teamName },
            { new: true, runValidators: true }
        );

        if (!updatedTeam) {
            return NextResponse.json(
                { success: false, message: "Team not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Team name updated successfully", data: updatedTeam },
            { status: 200 }
        );
    } catch (error) {
        console.log("PATCH Team Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}