// models/Dojo.ts

import mongoose, { type Model } from "mongoose";

export type DojoDocument = {
  dojoId: string;
  name: string;
  location: string;
  instructors?: string[];
  instructor?: string;
};

const dojoSchema = new mongoose.Schema(
  {
    dojoId:{
      type:String,
      required:true,
      unique:true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    instructor:{
      type:String,
      trim: true,
    },
    instructors: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

dojoSchema.index({ createdAt: -1 });
dojoSchema.index({ name: 1 });
dojoSchema.index({ location: 1 });

const Dojo =
  (mongoose.models.Dojo as Model<DojoDocument> | undefined) ||
  mongoose.model<DojoDocument>("Dojo", dojoSchema);

export default Dojo;
