import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICTFTeamScore extends Document {
  teamId: mongoose.Types.ObjectId;
  teamName: string;
  score: number;
}

const CTFTeamScoreSchema = new Schema<ICTFTeamScore>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      unique: true,
    },
    teamName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const CTFTeamScore: Model<ICTFTeamScore> =
  mongoose.models.CTFTeamScore ||
  mongoose.model<ICTFTeamScore>("CTFTeamScore", CTFTeamScoreSchema);

export default CTFTeamScore;
