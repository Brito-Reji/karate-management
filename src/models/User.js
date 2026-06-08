import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String,  unique: true },
    phoneNo: { type: String, unique: true, },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["super_admin", "instructor", "student"] },
    status: { type: String, default: "Active" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.User ||
    mongoose.model("User", userSchema);
