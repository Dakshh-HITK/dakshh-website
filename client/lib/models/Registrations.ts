import { IRegistration } from "@/types/interface";
import mongoose, { model, Schema, models, Document } from "mongoose";

export interface IRegistrationDocument extends IRegistration, Document {
    _id: mongoose.Types.ObjectId;
}

const registrationSchema = new Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        isTeam: {
            type: Boolean,
            required: true,
            default: false,
        },
        teamId: {
            type: String,
            unique: true,
            sparse: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        team: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        verified: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    { timestamps: true }
);

const Registration = models.Registration || model<IRegistrationDocument>("Registration", registrationSchema);

export default Registration;