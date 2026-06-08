import mongoose from "mongoose";
import { BELT_NAMES } from "@/lib/constants";

const beltHistorySchema = new mongoose.Schema(
  {
    belt: {
      type: String,
      enum: BELT_NAMES,
      required: true,
    },
    dateEarned: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    // link to User (optional now, required when students get login)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    currentBelt: {
      type: String,
      enum: BELT_NAMES,
      default: "White",
    },
    dojoLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DojoLocation",
      required: [true, "Dojo location is required"],
    },
    dateOfLastTest: {
      type: Date,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    beltHistory: [beltHistorySchema],
  },
  { timestamps: true }
);

const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
