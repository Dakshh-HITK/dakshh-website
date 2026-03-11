import mongoose, { Schema, models, model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  roles: ("participant" | "volunteer" | "admin" | "super_admin")[];
  passwordHash?: string;
  image?: string;
  avatar?: number;
  provider: "google" | "credentials";
  emailVerified?: Date;
  verified?: boolean;
  fullName?: string;
  phoneNumber?: string;
  college?: string;
  stream?: string;
  isProfileComplete: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    roles: {
      type: [String],
      enum: ["participant", "volunteer", "admin", "super_admin"],
      default: ["participant"],
    },
    provider: {
      type: String,
      enum: ["google", "credentials"],
      required: true,
      default: "credentials",
    },
    passwordHash: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    avatar: {
      type: Number,
      required: false,
      min: 1,
      max: 10,
    },
    emailVerified: {
      type: Date,
      required: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    fullName: {
      type: String,
      required: false,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    college: {
      type: String,
      required: false,
      trim: true,
    },
    stream: {
      type: String,
      required: false,
      trim: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User =
  models.User ?? model<IUserDocument>("User", userSchema);

export default User;
