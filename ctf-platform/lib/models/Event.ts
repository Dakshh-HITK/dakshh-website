import mongoose, { Schema, model, models } from "mongoose";

export interface IEventDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  eventName: string;
  category: string;
  isActive: boolean;
  registrations: mongoose.Types.ObjectId[];
}

const eventSchema = new Schema(
  {
    eventName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
    },
    date: String,
    time: String,
    duration: String,
    venue: String,
    description: String,
    banner: String,
    rules: [String],
    clubs: [String],
    isTeamEvent: Boolean,
    isActive: { type: Boolean, default: false },
    doc: String,
    pocs: [{ name: String, mobile: String }],
    maxMembersPerTeam: Number,
    minMembersPerTeam: Number,
    teamLimit: Number,
    isPaidEvent: Boolean,
    isFoodProvided: Boolean,
    maxFoodServingsPerParticipant: { type: Number, default: 1 },
    fees: { type: Number, default: 0 },
    prizePool: { type: String, default: "TBD" },
    registrations: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Registration" },
    ],
  },
  { timestamps: true }
);

const Event =
  models.Event ?? model<IEventDocument>("Event", eventSchema);

export default Event;
