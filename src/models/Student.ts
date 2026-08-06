import mongoose, { type Model } from "mongoose";

const { Schema } = mongoose;

export type StudentDocument = {
  studentId: string;
  name: string;
  dojoId?: string;
  dob?: Date;
  gender?: "Male" | "Female" | "Other";
  phoneNumber?: string;
  fatherName?: string;
  motherName?: string;
  admissionDate?: Date;
  belt: string;
  pendingFees?: number;
  image?: string;
  status?: "Active" | "Inactive";
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const studentSchema = new Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dojoId: { type: String },
  dob: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  phoneNumber: { type: String, index: true },
  createdBy: { type: String },
  updatedBy: { type: String },
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

// Hot reload can keep an older compiled schema; keep phone optional.
if (mongoose.models.Student) {
  Student.schema.path("phoneNumber").required(false);
}

/** Drop legacy unique phone index so siblings can share a parent number. Safe to call repeatedly. */
let phoneIndexFixed = false;
export async function ensureSharedPhoneAllowed() {
  if (phoneIndexFixed) return;
  try {
    const indexes = await Student.collection.indexes();
    const phoneUnique = indexes.find(
      (idx) => idx.key?.phoneNumber === 1 && idx.unique === true
    );
    if (phoneUnique?.name) {
      await Student.collection.dropIndex(phoneUnique.name);
    }
    phoneIndexFixed = true;
  } catch {
    // Retry on next request if DB was not ready
  }
}

export default Student;
