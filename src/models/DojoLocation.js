import mongoose from "mongoose";

const dojoLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Dojo name is required"],
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const DojoLocation =
  mongoose.models.DojoLocation ||
  mongoose.model("DojoLocation", dojoLocationSchema);

export default DojoLocation;
