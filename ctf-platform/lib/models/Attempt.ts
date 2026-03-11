import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICTFAttempt extends Document {
  teamId: mongoose.Types.ObjectId;
  challengeId: number;
  attempts: number;
  locked_until: Date | null;
  solved: boolean;
  solvedBy: mongoose.Types.ObjectId | null;
  solvedAt: Date | null;
}

const CTFAttemptSchema = new Schema<ICTFAttempt>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    challengeId: {
      type: Number,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    locked_until: {
      type: Date,
      default: null,
    },
    solved: {
      type: Boolean,
      default: false,
    },
    solvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    solvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One attempt record per team per challenge
CTFAttemptSchema.index({ teamId: 1, challengeId: 1 }, { unique: true });

const CTFAttempt: Model<ICTFAttempt> =
  mongoose.models.CTFAttempt ||
  mongoose.model<ICTFAttempt>("CTFAttempt", CTFAttemptSchema);

export default CTFAttempt;
