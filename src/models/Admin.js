import mongoose from "mongoose";

const { Schema } = mongoose;

const adminSchema = new Schema({
 firstName: { type: String, required: true },
 lastName: { type: String, required: true },
 phoneNumber: { type: String, required: true, unique: true },
 email: { type: String, required: true, unique: true },
});

export default mongoose.models.Admin || mongoose.model("Admin", adminSchema);