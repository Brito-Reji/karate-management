import mongoose, { type Model } from "mongoose";
const { Schema } = mongoose;

export type UserDocument = {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role: "admin" | "instructor" | "student";
  isBlocked?: boolean;
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
    refreshToken: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const User =
  (mongoose.models.User as Model<UserDocument> | undefined) ||
  mongoose.model<UserDocument>("User", userSchema);

export default User;
