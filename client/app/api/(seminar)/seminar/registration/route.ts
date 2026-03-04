import { auth } from "@/auth";
import Seminar from "@/lib/models/Seminar";
import SeminarRegistration from "@/lib/models/SeminarRegistration";
import User from "@/lib/models/User";
import connect from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req : NextRequest){
    try{
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();


        const { seminarId } = await req.json();

        const seminar = await Seminar.findById(seminarId);
        if (!seminar) {
            return NextResponse.json({ error: "Seminar not found" }, { status: 404 });
        }

        if (!seminar.isRegisterationNeeded) {
            return NextResponse.json({ error: "Registration not required for this seminar" }, { status: 400 });
        }

        if (seminar.registrations.includes(session.user.id)) {
            return NextResponse.json({ error: "Already registered for this seminar" }, { status: 200 });
        }

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        if(!user.isProfileComplete){
            return NextResponse.json({ error: "Complete your profile before registering for seminars" }, { status: 400 });
        }
        
        const registration = await SeminarRegistration.create({
            seminarId: seminar._id,
            participant: session.user.id,
        });
        seminar.registrations.push(registration._id);
        

        
        await seminar.save();
        
        return NextResponse.json({ message: "Successfully registered for seminar" }, { status: 200 });

    }
    catch(error){
        return NextResponse.json({ error: "Failed to register for seminar" }, { status: 500 });
    }
}