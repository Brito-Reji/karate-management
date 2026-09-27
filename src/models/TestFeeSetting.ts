import mongoose, { type Model } from "mongoose";

export type TestFeeSettingDocument = {
  beltName: string;
  fee: number;
  instructorCommission: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const testFeeSettingSchema = new mongoose.Schema(
  {
    beltName: { type: String, required: true, unique: true, trim: true },
    fee: { type: Number, required: true, min: 0, default: 0 },
    instructorCommission: { type: Number, required: true, min: 0, default: 0 },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

const TestFeeSetting =
  (mongoose.models.TestFeeSetting as Model<TestFeeSettingDocument> | undefined) ||
  mongoose.model<TestFeeSettingDocument>("TestFeeSetting", testFeeSettingSchema);

export default TestFeeSetting;
