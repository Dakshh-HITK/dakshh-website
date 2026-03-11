import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICTFSection extends Document {
  key: string;
  title: string;
  subtitle: string;
  color: string;
  order: number;
}

const CTFSectionSchema = new Schema<ICTFSection>(
  {
    key: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const CTFSection: Model<ICTFSection> =
  mongoose.models.CTFSection ||
  mongoose.model<ICTFSection>("CTFSection", CTFSectionSchema);

export default CTFSection;
