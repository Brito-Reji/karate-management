import mongoose from "mongoose";
const { Schema } = mongoose;

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

export default mongoose.models.User ||
    mongoose.model("User", userSchema);