import mongoose, { type Model } from "mongoose";

export type BeltProgressionDocument = {
  studentId: mongoose.Types.ObjectId;
  beltName: string;
  rank: number;
  awardedDate: Date;
  examiner?: string;
  notes?: string;
  createdAt?: Date;
};

const beltProgressionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    beltName: { type: String, required: true },
    rank: { type: Number, required: true },
    awardedDate: { type: Date, required: true, default: Date.now },
    examiner: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

const BeltProgression =
  (mongoose.models.BeltProgression as Model<BeltProgressionDocument> | undefined) ||
  mongoose.model<BeltProgressionDocument>("BeltProgression", beltProgressionSchema);

export default BeltProgression;
