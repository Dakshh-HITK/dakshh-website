import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICTFChallenge extends Document {
  challengeId: number;
  title: string;
  category: string;
  difficulty: "easy" | "ez-med" | "medium" | "hard";
  points: number;
  description: string;
  placeholder: string;
  section: string;
  sectionColor: string;
  flagHash: string;
  enabled: boolean;
}

const CTFChallengeSchema = new Schema<ICTFChallenge>(
  {
    challengeId: {
      type: Number,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "ez-med", "medium", "hard"],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    placeholder: {
      type: String,
      required: true,
      default: "DAKSHH{...}",
    },
    section: {
      type: String,
      required: true,
    },
    sectionColor: {
      type: String,
      required: true,
    },
    flagHash: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const CTFChallenge: Model<ICTFChallenge> =
  mongoose.models.CTFChallenge ||
  mongoose.model<ICTFChallenge>("CTFChallenge", CTFChallengeSchema);

export default CTFChallenge;
