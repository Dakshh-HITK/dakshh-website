import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const seminarSchema = new Schema(
  {
    title: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    club: { type: String },
    isRegisterationNeeded: { type: Boolean, default: false },
    speaker: { type: String, required: true },
    speakerImage: { type: String },
    speakerBio: { type: String },
    description: { type: String },
    speakerNote: { type: String },
    dateTime: { type: Date, required: true },
    mode: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    registrations: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SeminarRegistration",
        },
      ],
      default: [],
    },
    venue: { type: String, required: true },
  },
  {
    collection: "Seminar",
    timestamps: true,
  },
);

const Seminar = models.Seminar || model("Seminar", seminarSchema);

export default Seminar;