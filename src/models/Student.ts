import mongoose, { type Model } from "mongoose";

const { Schema } = mongoose;

export type StudentDocument = {
  studentId: string;
  name: string;
  dojoId?: string;
  dob?: Date;
  gender?: "Male" | "Female" | "Other";
  phoneNumber: string;
  fatherName?: string;
  motherName?: string;
  admissionDate?: Date;
  belt: string;
  pendingFees?: number;
  image?: string;
  status?: "Active" | "Inactive";
  createdAt?: Date;
  updatedAt?: Date;
};

const studentSchema = new Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dojoId: { type: String },
  dob: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  phoneNumber: { type: String, required: true },
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

const Student =
  (mongoose.models.Student as Model<StudentDocument> | undefined) ||
  mongoose.model<StudentDocument>("Student", studentSchema);

export default Student;
