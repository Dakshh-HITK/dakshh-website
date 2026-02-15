import { IRegistration } from "@/types/interface";
import mongoose, { model, Schema } from "mongoose";
import { models } from "mongoose";

export interface IregistrationDocument extends IRegistration, mongoose.Document {
    _id: mongoose.Types.ObjectId;
}

const registrationSchema = new Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },
        isTeam: {
            type: Boolean,
            required: true,
            default: false
        },
        teamId: {
            type: String,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        team: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],
        verified: {
            type: Boolean,
            required: true,
            default: false
        },
        checkedIn: {
            type: Boolean,
            required: true,
            default: false
        },
        checkedInAt: {
            type: Date,
        },
        checkedInBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        foodServedCount: {
            type: Number,
            required: true,
            default: 0
        },
        lastFoodServedAt: {
            type: Date,
        }
    },
    { timestamps: true },
);

const Registration = models.Registration ?? model<IregistrationDocument>("Registration", registrationSchema);

export default Registration;