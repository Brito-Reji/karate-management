// run: node src/scripts/seed.mjs
// seeds the admin user and sample dojo locations

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is missing. Check your .env.local file.");
  process.exit(1);
}

// define schemas inline (can't use @/ alias in standalone scripts)
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, enum: ["super_admin", "instructor", "student"] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const dojoLocationSchema = new mongoose.Schema(
  {
    name: String,
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const DojoLocation = mongoose.model("DojoLocation", dojoLocationSchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // seed admin
  const existingAdmin = await User.findOne({ email: "admin@karate.com" });
  if (existingAdmin) {
    console.log("Admin already exists, skipping...");
  } else {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await User.create({
      name: "Admin",
      email: "admin@karate.com",
      password: hashedPassword,
      role: "super_admin",
    });
    console.log("Admin created → email: admin@karate.com | password: admin123");
  }

  // seed dojos (add your actual dojo names here)
  const dojos = [
    { name: "Main Dojo", address: "" },
    { name: "Downtown Dojo", address: "" },
    { name: "West Side Dojo", address: "" },
    { name: "East Side Dojo", address: "" },
    { name: "North Dojo", address: "" },
  ];

  const existingDojos = await DojoLocation.countDocuments();
  if (existingDojos > 0) {
    console.log(`${existingDojos} dojos already exist, skipping...`);
  } else {
    await DojoLocation.insertMany(dojos);
    console.log(`${dojos.length} dojos created`);
  }

  await mongoose.disconnect();
  console.log("Seed complete. Disconnected.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
