import mongoose, { type Model } from "mongoose";

const { Schema } = mongoose;

export type ChangeRequestType = "profile_update" | "dojo_update" | "dojo_join";
export type ChangeRequestStatus = "pending" | "approved" | "rejected";

export type ProfilePayload = {
  name?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
};

export type DojoUpdatePayload = {
  name?: string;
  location?: string;
  imageUrl?: string;
  imagePublicId?: string;
};

export type DojoJoinPayload = {
  dojoId: string;
  dojoName?: string;
  dojoLocation?: string;
};

export type ChangeRequestDocument = {
  type: ChangeRequestType;
  status: ChangeRequestStatus;
  submittedBy: mongoose.Types.ObjectId;
  targetDojoId?: mongoose.Types.ObjectId;
  payload: ProfilePayload | DojoUpdatePayload | DojoJoinPayload;
  currentSnapshot?: Record<string, unknown>;
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

const changeRequestSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["profile_update", "dojo_update", "dojo_join"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetDojoId: {
      type: Schema.Types.ObjectId,
      ref: "Dojo",
      index: true,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    currentSnapshot: { type: Schema.Types.Mixed },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

changeRequestSchema.index(
  { submittedBy: 1, type: 1, targetDojoId: 1, status: 1 },
  { partialFilterExpression: { status: "pending" } }
);

const ChangeRequest =
  (mongoose.models.ChangeRequest as Model<ChangeRequestDocument> | undefined) ||
  mongoose.model<ChangeRequestDocument>("ChangeRequest", changeRequestSchema);

export default ChangeRequest;
