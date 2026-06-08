import mongoose from "mongoose";

const { Schema } = mongoose;

const studentSchema = new Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  dob: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  phoneNumber: { type: String,required:true },
  fatherName: { type: String },
  motherName: { type: String },
  admissionDate: { type: Date, default: Date.now },
  belt: { type: String, required: true },
  pendingFees: { type: Number, default: 0 },
  image: { type: String },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Student ||
  mongoose.model("Student", studentSchema);