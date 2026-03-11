import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IRegistrationDocument extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  isInTeam: boolean;
  teamId?: mongoose.Types.ObjectId;
  participant: mongoose.Types.ObjectId;
  verified: boolean;
  checkedIn: boolean;
}

const registrationSchema = new Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    isInTeam: {
      type: Boolean,
      required: true,
      default: false,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verified: {
      type: Boolean,
      required: true,
      default: false,
    },
    checkedIn: {
      type: Boolean,
      required: true,
      default: false,
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
      default: 0,
    },
    lastFoodServedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Registration =
  models.Registration ||
  model<IRegistrationDocument>("Registration", registrationSchema);

export default Registration;
