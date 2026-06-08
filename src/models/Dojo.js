// models/Dojo.js

import mongoose from "mongoose";

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
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Dojo ||
  mongoose.model("Dojo", dojoSchema);