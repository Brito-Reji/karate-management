import mongoose, { type Model } from "mongoose";
const { Schema } = mongoose;

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type UserDocument = {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role: "admin" | "instructor" | "student";
  isBlocked?: boolean;
  approvalStatus?: ApprovalStatus;
  emailVerified?: boolean;
  emailOtpHash?: string;
  emailOtpExpiresAt?: Date;
  passwordResetOtpHash?: string;
  passwordResetOtpExpiresAt?: Date;
  dojoIds?: string[];
  avatarUrl?: string;
  avatarPublicId?: string;
  bio?: string;
  appliedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  refreshToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: { type: String },
    role: { type: String, required: true, enum: ["admin", "instructor", "student"] },
    isBlocked: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    emailVerified: { type: Boolean, default: true },
    emailOtpHash: { type: String },
    emailOtpExpiresAt: { type: Date },
    passwordResetOtpHash: { type: String },
    passwordResetOtpExpiresAt: { type: Date },
    dojoIds: { type: [String], default: [] },
    avatarUrl: { type: String },
    avatarPublicId: { type: String },
    bio: { type: String, maxlength: 500 },
    appliedAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: String },
    rejectionReason: { type: String },
    refreshToken: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const User =
  (mongoose.models.User as Model<UserDocument> | undefined) ||
  mongoose.model<UserDocument>("User", userSchema);

export default User;
